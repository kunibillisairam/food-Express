import React, { useContext } from "react";
import { CartContext } from "../context/CartContext";

function Noodles({ setPage }) {
  const { addToCart } = useContext(CartContext);

  return (
    <section className="popular-dishes">
      <h2>Our Popular Noodles</h2>
      <p>Hot and tasty noodles</p>

      <div className="dish-grid">
        <div className="dish-card">
          <h3>Veg Noodles</h3>
          <p>Fresh vegetables with noodles</p>
          <div className="price-add">
            <span>₹129</span>
            <button
              onClick={() =>
                addToCart({ name: "Veg Noodles", price: 129 })
              }
            >
              Add To Cart
            </button>
          </div>
        </div>

        <div className="dish-card">
          <h3>Chicken Noodles</h3>
          <p>Spicy chicken noodles</p>
          <div className="price-add">
            <span>₹179</span>
            <button
              onClick={() =>
                addToCart({ name: "Chicken Noodles", price: 179 })
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

export default Noodles;

