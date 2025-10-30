import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Publisher } from '@/lib/publisher'

// Mock do Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis()
  }))
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock dos adapters
vi.mock('@/lib/adapters/youtubeShorts')
vi.mock('@/lib/adapters/instagramReels')
vi.mock('@/lib/adapters/tiktok')

describe('Publisher', () => {
  let publisher: Publisher

  beforeEach(() => {
    vi.clearAllMocks()
    publisher = new Publisher()
  })

  describe('createPublishJobs', () => {
    it('deve criar jobs para múltiplas plataformas', async () => {
      const mockJob = { id: 'job123' }
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockJob,
        error: null
      })

      const jobIds = await publisher.createPublishJobs(
        'user123',
        'upload123',
        ['youtube', 'tiktok'],
        {
          title: 'Teste',
          description: 'Descrição teste',
          tags: ['teste']
        }
      )

      expect(jobIds).toHaveLength(2)
      expect(mockSupabase.from).toHaveBeenCalledWith('jobs')
      expect(mockSupabase.from().insert).toHaveBeenCalledTimes(2)
    })

    it('deve lidar com erro na criação de job', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const jobIds = await publisher.createPublishJobs(
        'user123',
        'upload123',
        ['youtube'],
        {
          title: 'Teste',
          description: 'Descrição teste'
        }
      )

      expect(jobIds).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('getPendingJobs', () => {
    it('deve buscar jobs pendentes corretamente', async () => {
      const mockJobs = [
        { id: 'job1', status: 'queued' },
        { id: 'job2', status: 'processing' }
      ]

      mockSupabase.from().select().in().or().order.mockResolvedValue({
        data: mockJobs,
        error: null
      })

      const jobs = await publisher.getPendingJobs()

      expect(jobs).toEqual(mockJobs)
      expect(mockSupabase.from).toHaveBeenCalledWith('jobs')
    })

    it('deve retornar array vazio em caso de erro', async () => {
      mockSupabase.from().select().in().or().order.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const jobs = await publisher.getPendingJobs()

      expect(jobs).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('getUserJobs', () => {
    it('deve buscar jobs de um usuário específico', async () => {
      const mockJobs = [
        { id: 'job1', user_id: 'user123', status: 'published' }
      ]

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockJobs,
        error: null
      })

      const jobs = await publisher.getUserJobs('user123')

      expect(jobs).toEqual(mockJobs)
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('user_id', 'user123')
    })

    it('deve filtrar por status quando especificado', async () => {
      const mockJobs = [
        { id: 'job1', user_id: 'user123', status: 'published' }
      ]

      mockSupabase.from().select().eq().eq().order.mockResolvedValue({
        data: mockJobs,
        error: null
      })

      const jobs = await publisher.getUserJobs('user123', 'published')

      expect(jobs).toEqual(mockJobs)
      // Verificar se foi chamado com filtro de status
      expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith('status', 'published')
    })
  })

  describe('cancelJob', () => {
    it('deve cancelar job com sucesso', async () => {
      const mockJob = {
        id: 'job123',
        status: 'queued',
        user_id: 'user123',
        provider: 'youtube'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockJob,
        error: null
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        data: mockJob,
        error: null
      })

      const result = await publisher.cancelJob('job123')

      expect(result).toBe(true)
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'cancelled',
        updated_at: expect.any(String)
      })
    })

    it('não deve cancelar job já publicado', async () => {
      const mockJob = {
        id: 'job123',
        status: 'published',
        user_id: 'user123',
        provider: 'youtube'
      }

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockJob,
        error: null
      })

      const result = await publisher.cancelJob('job123')

      expect(result).toBe(false)
      expect(mockSupabase.from().update).not.toHaveBeenCalled()
    })
  })

  describe('validateForPlatforms', () => {
    it('deve validar vídeo para múltiplas plataformas', async () => {
      // Mock de conexão válida
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: {
          access_token_encrypted: 'encrypted-token',
          provider: 'youtube'
        },
        error: null
      })

      const videoMeta = {
        duration: 30,
        width: 1080,
        height: 1920,
        aspectRatio: 9/16,
        fileSize: 10 * 1024 * 1024,
        format: 'mp4'
      }

      const options = {
        title: 'Teste',
        description: 'Descrição'
      }

      const results = await publisher.validateForPlatforms(
        'user123',
        ['youtube', 'tiktok'],
        videoMeta,
        options
      )

      expect(Object.keys(results)).toHaveLength(2)
      expect(results.youtube).toBeDefined()
      expect(results.tiktok).toBeDefined()
    })
  })
})