import React, { useContext } from "react";
import { CartContext } from "../context/CartContext";

function Kavaabu({ setPage }) {
  const { addToCart } = useContext(CartContext);

  return (
    <section className="popular-dishes">
      <h2>Our Popular Kavaabu</h2>
      <p>Spicy and juicy kavaabu items</p>

      <div className="dish-grid">
        <div className="dish-card">
          <h3>Chicken Kavaabu</h3>
          <p>Grilled chicken with spices</p>
          <div className="price-add">
            <span>₹249</span>
            <button
              onClick={() =>
                addToCart({ name: "Chicken Kavaabu", price: 249 })
              }
            >
              Add To Cart
            </button>
          </div>
        </div>

        <div className="dish-card">
          <h3>Mutton Kavaabu</h3>
          <p>Juicy mutton with rich taste</p>
          <div className="price-add">
            <span>₹349</span>
            <button
              onClick={() =>
                addToCart({ name: "Mutton Kavaabu", price: 349 })
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

export default Kavaabu;

