export default async function handler(req, res) {
  // リクエストメソッドがPOST以外の場合はエラーを返す（不正なアクセスを防ぐため）
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 環境変数からOpenAIのAPIキーを取得する
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  // APIキーが設定されていない場合はエラーを返す
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI APIキーが設定されていません。Vercelの環境変数に OPENAI_API_KEY を設定してください。' });
  }

  try {
    // フロントエンドから送られてきたデータ（相談内容など）を受け取る
    const { worry, feeling, goal, zodiac, number } = req.body;
    
    // AIの役割設定（システムプロンプト：AIにどういう立場で答えてほしいかを指示する）
    const systemInstruction = `あなたは占いと数秘術の要素を取り入れた、優しく寄り添うカウンセラーです。
ユーザーの相談内容に対して、星座（${zodiac}）と数秘（${number}）の特性を踏まえながら、
優しく、否定せず、心が少し軽くなるようなアドバイスを返してください。`;

    // ユーザーからの実際の入力内容をまとめる
    const promptText = `【相談内容】${worry}\n【今の気持ち】${feeling}\n【どうなりたいか】${goal}`;

    // OpenAI APIへの通信先URL
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    // OpenAI APIにリクエストを送信する
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}` // APIキーを使って認証する
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 使用するAIモデルを指定
        messages: [
          { role: 'system', content: systemInstruction }, // AIの役割
          { role: 'user', content: promptText }           // ユーザーの入力
        ],
        temperature: 0.7 // 回答の創造性（0に近いほど固く、1に近いほど自由になる）
      })
    });

    // APIからのレスポンスが正常でない場合のエラーハンドリング
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error Response:', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to connect to AI', details: errorText });
    }

    // レスポンスのJSONデータを取得
    const data = await response.json();
    
    // OpenAIのレスポンス形式から、テキスト部分だけを抜き出す
    const answer = data.choices?.[0]?.message?.content;

    // 回答が空だった場合はエラーを投げる
    if (!answer) {
      throw new Error('AIから有効な回答が返ってきませんでした');
    }

    // 成功した場合は、AIからの回答をフロントエンドへ返す
    res.status(200).json({ message: answer });
  } catch (error) {
    // 予期せぬエラーが発生した場合の処理
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to connect to AI' });
  }
}
