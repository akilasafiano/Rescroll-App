import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// host: true  -> bisa dibuka dari HP lewat IP laptop (satu jaringan Wi-Fi)
// proxy /api  -> diteruskan ke backend, jadi HP cukup membuka port 5173
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
