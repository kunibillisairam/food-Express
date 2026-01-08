import React, { useContext } from "react";
import { CartContext } from "../context/CartContext";

function Kebab() {
  const { addToCart } = useContext(CartContext);

  const kebabs = [
    { name: "Chicken Kebab", price: 199 },
    { name: "Mutton Kebab", price: 249 },
  ];

  return (
    <section className="popular-dishes">
      <h2>🔥 Kebabs</h2>

      <div className="dish-grid">
        {kebabs.map((item, index) => (
          <div className="dish-card" key={index}>
            <h3>{item.name}</h3>
            <p>₹{item.price}</p>

            <button
              className="cardbutto"
              onClick={() => addToCart(item)}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Kebab;
