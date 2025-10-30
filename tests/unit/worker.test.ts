import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { JobWorker } from '@/lib/worker'
import { Publisher } from '@/lib/publisher'

// Mock do Publisher
vi.mock('@/lib/publisher')

describe('JobWorker', () => {
  let worker: JobWorker
  let mockPublisher: any

  beforeEach(() => {
    // Reset dos mocks
    vi.clearAllMocks()
    
    // Mock do Publisher
    mockPublisher = {
      getPendingJobs: vi.fn(),
      processJob: vi.fn()
    }
    
    vi.mocked(Publisher).mockImplementation(() => mockPublisher)
    
    worker = new JobWorker()
  })

  afterEach(() => {
    // Garantir que worker está parado
    worker.stop()
  })

  it('deve iniciar worker corretamente', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    worker.start()
    
    expect(consoleSpy).toHaveBeenCalledWith('Iniciando Job Worker...')
    expect(worker.getStatus().running).toBe(true)
    
    consoleSpy.mockRestore()
  })

  it('deve parar worker corretamente', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    worker.start()
    worker.stop()
    
    expect(consoleSpy).toHaveBeenCalledWith('Parando Job Worker...')
    expect(worker.getStatus().running).toBe(false)
    
    consoleSpy.mockRestore()
  })

  it('não deve iniciar worker se já estiver rodando', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    worker.start()
    worker.start() // Segunda tentativa
    
    expect(consoleSpy).toHaveBeenCalledWith('Worker já está rodando')
    
    consoleSpy.mockRestore()
  })

  it('deve processar jobs pendentes', async () => {
    const mockJobs = [
      { id: 'job1', status: 'queued' },
      { id: 'job2', status: 'queued' }
    ]
    
    mockPublisher.getPendingJobs.mockResolvedValue(mockJobs)
    mockPublisher.processJob.mockResolvedValue(true)
    
    // Iniciar worker
    worker.start()
    
    // Aguardar um ciclo de processamento
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(mockPublisher.getPendingJobs).toHaveBeenCalled()
    expect(mockPublisher.processJob).toHaveBeenCalledWith('job1')
    expect(mockPublisher.processJob).toHaveBeenCalledWith('job2')
  })

  it('deve lidar com erro no processamento', async () => {
    const mockJobs = [{ id: 'job1', status: 'queued' }]
    
    mockPublisher.getPendingJobs.mockResolvedValue(mockJobs)
    mockPublisher.processJob.mockRejectedValue(new Error('Processing error'))
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    worker.start()
    
    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Erro ao processar job job1:'),
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })

  it('deve processar jobs em lotes', async () => {
    // Criar 10 jobs para testar batching
    const mockJobs = Array.from({ length: 10 }, (_, i) => ({
      id: `job${i + 1}`,
      status: 'queued'
    }))
    
    mockPublisher.getPendingJobs.mockResolvedValue(mockJobs)
    mockPublisher.processJob.mockResolvedValue(true)
    
    worker.start()
    
    // Aguardar processamento completo
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Verificar se todos os jobs foram processados
    expect(mockPublisher.processJob).toHaveBeenCalledTimes(10)
  })

  it('deve retornar status correto', () => {
    expect(worker.getStatus().running).toBe(false)
    
    worker.start()
    expect(worker.getStatus().running).toBe(true)
    expect(worker.getStatus().interval).toBe(60000)
    
    worker.stop()
    expect(worker.getStatus().running).toBe(false)
  })

  it('deve lidar com lista vazia de jobs', async () => {
    mockPublisher.getPendingJobs.mockResolvedValue([])
    
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    worker.start()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(consoleSpy).toHaveBeenCalledWith('Nenhum job pendente encontrado')
    expect(mockPublisher.processJob).not.toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })
})