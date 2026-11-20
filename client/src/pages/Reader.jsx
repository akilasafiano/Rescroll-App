import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../App.jsx';
import BookCover from '../components/BookCover.jsx';
import { useScrollState } from '../components/hooks.js';

export default function Reader() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const source = sp.get('src') === 'redirect' ? 'redirect' : 'library';
  const { setUser, notify } = useApp();
  const [item, setItem] = useState(null);
  const [left, setLeft] = useState(null);
  const [res, setRes] = useState(null);
  const nav = useNavigate();
  const sc = useScrollState();

  useEffect(() => {
    setItem(null); setRes(null);
    api('/contents/' + id).then((r) => {
      setItem(r.item);
      const need = r.item.secs ?? (r.item.type === 'ebook' ? Math.min(90, r.item.min * 30) : Math.min(90, r.item.min * 20));
      setLeft(r.item.done ? 0 : need);
    }).catch(() => nav('/home'));
  }, [id]);
  useEffect(() => { if (left > 0) { const t = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(t); } }, [left]);

  const finish = async () => {
    try { const r = await api(`/contents/${id}/complete`, { method: 'POST', body: { source } }); setUser(r.user); setRes(r); }
    catch (e) { notify(e.message); }
  };
  if (!item) return <div className="center">Memuat…</div>;
  const xp = source === 'redirect' ? 50 : item.xp;
  const reachedEnd = sc.p > 0.85;
  const ready = !item.done && left <= 0 && reachedEnd;
  const hint = item.done ? '' : left > 0 && !reachedEnd ? `Baca sampai bawah dan tunggu ${left} detik.` : left > 0 ? `Tunggu ${left} detik lagi.` : !reachedEnd ? 'Gulir sampai akhir bacaan untuk menyelesaikan.' : '';

  return (
    <article className="reader2">
      <button className="back-link" onClick={() => nav(-1)}>← Kembali</button>
      <header className={'read-head' + (item.cover ? ' with-cover' : '')}>
        <div>
          <span className="acard-topic">{item.topic}</span>
          <h1>{item.title}</h1>
          {item.sub && <p className="read-sub">{item.sub}</p>}
          <p className="read-meta">{item.min} menit baca</p>
        </div>
        {item.cover && <BookCover item={item} className="small" />}
      </header>
      <div className="read-body">
        {item.body.map((p, i) => p.startsWith('## ')
          ? <h2 key={i}>{p.slice(3)}</h2>
          : <p key={i}>{p}</p>)}
      </div>
      <div className="read-finish">
        <button className="btn" disabled={!ready || !!res} onClick={finish}>
          {item.done ? 'Sudah selesai ✓' : ready ? `Selesai membaca · +${xp} XP` : 'Selesaikan bacaan'}
        </button>
        {hint && <p>{hint}</p>}
      </div>
      {res && (
        <div className="modal" role="dialog" aria-modal="true">
          <div>
            <img src="/assets/campfire.png" alt="" width="80" />
            <h2>+{res.gained} XP</h2>
            <p>{res.levelUp ? `Naik ke Level ${res.user.level}! 🎉` : `Level ${res.user.level} · ${res.user.levelProgress}/100 XP`}{res.newBadges ? ' · Badge baru terbuka 🏅' : ''}</p>
            <button className="btn" onClick={() => nav('/home')}>Kembali ke Beranda</button>
          </div>
        </div>
      )}
    </article>
  );
}
