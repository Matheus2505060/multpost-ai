import { Publisher } from './publisher';

export class JobWorker {
  private publisher: Publisher;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL = 60000; // 1 minuto

  constructor() {
    this.publisher = new Publisher();
  }

  // Iniciar worker
  start(): void {
    if (this.isRunning) {
      console.log('Worker já está rodando');
      return;
    }

    console.log('Iniciando Job Worker...');
    this.isRunning = true;

    // Processar jobs imediatamente
    this.processJobs();

    // Configurar intervalo
    this.intervalId = setInterval(() => {
      this.processJobs();
    }, this.POLL_INTERVAL);

    console.log(`Worker iniciado com intervalo de ${this.POLL_INTERVAL / 1000}s`);
  }

  // Parar worker
  stop(): void {
    if (!this.isRunning) {
      console.log('Worker já está parado');
      return;
    }

    console.log('Parando Job Worker...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('Worker parado');
  }

  // Processar jobs pendentes
  private async processJobs(): Promise<void> {
    if (!this.isRunning) return;

    try {
      console.log('Verificando jobs pendentes...');
      
      const pendingJobs = await this.publisher.getPendingJobs();
      
      if (pendingJobs.length === 0) {
        console.log('Nenhum job pendente encontrado');
        return;
      }

      console.log(`Encontrados ${pendingJobs.length} jobs pendentes`);

      // Processar jobs em paralelo (máximo 5 simultâneos)
      const batchSize = 5;
      for (let i = 0; i < pendingJobs.length; i += batchSize) {
        const batch = pendingJobs.slice(i, i + batchSize);
        
        const promises = batch.map(job => this.processJobSafely(job.id));
        await Promise.allSettled(promises);
        
        // Pequena pausa entre batches para não sobrecarregar
        if (i + batchSize < pendingJobs.length) {
          await this.sleep(1000);
        }
      }

      console.log('Processamento de jobs concluído');

    } catch (error) {
      console.error('Erro no processamento de jobs:', error);
    }
  }

  // Processar job individual com tratamento de erro
  private async processJobSafely(jobId: string): Promise<void> {
    try {
      console.log(`Processando job ${jobId}...`);
      
      const success = await this.publisher.processJob(jobId);
      
      if (success) {
        console.log(`Job ${jobId} processado com sucesso`);
      } else {
        console.log(`Job ${jobId} falhou no processamento`);
      }

    } catch (error) {
      console.error(`Erro ao processar job ${jobId}:`, error);
    }
  }

  // Utilitário para pausas
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Status do worker
  getStatus(): { running: boolean; interval: number } {
    return {
      running: this.isRunning,
      interval: this.POLL_INTERVAL
    };
  }
}

// Instância global do worker
let globalWorker: JobWorker | null = null;

// Funções para controlar o worker globalmente
export function startJobWorker(): JobWorker {
  if (!globalWorker) {
    globalWorker = new JobWorker();
  }
  
  globalWorker.start();
  return globalWorker;
}

export function stopJobWorker(): void {
  if (globalWorker) {
    globalWorker.stop();
  }
}

export function getJobWorkerStatus(): { running: boolean; interval: number } | null {
  return globalWorker ? globalWorker.getStatus() : null;
}

// Auto-inicializar worker em produção
if (process.env.NODE_ENV === 'production' && process.env.AUTO_START_WORKER === 'true') {
  console.log('Auto-iniciando Job Worker...');
  startJobWorker();
}