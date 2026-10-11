const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const LEN = { 'Krótka': 'ok. 120–180 słów', 'Średnia': 'ok. 250–350 słów', 'Szczegółowa': 'ok. 500–700 słów' };
const SYSTEM = 'Jesteś doświadczonym nauczycielem. Piszesz po polsku zwięzłe, rzetelne notatki do nauki dla uczniów. Używaj wyłącznie czystego tekstu – bez składni Markdown (bez #, ** i tabel). Zacznij od krótkiego tytułu, potem sekcje z krótkimi nagłówkami, a punkty zaczynaj od „• ”. Nie wymyślaj faktów; jeśli czegoś nie jesteś pewien, pomiń to. Pisz poprawną polszczyzną.';

function clean(t) {
  t = String(t || '').replace(/\*\*|__/g, '').replace(/^\s{0,8}#{1,6}\s+/gm, '').replace(/^(\s*)[*\-]\s+/gm, '$1• ');
  const out = []; let last = '', n = 0;
  for (const l of t.split('\n')) {
    const k = l.trim();
    if (k && k === last) { if (++n > 1) continue; } else { last = k; n = 0; }
    out.push(l);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function run(env, model, input) {
  try { return await env.AI.run(model, input); }
  catch (e) {
    if (/agree|license|5016/i.test(String(e.message))) {
      await env.AI.run(model, { prompt: 'agree' }).catch(() => {});
      return await env.AI.run(model, input);
    }
    throw e;
  }
}

export async function onRequestPost({ request, env }) {
  const { topic, subject, length } = await request.json().catch(() => ({}));
  if (typeof topic !== 'string' || !topic.trim() || topic.length > 200) return json({ error: 'Podaj temat (maks. 200 znaków).' }, 400);
  if (!env.AI) return json({ error: 'Brak powiązania AI w Cloudflare (Settings → Bindings → Workers AI, nazwa: AI).' }, 500);

  try {
    const out = await run(env, env.AI_TEXT_MODEL || '@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Przedmiot: ${String(subject || '').slice(0, 40)}\nTemat: ${topic.trim()}\nDługość: ${LEN[length] || LEN['Średnia']}` }
      ],
      max_tokens: 1800,
      temperature: 0.4
    });
    const text = clean(out?.response ?? out?.choices?.[0]?.message?.content ?? '');
    return text ? json({ text }) : json({ error: 'Pusta odpowiedź. Spróbuj ponownie.' }, 502);
  } catch (e) {
    console.error('WorkersAI', e.message);
    return json({ error: 'Nie udało się wygenerować notatki. (AI: ' + String(e.message).slice(0, 160) + ')' }, 502);
  }
}
