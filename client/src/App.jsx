import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Sidebar from './components/Sidebar.jsx';
import { useScrollState } from './components/hooks.js';
import { api } from './api.js';
import { Welcome, Topics } from './pages/Onboarding.jsx';
import Home from './pages/Home.jsx';
import Library from './pages/Library.jsx';
import Reader from './pages/Reader.jsx';
import Profile from './pages/Profile.jsx';
import { Simulator, Redirect } from './pages/Simulator.jsx';

const Ctx = createContext();
export const useApp = () => useContext(Ctx);

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = memuat, null = belum login
  const [toast, setToast] = useState('');
  const loc = useLocation();
  const nav = useNavigate();
  const [askLogout, setAskLogout] = useState(false);

  const notify = useCallback((m) => { setToast(m); setTimeout(() => setToast(''), 2200); }, []);
  const login = useCallback((u) => { localStorage.setItem('rs_uid', u.id); setUser(u); }, []);
  const logout = useCallback(() => { localStorage.removeItem('rs_uid'); setUser(null); }, []);

  useEffect(() => {
    if (!localStorage.getItem('rs_uid')) return setUser(null);
    api('/me').then((r) => setUser(r.user)).catch(() => logout());
  }, []);
  const sc = useScrollState();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);

  if (user === undefined) return <div className="shell"><div className="center">Memuat…</div></div>;

  const needTopics = user && user.topics.length < 3;
  const guard = (el) => (!user ? <Navigate to="/welcome" replace /> : needTopics ? <Navigate to="/topics" replace /> : el);
  const showNav = Boolean(user) && !['/welcome', '/topics'].includes(loc.pathname);

  return (
    <Ctx.Provider value={{ user, setUser, login, logout, requestLogout: () => setAskLogout(true), notify }}>
      <div className={`shell ${showNav ? 'with-sidebar' : ''}`}>
        {showNav && <Sidebar />}
        {showNav && <div className="scroll-progress" aria-hidden="true"><i style={{ transform: `scaleX(${sc.p})` }} /></div>}
        {showNav && sc.y > 600 && <button className="to-top" aria-label="Kembali ke atas" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>}
        <main className="page">
          <Routes>
            <Route path="/" element={<Navigate to={user ? '/home' : '/welcome'} replace />} />
            <Route path="/welcome" element={user && !needTopics ? <Navigate to="/home" replace /> : <Welcome />} />
            <Route path="/topics" element={user ? <Topics /> : <Navigate to="/welcome" replace />} />
            <Route path="/home" element={guard(<Home />)} />
            <Route path="/library" element={guard(<Library />)} />
            <Route path="/profile" element={guard(<Profile />)} />
            <Route path="/profile/:sub" element={guard(<Profile />)} />
            <Route path="/read/:id" element={guard(<Reader />)} />
            <Route path="/redirect" element={guard(<Redirect />)} />
            <Route path="/simulator" element={guard(<Simulator />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {toast && <div className="toast" role="status">{toast}</div>}
        {askLogout && (
          <ConfirmDialog danger title="Keluar dari akun?"
            text="Kamu bisa masuk lagi kapan saja. Streak dan XP-mu tetap tersimpan."
            confirmLabel="Ya, keluar" cancelLabel="Batal"
            onCancel={() => setAskLogout(false)}
            onConfirm={() => { setAskLogout(false); logout(); nav('/welcome'); notify('Kamu sudah keluar'); }} />
        )}
      </div>
    </Ctx.Provider>
  );
}
