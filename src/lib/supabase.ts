import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos para o usuário
export interface User {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  role: 'owner' | 'admin' | 'member';
  plan: 'mensal' | 'anual' | 'none';
  status: 'trial' | 'ativo' | 'past_due' | 'cancelado' | 'none';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  trial_end_at?: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

// Função para hash da senha
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Função para verificar senha
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Função para gerar token JWT
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d',
  });
};

// Função para verificar token JWT
export const verifyToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
  } catch {
    return null;
  }
};

// Função para criar usuário
export const createUser = async (name: string, email: string, password: string): Promise<User | null> => {
  try {
    const hashedPassword = await hashPassword(password);
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: 'owner',
          plan: 'none',
          status: 'none',
          verified: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return null;
  }
};

// Função para buscar usuário por email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
};

// Função para buscar usuário por ID
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
};

// Função para atualizar usuário
export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return null;
  }
};

// Função para verificar se evento do Stripe já foi processado
export const isStripeEventProcessed = async (eventId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('id', eventId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
};

// Função para marcar evento do Stripe como processado
export const markStripeEventProcessed = async (eventId: string): Promise<void> => {
  try {
    await supabase
      .from('stripe_events')
      .insert([{ id: eventId }]);
  } catch (error) {
    console.error('Erro ao marcar evento como processado:', error);
  }
};