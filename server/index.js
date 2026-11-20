// ReScroll API - Express + penyimpanan file JSON (tanpa database eksternal)
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID, scryptSync, timingSafeEqual } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const CATALOG = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'contents.json'), 'utf8'));
const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = path.join(__dirname, '..', 'client', 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const hashPassword = (password, salt = randomUUID()) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const verifyPassword = (password, stored) => { try { const [salt, hash] = stored.split(':'); return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex')); } catch { return false; } };
const cleanEmail = (email) => String(email || '').trim().toLowerCase();

// ---------- penyimpanan ----------
const load = () => (fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : { users: {} });
const save = (db) => {
  fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db, null, 2));
  fs.renameSync(DB_FILE + '.tmp', DB_FILE);
};
const ymd = (d = new Date()) => d.toLocaleDateString('sv-SE'); // YYYY-MM-DD (waktu lokal)
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); };

// ---------- gamifikasi ----------
const BADGES = [
  { id: 'first', name: 'Check-in Pertama', icon: '🔥', test: (u) => u.checkins.length >= 1 },
  { id: 'streak3', name: 'Streak 3 Hari', icon: '⚡', test: (u) => u.bestStreak >= 3 },
  { id: 'reader1', name: 'Pembaca Pertama', icon: '📖', test: (u) => u.completed.length >= 1 },
  { id: 'reader5', name: 'Rajin Membaca', icon: '📚', test: (u) => u.completed.length >= 5 },
  { id: 'redirect3', name: 'Pengalih Ulung', icon: '🧭', test: (u) => u.completed.filter((c) => c.source === 'redirect').length >= 3 },
  { id: 'lvl3', name: 'Level 3', icon: '🏅', test: (u) => u.xp >= 200 },
];
const effectiveStreak = (u) => {
  const t = ymd();
  return u.lastCheckin === t || u.lastCheckin === addDays(t, -1) ? u.streak : 0;
};
const view = (u) => {
  const t = ymd();
  return {
    id: u.id, name: u.name, email: u.email || '', profileImage: u.profileImage || '', socialLinks: u.socialLinks || [], topics: u.topics, xp: u.xp, settings: u.settings, rating: u.rating,
    level: Math.floor(u.xp / 100) + 1, levelProgress: u.xp % 100,
    streak: effectiveStreak(u), checkedToday: u.lastCheckin === t,
    streakAtRisk: effectiveStreak(u) > 0 && u.lastCheckin !== t,
    badges: BADGES.map((b) => ({ id: b.id, name: b.name, icon: b.icon, earned: b.test(u) })),
  };
};
const gain = (u, xp, reason) => { u.xp += xp; u.xpLog.push({ ts: Date.now(), xp, reason }); };

// data contoh 6 hari sebelumnya agar dashboard tidak kosong saat demo
const demoSessions = () => {
  const out = []; const mins = [48, 35, 62, 41, 28, 22];
  mins.forEach((m, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(21, 10, 0, 0);
    out.push({ id: randomUUID(), ts: d.getTime(), durationSec: m * 60, returns: 3 + (i % 3), triggered: i > 1, redirected: i > 2, demo: true });
  });
  return out;
};
const newUser = (name, email = '', passwordHash = '') => ({
  id: randomUUID(), name, email, passwordHash, profileImage: '', socialLinks: [], topics: [], xp: 0, streak: 0, bestStreak: 0, lastCheckin: null, checkins: [],
  completed: [], sessions: demoSessions(), xpLog: [],
  settings: { threshold: 15, notify: true, consent: true }, rating: null,
});

// ---------- app ----------
const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

const auth = (req, res, next) => {
  const db = load(); const u = db.users[req.header('x-user-id')];
  if (!u) return res.status(401).json({ error: 'Belum login' });
  req.db = db; req.u = u; next();
};
const done = (req, res, extra = {}) => { save(req.db); res.json({ user: view(req.u), ...extra }); };

