import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  paid: 300,
  consult: 500,
  compat: 300,
  compatConsult: 500,
};

const LABELS = {
  paid: '詳細診断（星座×数秘）',
  consult: '気持ちの整理・相談',
  compat: '相性診断',
  compatConsult: '相手との関係相談',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, metadata } = req.body;

  if (!PRICES[type]) {
    return res.status(400).json({ error: '不正な決済タイプです' });
  }

  const origin = req.headers.origin || 'https://self-insight.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `星命館 — ${LABELS[type]}`,
            },
            unit_amount: PRICES[type],
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&type=${type}`,
      cancel_url: `${origin}/`,
      metadata: metadata || {},
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: '決済の準備に失敗しました' });
  }
}
