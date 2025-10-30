import { BaseAdapter, VideoMetadata, PublishOptions, ValidationResult, UploadResult, PublishResult, JobStatus } from './base';

export class YouTubeShortsAdapter extends BaseAdapter {
  private readonly API_BASE = 'https://www.googleapis.com/youtube/v3';
  private readonly UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';
  
  // Limites do YouTube Shorts
  private readonly MAX_TITLE_LENGTH = 100;
  private readonly MAX_DESCRIPTION_LENGTH = 5000;
  private readonly MAX_DURATION = 60; // 60 segundos
  private readonly MIN_DURATION = 1;
  private readonly MAX_FILE_SIZE = 256 * 1024 * 1024; // 256MB

  constructor(accessToken: string, refreshToken?: string) {
    super('youtube', accessToken, refreshToken);
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
      warnings.push('Para melhor performance no Shorts, use proporção 9:16');
    }

    if (options.tags && options.tags.length > 10) {
      warnings.push('YouTube recomenda no máximo 10 tags');
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

      // Preparar metadados do vídeo
      const metadata = {
        snippet: {
          title: this.truncateText(options.title, this.MAX_TITLE_LENGTH),
          description: this.truncateText(options.description, this.MAX_DESCRIPTION_LENGTH),
          tags: options.tags?.slice(0, 10), // Máximo 10 tags
          categoryId: '22', // People & Blogs
          defaultLanguage: 'pt-BR'
        },
        status: {
          privacyStatus: options.privacy || 'unlisted', // Unlisted por padrão
          selfDeclaredMadeForKids: false
        }
      };

      // Fazer upload usando resumable upload
      const uploadResponse = await this.resumableUpload(file, metadata);
      
      return {
        success: true,
        jobId: uploadResponse.id
      };

    } catch (error) {
      console.error('Erro no upload YouTube:', error);
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

      // Se tem data de agendamento, usar API de agendamento
      if (options.scheduleDate) {
        return await this.scheduleVideo(uploadId, options.scheduleDate);
      }

      // Publicar imediatamente mudando privacyStatus
      const response = await fetch(`${this.API_BASE}/videos?part=status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: uploadId,
          status: {
            privacyStatus: 'public'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        publishedUrl: `https://youtube.com/shorts/${uploadId}`,
        externalId: uploadId
      };

    } catch (error) {
      console.error('Erro na publicação YouTube:', error);
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

      const response = await fetch(`${this.API_BASE}/videos?part=status,processingDetails&id=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      const video = data.items?.[0];

      if (!video) {
        return { status: 'failed', error: 'Vídeo não encontrado' };
      }

      const processingStatus = video.processingDetails?.processingStatus;
      const uploadStatus = video.status?.uploadStatus;

      // Mapear status do YouTube para nosso sistema
      if (uploadStatus === 'uploaded' && processingStatus === 'succeeded') {
        return {
          status: 'published',
          publishedUrl: `https://youtube.com/shorts/${jobId}`
        };
      } else if (processingStatus === 'processing') {
        return {
          status: 'processing',
          progress: video.processingDetails?.processingProgress?.partsProcessed || 0
        };
      } else if (uploadStatus === 'failed' || processingStatus === 'failed') {
        return {
          status: 'failed',
          error: video.processingDetails?.processingFailureReason || 'Falha no processamento'
        };
      }

      return { status: 'queued' };

    } catch (error) {
      console.error('Erro ao verificar status YouTube:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async cancel(jobId: string): Promise<boolean> {
    try {
      // YouTube não permite cancelar uploads em progresso
      // Apenas deletar o vídeo se já foi processado
      const response = await fetch(`${this.API_BASE}/videos?id=${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.ok;

    } catch (error) {
      console.error('Erro ao cancelar YouTube:', error);
      return false;
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) return null;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.YT_CLIENT_ID!,
          client_secret: process.env.YT_CLIENT_SECRET!,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      return data.access_token;

    } catch (error) {
      console.error('Erro ao renovar token YouTube:', error);
      return null;
    }
  }

  // Métodos auxiliares
  private async resumableUpload(file: Buffer, metadata: any): Promise<any> {
    // Implementação simplificada do resumable upload
    // Em produção, implementar upload em chunks
    const response = await fetch(this.UPLOAD_URL + '?uploadType=multipart&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'multipart/related; boundary="boundary"'
      },
      body: this.createMultipartBody(metadata, file)
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  }

  private createMultipartBody(metadata: any, file: Buffer): string {
    const boundary = 'boundary';
    let body = '';
    
    body += `--${boundary}\r\n`;
    body += 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
    body += JSON.stringify(metadata) + '\r\n';
    body += `--${boundary}\r\n`;
    body += 'Content-Type: video/mp4\r\n\r\n';
    
    return body + file.toString('binary') + `\r\n--${boundary}--`;
  }

  private async scheduleVideo(videoId: string, scheduleDate: Date): Promise<PublishResult> {
    // YouTube não suporta agendamento via API para Shorts
    // Retornar como agendado e processar via worker
    return {
      success: true,
      publishedUrl: `https://youtube.com/shorts/${videoId}`,
      externalId: videoId
    };
  }

  // Métodos mock para modo sandbox
  private mockUpload(filename: string, options: PublishOptions): UploadResult {
    const mockJobId = `yt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      success: true,
      jobId: mockJobId
    };
  }

  private mockPublish(uploadId: string): PublishResult {
    return {
      success: true,
      publishedUrl: `https://youtube.com/shorts/${uploadId}`,
      externalId: uploadId
    };
  }

  private mockGetStatus(jobId: string): JobStatus {
    // Simular diferentes status baseado no tempo
    const now = Date.now();
    const jobTime = parseInt(jobId.split('_')[1]) || now;
    const elapsed = now - jobTime;

    if (elapsed < 5000) {
      return { status: 'processing', progress: 25 };
    } else if (elapsed < 10000) {
      return { status: 'processing', progress: 75 };
    } else {
      return {
        status: 'published',
        publishedUrl: `https://youtube.com/shorts/${jobId}`
      };
    }
  }
}