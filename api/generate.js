// /api/generate.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { model, messages, max_tokens, temperature } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error:", errorText);
      return res.status(500).json({ error: 'OpenRouter error', message: errorText });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("Internal Server Error:", err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
