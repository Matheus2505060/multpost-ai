import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Obter token do cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 401 }
      );
    }

    // Verificar token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar usuário com tratamento de erro melhorado
    try {
      const user = await getUserById(decoded.userId);
      if (!user) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      // Remover senha da resposta
      const { password, ...userWithoutPassword } = user;

      return NextResponse.json({
        user: userWithoutPassword,
      });
    } catch (dbError) {
      console.error('Erro ao buscar usuário no banco:', dbError);
      
      // Se a tabela não existir, retornar erro específico
      if (dbError instanceof Error && dbError.message.includes('table')) {
        return NextResponse.json(
          { error: 'Banco de dados não configurado. Configure o Supabase primeiro.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erro ao acessar dados do usuário' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}