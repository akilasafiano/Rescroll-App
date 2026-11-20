import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, assetUrl } from '../api.js';
import { useApp } from '../App.jsx';
import { CheckinPanel } from './Home.jsx';

const S = (d) => <svg viewBox="0 0 24 24">{d}</svg>;
const MENU = [
  ['account', 'Account', S(<><circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="10" r="3.2" fill="#111" /><path d="M5.6 18.5c1.4-3 3.6-4 6.4-4s5 1 6.4 4" fill="#111" /></>)],
  ['dashboard', 'Dashboard Reflektif', S(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>)],
  ['settings', 'Settings & Privacy', S(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>)],
  ['about', 'About & Rating', S(<path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="#111" />)],
  ['logout', 'Log out', S(<><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9" /></>)],
];

function Main() {
  const { user, requestLogout } = useApp();
  const nav = useNavigate();
  return (
    <div className="pbg">
      <section className="pcard">
        <img className="avatar" style={{ width: 84, height: 84, objectFit: 'cover' }} src={assetUrl(user.profileImage) || '/assets/avatar.png'} alt="Foto profil" />
        <div style={{ flex: 1 }}>
          <h2>{user.name}</h2>
          <div className="flame-line"><img src="/assets/campfire.png" alt="" />+{user.streak}</div>
          <button className="btn" onClick={() => nav('/profile/account')}>Edit Profile</button>
          <div className="lvl">Level {user.level} · {user.xp} XP</div>
          <div className="bar"><i style={{ width: user.levelProgress + '%' }} /></div>
        </div>
      </section>
      <section className="strip" aria-label="Check-in harian">
        <CheckinPanel n={5} cls="days5" dayCls={(i, c) => (
          <div key={i} className={'d5' + (i === c.today ? ' today' : '') + (i < c.filled ? '' : ' off')}>
            <img src="/assets/flame.png" alt="" />{i === c.today ? 'Hari Ini' : `Hari ${i + 1}`}
          </div>
        )} />
      </section>
      <section className="menu">
        {MENU.map(([k, label, icon]) => (
          <button key={k} onClick={() => (k === 'logout' ? requestLogout() : nav('/profile/' + k))}>{icon}{label}</button>
        ))}
      </section>
    </div>
  );
}

function Account() {
  const { user, setUser, notify } = useApp();
  const [name, setName] = useState(user.name);
  const [uploading, setUploading] = useState(false);
  const nav = useNavigate();
  const uploadPhoto = async (file) => { if (!file) return; if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return notify('Gunakan JPG, PNG, atau WebP.'); if (file.size > 5*1024*1024) return notify('Ukuran foto maksimal 5 MB.'); setUploading(true); const reader = new FileReader(); reader.onload = async () => { try { const r = await api('/profile-image', { method:'POST', body:{ data:reader.result, mime:file.type } }); setUser(r.user); notify('Foto profil berhasil diperbarui.'); } catch(e) { notify(e.message); } finally { setUploading(false); } }; reader.readAsDataURL(file); };
  const save = async () => { const r = await api('/me', { method: 'PUT', body: { name } }); setUser(r.user); notify('Profil disimpan'); };
  return (
    <>
      <div className="box profile-edit-photo">
        <img src={assetUrl(user.profileImage) || '/assets/avatar.png'} alt="Foto profil" />
        <div><h3>Foto profil</h3><p>Unggah JPG, PNG, atau WebP hingga 5 MB.</p><label className="btn upload-label">{uploading ? 'Mengunggah…' : 'Pilih foto'}<input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={uploading} onChange={e=>uploadPhoto(e.target.files?.[0])}/></label></div>
      </div>
      <div className="box">
        <h3>Nama</h3>
        <p className="account-email">{user.email || 'Akun lokal'}</p>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="Nama" />
        <button className="btn" style={{ marginTop: 12 }} disabled={!name.trim() || name === user.name} onClick={save}>Simpan</button>
      </div>
      <div className="box">
        <h3>Topik favorit</h3>
        <p>{user.topics.join(' · ')}</p>
        <button className="btn ghost" onClick={() => nav('/topics')}>Ubah topik</button>
      </div>
      <div className="box">
        <h3>Pencapaian</h3>
        <div className="badges">
          {user.badges.map((b) => <div key={b.id} className={'badge' + (b.earned ? '' : ' off')}><b>{b.icon}</b>{b.name}</div>)}
        </div>
      </div>
    </>
  );
}

function Settings() {
  const { user, setUser, logout, notify } = useApp();
  const nav = useNavigate();
  const [th, setTh] = useState(user.settings.threshold);
  const put = async (patch) => { const r = await api('/settings', { method: 'PUT', body: patch }); setUser(r.user); };
  const wipe = async () => {
    if (!confirm('Hapus akunmu beserta seluruh data (XP, streak, riwayat scroll)? Tindakan ini tidak bisa dibatalkan.')) return;
    await api('/me', { method: 'DELETE' }); logout(); nav('/welcome');
  };
  const Sw = ({ on, onClick, label }) => <button className={'switch' + (on ? ' on' : '')} role="switch" aria-checked={on} aria-label={label} onClick={onClick} />;
  return (
    <>
      <div className="box">
        <h3>Ambang durasi scroll</h3>
        <p>Pengingat muncul setelah kamu scroll terus-menerus selama <b>{th} detik</b>. Nilai kecil dipakai agar mudah didemokan; pada aplikasi nyata ambang ini berupa menit.</p>
        <input type="range" min="5" max="120" step="5" value={th} onChange={(e) => setTh(+e.target.value)} onMouseUp={() => put({ threshold: th })} onTouchEnd={() => put({ threshold: th })} onKeyUp={() => put({ threshold: th })} aria-label="Ambang durasi scroll (detik)" />
      </div>
      <div className="box">
        <div className="row"><div><h3 style={{ margin: 0 }}>Pengingat pengalihan</h3><p style={{ margin: 0 }}>Tampilkan opsi pindah ke ReScroll. Tidak pernah memblokir.</p></div>
          <Sw on={user.settings.notify} label="Pengingat pengalihan" onClick={() => put({ notify: !user.settings.notify })} /></div>
        <div className="row"><div><h3 style={{ margin: 0 }}>Simpan data pola scroll</h3><p style={{ margin: 0 }}>Persetujuan eksplisit. Jika dimatikan, durasi tidak disimpan dan dashboard berhenti diperbarui.</p></div>
          <Sw on={user.settings.consent} label="Simpan data pola scroll" onClick={() => put({ consent: !user.settings.consent })} /></div>
      </div>
      <div className="box">
        <h3>Privasi data</h3>
        <p>ReScroll hanya mengolah <b>durasi</b> dan <b>pola interaksi</b> (data minimization). Isi konten yang kamu lihat di aplikasi lain tidak dibaca. Pada versi produksi, data dienkripsi end-to-end. Pada prototipe ini data disimpan di berkas lokal <code>server/data/db.json</code> di perangkatmu.</p>
        <button className="btn" style={{ background: '#b3261e' }} onClick={wipe}>Hapus semua data saya</button>
      </div>
    </>
  );
}

function About() {
  const { user, setUser, notify } = useApp();
  const [stars, setStars] = useState(user.rating?.stars || 0);
  const [comment, setComment] = useState(user.rating?.comment || '');
  const send = async () => { const r = await api('/rating', { method: 'POST', body: { stars, comment } }); setUser(r.user); notify('Terima kasih atas penilaianmu!'); };
  return (
    <>
      <div className="box">
        <h3>Tentang ReScroll</h3>
        <p>ReScroll adalah model intervensi perilaku digital berbasis gamifikasi untuk mengatasi doomscrolling pada generasi muda. Aplikasi ini tidak membatasi, tetapi mengalihkan scroll pasif menjadi aktivitas yang lebih bermanfaat.</p>
        <div className="sdg"><span>SDG 3 · Good Health and Well-Being</span><span>SDG 9 · Industry, Innovation, and Infrastructure</span></div>
        <p>Menuju Indonesia Emas 2045.</p>
      </div>
      <div className="box">
        <h3>Empat fitur utama</h3>
        <p><b>Deteksi real-time.</b> Menghitung durasi scroll berkelanjutan dan frekuensi kembali ke feed.</p>
        <p><b>Redirect adaptif.</b> Menawarkan micro-learning sesuai topikmu, bukan memblokir.</p>
        <p><b>Gamifikasi.</b> Poin, streak harian, level, dan badge.</p>
        <p><b>Dashboard reflektif.</b> Ringkasan kebiasaan dan saran berbasis datamu.</p>
      </div>
      <div className="box">
        <h3>Beri penilaian</h3>
        <div className="stars">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)} aria-label={`${n} bintang`}>★</button>)}</div>
        <textarea className="input" placeholder="Masukan untuk tim ReScroll (opsional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} />
        <button className="btn" style={{ marginTop: 12 }} disabled={!stars} onClick={send}>Kirim</button>
      </div>
    </>
  );
}

