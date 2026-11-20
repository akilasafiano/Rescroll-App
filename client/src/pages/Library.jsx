import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../App.jsx';
import BookCover from '../components/BookCover.jsx';
import SearchBox from '../components/SearchBox.jsx';
import { useReveal } from '../components/hooks.js';

export default function Library() {
  const { user } = useApp();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') === 'article' ? 'article' : 'ebook';
  const q = sp.get('q') || '';
  const [items, setItems] = useState(null);
  useEffect(() => {
    setItems(null);
    api(`/contents?type=${tab}&q=${encodeURIComponent(q)}`).then((r) => setItems(r.items));
  }, [tab, q, user.xp]);
  useReveal(items);
  const setTab = (t) => setSp({ tab: t, ...(q ? { q } : {}) });

  return (
    <div className="lib">
      <header className="lib-top">
        <div>
          <h1>Library</h1>
          <p>{tab === 'ebook' ? 'Koleksi e-book pilihan, dari klasik sampai teknologi.' : 'Bacaan singkat yang bisa selesai dalam beberapa menit.'}</p>
        </div>
        <SearchBox initial={q} />
      </header>

      <div className="tabs2" role="tablist">
        <button role="tab" aria-selected={tab === 'ebook'} className={tab === 'ebook' ? 'on' : ''} onClick={() => setTab('ebook')}>E-Book</button>
        <button role="tab" aria-selected={tab === 'article'} className={tab === 'article' ? 'on' : ''} onClick={() => setTab('article')}>Artikel</button>
      </div>

      {q && (
        <p className="lib-filter">Hasil untuk “{q}”
          <button onClick={() => setSp({ tab })}>Hapus filter</button>
        </p>
      )}

      {!items && <div className="empty">Memuat…</div>}
      {items && !items.length && <div className="empty">Belum ada {tab === 'ebook' ? 'e-book' : 'artikel'} yang cocok dengan pencarianmu.</div>}

      {tab === 'ebook' ? (
        <div className="book-grid">
          {items?.map((c, i) => (
            <Link key={c.id} to={`/read/${c.id}`} style={{ '--i': i % 4 }} className={'book rv' + (c.done ? ' done' : '')}>
              <BookCover item={c} />
              <div className="book-meta"><span>{c.min} menit baca</span><b>+{c.xp} XP</b></div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="article-list">
          {items?.map((c, i) => (
            <Link key={c.id} to={`/read/${c.id}`} style={{ '--i': i % 4 }} className={'arow rv' + (c.done ? ' done' : '')}>
              <div>
                <span className="acard-topic">{c.topic}</span>
                <h3>{c.title}</h3>
                <p>{c.lead}</p>
                <small>{c.min} menit baca</small>
              </div>
              <b>+{c.xp} XP</b>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
