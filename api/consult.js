export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DIFY_API_URL = 'https://api.dify.ai/v1/chat-messages';
  const DIFY_API_KEY = process.env.DIFY_API_KEY;

  try {
    // フロントエンドから送られてきた「相談内容」を受け取る
    const { worry, feeling, goal, zodiac, number } = req.body;
    
    // Difyに送るために1つの文章にまとめる
    const query = `【相談内容】${worry}\n【今の気持ち】${feeling}\n【どうなりたいか】${goal}\n【基本情報】星座: ${zodiac}, 数秘: ${number}`;

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
        user: 'user-123' // 必要に応じてIDは管理してください
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify API Error Response:', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to connect to AI', details: errorText });
    }

    const data = await response.json();

    // AIからの回答をフロントエンドへ返す（キー名を message に変更）
    res.status(200).json({ message: data.answer });
  } catch (error) {
    console.error('Dify API Error:', error);
    res.status(500).json({ error: 'Failed to connect to AI' });
  }
}
