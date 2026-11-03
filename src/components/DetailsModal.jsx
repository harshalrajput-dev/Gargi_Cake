import { useEffect } from "react";

export default function DetailsModal({ cake, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!cake) return null;

  return (
    <div
      className="modal is-visible"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>
          &times;
        </span>
        <h2>{cake.title}</h2>
        <hr style={{ margin: "15px 0", border: "1px solid #eee" }} />
        <h3>🎂 કેક કેવી રીતે બને છે (Recipe Process):</h3>
        <p>{cake.process}</p>
        <br />
        <h3>🛒 કઈ કઈ સામગ્રી વપરાય છે (Ingredients):</h3>
        <p>{cake.ingredients}</p>
      </div>
    </div>
  );
}
