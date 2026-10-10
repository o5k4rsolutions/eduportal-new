const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const LEN = { 'Krótka': 'ok. 120–180 słów', 'Średnia': 'ok. 250–350 słów', 'Szczegółowa': 'ok. 500–700 słów' };

export async function onRequestPost({ request, env }) {
  const { topic, subject, length } = await request.json().catch(() => ({}));
  if (typeof topic !== 'string' || !topic.trim() || topic.length > 200) return json({ error: 'Podaj temat (maks. 200 znaków).' }, 400);
  if (!env.openai_api) return json({ error: 'Brak klucza openai_api na serwerze.' }, 500);

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.openai_api },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 1800,
      messages: [
        { role: 'system', content: 'Jesteś doświadczonym nauczycielem. Piszesz po polsku zwięzłe, rzetelne notatki do nauki dla uczniów. Używaj wyłącznie czystego tekstu – bez składni Markdown (bez #, ** i tabel). Zacznij od krótkiego tytułu, potem sekcje z krótkimi nagłówkami, a punkty zaczynaj od „• ”. Nie wymyślaj faktów; jeśli czegoś nie jesteś pewien, pomiń to.' },
        { role: 'user', content: `Przedmiot: ${String(subject || '').slice(0, 40)}\nTemat: ${topic.trim()}\nDługość: ${LEN[length] || LEN['Średnia']}` }
      ]
    })
  });
  if (!r.ok) return json({ error: 'Nie udało się wygenerować notatki. Spróbuj za chwilę.' }, 502);
  const out = await r.json();
  const text = out.choices?.[0]?.message?.content?.trim();
  return text ? json({ text }) : json({ error: 'Pusta odpowiedź. Spróbuj ponownie.' }, 502);
}