app.post('/api/register', (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 40);
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || '');
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ error: 'Isi nama, email valid, dan password minimal 8 karakter.' });
  const db = load();
  if (Object.values(db.users).some((x) => x.email === email)) return res.status(409).json({ error: 'Email sudah terdaftar. Silakan login.' });
  const u = newUser(name, email, hashPassword(password)); db.users[u.id] = u; save(db);
  res.status(201).json({ user: view(u) });
});
app.post('/api/login', (req, res) => {
  const email = cleanEmail(req.body.email); const password = String(req.body.password || '');
  const db = load(); const u = Object.values(db.users).find((x) => x.email === email);
  if (!u || !u.passwordHash || !verifyPassword(password, u.passwordHash)) return res.status(401).json({ error: 'Email atau password tidak sesuai.' });
  res.json({ user: view(u) });
});
app.post('/api/auth/google', async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google Sign-In belum dikonfigurasi oleh developer.' });
  const credential = String(req.body.credential || '');
  if (!credential) return res.status(400).json({ error: 'Token Google tidak ditemukan.' });
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const info = await response.json();
    if (!response.ok || !info.email || info.email_verified !== 'true') return res.status(401).json({ error: 'Verifikasi Google gagal.' });
    if (process.env.GOOGLE_CLIENT_ID && info.aud !== process.env.GOOGLE_CLIENT_ID) return res.status(401).json({ error: 'Google Client ID tidak cocok.' });
    const db = load(); let u = Object.values(db.users).find((x) => x.email === cleanEmail(info.email));
    if (!u) { u = newUser(String(info.name || info.email.split('@')[0]).slice(0,40), cleanEmail(info.email)); db.users[u.id] = u; }
    if (info.picture && !u.profileImage) u.profileImage = info.picture;
    save(db); res.json({ user: view(u) });
  } catch { res.status(502).json({ error: 'Tidak dapat memverifikasi akun Google saat ini.' }); }
});

