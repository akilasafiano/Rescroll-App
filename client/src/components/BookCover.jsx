// Sampul buku. Sampul asli (sudah memuat judul) ditampilkan polos; sampul ilustrasi diberi judul di atasnya.
export default function BookCover({ item, className = '' }) {
  if (item.coverFull) {
    return (
      <div className={'bookcover real ' + className}>
        <img src={item.cover} alt={`Sampul ${item.title}`} loading="lazy" decoding="async" />
      </div>
    );
  }
  return (
    <div className={'bookcover ' + className}>
      <img src={item.cover} alt="" loading="lazy" decoding="async" />
      <div className="bookcover-shade" />
      <div className="bookcover-text">
        <span>{item.topic}</span>
        <b>{item.title}</b>
        <small>{item.sub}</small>
      </div>
    </div>
  );
}
