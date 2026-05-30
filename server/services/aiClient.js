const API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6-20250514';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function callAI(messages, options = {}, maxRetries = 3) {
  const body = JSON.stringify({
    model: MODEL,
    max_tokens: options.maxTokens ?? 4096,
    messages,
    ...(options.system ? { system: options.system } : {}),
  });
  console.log(`[AI] Calling ${MODEL}, body size: ${(body.length / 1024).toFixed(1)}KB`);

  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const res = await fetch(`${BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 429) {
        console.log(`[AI] Rate limited, retrying (${i + 1}/${maxRetries})...`);
        await sleep(1000 * (i + 1));
        continue;
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const textBlock = data.content?.find((b) => b.type === 'text');
      return textBlock?.text ?? '';
    } catch (err) {
      console.error(`[AI] Call failed (${i + 1}/${maxRetries}):`, err.message);
      if (i === maxRetries - 1) throw err;
      await sleep(800 * (i + 1));
    }
  }
}
