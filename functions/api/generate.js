const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const LEN = { 'Krótka': 'ok. 120–180 słów', 'Średnia': 'ok. 250–350 słów', 'Szczegółowa': 'ok. 500–700 słów' };
const SYSTEM = 'Jesteś doświadczonym nauczycielem. Piszesz po polsku zwięzłe, rzetelne notatki do nauki dla uczniów. Używaj wyłącznie czystego tekstu – bez składni Markdown (bez #, ** i tabel). Zacznij od krótkiego tytułu, potem sekcje z krótkimi nagłówkami, a punkty zaczynaj od „• ”. Nie wymyślaj faktów; jeśli czegoś nie jesteś pewien, pomiń to.';

export async function onRequestPost({ request, env }) {
  const { topic, subject, length } = await request.json().catch(() => ({}));
  if (typeof topic !== 'string' || !topic.trim() || topic.length > 200) return json({ error: 'Podaj temat (maks. 200 znaków).' }, 400);
  if (!env.gemini_api) return json({ error: 'Brak klucza gemini_api na serwerze.' }, 500);

  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.gemini_api },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: `Przedmiot: ${String(subject || '').slice(0, 40)}\nTemat: ${topic.trim()}\nDługość: ${LEN[length] || LEN['Średnia']}` }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 4000 }
    })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    const why = e.error?.message || ('HTTP ' + r.status);
    console.error('Gemini', r.status, why);
    return json({ error: 'Nie udało się wygenerować notatki. (Gemini: ' + why.slice(0, 160) + ')' }, 502);
  }
  const out = await r.json();
  const text = (out.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
  return text ? json({ text }) : json({ error: 'Pusta odpowiedź (mogła zostać zablokowana). Spróbuj zmienić temat.' }, 502);
}
