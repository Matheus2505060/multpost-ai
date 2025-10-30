import { beforeAll, afterAll, beforeEach } from 'vitest'

// Mock do Supabase para testes
const mockSupabase = {
  from: (table: string) => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
    eq: () => mockSupabase.from(table),
    single: () => ({ data: null, error: null }),
    order: () => mockSupabase.from(table),
    limit: () => mockSupabase.from(table),
    in: () => mockSupabase.from(table),
    or: () => mockSupabase.from(table)
  }),
  auth: {
    signUp: () => ({ data: { user: null }, error: null }),
    signInWithPassword: () => ({ data: { user: null }, error: null }),
    signOut: () => ({ error: null }),
    getUser: () => ({ data: { user: null }, error: null })
  }
}

// Mock global do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock do Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}))

// Setup global
beforeAll(() => {
  // Configurações globais para testes
})

afterAll(() => {
  // Limpeza após todos os testes
})

beforeEach(() => {
  // Reset de mocks antes de cada teste
  vi.clearAllMocks()
})