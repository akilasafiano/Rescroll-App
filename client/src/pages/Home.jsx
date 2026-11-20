import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../App.jsx';
import SearchBox from '../components/SearchBox.jsx';
import { useReveal } from '../components/hooks.js';

// posisi hari dalam siklus streak (N kartu): mana yang sudah terisi, mana "Hari Ini"
export const cycle = (streak, checked, n) => {
  let filled = streak === 0 ? 0 : ((streak - 1) % n) + 1;
  if (!checked && filled === n) filled = 0;
  return { filled, today: checked ? filled - 1 : filled };
};

export function CheckinPanel({ n, cls, dayCls }) {
  const { user, setUser, notify } = useApp();
  const c = cycle(user.streak, user.checkedToday, n);
  const go = async () => {
    try {
      const r = await api('/checkin', { method: 'POST' }); setUser(r.user);
      notify(`Check-in berhasil! +${r.gained} XP` + (r.newBadges ? ' · Badge baru 🎉' : ''));
    } catch (e) { notify(e.message); }
  };
  return (
    <>
      <div className={cls}>
        {Array.from({ length: n }, (_, i) => dayCls(i, c))}
      </div>
      <button className="btn indigo" onClick={go} disabled={user.checkedToday}>
        {user.checkedToday ? 'Sudah check-in ✓' : 'Check-in hari ini'}
      </button>
    </>
  );
}

export default function Home() {
  const { user } = useApp();
  const [daily, setDaily] = useState(null);
  useEffect(() => { api('/home').then((r) => setDaily(r.daily)); }, [user.xp]);
  useReveal(daily);
  const first = (user.name || '').split(' ')[0];
  const doneCount = daily ? daily.filter((a) => a.done).length : 0;

  return (
    <div className="home">
      <header className="home-top">
        <div>
          <h1>Halo, {first}</h1>
          <p>Scroll dengan tujuan. Mulai dari satu bacaan hari ini.</p>
        </div>
        <SearchBox />
      </header>

      <section id="checkin" className="streak-card rv" aria-label="Check-in harian">
        <div className="streak-hero">
          <img src="/assets/campfire.png" alt="" />
          <div>
            <b>Streak +{user.streak}</b>
            <span>Level {user.level} · {user.xp} XP</span>
          </div>
        </div>
        <CheckinPanel n={4} cls="days d4" dayCls={(i, c) => (
          <div key={i} style={{ '--i': i }} className={'day' + (i === c.today ? ' today' : '') + (i < c.filled ? '' : ' off')}>
            <span>{i === c.today ? 'Hari ini' : `Hari ${i + 1}`}</span>
            <img src="/assets/flame.png" alt="" />
          </div>
        )} />
      </section>

      <a id="security" className="security-row rv" href="https://periksadata.com/" target="_blank" rel="noopener noreferrer"
        aria-label="Buka PeriksaData untuk mengecek kebocoran email">
        <span className="security-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>
        </span>
        <span className="security-copy">
          <strong>Pernahkah email kamu bocor?</strong>
          <span>Cek apakah alamat emailmu muncul dalam insiden kebocoran data. Pemeriksaan dilakukan di PeriksaData, dan kamu memasukkan email sendiri di situs tersebut.</span>
        </span>
        <span className="security-go" aria-hidden="true">↗</span>
      </a>

      <section id="artikel" className="daily" aria-label="Artikel harian">
        <div className="sec-head rv">
          <div>
            <h2>Bacaan hari ini</h2>
            <p>Selesaikan artikel untuk menambah XP dan menjaga streak.</p>
          </div>
          {daily && <div className="sec-progress" aria-label={`${doneCount} dari ${daily.length} selesai`}>
            <span>{doneCount}/{daily.length} selesai</span>
            <i><b style={{ width: (daily.length ? (doneCount / daily.length) * 100 : 0) + '%' }} /></i>
          </div>}
        </div>
        <div className="article-grid">
          {!daily && <div className="empty">Memuat…</div>}
          {daily?.map((a, i) => (
            <Link key={a.id} to={`/read/${a.id}`} style={{ '--i': i }} className={'acard rv' + (a.done ? ' done' : '')}>
              <span className="acard-topic">{a.topic}</span>
              <h3>{a.title}</h3>
              <p>{a.lead}</p>
              <footer><span>{a.min} menit baca</span><b>+{a.xp} XP</b></footer>
            </Link>
          ))}
        </div>
        <Link to="/library?tab=article" className="more-link rv">Lihat semua artikel</Link>
      </section>
    </div>
  );
}
