import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'session_idが必要です' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      res.status(200).json({ paid: true, metadata: session.metadata });
    } else {
      res.status(200).json({ paid: false });
    }
  } catch (error) {
    console.error('Stripe verify error:', error);
    res.status(500).json({ error: '決済確認に失敗しました' });
  }
}
