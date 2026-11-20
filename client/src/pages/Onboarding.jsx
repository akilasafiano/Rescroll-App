import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../App.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function Welcome() {
  const { login, notify } = useApp();
  const [stage, setStage] = useState('intro');
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (stage !== 'auth' || !GOOGLE_CLIENT_ID) return;
    const render = () => window.google?.accounts?.id?.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        setBusy(true);
        try { const r = await api('/auth/google', { method: 'POST', body: { credential } }); login(r.user); nav(r.user.topics.length >= 3 ? '/home' : '/topics'); }
        catch (err) { notify(err.message); setBusy(false); }
      },
    });
    if (window.google?.accounts?.id) render();
    else { const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.onload = render; document.head.appendChild(script); }
  }, [stage, login, nav, notify]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const path = mode === 'register' ? '/register' : '/login';
      const body = mode === 'register' ? { name, email, password } : { email, password };
      const r = await api(path, { method: 'POST', body }); login(r.user); nav(r.user.topics.length >= 3 ? '/home' : '/topics');
    } catch (err) { notify(err.message); setBusy(false); }
  };

  if (stage === 'intro') return (
    <section className="intro-screen">
      <div className="intro-top"><span className="brand-mark">R</span><span>ReScroll</span><span className="intro-pill">YOUR DIGITAL RESET</span></div>
      <div className="intro-copy"><span className="eyebrow">SCROLL WITH INTENTION</span><h1>Make your<br/><em>scroll</em> count.</h1><p>Ubah waktu layar yang terbuang menjadi momen belajar, eksplorasi, dan progres kecil setiap hari.</p><button className="btn intro-cta" onClick={() => setStage('auth')}>Mulai perjalanan <span>→</span></button><div className="intro-note">Discover · Learn · Grow</div></div>
      <div className="intro-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-card card-a"><span>01 / DISCOVER</span><b>Find your<br/>next curiosity.</b><i>✳</i></div><div className="art-card card-b"><span>DAILY PROGRESS</span><b>+120 XP</b><small>You're building a better habit.</small></div><div className="art-dot">✦</div></div>
    </section>
  );

  return (
    <section className="auth-screen">
      <div className="auth-brand"><span className="brand-mark">R</span><b>ReScroll</b></div>
      <div className="auth-card">
        <span className="eyebrow">WELCOME TO YOUR RESET</span>
        <h1>{mode === 'login' ? 'Welcome back.' : 'Create your space.'}</h1>
        <p className="auth-sub">{mode === 'login' ? 'Masuk dan lanjutkan perjalanan baikmu.' : 'Satu akun untuk kebiasaan digital yang lebih mindful.'}</p>
        <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Masuk</button><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Daftar</button></div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <label>Nama lengkap<input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama kamu" maxLength={40} required/></label>}
          <label>Email<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" autoComplete="email" required/></label>
          <label>Password<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 8 karakter" minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} required/></label>
          <button className="btn auth-submit" disabled={busy}>{busy ? 'Memproses…' : mode === 'login' ? 'Masuk ke ReScroll' : 'Buat akun'}</button>
        </form>
        <div className="auth-divider"><span/>atau lanjutkan dengan<span/></div>
        {GOOGLE_CLIENT_ID ? <button className="google-btn" onClick={()=>window.google?.accounts?.id?.prompt()} disabled={busy}><b>G</b> Lanjutkan dengan Google</button> : <div className="google-unconfigured"><b>G</b><span>Google Sign-In siap diaktifkan setelah Google Client ID ditambahkan di file <code>client/.env</code>.</span></div>}
        <button className="text-back" onClick={()=>setStage('intro')}>← Kembali ke perkenalan</button>
      </div>
      <p className="auth-foot">Dengan melanjutkan, kamu menyetujui penggunaan data sesuai pengaturan privasi ReScroll.</p>
    </section>
  );
}

const TOPIC_META = {
  Entertainment: ['Film, musik, budaya pop, dan cerita kreatif.', '🎬', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=700'],
  Sport: ['Olahraga, atlet, kebugaran, dan kompetisi.', '🏃', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=700'],
  Education: ['Pengetahuan baru, skill, dan pengembangan diri.', '📚', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=700'],
  Health: ['Kesehatan, wellbeing, dan kebiasaan seimbang.', '🌿', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700'],
  Social: ['Relasi, komunitas, dan isu sosial.', '🤝', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700'],
  Technology: ['Inovasi digital, sains, dan teknologi.', '💡', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=700'],
};
export function Topics() {
  const { user, setUser, notify } = useApp();
  const [all, setAll] = useState([]); const [sel, setSel] = useState(user.topics || []); const nav = useNavigate();
  useEffect(() => { api('/topics').then(r => setAll(r.topics)); }, []);
  const toggle = t => { if (sel.includes(t)) setSel(sel.filter(x=>x!==t)); else if (sel.length >= 3) notify('Pilih tepat 3 topik favorit.'); else setSel([...sel,t]); };
  const go = async () => { const r = await api('/me', { method:'PUT', body:{topics:sel} }); setUser(r.user); nav('/home'); };
  return <section className="topics-screen"><header className="topics-head"><button className="back" onClick={()=>nav(-1)}>←</button><span className="eyebrow">PERSONALIZE YOUR FEED</span><h1>Pilih hal yang<br/><em>membuatmu penasaran.</em></h1><p>Pilih 3 topik. ReScroll akan menyusun rekomendasi berdasarkan minatmu.</p><div className="selection-count">{sel.length} <span>/ 3 dipilih</span></div></header><div className="topic-grid">{all.map(t=>{const meta=TOPIC_META[t]||['Explore more content','✦',''];return <button key={t} className={'topic-card '+(sel.includes(t)?'selected':'')} onClick={()=>toggle(t)} style={{'--topic-image':`url(${meta[2]})`}}><span className="topic-emoji">{meta[1]}</span><span className="topic-check">✓</span><b>{t}</b><small>{meta[0]}</small></button>})}</div><button className="btn topic-continue" disabled={sel.length!==3} onClick={go}>Lanjut ke beranda <span>→</span></button></section>;
}
