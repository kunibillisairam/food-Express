import React, { useEffect, useState } from "react";
import "./AdminOrders.css";

function AdminOrders({ setPage }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-title">📦 Admin Orders</h1>

      {orders.length === 0 ? (
        <p className="no-orders">No orders yet</p>
      ) : (
        <div className="orders-grid">
          {orders.map((order, index) => (
            <div className="order-card" key={index}>
              <div className="order-header">
                <h3>Order #{index + 1}</h3>
                <span className="status">Pending</span>
              </div>

              <p><b>User:</b> {order.user}</p>
              <p><b>Total:</b> ₹{order.total}</p>

              <div className="items">
                <b>Items:</b>

                {order.items.map((item, i) => (
                  <div className="order-item" key={i}>
                    <img
                      src={item.img}
                      alt={item.name}
                      className="order-img"
                    />

                    <div className="order-item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-qty">
                        Qty: {item.qty} | ₹{item.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BACK TO HOME BUTTON */}
      <div className="admin-footer">
        <button
          className="back-btn small"
          onClick={() => setPage("home")}
        >
          ⬅ Back to Home
        </button>
      </div>
    </div>
  );
}

export default AdminOrders;



