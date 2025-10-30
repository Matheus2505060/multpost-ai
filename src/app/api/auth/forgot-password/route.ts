import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, generateToken } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validação básica
    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await getUserByEmail(email);
    
    // Sempre retornar sucesso por segurança (não revelar se email existe)
    if (!user) {
      return NextResponse.json({
        message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.',
      });
    }

    // Gerar token de reset (expira em 1 hora)
    const resetToken = generateToken(user.id);

    // Enviar email de reset
    const emailSent = await sendPasswordResetEmail(email, user.id, resetToken);
    
    if (!emailSent) {
      console.warn('Falha ao enviar email de reset para:', email);
    }

    return NextResponse.json({
      message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.',
    });

  } catch (error) {
    console.error('Erro no forgot-password:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}