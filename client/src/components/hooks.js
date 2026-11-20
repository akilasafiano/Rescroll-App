import { useEffect, useState } from 'react';

// Memunculkan elemen ber-class "rv" dengan animasi halus saat masuk viewport (scroll-reveal).
export function useReveal(dep) {
  useEffect(() => {
    const els = [...document.querySelectorAll('.rv:not(.in)')];
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
}

// Progres scroll halaman 0..1 + apakah halaman sudah digulir (untuk bayangan topbar & tombol "ke atas").
export function useScrollState() {
  const [s, setS] = useState({ p: 0, y: 0 });
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setS({ p: max > 4 ? Math.min(1, window.scrollY / max) : 1, y: window.scrollY });
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    const mo = new MutationObserver(on); mo.observe(document.body, { childList: true, subtree: true });
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); mo.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return s;
}
