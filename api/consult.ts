export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { zodiac, number, worry, feeling, goal } = req.body;

    const apiKey = process.env.DIFY_API_KEY || '';
    const authHeader = apiKey.startsWith('Bearer ')
      ? apiKey
      : `Bearer ${apiKey}`;

    const query = `
星座：${zodiac}
数秘：${number}
相談内容：${worry}
今の気持ち：${feeling}
望んでいる状態：${goal}

この人に、共感・状況整理・小さな提案の順で、やさしく具体的に答えてください。
`;

    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {},
        query,
        response_mode: 'blocking',
        user: 'self-insight-user'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Dify API error'
      });
    }

    return res.status(200).json({
      message: data.answer || '回答を生成できませんでした。'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Server error'
    });
  }
}
