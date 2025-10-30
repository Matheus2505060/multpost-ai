import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/supabase';
import { generateToken } from '@/lib/supabase';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Criar usuário
    const user = await createUser(name, email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // Gerar token de verificação
    const verificationToken = generateToken(user.id);

    // Enviar email de verificação
    const emailSent = await sendVerificationEmail(email, user.id, verificationToken);
    
    if (!emailSent) {
      console.warn('Falha ao enviar email de verificação para:', email);
    }

    return NextResponse.json({
      message: 'Conta criada com sucesso! Verifique seu email para ativar a conta.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.verified,
      },
    });

  } catch (error) {
    console.error('Erro no signup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}