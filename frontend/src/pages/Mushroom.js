import React, { useContext } from "react";
import { CartContext } from "../context/CartContext";

function Mushroom({ setPage }) {
  const { addToCart } = useContext(CartContext);

  return (
    <section className="popular-dishes">
      <h2>Our Popular Mushroom Items</h2>
      <p>Delicious vegetarian dishes</p>

      <div className="dish-grid">
        <div className="dish-card">
          <h3>Mushroom Fry</h3>
          <p>Crispy fried mushrooms</p>
          <div className="price-add">
            <span>₹159</span>
            <button
              onClick={() =>
                addToCart({ name: "Mushroom Fry", price: 159 })
              }
            >
              Add To Cart
            </button>
          </div>
        </div>

        <div className="dish-card">
          <h3>Mushroom Masala</h3>
          <p>Rich mushroom gravy</p>
          <div className="price-add">
            <span>₹199</span>
            <button
              onClick={() =>
                addToCart({ name: "Mushroom Masala", price: 199 })
              }
            >
              Add To Cart
            </button>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <button className="cardbutto" onClick={() => setPage("home")}>
          Back
        </button>
      </div>
    </section>
  );
}

export default Mushroom;
