import { YouTubeShortsAdapter } from './adapters/youtubeShorts';
import { InstagramReelsAdapter } from './adapters/instagramReels';
import { TikTokAdapter } from './adapters/tiktok';
import { BaseAdapter, VideoMetadata, PublishOptions, ValidationResult } from './adapters/base';
import { supabase } from './supabase';

export interface Connection {
  id: string;
  user_id: string;
  provider: 'youtube' | 'facebook' | 'tiktok';
  access_token_encrypted: string;
  refresh_token_encrypted?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PublishJob {
  id: string;
  user_id: string;
  upload_id: string;
  provider: string;
  title: string;
  description: string;
  tags?: string[];
  schedule_at?: string;
  status: 'queued' | 'processing' | 'published' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  error_message?: string;
  published_url?: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export class Publisher {
  private adapters: Map<string, BaseAdapter> = new Map();

  constructor() {
    // Adapters serão inicializados quando necessário
  }

  // Inicializar adapter para um usuário e plataforma específica
  async initializeAdapter(userId: string, provider: string): Promise<BaseAdapter | null> {
    try {
      // Buscar conexão do usuário
      const { data: connection, error } = await supabase
        .from('connections')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

      if (error || !connection) {
        console.error(`Conexão não encontrada para ${provider}:`, error);
        return null;
      }

      // Descriptografar tokens (em produção, usar crypto adequado)
      const accessToken = this.decryptToken(connection.access_token_encrypted);
      const refreshToken = connection.refresh_token_encrypted 
        ? this.decryptToken(connection.refresh_token_encrypted) 
        : undefined;

      // Criar adapter apropriado
      let adapter: BaseAdapter;
      switch (provider) {
        case 'youtube':
          adapter = new YouTubeShortsAdapter(accessToken, refreshToken);
          break;
        case 'facebook':
          adapter = new InstagramReelsAdapter(accessToken, refreshToken);
          break;
        case 'tiktok':
          adapter = new TikTokAdapter(accessToken, refreshToken);
          break;
        default:
          throw new Error(`Provider não suportado: ${provider}`);
      }

      // Cache do adapter
      const key = `${userId}_${provider}`;
      this.adapters.set(key, adapter);

      return adapter;

    } catch (error) {
      console.error(`Erro ao inicializar adapter ${provider}:`, error);
      return null;
    }
  }

  // Validar vídeo para múltiplas plataformas
  async validateForPlatforms(
    userId: string, 
    platforms: string[], 
    videoMeta: VideoMetadata, 
    options: PublishOptions
  ): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};

    for (const platform of platforms) {
      const adapter = await this.initializeAdapter(userId, platform);
      if (adapter) {
        results[platform] = adapter.validate(videoMeta, options);
      } else {
        results[platform] = {
          valid: false,
          errors: [`Não foi possível conectar com ${platform}`],
          warnings: []
        };
      }
    }

    return results;
  }

  // Criar jobs de publicação para múltiplas plataformas
  async createPublishJobs(
    userId: string,
    uploadId: string,
    platforms: string[],
    options: PublishOptions
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const platform of platforms) {
      try {
        const { data: job, error } = await supabase
          .from('jobs')
          .insert([
            {
              user_id: userId,
              upload_id: uploadId,
              provider: platform,
              title: options.title,
              description: options.description,
              tags: options.tags,
              schedule_at: options.scheduleDate?.toISOString(),
              status: 'queued'
            }
          ])
          .select()
          .single();

        if (error) {
          console.error(`Erro ao criar job para ${platform}:`, error);
          continue;
        }

        jobIds.push(job.id);

        // Log da criação do job
        await this.logJobEvent(job.id, 'info', `Job criado para ${platform}`, {
          platform,
          title: options.title,
          scheduled: !!options.scheduleDate
        });

      } catch (error) {
        console.error(`Erro ao criar job para ${platform}:`, error);
      }
    }

