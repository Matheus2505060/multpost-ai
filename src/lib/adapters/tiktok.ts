import { BaseAdapter, VideoMetadata, PublishOptions, ValidationResult, UploadResult, PublishResult, JobStatus } from './base';

export class TikTokAdapter extends BaseAdapter {
  private readonly API_BASE = 'https://open-api.tiktok.com/share/video/upload/';
  
  // Limites do TikTok
  private readonly MAX_TITLE_LENGTH = 150;
  private readonly MAX_DESCRIPTION_LENGTH = 2200;
  private readonly MAX_DURATION = 180; // 3 minutos
  private readonly MIN_DURATION = 3;
  private readonly MAX_FILE_SIZE = 128 * 1024 * 1024; // 128MB

  constructor(accessToken: string, refreshToken?: string) {
    super('tiktok', accessToken, refreshToken);
  }

  validate(videoMeta: VideoMetadata, options: PublishOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar título
    errors.push(...this.validateTitle(options.title, this.MAX_TITLE_LENGTH));

    // Validar descrição
    errors.push(...this.validateDescription(options.description, this.MAX_DESCRIPTION_LENGTH));

    // Validar duração
    errors.push(...this.validateDuration(videoMeta.duration, this.MIN_DURATION, this.MAX_DURATION));

    // Validar tamanho do arquivo
    errors.push(...this.validateFileSize(videoMeta.size, this.MAX_FILE_SIZE));

    // Validar formato vertical
    errors.push(...this.validateVerticalVideo(videoMeta));

    // Avisos para otimização
    if (videoMeta.aspectRatio > 0.6) {
      warnings.push('Para melhor performance no TikTok, use proporção 9:16');
    }

    if (videoMeta.duration > 60) {
      warnings.push('Vídeos de até 60 segundos têm melhor alcance no TikTok');
    }

    if (options.tags && options.tags.length > 5) {
      warnings.push('TikTok recomenda no máximo 5 hashtags');
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

      // Passo 1: Inicializar upload
      const uploadUrl = await this.initializeUpload();
      
      // Passo 2: Fazer upload do arquivo
      const uploadResult = await this.uploadFile(uploadUrl, file, options);
      
      return {
        success: true,
        jobId: uploadResult.publish_id
      };

    } catch (error) {
      console.error('Erro no upload TikTok:', error);
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

      // TikTok não suporta agendamento via API
      // Publicar imediatamente
      const response = await fetch('https://open-api.tiktok.com/share/video/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_id: uploadId,
          post_info: {
            title: this.truncateText(options.title, this.MAX_TITLE_LENGTH),
            privacy_level: 'SELF_ONLY', // Privado por padrão, depois mudar para público
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: uploadId // Na verdade seria a URL do vídeo
          }
        })
      });

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        publishedUrl: `https://tiktok.com/@user/video/${data.share_id}`,
        externalId: data.share_id
      };

    } catch (error) {
      console.error('Erro na publicação TikTok:', error);
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

      const response = await fetch(`https://open-api.tiktok.com/share/video/query/?share_id=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Mapear status do TikTok para nosso sistema
      switch (data.status) {
        case 'PROCESSING_DOWNLOAD':
        case 'PROCESSING_UPLOAD':
          return { status: 'processing', progress: 50 };
        case 'SEND_TO_USER_INBOX':
          return { status: 'processing', progress: 90 };
        case 'PUBLISHED':
          return {
            status: 'published',
            publishedUrl: `https://tiktok.com/@user/video/${jobId}`
          };
        case 'FAILED':
          return {
            status: 'failed',
            error: data.fail_reason || 'Erro no processamento do TikTok'
          };
        default:
          return { status: 'queued' };
      }

    } catch (error) {
      console.error('Erro ao verificar status TikTok:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async cancel(jobId: string): Promise<boolean> {
    try {
      // TikTok não permite cancelar uploads via API
      // Retornar false indicando que não é possível cancelar
      return false;

    } catch (error) {
      console.error('Erro ao cancelar TikTok:', error);
      return false;
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) return null;

    try {
      const response = await fetch('https://open-api.tiktok.com/oauth/refresh_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      return data.access_token;

    } catch (error) {
      console.error('Erro ao renovar token TikTok:', error);
      return null;
    }
  }

  // Métodos auxiliares
  private async initializeUpload(): Promise<string> {
    const response = await fetch('https://open-api.tiktok.com/share/video/upload/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_info: {
          source: 'FILE_UPLOAD'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize upload: ${response.status}`);
    }

    const data = await response.json();
    return data.upload_url;
  }

  private async uploadFile(uploadUrl: string, file: Buffer, options: PublishOptions): Promise<any> {
    const formData = new FormData();
    formData.append('video', new Blob([file], { type: 'video/mp4' }));
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  }

  // Métodos mock para modo sandbox
  private mockUpload(filename: string, options: PublishOptions): UploadResult {
    const mockJobId = `tt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      jobId: mockJobId
    };
  }

  private mockPublish(uploadId: string): PublishResult {
    return {
      success: true,
      publishedUrl: `https://tiktok.com/@user/video/${uploadId}`,
      externalId: uploadId
    };
  }

  private mockGetStatus(jobId: string): JobStatus {
    // Simular diferentes status baseado no tempo
    const now = Date.now();
    const jobTime = parseInt(jobId.split('_')[1]) || now;
    const elapsed = now - jobTime;

    if (elapsed < 6000) {
      return { status: 'processing', progress: 20 };
    } else if (elapsed < 12000) {
      return { status: 'processing', progress: 60 };
    } else {
      return {
        status: 'published',
        publishedUrl: `https://tiktok.com/@user/video/${jobId}`
      };
    }
  }
}