function Dashboard() {
  const [d, setD] = useState(null);
  const { user } = useApp();
  useEffect(() => { api('/dashboard').then(setD); }, [user.xp]);
  if (!d) return <div className="center">Memuat…</div>;
  const maxS = Math.max(1, ...d.days.map((x) => x.scrollMin)), maxX = Math.max(1, ...d.days.map((x) => x.xp));
  const rate = d.triggered ? Math.round((d.redirected / d.triggered) * 100) : 0;
  return (
    <>
      <div className="stats">
        <div className="stat"><b>{d.totalMin}</b><span>menit scroll (7 hari)</span></div>
        <div className="stat"><b>{d.triggered}</b><span>pengingat muncul</span></div>
        <div className="stat"><b>{rate}%</b><span>pengingat diterima</span></div>
        <div className="stat"><b>{d.xpWeek}</b><span>XP minggu ini</span></div>
      </div>
      <div className="box">
        <h3>Durasi scroll per hari (menit)</h3>
        <div className="chart">{d.days.map((x, i) => <div key={x.date}>{x.scrollMin}<i className={i === 6 ? 't' : ''} style={{ height: (x.scrollMin / maxS) * 100 + '%' }} />{x.label}</div>)}</div>
      </div>
      <div className="box">
        <h3>XP per hari</h3>
        <div className="chart xpc">{d.days.map((x, i) => <div key={x.date}>{x.xp}<i className={i === 6 ? 't' : ''} style={{ height: (x.xp / maxX) * 100 + '%' }} />{x.label}</div>)}</div>
      </div>
      <div className="box">
        <h3>Saran untukmu</h3>
        {d.tips.length ? d.tips.map((t, i) => <div className="tip" key={i}>{t}</div>) : <p>Coba simulasi scroll atau baca satu artikel agar saran muncul.</p>}
        {d.hasDemo && <p style={{ fontSize: 12, color: '#999' }}>Catatan: data 6 hari sebelum hari ini adalah data contoh untuk demo.</p>}
      </div>
    </>
  );
}

const TITLES = { account: 'Account', dashboard: 'Dashboard Reflektif', settings: 'Settings & Privacy', about: 'About & Rating' };
export default function Profile() {
  const { sub } = useParams();
  const nav = useNavigate();
  if (!sub) return <Main />;
  const View = { account: Account, dashboard: Dashboard, settings: Settings, about: About }[sub];
  if (!View) return <Main />;
  return (
    <>
      <header className="subhead"><button className="back" onClick={() => nav('/profile')} aria-label="Kembali">←</button><h2>{TITLES[sub]}</h2></header>
      <div className="sub"><View /></div>
    </>
  );
}
