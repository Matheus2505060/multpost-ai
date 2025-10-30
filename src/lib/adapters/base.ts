// Interface base para todos os adapters de plataforma
export interface VideoMetadata {
  duration: number; // em segundos
  width: number;
  height: number;
  size: number; // em bytes
  aspectRatio: number;
}

export interface PublishOptions {
  title: string;
  description: string;
  tags?: string[];
  scheduleDate?: Date;
  privacy?: 'public' | 'unlisted' | 'private';
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UploadResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

export interface PublishResult {
  success: boolean;
  publishedUrl?: string;
  externalId?: string;
  error?: string;
}

export interface JobStatus {
  status: 'queued' | 'processing' | 'published' | 'failed' | 'cancelled';
  progress?: number;
  error?: string;
  publishedUrl?: string;
}

export abstract class BaseAdapter {
  protected provider: string;
  protected accessToken: string;
  protected refreshToken?: string;

  constructor(provider: string, accessToken: string, refreshToken?: string) {
    this.provider = provider;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  // Validar se o vídeo atende aos requisitos da plataforma
  abstract validate(videoMeta: VideoMetadata, options: PublishOptions): ValidationResult;

  // Fazer upload do arquivo
  abstract upload(file: Buffer, filename: string, options: PublishOptions): Promise<UploadResult>;

  // Publicar o vídeo (pode ser imediato ou agendado)
  abstract publish(uploadId: string, options: PublishOptions): Promise<PublishResult>;

  // Verificar status de um job
  abstract getStatus(jobId: string): Promise<JobStatus>;

  // Cancelar um job
  abstract cancel(jobId: string): Promise<boolean>;

  // Renovar token de acesso se necessário
  abstract refreshAccessToken(): Promise<string | null>;

  // Validações comuns
  protected validateTitle(title: string, maxLength: number): string[] {
    const errors: string[] = [];
    if (!title.trim()) {
      errors.push('Título é obrigatório');
    }
    if (title.length > maxLength) {
      errors.push(`Título deve ter no máximo ${maxLength} caracteres`);
    }
    return errors;
  }

  protected validateDescription(description: string, maxLength: number): string[] {
    const errors: string[] = [];
    if (description.length > maxLength) {
      errors.push(`Descrição deve ter no máximo ${maxLength} caracteres`);
    }
    return errors;
  }

  protected validateVerticalVideo(videoMeta: VideoMetadata): string[] {
    const errors: string[] = [];
    const { width, height, aspectRatio } = videoMeta;
    
    // Verificar se é vertical (9:16 ou similar)
    if (aspectRatio >= 1) {
      errors.push('Vídeo deve ser vertical (9:16 recomendado)');
    }
    
    // Verificar resolução mínima
    if (width < 720 || height < 1280) {
      errors.push('Resolução mínima: 720x1280');
    }
    
    return errors;
  }

  protected validateDuration(duration: number, minDuration: number, maxDuration: number): string[] {
    const errors: string[] = [];
    if (duration < minDuration) {
      errors.push(`Duração mínima: ${minDuration} segundos`);
    }
    if (duration > maxDuration) {
      errors.push(`Duração máxima: ${maxDuration} segundos`);
    }
    return errors;
  }

  protected validateFileSize(size: number, maxSize: number): string[] {
    const errors: string[] = [];
    if (size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      errors.push(`Tamanho máximo do arquivo: ${maxSizeMB}MB`);
    }
    return errors;
  }

  protected truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}