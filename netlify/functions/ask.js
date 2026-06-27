exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  try {
    const { word } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a bilingual English dictionary for Spanish speakers. For the word: "${word}" respond ONLY with valid JSON, no markdown, no backticks, no extra text:
{"word":"${word}","pronunciation":"phonetic using Spanish sounds, CAPS for stressed syllable, hyphens between syllables, e.g. AP-ul for apple","definition":"Clear 1-2 sentence English definition","examples":["Natural example sentence using the word.","Another natural example sentence."]}`
            }]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 512 }
        })
      }
    );

    const raw = await response.text();
    if (!response.ok) return { statusCode: 200, headers, body: JSON.stringify({ debug: true, status: response.status, raw }) };

    const data = JSON.parse(raw);
    const text = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };

  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ debug: true, error: err.message }) };
  }
};
