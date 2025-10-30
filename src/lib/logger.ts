import winston from 'winston'
import { supabase } from './supabase'

// Configuração do Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'multipost-ai' },
  transports: [
    // Arquivo de logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
})

// Em desenvolvimento, também logar no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

export interface LogEntry {
  id?: string
  job_id?: string
  user_id?: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  meta_json?: any
  created_at?: string
}

export class LogManager {
  // Log estruturado que vai para Winston e banco
  static async log(entry: LogEntry): Promise<void> {
    try {
      // Log no Winston
      logger.log(entry.level, entry.message, {
        job_id: entry.job_id,
        user_id: entry.user_id,
        meta: entry.meta_json,
        timestamp: new Date().toISOString()
      })

      // Salvar no banco para interface admin
      if (entry.job_id || entry.user_id) {
        await supabase
          .from('logs')
          .insert([{
            job_id: entry.job_id,
            user_id: entry.user_id,
            level: entry.level,
            message: entry.message,
            meta_json: entry.meta_json,
            created_at: new Date().toISOString()
          }])
      }

    } catch (error) {
      // Fallback: pelo menos logar no Winston se banco falhar
      logger.error('Erro ao salvar log no banco', { error, originalEntry: entry })
    }
  }

  // Logs específicos para jobs
  static async logJob(jobId: string, level: LogEntry['level'], message: string, meta?: any): Promise<void> {
    await this.log({
      job_id: jobId,
      level,
      message,
      meta_json: meta
    })
  }

  // Logs específicos para usuários
  static async logUser(userId: string, level: LogEntry['level'], message: string, meta?: any): Promise<void> {
    await this.log({
      user_id: userId,
      level,
      message,
      meta_json: meta
    })
  }

  // Buscar logs do banco para interface admin
  static async getLogs(filters?: {
    job_id?: string
    user_id?: string
    level?: string
    limit?: number
    offset?: number
  }): Promise<LogEntry[]> {
    try {
      let query = supabase
        .from('logs')
        .select('*')

      if (filters?.job_id) {
        query = query.eq('job_id', filters.job_id)
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters?.level) {
        query = query.eq('level', filters.level)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100)
        .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 100) - 1)

      if (error) {
        logger.error('Erro ao buscar logs', { error })
        return []
      }

      return data || []

    } catch (error) {
      logger.error('Erro ao buscar logs', { error })
      return []
    }
  }

  // Métricas de performance
  static async getMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    totalJobs: number
    successfulJobs: number
    failedJobs: number
    averageProcessingTime: number
    errorRate: number
    platformStats: Record<string, { total: number; success: number; failed: number }>
  }> {
    try {
      const now = new Date()
      let startTime: Date

      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }

      // Buscar jobs no período
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .gte('created_at', startTime.toISOString())

      if (error) {
        throw error
      }

      const totalJobs = jobs?.length || 0
      const successfulJobs = jobs?.filter(job => job.status === 'published').length || 0
      const failedJobs = jobs?.filter(job => job.status === 'failed').length || 0
      const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0

      // Calcular tempo médio de processamento
      const completedJobs = jobs?.filter(job => 
        job.status === 'published' && job.created_at && job.updated_at
      ) || []

      const averageProcessingTime = completedJobs.length > 0
        ? completedJobs.reduce((acc, job) => {
            const start = new Date(job.created_at).getTime()
            const end = new Date(job.updated_at).getTime()
            return acc + (end - start)
          }, 0) / completedJobs.length / 1000 // em segundos
        : 0

      // Stats por plataforma
      const platformStats: Record<string, { total: number; success: number; failed: number }> = {}
      
      jobs?.forEach(job => {
        if (!platformStats[job.provider]) {
          platformStats[job.provider] = { total: 0, success: 0, failed: 0 }
        }
        
        platformStats[job.provider].total++
        
        if (job.status === 'published') {
          platformStats[job.provider].success++
        } else if (job.status === 'failed') {
          platformStats[job.provider].failed++
        }
      })

      return {
        totalJobs,
        successfulJobs,
        failedJobs,
        averageProcessingTime,
        errorRate,
        platformStats
      }

    } catch (error) {
      logger.error('Erro ao calcular métricas', { error })
      return {
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        averageProcessingTime: 0,
        errorRate: 0,
        platformStats: {}
      }
    }
  }

  // Limpar logs antigos (manutenção)
  static async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { error } = await supabase
        .from('logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        throw error
      }

      logger.info(`Logs antigos removidos (anteriores a ${cutoffDate.toISOString()})`)

    } catch (error) {
      logger.error('Erro ao limpar logs antigos', { error })
    }
  }
}

// Exportar logger Winston para uso direto quando necessário
export { logger }

// Middleware para capturar erros não tratados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise })
})