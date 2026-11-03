import Cake3D from "./Cake3D.jsx";
import { heroCake } from "../data/products.js";

export default function Hero({ onViewDetails }) {
  const scrollToShop = () => {
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero" id="home">
      <Cake3D />

      <div className="hero-content">
        <span className="luxury-badge">✨ Royal Bakery Experience</span>
        <h1>Gargi&apos;s Premium Cakes</h1>
        <h2>Owner by Chetan Lohar</h2>
        <p>
          Luxury ingredients baked to perfection. Drag, spin and feel the taste
          of our master creation!
        </p>
        <div className="hero-btns">
          <button
            className="btn btn-details"
            type="button"
            onClick={() => onViewDetails(heroCake)}
          >
            View Details
          </button>
          <button
            className="btn btn-order"
            type="button"
            onClick={scrollToShop}
          >
            Order Now
          </button>
        </div>
      </div>
    </section>
  );
}
