import { products } from "../data/products.js";
import ProductCard from "./ProductCard.jsx";

export default function Products({ onAddToCart, onDetails, onBuyNow }) {
  return (
    <section className="products-section" id="shop">
      <h2 className="section-title">Select Your Flavor</h2>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onDetails={onDetails}
            onBuyNow={onBuyNow}
          />
        ))}
      </div>
    </section>
  );
}
