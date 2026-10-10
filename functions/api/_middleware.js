// Każde wywołanie /api/* musi mieć ważny token zalogowanego użytkownika Supabase
// (inaczej ktokolwiek mógłby spalić Twój budżet w OpenAI).
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });

export async function onRequest({ request, env, next, data }) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Zaloguj się ponownie.' }, 401);
  const r = await fetch(env.SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token }
  });
  if (!r.ok) return json({ error: 'Sesja wygasła. Zaloguj się ponownie.' }, 401);
  data.user = await r.json();
  return next();
}
