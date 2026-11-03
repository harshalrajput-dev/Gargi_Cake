export default function Navbar({ cartCount, onViewCart }) {
  return (
    <header>
      <div className="logo" onClick={() => window.scrollTo(0, 0)}>
        Gargi_Cake
      </div>
      <nav>
        <ul>
          <li>
            <a href="#home">Home</a>
          </li>
          <li>
            <a href="#about">About</a>
          </li>
          <li>
            <a href="#shop">Purchase</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
          <li onClick={onViewCart} style={{ cursor: "pointer" }}>
            Cart: <span className="cart-counter">{cartCount}</span>
          </li>
        </ul>
      </nav>
    </header>
  );
}
