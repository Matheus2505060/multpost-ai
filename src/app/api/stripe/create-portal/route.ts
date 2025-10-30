import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/supabase';
import stripe from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    // Validação
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await getUserById(userId);
    if (!user || !user.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou sem assinatura' },
        { status: 404 }
      );
    }

    // Criar sessão do portal do cliente
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
    });

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {
    console.error('Erro ao criar portal do cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao acessar portal de cobrança' },
      { status: 500 }
    );
  }
}