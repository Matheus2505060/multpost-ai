import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/supabase';
import stripe, { getStripeConfig } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { plan, userId } = await request.json();

    // Validações
    if (!plan || !userId || !['mensal', 'anual'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plano e usuário são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Configuração do Stripe
    const config = getStripeConfig();
    const priceId = config.priceIds[plan as keyof typeof config.priceIds];

    // Criar ou recuperar customer do Stripe
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Salvar customer_id no banco
      await updateUser(user.id, { stripe_customer_id: customerId });
    }

    // Configurar trial apenas para plano mensal
    const sessionConfig: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=1`,
      metadata: {
        userId: user.id,
        plan,
      },
    };

    // Adicionar trial apenas para plano mensal
    if (plan === 'mensal') {
      sessionConfig.subscription_data = {
        trial_period_days: 7,
      };
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}