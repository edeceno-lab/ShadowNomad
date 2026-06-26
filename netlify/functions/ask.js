exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { word } = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `You are a bilingual English dictionary for Spanish speakers. For the word: "${word}" respond ONLY with valid JSON, no markdown:
{"word":"${word}","pronunciation":"phonetic using Spanish sounds, CAPS for stress, hyphens between syllables","definition":"1-2 sentence English definition","examples":["example 1","example 2"]}`
        }]
      })
    });

    const raw = await response.text();
    if (!response.ok) {
      return { statusCode: 200, headers, body: JSON.stringify({ debug: true, status: response.status, raw }) };
    }

    const data = JSON.parse(raw);
    const text = data.content.map(b => b.text || '').join('');
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };

  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ debug: true, error: err.message }) };
  }
};
