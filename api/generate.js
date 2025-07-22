export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration: missing API key.' });
  }

  try {
    const { model, messages, max_tokens, temperature } = req.body;
    if (!model || !messages) {
      return res.status(400).json({ error: 'Missing required fields: model and messages.' });
    }

    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      }),
    });

    const data = await openRouterRes.json();
    if (!openRouterRes.ok) {
      console.error('OpenRouter API error:', data);
      return res.status(openRouterRes.status).json({ error: data.error || 'OpenRouter API error', details: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in /api/generate:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
} 