import React, { useContext } from "react";
import { CartContext } from "../context/CartContext";

function Burger({ setPage }) {
  const { addToCart } = useContext(CartContext);

  return (
    <>
      <section className="popular-dishes">
        <h2>Our Popular Burgers</h2>
        <p>Choose your favorite burger</p>

        <div className="dish-grid">
          <div className="dish-card">
            <h3>Cheese Burger</h3>
            <p>Loaded with cheese and fresh veggies</p>

            <div className="price-add">
              <span>₹149</span>
              <button
                onClick={() =>
                  addToCart({ name: "Cheese Burger", price: 149 })
                }
              >
                Add To Cart
              </button>
            </div>
          </div>

          <div className="dish-card">
            <h3>Chicken Burger</h3>
            <p>Juicy chicken with special sauce</p>

            <div className="price-add">
              <span>₹179</span>
              <button
                onClick={() =>
                  addToCart({ name: "Chicken Burger", price: 179 })
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
    </>
  );
}

export default Burger;

