export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI APIキーが設定されていません。' });
  }

  try {
    const { worry, feeling, goal, zodiac, number } = req.body;

    const systemInstruction = `あなたは占いと数秘術の要素を取り入れた、優しく寄り添うカウンセラーです。
ユーザーの相談内容に対して、星座（${zodiac}）と数秘（${number}）の特性を踏まえながら、
優しく、否定せず、心が少し軽くなるようなアドバイスを返してください。

返答の最後に必ず以下のタグを1つだけ付けてください。他の文章は一切付け加えないでください。
判断基準は「場所や立場」ではなく「実際の関係の深さ」です。
- 恋愛関係・交際・不倫・片思い・家族・親友など、実際に親密な間柄の相手が登場する場合（たとえ職場・ご近所であっても恋愛感情や深い親密さが伴う場合を含む）→ [COMPAT:yes]
- 仕事上の付き合いのみの上司・同僚、ご近所トラブル、ママ友の軋轢など親密さを伴わない関係、または特定の相手が登場しない相談 → [COMPAT:no]`;

    const promptText = `【相談内容】${worry}\n【今の気持ち】${feeling}\n【どうなりたいか】${goal}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: promptText }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'AIとの通信に失敗しました', details: errorText });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error('AIから有効な回答が返ってきませんでした');
    }

    // [COMPAT:yes/no] タグを抽出してフロントに渡す
    const compatMatch = answer.match(/\[COMPAT:(yes|no)\]/);
    const showCompat = compatMatch ? compatMatch[1] === 'yes' : false;
    const message = answer.replace(/\[COMPAT:(yes|no)\]/, '').trim();

    res.status(200).json({ message, showCompat });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'AIとの通信に失敗しました' });
  }
}
