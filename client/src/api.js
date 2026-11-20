// API relatif untuk web lokal; APK memakai URL backend yang dikonfigurasi di VITE_API_BASE_URL.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export const API_ORIGIN = API_BASE.startsWith('http') ? new URL(API_BASE).origin : '';
export const assetUrl = (path) => path && path.startsWith('/uploads/') ? API_ORIGIN + path : path;
export const api = async (path, { method = 'GET', body } = {}) => {
  const uid = localStorage.getItem('rs_uid');
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(uid ? { 'x-user-id': uid } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Terjadi kesalahan'), { status: res.status });
  return data;
};
