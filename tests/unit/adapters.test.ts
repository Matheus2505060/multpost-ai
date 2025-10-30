import { describe, it, expect, vi, beforeEach } from 'vitest'
import { YouTubeShortsAdapter } from '@/lib/adapters/youtubeShorts'
import { InstagramReelsAdapter } from '@/lib/adapters/instagramReels'
import { TikTokAdapter } from '@/lib/adapters/tiktok'
import type { VideoMetadata, PublishOptions } from '@/lib/adapters/base'

// Mock das APIs externas
vi.mock('googleapis', () => ({
  google: {
    youtube: () => ({
      videos: {
        insert: vi.fn()
      }
    }),
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: vi.fn(),
        refreshAccessToken: vi.fn()
      }))
    }
  }
}))

describe('Adapters de Publicação', () => {
  const mockVideoMeta: VideoMetadata = {
    duration: 30,
    width: 1080,
    height: 1920,
    aspectRatio: 9/16,
    fileSize: 10 * 1024 * 1024, // 10MB
    format: 'mp4'
  }

  const mockPublishOptions: PublishOptions = {
    title: 'Vídeo de Teste',
    description: 'Descrição do vídeo de teste #teste',
    tags: ['teste', 'unitario']
  }

  describe('YouTubeShortsAdapter', () => {
    let adapter: YouTubeShortsAdapter

    beforeEach(() => {
      adapter = new YouTubeShortsAdapter('mock-access-token', 'mock-refresh-token')
    })

    it('deve validar vídeo corretamente', () => {
      const result = adapter.validate(mockVideoMeta, mockPublishOptions)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve rejeitar vídeo muito longo', () => {
      const longVideoMeta = { ...mockVideoMeta, duration: 120 } // 2 minutos
      const result = adapter.validate(longVideoMeta, mockPublishOptions)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Duração máxima para YouTube Shorts é 60 segundos')
    })

    it('deve rejeitar vídeo horizontal', () => {
      const horizontalVideoMeta = { 
        ...mockVideoMeta, 
        width: 1920, 
        height: 1080, 
        aspectRatio: 16/9 
      }
      const result = adapter.validate(horizontalVideoMeta, mockPublishOptions)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('YouTube Shorts requer vídeo vertical (9:16)')
    })

    it('deve truncar título longo', () => {
      const longTitle = 'A'.repeat(150) // Título muito longo
      const options = { ...mockPublishOptions, title: longTitle }
      const result = adapter.validate(mockVideoMeta, options)
      
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Título será truncado para 100 caracteres')
    })

    it('deve fazer upload com sucesso', async () => {
      const mockBuffer = Buffer.from('fake video data')
      
      // Mock da resposta da API
      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'youtube-video-id' }
      })
      
      vi.doMock('googleapis', () => ({
        google: {
          youtube: () => ({
            videos: { insert: mockInsert }
          })
        }
      }))

      const result = await adapter.upload(mockBuffer, 'test.mp4', mockPublishOptions)
      
      expect(result.success).toBe(true)
      expect(result.jobId).toBe('youtube-video-id')
    })

    it('deve lidar com erro de upload', async () => {
      const mockBuffer = Buffer.from('fake video data')
      
      // Mock de erro da API
      const mockInsert = vi.fn().mockRejectedValue(new Error('API Error'))
      
      vi.doMock('googleapis', () => ({
        google: {
          youtube: () => ({
            videos: { insert: mockInsert }
          })
        }
      }))

      const result = await adapter.upload(mockBuffer, 'test.mp4', mockPublishOptions)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('API Error')
    })
  })

  describe('InstagramReelsAdapter', () => {
    let adapter: InstagramReelsAdapter

    beforeEach(() => {
      adapter = new InstagramReelsAdapter('mock-access-token')
    })

    it('deve validar vídeo corretamente', () => {
      const result = adapter.validate(mockVideoMeta, mockPublishOptions)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve rejeitar vídeo muito grande', () => {
      const largeVideoMeta = { 
        ...mockVideoMeta, 
        fileSize: 1024 * 1024 * 1024 // 1GB
      }
      const result = adapter.validate(largeVideoMeta, mockPublishOptions)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Tamanho máximo para Instagram Reels é 100MB')
    })

    it('deve truncar descrição longa', () => {
      const longDescription = 'A'.repeat(3000) // Descrição muito longa
      const options = { ...mockPublishOptions, description: longDescription }
      const result = adapter.validate(mockVideoMeta, options)
      
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Descrição será truncada para 2200 caracteres')
    })
  })

  describe('TikTokAdapter', () => {
    let adapter: TikTokAdapter

    beforeEach(() => {
      adapter = new TikTokAdapter('mock-access-token')
    })

    it('deve validar vídeo corretamente', () => {
      const result = adapter.validate(mockVideoMeta, mockPublishOptions)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('deve rejeitar vídeo muito longo para TikTok', () => {
      const longVideoMeta = { ...mockVideoMeta, duration: 600 } // 10 minutos
      const result = adapter.validate(longVideoMeta, mockPublishOptions)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Duração máxima para TikTok é 180 segundos')
    })

    it('deve validar formato de arquivo', () => {
      const invalidFormatMeta = { ...mockVideoMeta, format: 'avi' }
      const result = adapter.validate(invalidFormatMeta, mockPublishOptions)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('TikTok aceita apenas MP4')
    })
  })
})