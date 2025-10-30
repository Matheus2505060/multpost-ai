import Stripe from 'stripe';

// Configuração do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export default stripe;

// Configuração dos preços baseada no modo
export const getStripeConfig = () => {
  const isTestMode = process.env.STRIPE_MODE === 'test';
  
  return {
    publicKey: process.env.STRIPE_PUBLIC_KEY!,
    priceIds: {
      mensal: isTestMode ? process.env.PRICE_ID_MENSAL_TEST! : process.env.PRICE_ID_MENSAL_LIVE!,
      anual: isTestMode ? process.env.PRICE_ID_ANUAL_TEST! : process.env.PRICE_ID_ANUAL_LIVE!,
    },
    mode: isTestMode ? 'test' : 'live',
  };
};

// Mapear price_id para plano
export const mapPriceIdToPlan = (priceId: string): 'mensal' | 'anual' | 'none' => {
  const config = getStripeConfig();
  
  if (priceId === config.priceIds.mensal) return 'mensal';
  if (priceId === config.priceIds.anual) return 'anual';
  return 'none';
};