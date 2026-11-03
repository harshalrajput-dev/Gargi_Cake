import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Hero from "../components/Hero.jsx";
import About from "../components/About.jsx";
import Products from "../components/Products.jsx";
import DetailsModal from "../components/DetailsModal.jsx";
import OrderModal from "../components/OrderModal.jsx";
import Contact from "../components/Contact.jsx";
import FloatingContact from "../components/FloatingContact.jsx";
import Footer from "../components/Footer.jsx";

export default function Home() {
  const [cart, setCart] = useState([]);
  const [detailCake, setDetailCake] = useState(null);
  const [orderCake, setOrderCake] = useState(null);

  const handleAddToCart = (product) => {
    setCart((previous) => [
      ...previous,
      { name: product.cartName, price: product.price },
    ]);
    alert(
      product.cartName + " added successfully to your luxury cart!"
    );
  };

  const handleViewCart = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    let list = "🛒 Your Luxury Order:\n\n";
    let total = 0;
    cart.forEach((item, index) => {
      list += `${index + 1}. ${item.name} - ₹${item.price}\n`;
      total += item.price;
    });
    list += `\nTotal Amount: ₹${total}`;
    alert(list);
  };

  const handleShowDetails = (cake) => {
    setDetailCake(cake);
  };

  const handleOpenOrder = (product) => {
    setDetailCake(null);
    setOrderCake(product);
  };

  return (
    <>
      <Navbar cartCount={cart.length} onViewCart={handleViewCart} />
      <Hero onViewDetails={handleShowDetails} />
      <About />
      <Products
        onAddToCart={handleAddToCart}
        onDetails={handleShowDetails}
        onBuyNow={handleOpenOrder}
      />
      {detailCake && (
        <DetailsModal cake={detailCake} onClose={() => setDetailCake(null)} />
      )}
      {orderCake && (
        <OrderModal cake={orderCake} onClose={() => setOrderCake(null)} />
      )}
      <Contact />
      <FloatingContact />
      <Footer />
    </>
  );
}
