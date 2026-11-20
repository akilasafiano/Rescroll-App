import { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import { assetUrl } from '../api.js';

const Ico = ({ children }) => <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const ICON = {
  '/home': <Ico><path d="M3.5 11 12 3.5l8.5 7.5" /><path d="M5.5 9.5V20.5h13V9.5" /><path d="M10 20.5v-6h4v6" /></Ico>,
  '/library': <Ico><path d="M5 4.5h4.5v15H5zM11.5 4.5H16v15h-4.5z" /><path d="m17.8 6 3.2 13.2-3.8.9-3.2-13.2z" /></Ico>,
  '/profile': <Ico><circle cx="12" cy="8" r="4.2" /><path d="M3.8 21c.8-4.6 4.2-6.6 8.2-6.6s7.4 2 8.2 6.6z" /></Ico>,
};
const NAV = [['/home', 'Home'], ['/library', 'Library'], ['/profile', 'Profil']];
const sectionOf = (p) => (p.startsWith('/library') || p.startsWith('/read') ? '/library' : p.startsWith('/profile') ? '/profile' : '/home');

const HOME_ANCHORS = [['checkin', 'Check-in harian'], ['security', 'Security check'], ['artikel', 'Artikel harian']];
const PROFILE_LINKS = [['account', 'Account'], ['dashboard', 'Dashboard Reflektif'], ['settings', 'Settings & Privacy'], ['about', 'About & Rating']];

export default function Sidebar() {
  const { user, requestLogout } = useApp();
  const loc = useLocation();
  const nav = useNavigate();
  const [panel, setPanel] = useState(null);   // null = hanya rail; '/home' | '/library' | '/profile' = panel terbuka
  const [mobileOpen, setMobileOpen] = useState(false);
  const [spy, setSpy] = useState('checkin');
  const section = sectionOf(loc.pathname);

  // panel mengikuti halaman aktif; di layar kecil drawer ditutup saat pindah halaman
  useEffect(() => { setPanel((p) => (p ? section : p)); setMobileOpen(false); }, [section, loc.pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setPanel(null); setMobileOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // scroll-spy: sorot bagian Home yang sedang terlihat
  useEffect(() => {
    if (loc.pathname !== '/home' || panel !== '/home') return;
    const on = () => {
      let cur = HOME_ANCHORS[0][0];
      for (const [id] of HOME_ANCHORS) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 170) cur = id; }
      setSpy(cur);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [loc.pathname, panel]);

  const jump = useCallback((id) => {
    const run = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (loc.pathname === '/home') run(); else { nav('/home'); setTimeout(run, 350); }
    setMobileOpen(false);
  }, [loc.pathname, nav]);

  const pick = (p) => (e) => {
    e.preventDefault();
    if (loc.pathname === p) setPanel((cur) => (cur === p ? null : p));
    else { nav(p); setPanel(p); }
  };
  const close = () => { setPanel(null); setMobileOpen(false); };
  const topics = user.topics || [];
  const photo = assetUrl(user.profileImage) || '/assets/avatar.png';
  const panelOpen = Boolean(panel) || mobileOpen;
  const shown = panel || section;

  return (
    <>
      <button className="menu-toggle" aria-label="Buka navigasi" aria-expanded={mobileOpen} onClick={() => setMobileOpen((v) => !v)}>
        <span /><span /><span />
      </button>
      {panelOpen && <button className="nav-scrim" aria-label="Tutup navigasi" tabIndex={-1} onClick={close} />}

      <aside className={'nrail' + (mobileOpen ? ' open' : '')} aria-label="Navigasi utama">
        <div className="nrail-brand" title="ReScroll"><span className="brand-mark">R</span></div>
        <nav className="nrail-links">
          {NAV.map(([p, label]) => (
            <NavLink key={p} to={p} onClick={pick(p)} aria-expanded={panel === p}
              className={() => (section === p ? 'active' : '') + (panel === p ? ' expanded' : '')}>
              {ICON[p]}<span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="nrail-foot">
          <div className="nrail-streak" title="Streak harianmu"><img src="/assets/campfire.png" alt="" />{user.streak}</div>
          <button className="nrail-avatar" aria-label="Buka profil" onClick={() => nav('/profile')}><img src={photo} alt="" /></button>
        </div>
      </aside>

      <section className={'flyout' + (panelOpen ? ' show' : '')} aria-label={`Menu ${shown.slice(1)}`} aria-hidden={!panelOpen}>
        {shown === '/home' && (
          <>
            <header><h2>Home</h2></header>
            <div className="fly-group"><h3>Di halaman ini</h3>
              {HOME_ANCHORS.map(([id, label]) => (
                <button key={id} className={'fly-item' + (loc.pathname === '/home' && spy === id ? ' on' : '')} onClick={() => jump(id)} tabIndex={panelOpen ? 0 : -1}>{label}</button>
              ))}
            </div>
            <div className="fly-group"><h3>Pintasan</h3>
              <button className="fly-item" onClick={() => nav('/library?tab=article')} tabIndex={panelOpen ? 0 : -1}>Semua artikel</button>
              <button className="fly-item" onClick={() => nav('/library?tab=ebook')} tabIndex={panelOpen ? 0 : -1}>Semua e-book</button>
            </div>
          </>
        )}
        {shown === '/library' && (
          <>
            <header><h2>Library</h2></header>
            <div className="fly-group"><h3>Koleksi</h3>
              <button className="fly-item" onClick={() => nav('/library?tab=ebook')} tabIndex={panelOpen ? 0 : -1}>E-Book</button>
              <button className="fly-item" onClick={() => nav('/library?tab=article')} tabIndex={panelOpen ? 0 : -1}>Article</button>
            </div>
            {topics.length > 0 && (
              <div className="fly-group"><h3>Topik favoritmu</h3>
                {topics.map((t) => <button key={t} className="fly-item" onClick={() => nav(`/library?tab=article&q=${encodeURIComponent(t)}`)} tabIndex={panelOpen ? 0 : -1}>{t}</button>)}
              </div>
            )}
          </>
        )}
        {shown === '/profile' && (
          <>
            <header><h2>Profil</h2></header>
            <div className="fly-group"><h3>Akun</h3>
              {PROFILE_LINKS.map(([k, label]) => (
                <button key={k} className={'fly-item' + (loc.pathname === '/profile/' + k ? ' on' : '')} onClick={() => nav('/profile/' + k)} tabIndex={panelOpen ? 0 : -1}>{label}</button>
              ))}
              <button className="fly-item danger" onClick={() => { setMobileOpen(false); setPanel(null); requestLogout(); }} tabIndex={panelOpen ? 0 : -1}>Log out</button>
            </div>
          </>
        )}
        <button className="fly-close" onClick={close} tabIndex={panelOpen ? 0 : -1}><span aria-hidden="true">‹</span> Tutup navigasi</button>
      </section>
    </>
  );
}
