import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, verifyToken } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { id, token } = await request.json();

    // Validações básicas
    if (!id || !token) {
      return NextResponse.json(
        { error: 'ID e token são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar token
    const decoded = verifyToken(token);
    if (!decoded || decoded.userId !== id) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Se já verificado, retornar sucesso
    if (user.verified) {
      return NextResponse.json({
        message: 'Email já verificado',
      });
    }

    // Atualizar usuário como verificado
    const updatedUser = await updateUser(id, { verified: true });
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Erro ao verificar email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Email verificado com sucesso! Você já pode fazer login.',
    });

  } catch (error) {
    console.error('Erro na verificação de email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}