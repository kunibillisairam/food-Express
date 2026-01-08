import React, { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import "./Cart.css";

function Cart() {
  const { cart, updateQty, clearCart, total } =
    useContext(CartContext);
  const [coupon, setCoupon] = useState("");

  // ✅ PLACE ORDER (SENDS DATA TO BACKEND)
  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const orderData = {
      user: localStorage.getItem("user") || "Guest",
      items: cart.map(item => ({
        name: item.name,
        price: item.price,
        qty: item.qty,
        img: item.img
      })),
      total,
      coupon
    };

    try {
      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (res.ok) {
        alert("Order placed successfully 🎉");
        clearCart();
        setCoupon("");
      } else {
        alert(data.message || "Order failed");
      }
    } catch (err) {
      alert("Order failed");
    }
  };


  return (
    <div className="cart-page">
      <h1 className="cart-title">🛒 Your Cart</h1>

      <div className="cart-container">
        {cart.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          <>
            {cart.map((item, index) => (
              <div className="cart-item" key={index}>
                <div>
                  <div className="cart-name">{item.name}</div>
                  <div>₹{item.price}</div>
                </div>

                <div className="cart-actions">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.name, -1)}
                  >
                    −
                  </button>

                  <span>{item.qty}</span>

                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.name, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            <div className="cart-summary">
              <div className="coupon-section">
                <input
                  type="text"
                  placeholder="Coupon Code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="coupon-input"
                />
              </div>
              <div className="total">Total: ₹{total}</div>
              <button className="place-btn" onClick={placeOrder}>
                Place Order
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;