app.get('/api/me', auth, (req, res) => res.json({ user: view(req.u) }));
app.post('/api/profile-image', auth, (req, res) => {
  const { data, mime } = req.body || {};
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime) || typeof data !== 'string') return res.status(400).json({ error: 'Format foto harus JPG, PNG, atau WebP.' });
  const raw = data.replace(/^data:image\/(jpeg|png|webp);base64,/, '');
  if (raw.length > 5 * 1024 * 1024 * 1.37) return res.status(413).json({ error: 'Ukuran foto maksimal 5 MB.' });
  const ext = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
  const filename = `${req.u.id}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(raw, 'base64'));
  req.u.profileImage = `/uploads/${filename}?v=${Date.now()}`; done(req, res);
});


app.put('/api/me', auth, (req, res) => {
  const { name, topics, profileImage } = req.body;
  if (typeof name === 'string' && name.trim()) req.u.name = name.trim().slice(0, 40);
  if (typeof profileImage === 'string' && profileImage.startsWith('/uploads/')) req.u.profileImage = profileImage;
  if (Array.isArray(topics)) req.u.topics = topics.filter((t) => CATALOG.topics.includes(t)).slice(0, 3);
  done(req, res);
});

app.delete('/api/me', auth, (req, res) => { delete req.db.users[req.u.id]; save(req.db); res.json({ ok: true }); });

app.put('/api/settings', auth, (req, res) => {
  const s = req.body, cur = req.u.settings;
  if (Number.isFinite(s.threshold)) cur.threshold = Math.min(120, Math.max(5, Math.round(s.threshold)));
  if (typeof s.notify === 'boolean') cur.notify = s.notify;
  if (typeof s.consent === 'boolean') cur.consent = s.consent;
  done(req, res);
});

app.post('/api/rating', auth, (req, res) => {
  const stars = Math.min(5, Math.max(1, Number(req.body.stars) || 0));
  req.u.rating = { stars, comment: String(req.body.comment || '').slice(0, 300) };
  done(req, res);
});

app.post('/api/checkin', auth, (req, res) => {
  const u = req.u, t = ymd();
  if (u.lastCheckin === t) return res.status(409).json({ error: 'Kamu sudah check-in hari ini' });
  u.streak = u.lastCheckin === addDays(t, -1) ? u.streak + 1 : 1;
  u.bestStreak = Math.max(u.bestStreak, u.streak);
  u.lastCheckin = t; u.checkins.push(t);
  const before = view(u).badges.filter((b) => b.earned).length;
  gain(u, 10, 'checkin');
  done(req, res, { gained: 10, newBadges: view(u).badges.filter((b) => b.earned).length - before });
});

// ---------- konten ----------
const withDone = (u, c, full) => {
  const { body, ...rest } = c;
  const lead = (body.find((p) => !p.startsWith('## ')) || '').slice(0, 150).replace(/\s+\S*$/, '') + '…';
  return { ...(full ? c : { ...rest, lead }), done: u.completed.some((x) => x.contentId === c.id) };
};
const hay = (c) => (c.title + ' ' + c.topic + ' ' + (c.sub || '') + ' ' + c.body.join(' ')).toLowerCase();
const ranked = (u, list) => [...list].sort((a, b) => (u.topics.includes(b.topic) - u.topics.includes(a.topic)));

app.get('/api/social-links', auth, (req, res) => res.json({ links: req.u.socialLinks || [] }));
app.post('/api/social-links', auth, (req, res) => {
  const url = String(req.body.url || '').trim(); let platform = '';
  try { const u = new URL(url); if (u.hostname === 'www.tiktok.com' || u.hostname === 'tiktok.com' || u.hostname === 'vm.tiktok.com') platform = 'TikTok'; else if (u.hostname === 'www.instagram.com' || u.hostname === 'instagram.com') platform = 'Instagram'; } catch {}
  if (!platform || !/^https:\/\//.test(url)) return res.status(400).json({ error: 'Masukkan tautan publik TikTok atau Instagram yang valid.' });
  req.u.socialLinks ||= []; if (req.u.socialLinks.some(x => x.url === url)) return res.status(409).json({ error: 'Tautan ini sudah tersimpan.' });
  req.u.socialLinks.unshift({ id: randomUUID(), url, platform, addedAt: Date.now() }); done(req, res, { links: req.u.socialLinks });
});
app.delete('/api/social-links/:id', auth, (req, res) => { req.u.socialLinks = (req.u.socialLinks || []).filter(x => x.id !== req.params.id); done(req, res, { links: req.u.socialLinks }); });

app.get('/api/topics', (_req, res) => res.json({ topics: CATALOG.topics }));

app.get('/api/contents', auth, (req, res) => {
  const { type, q } = req.query;
  let list = CATALOG.items.filter((c) => !type || c.type === type);
  if (q) list = list.filter((c) => hay(c).includes(String(q).toLowerCase()));
  res.json({ items: (type === 'article' ? ranked(req.u, list) : list).map((c) => withDone(req.u, c)) });
});

app.get('/api/search', auth, (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) return res.json({ items: [] });
  const words = q.split(/\s+/).filter(Boolean);
  const out = [];
  for (const c of CATALOG.items) {
    const title = c.title.toLowerCase(), meta = (c.topic + ' ' + (c.sub || '')).toLowerCase();
    let score = 0, snippet = '';
    for (const w of words) {
      if (title.includes(w)) score += 10;
      if (meta.includes(w)) score += 4;
      const para = c.body.find((p) => !p.startsWith('## ') && p.toLowerCase().includes(w));
      if (para) { score += 1; if (!snippet && !title.includes(w)) { const i = para.toLowerCase().indexOf(w); const a = Math.max(0, i - 40); snippet = (a ? '…' : '') + para.slice(a, a + 110).trim() + '…'; } }
    }
    if (score) out.push({ id: c.id, type: c.type, title: c.title, topic: c.topic, min: c.min, snippet, score });
  }
  out.sort((a, b) => b.score - a.score);
  res.json({ items: out.slice(0, 8).map(({ score, ...r }) => r) });
});

app.get('/api/home', auth, (req, res) => {
  const pool = ranked(req.u, CATALOG.items.filter((c) => c.type === 'article')).map((c) => withDone(req.u, c));
  const todo = pool.filter((c) => !c.done);
  res.json({ daily: (todo.length >= 4 ? todo : [...todo, ...pool.filter((c) => c.done)]).slice(0, 4) });
});

app.get('/api/redirect', auth, (req, res) => {
  const pool = ranked(req.u, CATALOG.items.filter((c) => c.type === 'article')).map((c) => withDone(req.u, c));
  const todo = pool.filter((c) => !c.done);
  res.json({ items: (todo.length >= 3 ? todo : pool).slice(0, 3), bonus: 50 });
});

app.get('/api/contents/:id', auth, (req, res) => {
  const c = CATALOG.items.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Konten tidak ditemukan' });
  res.json({ item: withDone(req.u, c, true) });
});

app.post('/api/contents/:id/complete', auth, (req, res) => {
  const c = CATALOG.items.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Konten tidak ditemukan' });
  const u = req.u;
  if (u.completed.some((x) => x.contentId === c.id)) return res.status(409).json({ error: 'Konten ini sudah kamu selesaikan' });
  const source = req.body.source === 'redirect' ? 'redirect' : 'library';
  const xp = source === 'redirect' ? 50 : c.xp;
  const lvl = Math.floor(u.xp / 100);
  const before = view(u).badges.filter((b) => b.earned).length;
  u.completed.push({ contentId: c.id, ts: Date.now(), xp, source });
  gain(u, xp, source);
  const v = view(u);
  done(req, res, { gained: xp, levelUp: Math.floor(u.xp / 100) > lvl, newBadges: v.badges.filter((b) => b.earned).length - before });
});

// ---------- deteksi & dashboard ----------
app.post('/api/sessions', auth, (req, res) => {
  if (!req.u.settings.consent) return res.json({ ok: true, stored: false }); // tanpa persetujuan, data perilaku tidak disimpan
  const b = req.body;
  req.u.sessions.push({
    id: randomUUID(), ts: Date.now(), durationSec: Math.max(0, Math.round(b.durationSec) || 0),
    returns: Math.max(0, Math.round(b.returns) || 0), triggered: !!b.triggered, redirected: !!b.redirected,
  });
  save(req.db); res.json({ ok: true, stored: true });
});

app.get('/api/dashboard', auth, (req, res) => {
  const u = req.u, days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(ymd(), -i);
    const s = u.sessions.filter((x) => ymd(new Date(x.ts)) === d);
    days.push({
      date: d, label: new Date(d + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'short' }),
      scrollMin: Math.round(s.reduce((a, x) => a + x.durationSec, 0) / 60),
      xp: u.xpLog.filter((x) => ymd(new Date(x.ts)) === d).reduce((a, x) => a + x.xp, 0),
    });
  }
  const week = u.sessions.filter((x) => x.ts >= Date.now() - 7 * 864e5);
  const triggered = week.filter((x) => x.triggered).length, redirected = week.filter((x) => x.redirected).length;
  const hours = {}; week.forEach((x) => { const h = new Date(x.ts).getHours(); hours[h] = (hours[h] || 0) + x.durationSec; });
  const peak = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];
  const today = days[6], avg = Math.round(days.slice(0, 6).reduce((a, d) => a + d.scrollMin, 0) / 6);
  const tips = [];
  if (today.scrollMin > avg && today.scrollMin > 0) tips.push(`Scroll hari ini (${today.scrollMin} menit) lebih lama dari rata-rata 6 hari terakhir (${avg} menit). Coba pakai jeda ReScroll lebih awal.`);
  else if (today.scrollMin > 0) tips.push(`Scroll hari ini (${today.scrollMin} menit) masih di bawah rata-rata 6 hari terakhir (${avg} menit). Pertahankan.`);
  if (peak) tips.push(`Kamu paling lama scroll sekitar pukul ${String(peak[0]).padStart(2, '0')}.00. Jadwalkan satu artikel micro-learning di jam itu.`);
  if (triggered && redirected / triggered < 0.5) tips.push('Kurang dari separuh pengingat berujung pengalihan. Coba turunkan ambang durasi di Settings & Privacy.');
  if (!u.topics.length) tips.push('Pilih 3 topik favorit agar rekomendasi lebih sesuai.');
  res.json({
    days, triggered, redirected, totalMin: days.reduce((a, d) => a + d.scrollMin, 0), xpWeek: days.reduce((a, d) => a + d.xp, 0),
    readCount: u.completed.length, tips, hasDemo: u.sessions.some((x) => x.demo),
  });
});

// Sajikan foto profil lokal walau frontend sudah dibuild.
app.use('/uploads', express.static(UPLOAD_DIR));

// ---------- (opsional) sajikan hasil build frontend lewat 1 port ----------
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => console.log(`ReScroll API berjalan di http://localhost:${PORT}`));
