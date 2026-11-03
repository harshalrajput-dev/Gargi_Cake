export default function FloatingContact() {
  return (
    <div className="floating-contact" aria-label="Quick contact">
      <a
        href="https://wa.me/918849073745"
        target="_blank"
        rel="noopener noreferrer"
        className="float-btn float-whatsapp"
        aria-label="Chat with Gargi Cake on WhatsApp"
      >
        <span aria-hidden="true">💬</span>
        <span className="float-label">WhatsApp</span>
      </a>
      <a
        href="tel:+918849073745"
        className="float-btn float-call"
        aria-label="Call Gargi Cake bakery"
      >
        <span aria-hidden="true">📞</span>
        <span className="float-label">Call Bakery</span>
      </a>
    </div>
  );
}
