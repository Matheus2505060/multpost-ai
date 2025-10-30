import { BaseAdapter, VideoMetadata, PublishOptions, ValidationResult, UploadResult, PublishResult, JobStatus } from './base';

export class InstagramReelsAdapter extends BaseAdapter {
  private readonly API_BASE = 'https://graph.facebook.com/v18.0';
  
  // Limites do Instagram Reels
  private readonly MAX_TITLE_LENGTH = 2200; // Instagram usa caption como título
  private readonly MAX_DESCRIPTION_LENGTH = 2200;
  private readonly MAX_DURATION = 90; // 90 segundos
  private readonly MIN_DURATION = 3;
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  constructor(accessToken: string, refreshToken?: string) {
    super('facebook', accessToken, refreshToken);
  }

  validate(videoMeta: VideoMetadata, options: PublishOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar título (caption no Instagram)
    errors.push(...this.validateTitle(options.title, this.MAX_TITLE_LENGTH));

    // Validar descrição (combinada com título no Instagram)
    const totalText = options.title + ' ' + options.description;
    if (totalText.length > this.MAX_DESCRIPTION_LENGTH) {
      errors.push(`Texto total (título + descrição) deve ter no máximo ${this.MAX_DESCRIPTION_LENGTH} caracteres`);
    }

    // Validar duração
    errors.push(...this.validateDuration(videoMeta.duration, this.MIN_DURATION, this.MAX_DURATION));

    // Validar tamanho do arquivo
    errors.push(...this.validateFileSize(videoMeta.size, this.MAX_FILE_SIZE));

    // Validar formato vertical
    errors.push(...this.validateVerticalVideo(videoMeta));

    // Avisos para otimização
    if (videoMeta.aspectRatio > 0.6) {
      warnings.push('Para melhor performance no Reels, use proporção 9:16');
    }

    if (videoMeta.duration > 30) {
      warnings.push('Reels de até 30 segundos têm melhor alcance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  async upload(file: Buffer, filename: string, options: PublishOptions): Promise<UploadResult> {
    try {
      // Em modo sandbox, simular upload
      if (process.env.SANDBOX === 'true') {
        return this.mockUpload(filename, options);
      }

      // Passo 1: Criar container de mídia
      const containerId = await this.createMediaContainer(file, options);
      
      return {
        success: true,
        jobId: containerId
      };

    } catch (error) {
      console.error('Erro no upload Instagram:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no upload'
      };
    }
  }

  async publish(uploadId: string, options: PublishOptions): Promise<PublishResult> {
    try {
      // Em modo sandbox, simular publicação
      if (process.env.SANDBOX === 'true') {
        return this.mockPublish(uploadId);
      }

      // Instagram não suporta agendamento nativo via API
      // Publicar imediatamente
      const mediaId = await this.publishMediaContainer(uploadId);
      
      return {
        success: true,
        publishedUrl: `https://instagram.com/reel/${mediaId}`,
        externalId: mediaId
      };

    } catch (error) {
      console.error('Erro na publicação Instagram:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na publicação'
      };
    }
  }

  async getStatus(jobId: string): Promise<JobStatus> {
    try {
      // Em modo sandbox, simular status
      if (process.env.SANDBOX === 'true') {
        return this.mockGetStatus(jobId);
      }

      // Verificar status do container
      const response = await fetch(`${this.API_BASE}/${jobId}?fields=status_code`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Mapear status do Instagram para nosso sistema
      switch (data.status_code) {
        case 'FINISHED':
          return {
            status: 'published',
            publishedUrl: `https://instagram.com/reel/${jobId}`
          };
        case 'IN_PROGRESS':
          return { status: 'processing' };
        case 'ERROR':
          return {
            status: 'failed',
            error: 'Erro no processamento do Instagram'
          };
        default:
          return { status: 'queued' };
      }

    } catch (error) {
      console.error('Erro ao verificar status Instagram:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async cancel(jobId: string): Promise<boolean> {
    try {
      // Instagram não permite cancelar uploads em progresso
      // Apenas deletar o post se já foi publicado
      const response = await fetch(`${this.API_BASE}/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.ok;

    } catch (error) {
      console.error('Erro ao cancelar Instagram:', error);
      return false;
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) return null;

    try {
      const response = await fetch(`${this.API_BASE}/oauth/access_token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      return data.access_token;

    } catch (error) {
      console.error('Erro ao renovar token Instagram:', error);
      return null;
    }
  }

  // Métodos auxiliares
  private async createMediaContainer(file: Buffer, options: PublishOptions): Promise<string> {
    // Primeiro, fazer upload do vídeo para um serviço temporário
    const videoUrl = await this.uploadToTempStorage(file);
    
    // Criar container de mídia
    const response = await fetch(`${this.API_BASE}/me/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: videoUrl,
        caption: this.createCaption(options),
        share_to_feed: true
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create media container: ${response.status}`);
    }

    const data = await response.json();
    return data.id;
  }

  private async publishMediaContainer(containerId: string): Promise<string> {
    const response = await fetch(`${this.API_BASE}/me/media_publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creation_id: containerId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to publish media: ${response.status}`);
    }

    const data = await response.json();
    return data.id;
  }

  private async uploadToTempStorage(file: Buffer): Promise<string> {
    // Em produção, usar serviço como AWS S3 ou similar
    // Por enquanto, retornar URL mock
    return `https://temp-storage.example.com/video_${Date.now()}.mp4`;
  }

  private createCaption(options: PublishOptions): string {
    let caption = options.title;
    
    if (options.description) {
      caption += '\n\n' + options.description;
    }

    // Adicionar hashtags se fornecidas
    if (options.tags && options.tags.length > 0) {
      caption += '\n\n' + options.tags.map(tag => `#${tag}`).join(' ');
    }

    return this.truncateText(caption, this.MAX_DESCRIPTION_LENGTH);
  }

  // Métodos mock para modo sandbox
  private mockUpload(filename: string, options: PublishOptions): UploadResult {
    const mockJobId = `ig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      jobId: mockJobId
    };
  }

  private mockPublish(uploadId: string): PublishResult {
    return {
      success: true,
      publishedUrl: `https://instagram.com/reel/${uploadId}`,
      externalId: uploadId
    };
  }

  private mockGetStatus(jobId: string): JobStatus {
    // Simular diferentes status baseado no tempo
    const now = Date.now();
    const jobTime = parseInt(jobId.split('_')[1]) || now;
    const elapsed = now - jobTime;

    if (elapsed < 8000) {
      return { status: 'processing', progress: 30 };
    } else if (elapsed < 15000) {
      return { status: 'processing', progress: 80 };
    } else {
      return {
        status: 'published',
        publishedUrl: `https://instagram.com/reel/${jobId}`
      };
    }
  }
}