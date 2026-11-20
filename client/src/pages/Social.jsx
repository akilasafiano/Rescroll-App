import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../App.jsx';

function getEmbed(link) {
  if (link.platform === 'TikTok') { const m = link.url.match(/\/video\/(\d+)/); return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : ''; }
  return '';
}
export default function Social() {
  const [url,setUrl]=useState(''); const [links,setLinks]=useState([]); const [busy,setBusy]=useState(false); const {notify}=useApp();
  const refresh=()=>api('/social-links').then(r=>setLinks(r.links)); useEffect(()=>{refresh();},[]);
  const add=async e=>{e.preventDefault();setBusy(true);try{const r=await api('/social-links',{method:'POST',body:{url}});setLinks(r.links);setUrl('');notify('Tautan berhasil disimpan.');}catch(err){notify(err.message);}finally{setBusy(false);}};
  const remove=async id=>{const r=await api('/social-links/'+id,{method:'DELETE'});setLinks(r.links);};
  return <section className="social-page"><header className="social-header"><span className="eyebrow">YOUR SOCIAL LIBRARY</span><h1>Bring your<br/><em>inspiration</em> here.</h1><p>Simpan tautan video yang ingin kamu tonton kembali. ReScroll menyiapkannya dalam satu ruang.</p></header><form className="social-add" onSubmit={add}><input className="input" type="url" placeholder="Tempel tautan TikTok atau Instagram…" value={url} onChange={e=>setUrl(e.target.value)} required/><button className="btn" disabled={busy}>{busy?'Menyimpan…':'Tambah tautan +'}</button></form><div className="social-info"><b>Catatan integrasi</b><p>Versi ini menyimpan tautan dan menampilkan embed TikTok untuk URL video publik. Instagram dapat dibuka melalui tautan; embed penuh mengikuti kebijakan dan izin Instagram. Koneksi API resmi memerlukan akun developer, OAuth, dan kredensial aplikasi.</p></div><div className="social-list">{links.map(link=>{const embed=getEmbed(link);return <article className="social-item" key={link.id}><div className="social-item-head"><span className="social-platform">{link.platform}</span><button onClick={()=>remove(link.id)}>Hapus</button></div>{embed?<iframe title="TikTok video" src={embed} allow="encrypted-media; fullscreen" loading="lazy"/>:<div className="social-external"><b>Instagram post / reel</b><p>Pratinjau Instagram tidak selalu tersedia untuk semua tautan.</p><a href={link.url} target="_blank" rel="noreferrer">Buka di Instagram ↗</a></div>}<a className="social-url" href={link.url} target="_blank" rel="noreferrer">{link.url}</a></article>})}{!links.length&&<div className="social-empty">Belum ada tautan. Tambahkan video yang ingin kamu simpan di sini.</div>}</div></section>;
}
