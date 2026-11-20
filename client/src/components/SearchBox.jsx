import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function Hl({ text, q }) {
  const words = q.trim().split(/\s+/).filter(Boolean).map(esc);
  if (!words.length) return text;
  return text.split(new RegExp(`(${words.join('|')})`, 'ig')).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

// Kotak pencarian dengan saran langsung (judul, topik, penulis, dan isi bacaan)
export default function SearchBox({ initial = '' }) {
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const box = useRef(null);
  const seq = useRef(0);

  useEffect(() => setQ(initial), [initial]);
  useEffect(() => {
    const t = q.trim();
    if (!t) { setItems([]); setBusy(false); return; }
    setBusy(true);
    const my = ++seq.current;
    const id = setTimeout(() => {
      api('/search?q=' + encodeURIComponent(t))
        .then((r) => { if (my === seq.current) { setItems(r.items); setHi(-1); setBusy(false); } })
        .catch(() => setBusy(false));
    }, 180);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => {
    const out = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', out);
    return () => document.removeEventListener('mousedown', out);
  }, []);

  const go = (id) => { setOpen(false); nav('/read/' + id); };
  const submit = (e) => {
    e.preventDefault();
    if (hi >= 0 && items[hi]) return go(items[hi].id);
    const t = q.trim();
    if (!t) return;
    setOpen(false);
    nav(`/library?tab=${items[0]?.type || 'article'}&q=${encodeURIComponent(t)}`);
  };
  const key = (e) => {
    if (e.key === 'Escape') { setOpen(false); e.currentTarget.blur(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((h) => Math.min(items.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(-1, h - 1)); }
  };
  const showList = open && q.trim();

  return (
    <div className="searchbox" ref={box}>
      <form className="search" role="search" onSubmit={submit}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.5-4.5" /></svg>
        <input
          value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={key}
          placeholder="Cari artikel atau e-book…" aria-label="Cari konten" autoComplete="off"
          role="combobox" aria-expanded={!!showList} aria-controls="search-results"
        />
        {q && <button type="button" className="search-clear" aria-label="Hapus pencarian" onClick={() => { setQ(''); setItems([]); }}>×</button>}
      </form>
      {showList && (
        <ul className="search-pop" id="search-results" role="listbox">
          {busy && !items.length && <li className="search-empty">Mencari…</li>}
          {!busy && !items.length && <li className="search-empty">Tidak ada hasil untuk “{q.trim()}”.</li>}
          {items.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === hi}>
              <button type="button" className={'search-row' + (i === hi ? ' on' : '')} onMouseEnter={() => setHi(i)} onClick={() => go(c.id)}>
                <span className="search-type">{c.type === 'ebook' ? 'E-Book' : 'Artikel'}</span>
                <span className="search-main">
                  <b><Hl text={c.title} q={q} /></b>
                  <small>{c.snippet ? <Hl text={c.snippet} q={q} /> : `${c.topic} · ${c.min} menit baca`}</small>
                </span>
              </button>
            </li>
          ))}
          {items.length > 0 && (
            <li><button type="button" className="search-all" onClick={submit}>Lihat semua hasil di Library →</button></li>
          )}
        </ul>
      )}
    </div>
  );
}
