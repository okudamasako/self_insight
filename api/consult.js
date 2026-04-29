export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // デモ版として Gemini API を直接使用します
  // Vercelで設定した際の大文字小文字の違い(Gemini_API_KEY)も吸収できるようにします
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini APIキーが設定されていません。Vercelの環境変数に GEMINI_API_KEY を設定してください。' });
  }

  try {
    // フロントエンドから送られてきた「相談内容」を受け取る
    const { worry, feeling, goal, zodiac, number } = req.body;
    
    // AIの役割設定（システムプロンプト）
    const systemInstruction = `あなたは占いと数秘術の要素を取り入れた、優しく寄り添うカウンセラーです。
ユーザーの相談内容に対して、星座（${zodiac}）と数秘（${number}）の特性を踏まえながら、
優しく、否定せず、心が少し軽くなるようなアドバイスを返してください。`;

    // ユーザーからの入力
    const promptText = `【相談内容】${worry}\n【今の気持ち】${feeling}\n【どうなりたいか】${goal}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error Response:', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to connect to AI', details: errorText });
    }

    const data = await response.json();
    
    // Geminiのレスポンス形式からテキストを抽出
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      throw new Error('AIから有効な回答が返ってきませんでした');
    }

    // AIからの回答をフロントエンドへ返す
    res.status(200).json({ message: answer });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to connect to AI' });
  }
}
