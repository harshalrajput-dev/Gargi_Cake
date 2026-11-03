export default function ProductCard({
  product,
  onAddToCart,
  onDetails,
  onBuyNow,
}) {
  const stars = "★".repeat(product.rating) + "☆".repeat(5 - product.rating);

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.title} loading="lazy" />
      </div>
      <div className="product-title">{product.title}</div>
      <div className="rating">
        {stars} ({product.reviews})
      </div>
      <div className="price">₹{product.price}</div>
      <div className="prime-badge">Only Surat Udhana Delivery</div>
      <div className="card-buttons">
        <button
          className="btn-action btn-add-cart"
          type="button"
          onClick={() => onAddToCart(product)}
        >
          Add to Cart
        </button>
        <button
          className="btn-action btn-view-det"
          type="button"
          onClick={() => onDetails(product)}
        >
          Details
        </button>
        <button
          className="btn-action btn-buy-now"
          type="button"
          onClick={() => onBuyNow(product)}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
