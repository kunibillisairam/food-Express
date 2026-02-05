import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import FleetManager from '../components/FleetManager';

const Cart = ({ setView }) => {
    const { cart, removeFromCart, addToCart, totalAmount, fleetCode } = useContext(CartContext);

    if (cart.length === 0 && !fleetCode) {
        return (
            <div className="page-container fade-in" style={{ textAlign: 'center', marginTop: '5rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Your Cart is Empty 🍔</h2>
                <p style={{ marginBottom: '2rem', color: '#888' }}>Looks like you haven't added anything yet.</p>
                <div style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
                    <FleetManager />
                </div>
                <button className="action-btn" onClick={() => setView('home')}>Go to Menu</button>
            </div>
        )
    }

    return (
        <div className="page-container fade-in">
            <div className="cart-container">
                <FleetManager />
                <h2 className="page-title">
                    {fleetCode ? `FLEET CARGO (${cart.length} units)` : `Your Cart (${cart.length} items)`}
                </h2>
                {cart.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>Waiting for fleet members to add cargo...</p>
                ) : (
                    cart.map(item => (
                        <div key={item._id || item.id} className="cart-item">
                            <img src={item.imageUrl || item.image} alt={item.name} />
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                {item.name}
                            </div>
                            <div style={{ color: '#888', textAlign: 'center', fontSize: '0.9rem' }}>
                                ₹{item.price}
                            </div>
                            <div className="qty-controls">
                                <button className="qty-btn" onClick={() => removeFromCart(item._id || item.id)}>−</button>
                                <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                                <button className="qty-btn" onClick={() => addToCart(item)}>+</button>
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'right' }}>
                                ₹{item.price * item.qty}
                            </div>
                        </div>
                    ))
                )}

                <div className="checkout-section">
                    <div className="total-price">Total: ₹{totalAmount}</div>
                    <div className="cart-actions">
                        <button className="nav-btn cart-back-btn" onClick={() => setView('home')}>Back to Home</button>
                        <button className="action-btn cart-proceed-btn" onClick={() => {
                            if (!localStorage.getItem('user')) {
                                alert("Please login to place an order!");
                                setView('login');
                            } else {
                                setView('payment');
                            }
                        }}>Proceed to Payment</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
