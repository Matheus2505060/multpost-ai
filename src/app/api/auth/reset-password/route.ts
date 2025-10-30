import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, verifyToken, hashPassword } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { id, token, password } = await request.json();

    // Validações básicas
    if (!id || !token || !password) {
      return NextResponse.json(
        { error: 'ID, token e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
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

    // Hash da nova senha
    const hashedPassword = await hashPassword(password);

    // Atualizar senha
    const updatedUser = await updateUser(id, { password: hashedPassword });
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Erro ao atualizar senha' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Senha redefinida com sucesso! Você já pode fazer login.',
    });

  } catch (error) {
    console.error('Erro no reset de senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}