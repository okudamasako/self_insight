export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. DifyのAPI情報を設定
  const DIFY_API_URL = 'https://api.dify.ai/v1/chat-messages';
  const DIFY_API_KEY = process.env.DIFY_API_KEY; // ※後ほどVercelに設定します

  try {
    const { query } = req.body;

    // 2. Dify APIへリクエストを送信
    const response = await fetch(DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: 'blocking',
        conversation_id: '',
        user: 'abc-123'
      })
    });

    const data = await response.json();
    
    // 3. 結果を返す
    res.status(200).json({ answer: data.answer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to AI' });
  }
}
