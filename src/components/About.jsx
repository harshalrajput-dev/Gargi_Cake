export default function About() {
  return (
    <section className="about-section" id="about">
      <h2>Our Promise &amp; Story</h2>
      <div className="about-container">
        <div className="about-owner-profile">
          <img
            src="/images/chetan.png"
            alt="Chetan Lohar - Owner of Gargi's Premium Cakes"
          />
          <div className="profile-badge">Owner</div>
        </div>

        <div className="about-text">
          <p>
            <strong>Gargi&apos;s Premium Cakes</strong> is proudly founded and
            owned by <strong>Chetan Lohar</strong>. Committed to perfection, he
            personally manages the entire business operations and finances as
            the chief accountant, ensuring that every customer in Surat,
            Udhana receives premium quality cakes with complete transparency
            and fair pricing.
          </p>

          <p>
            At <strong>Gargi_Cake</strong>, we believe every celebration
            deserves a masterpiece. We use only the finest Belgian chocolate,
            organic farm ingredients, and premium vanilla beans. Each cake is
            freshly baked with love, artistry, and strict hygiene, ensuring the
            perfect taste for your special moments.
          </p>

          <div className="about-features">
            <div className="feature-box">
              <h3>👨‍🍳 Owner &amp; Management</h3>
              <p>Chetan Lohar (Accountant)</p>
            </div>
            <div className="feature-box">
              <h3>🍫 Premium Ingredients</h3>
              <p>Belgian imports &amp; Fresh Cream</p>
            </div>
            <div className="feature-box">
              <h3>🌿 100% Pure &amp; Fresh</h3>
              <p>No preservatives / Baked on Order</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
