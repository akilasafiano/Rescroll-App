import { useEffect, useRef } from 'react';

// Dialog konfirmasi bergaya aplikasi seluler: ikon, judul, penjelasan, dua tombol.
export default function ConfirmDialog({ title, text, confirmLabel, cancelLabel = 'Batal', danger, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onCancel]);
  return (
    <div className="confirm-scrim" onClick={onCancel}>
      <div className="confirm" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" aria-describedby="cf-text" onClick={(e) => e.stopPropagation()}>
        <span className={'confirm-icon' + (danger ? ' danger' : '')} aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9" /></svg>
        </span>
        <h2 id="cf-title">{title}</h2>
        <p id="cf-text">{text}</p>
        <div className="confirm-actions">
          <button ref={cancelRef} className="confirm-btn ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={'confirm-btn' + (danger ? ' danger' : '')} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
