export default function Contact() {
  return (
    <section className="contact-section" id="contact">
      <h2>Contact Us</h2>
      <div className="contact-info">
        <div className="contact-item">
          <h3>📞 Contact</h3>
          <p>
            <a href="tel:+919876543210">+91 98765 43210</a>
          </p>
        </div>
        <div className="contact-item">
          <h3>🎂 Cake Orders / Call Bakery</h3>
          <p>
            <a href="tel:+918849073745">+91 88490 73745</a>
          </p>
        </div>
        <div className="contact-item">
          <h3>💬 WhatsApp</h3>
          <p>
            <a
              href="https://wa.me/918849073745"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat with us
            </a>
          </p>
        </div>
        <div className="contact-item">
          <h3>✉️ Email</h3>
          <p>hello@gargicake.com</p>
        </div>
        <div className="contact-item">
          <h3>📍 Address</h3>
          <p>Udhana Main Road, Surat, Gujarat, India</p>
        </div>
      </div>
      <div className="contact-actions">
        <a href="tel:+918849073745" className="btn-contact-call">
          📞 Call Bakery
        </a>
        <a
          href="https://wa.me/918849073745"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-contact-whatsapp"
        >
          💬 Order on WhatsApp
        </a>
      </div>
    </section>
  );
}