    return jobIds;
  }

  // Processar um job específico
  async processJob(jobId: string): Promise<boolean> {
    try {
      // Buscar job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        console.error('Job não encontrado:', jobError);
        return false;
      }

      // Verificar se deve processar agora
      if (job.schedule_at && new Date(job.schedule_at) > new Date()) {
        // Ainda não é hora de processar
        return true;
      }

      // Atualizar status para processing
      await this.updateJobStatus(jobId, 'processing');
      await this.logJobEvent(jobId, 'info', 'Iniciando processamento', { provider: job.provider });

      // Buscar dados do upload
      const { data: upload, error: uploadError } = await supabase
        .from('uploads')
        .select('*')
        .eq('id', job.upload_id)
        .single();

      if (uploadError || !upload) {
        await this.updateJobStatus(jobId, 'failed', 'Upload não encontrado');
        return false;
      }

      // Inicializar adapter
      const adapter = await this.initializeAdapter(job.user_id, job.provider);
      if (!adapter) {
        await this.updateJobStatus(jobId, 'failed', 'Não foi possível conectar com a plataforma');
        return false;
      }

      // Ler arquivo do upload (em produção, usar storage real)
      const fileBuffer = await this.readUploadFile(upload.path);
      if (!fileBuffer) {
        await this.updateJobStatus(jobId, 'failed', 'Arquivo não encontrado');
        return false;
      }

      // Fazer upload
      const uploadResult = await adapter.upload(fileBuffer, upload.filename, {
        title: job.title,
        description: job.description || '',
        tags: job.tags,
        scheduleDate: job.schedule_at ? new Date(job.schedule_at) : undefined
      });

      if (!uploadResult.success) {
        await this.updateJobStatus(jobId, 'failed', uploadResult.error || 'Erro no upload');
        return false;
      }

      // Publicar
      const publishResult = await adapter.publish(uploadResult.jobId!, {
        title: job.title,
        description: job.description || '',
        tags: job.tags
      });

      if (!publishResult.success) {
        await this.updateJobStatus(jobId, 'failed', publishResult.error || 'Erro na publicação');
        return false;
      }

      // Sucesso
      await supabase
        .from('jobs')
        .update({
          status: 'published',
          published_url: publishResult.publishedUrl,
          external_id: publishResult.externalId,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      await this.logJobEvent(jobId, 'info', 'Publicação concluída com sucesso', {
        published_url: publishResult.publishedUrl,
        external_id: publishResult.externalId
      });

      return true;

    } catch (error) {
      console.error(`Erro ao processar job ${jobId}:`, error);
      
      // Incrementar tentativas
      const { data: job } = await supabase
        .from('jobs')
        .select('attempts, max_attempts')
        .eq('id', jobId)
        .single();

      if (job && job.attempts < job.max_attempts) {
        // Retry com backoff exponencial
        const nextAttempt = new Date(Date.now() + Math.pow(2, job.attempts) * 60000); // 2^n minutos
        await supabase
          .from('jobs')
          .update({
            attempts: job.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);

        await this.logJobEvent(jobId, 'warn', `Tentativa ${job.attempts + 1} falhada, reagendando`, {
          next_attempt: nextAttempt.toISOString(),
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      } else {
        // Máximo de tentativas atingido
        await this.updateJobStatus(jobId, 'failed', 'Máximo de tentativas atingido');
      }

      return false;
    }
  }

  // Buscar jobs pendentes para processamento
  async getPendingJobs(): Promise<PublishJob[]> {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .in('status', ['queued', 'processing'])
      .or(`schedule_at.is.null,schedule_at.lte.${new Date().toISOString()}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar jobs pendentes:', error);
      return [];
    }

    return jobs || [];
  }

  // Buscar jobs de um usuário
  async getUserJobs(userId: string, status?: string): Promise<PublishJob[]> {
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar jobs do usuário:', error);
      return [];
    }

    return jobs || [];
  }

  // Cancelar job
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !job) {
        return false;
      }

      // Se já foi publicado, não pode cancelar
      if (job.status === 'published') {
        return false;
      }

      // Tentar cancelar na plataforma se estiver processando
      if (job.status === 'processing' && job.external_id) {
        const adapter = await this.initializeAdapter(job.user_id, job.provider);
        if (adapter) {
          await adapter.cancel(job.external_id);
        }
      }

      // Atualizar status
      await this.updateJobStatus(jobId, 'cancelled');
      await this.logJobEvent(jobId, 'info', 'Job cancelado pelo usuário');

      return true;

    } catch (error) {
      console.error(`Erro ao cancelar job ${jobId}:`, error);
      return false;
    }
  }

  // Métodos auxiliares
  private async updateJobStatus(jobId: string, status: string, errorMessage?: string): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId);
  }

  private async logJobEvent(jobId: string, level: string, message: string, meta?: any): Promise<void> {
    await supabase
      .from('logs')
      .insert([
        {
          job_id: jobId,
          level,
          message,
          meta_json: meta
        }
      ]);
  }

  private decryptToken(encryptedToken: string): string {
    // Em produção, usar crypto real (AES-256-GCM ou similar)
    // Por enquanto, assumir que está em base64
    try {
      return Buffer.from(encryptedToken, 'base64').toString('utf8');
    } catch {
      return encryptedToken; // Fallback se não estiver criptografado
    }
  }

  private encryptToken(token: string): string {
    // Em produção, usar crypto real
    return Buffer.from(token).toString('base64');
  }

  private async readUploadFile(path: string): Promise<Buffer | null> {
    // Em produção, ler do storage real (S3, Supabase Storage, etc.)
    // Por enquanto, retornar buffer mock
    try {
      // Simular leitura de arquivo
      return Buffer.from('mock-video-data');
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      return null;
    }
  }
}