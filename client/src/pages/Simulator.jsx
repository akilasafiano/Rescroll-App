import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../App.jsx';

const TOPICS = ['Kabar buruk dari mana-mana', 'Thread panjang yang bikin emosi', 'Komentar saling serang', 'Prediksi suram tahun depan', 'Video viral yang memancing amarah', 'Rangkuman tragedi hari ini'];
const BG = ['#1b2a41', '#3d1f2b', '#26324a', '#2f2a1f', '#1f3a34', '#3a2745'];

// Simulasi feed media sosial + deteksi doomscrolling real-time (durasi scroll berkelanjutan + frekuensi kembali ke feed)
export function Simulator() {
  const { user } = useApp();
  const nav = useNavigate();
  const th = user.settings.threshold;
  const [cont, setCont] = useState(0);       // detik scroll berkelanjutan
  const [total, setTotal] = useState(0);     // total detik aktif scroll
  const [returns, setReturns] = useState(0); // jumlah kembali ke feed
  const [popup, setPopup] = useState(0);     // 0 = tidak tampil, 1 = "Still scrolling?", 2 = "Streak at Risk!"
  const s = useRef({ last: 0, cont: 0, total: 0, returns: 0, triggered: false, shown: 0, sent: false, popup: 0 });

  const touch = () => { s.current.last = Date.now(); };
  const send = (redirected) => {
    const r = s.current;
    if (r.sent || r.total === 0) return; r.sent = true;
    api('/sessions', { method: 'POST', body: { durationSec: r.total, returns: r.returns, triggered: r.triggered, redirected } }).catch(() => {});
  };

  useEffect(() => {
    const r = s.current;
    const tick = setInterval(() => {
      if (r.popup) return;
      if (Date.now() - r.last < 2500) { r.cont += 1; r.total += 1; } else if (Date.now() - r.last > 6000) r.cont = 0;
      setCont(r.cont); setTotal(r.total);
      if (user.settings.notify && r.cont >= th) {
        r.triggered = true; r.shown += 1; r.cont = 0;
        r.popup = user.streakAtRisk && r.shown % 2 === 1 ? 2 : 1; setPopup(r.popup);
      }
    }, 1000);
    const vis = () => { if (document.visibilityState === 'visible') { r.returns += 1; setReturns(r.returns); } };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', vis); send(false); };
  }, [th]);

  const close = () => { s.current.popup = 0; setPopup(0); s.current.last = 0; };
  const jump = () => { send(true); s.current.popup = 0; nav('/redirect'); };
  const refresh = () => { s.current.returns += 1; setReturns(s.current.returns); touch(); };

  return (
    <div className="sim">
      <div className="simbar">
        <Link to="/home" style={{ color: '#fff' }}>← Keluar</Link>
        <span>Simulasi feed · scroll: <b>{cont}</b>/{th} dtk · kembali ke feed: <b>{returns}</b></span>
        <button onClick={refresh} style={{ background: '#333', color: '#fff', borderRadius: 8, padding: '4px 8px' }} aria-label="Muat ulang feed">↻</button>
      </div>
      <div className="meter"><i style={{ width: Math.min(100, (cont / th) * 100) + '%' }} /></div>
      <div className="feed" onScroll={touch} onWheel={touch} onTouchMove={touch}>
        {Array.from({ length: 40 }, (_, i) => (
          <article key={i} className="post" style={{ background: `linear-gradient(180deg,${BG[i % 6]},#000)` }}>
            <h3>{TOPICS[i % 6]}</h3>
            <p>Konten simulasi #{i + 1}. Geser terus ke bawah dan lihat ReScroll bekerja.</p>
          </article>
        ))}
      </div>
      <div className="rail" aria-hidden="true"><div><b>❤️</b>115K</div><div><b>💬</b>174</div><div><b>🔖</b>8.8K</div></div>

      {popup > 0 && (
        <div className="glass" role="alertdialog" aria-labelledby="pt">
          {popup === 1 ? (
            <>
              <h4 id="pt">Still scrolling?</h4>
              <p>Your thumb is working overtime. How about we scroll something that upgrades you?</p>
              <button className="btn" onClick={jump}>Jump to ReScroll</button>
            </>
          ) : (
            <>
              <h4 id="pt">Streak at Risk!</h4>
              <p>Scrolling here = 0 XP<br />Scrolling on ReScroll = +50 XP<br />Upgrade your streak now!</p>
              <button className="btn" onClick={jump}>Switch to ReScroll</button>
            </>
          )}
          <button className="btn ghost" onClick={close}>Lanjut scroll</button>
        </div>
      )}
    </div>
  );
}

// Tujuan "Jump to ReScroll": alternatif konten (micro-learning) sesuai topik, bukan blokir
export function Redirect() {
  const [items, setItems] = useState(null);
  useEffect(() => { api('/redirect').then((r) => setItems(r.items)); }, []);
  return (
    <div className="pbg" style={{ paddingTop: 36, minHeight: '100dvh' }}>
      <h1 style={{ color: '#D13F12', margin: '0 22px 4px', fontSize: 28, lineHeight: 1.25 }}>Scroll yang menaikkan level-mu</h1>
      <p style={{ margin: '0 22px 20px', color: '#6b5a1a' }}>Pilih satu bacaan singkat. Selesaikan untuk <b>+50 XP</b> dan jaga streak-mu.</p>
      <div className="list">
        {!items && <div className="empty">Memuat…</div>}
        {items?.map((a) => (
          <Link key={a.id} to={`/read/${a.id}?src=redirect`} className={'ccard' + (a.done ? ' done' : '')}>
            <small>{a.topic}</small><h3>{a.title}</h3><span className="m">{a.min} menit baca</span><span className="xp">+50</span>
          </Link>
        ))}
      </div>
      <Link to="/home" className="sim-link" style={{ background: 'transparent', border: 0, color: '#8a7410' }}>Ke beranda</Link>
    </div>
  );
}
