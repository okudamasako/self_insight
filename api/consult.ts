export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': process.env.DIFY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        user: "user-1"
      })
    });

    const data = await response.json();

    return res.status(200).json({
      answer: data.answer
    });

  } catch (error) {
    return res.status(500).json({ error: 'Error' });
  }
}
