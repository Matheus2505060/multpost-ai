import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, generateToken } from '@/lib/supabase';

// Rate limiting simples (em produção, use Redis ou similar)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validações básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Rate limiting - máx 5 tentativas por 15 min
    const clientIP = request.ip || 'unknown';
    const now = Date.now();
    const attempts = loginAttempts.get(clientIP);

    if (attempts && attempts.count >= 5 && now - attempts.lastAttempt < 15 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
        { status: 429 }
      );
    }

    // Buscar usuário
    const user = await getUserByEmail(email);
    if (!user) {
      // Incrementar tentativas mesmo se usuário não existir (segurança)
      loginAttempts.set(clientIP, {
        count: (attempts?.count || 0) + 1,
        lastAttempt: now,
      });
      
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      // Incrementar tentativas
      loginAttempts.set(clientIP, {
        count: (attempts?.count || 0) + 1,
        lastAttempt: now,
      });
      
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Reset tentativas em caso de sucesso
    loginAttempts.delete(clientIP);

    // Gerar token JWT
    const token = generateToken(user.id);

    // Criar resposta com cookie
    const response = NextResponse.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        plan: user.plan,
        status: user.status,
      },
    });

    // Definir cookie httpOnly
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    });

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}