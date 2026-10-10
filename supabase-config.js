
window.EP = {
  SUPABASE_URL: 'https://gvnrtbetcukwcntvikfc.supabase.co',   // Supabase → Project Settings → API → Project URL
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bnJ0YmV0Y3Vrd2NudHZpa2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NTI1NjcsImV4cCI6MjEwNzIyODU2N30.EyVlI8YrMPo5Nq_PcUmtiqwuOfPoADW5qBv200_fwBA',          // ten sam ekran → anon public
  LOGIN: '/login',          
  HOME: '/moj-eduportal',
  ADMIN: '/admin'
};

// flagi z linków z e-maila – muszą być odczytane ZANIM supabase-js wyczyści adres
EP.recovery = /type=recovery/.test(location.hash);
EP.linkErr  = /error_code=/.test(location.hash);

window.sb = supabase.createClient(EP.SUPABASE_URL, EP.SUPABASE_ANON_KEY);

EP.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

EP.next = () => {
  const n = new URLSearchParams(location.search).get('next');
  return n && n[0] === '/' && n[1] !== '/' && n[1] !== '\\' ? n : EP.HOME;
};
// wyrzuca na logowanie i zapamiętuje, gdzie użytkownik był
EP.goLogin = () => location.replace(EP.LOGIN + '?next=' + encodeURIComponent(location.pathname + location.search + location.hash) + '#logowanie');

EP.ST = {
  new:             { label: 'Wysłane do administracji', cls: 'b-new'  },
  pending_payment: { label: 'Oczekuje na płatność',     cls: 'b-wait' },
  completed:       { label: 'Zrealizowane',             cls: 'b-ok'   },
  cancelled:       { label: 'Anulowane',                cls: 'b-bad'  }
};
EP.fmt = d => new Date(d).toLocaleDateString('pl-PL');
