import { supabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface SignUpData {
  name: string
  email: string
  password: string
}

export interface SignInData {
  email: string
  password: string
}

// Cadastrar usuário
export async function signUp({ name, email, password }: SignUpData) {
  try {
    // 1. Criar conta no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    })

    if (authError) throw authError

    // 2. Salvar dados adicionais na tabela users
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            name: name,
            created_at: new Date().toISOString()
          }
        ])

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError)
      }
    }

    return { data: authData, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Fazer login
export async function signIn({ email, password }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Fazer logout
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Obter usuário atual
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // Buscar dados completos do usuário na tabela users
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || ''
      }
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name
    }
  } catch (error) {
    return null
  }
}

// Resetar senha
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Verificar se usuário está logado
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser()
      callback(user)
    } else {
      callback(null)
    }
  })
}