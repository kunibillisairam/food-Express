import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';

const Cart = ({ setView }) => {
    const { cart, removeFromCart, addToCart, totalAmount } = useContext(CartContext);

    if (cart.length === 0) {
        return (
            <div className="page-container fade-in" style={{ textAlign: 'center', marginTop: '5rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Your Cart is Empty 🍔</h2>
                <p style={{ marginBottom: '2rem', color: '#888' }}>Looks like you haven't added anything yet.</p>
                <button className="action-btn" onClick={() => setView('home')}>Go to Menu</button>
            </div>
        )
    }

    return (
        <div className="page-container fade-in">
            <div className="cart-container">
                <h2 className="page-title">Your Cart ({cart.length} items)</h2>
                {cart.map(item => (
                    <div key={item.id} className="cart-item">
                        <img src={item.image} alt={item.name} />
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                            {item.name}
                        </div>
                        <div style={{ color: '#888', textAlign: 'center', fontSize: '0.9rem' }}>
                            ₹{item.price}
                        </div>
                        <div className="qty-controls">
                            <button className="qty-btn" onClick={() => removeFromCart(item.id)}>−</button>
                            <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                            <button className="qty-btn" onClick={() => addToCart(item)}>+</button>
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'right' }}>
                            ₹{item.price * item.qty}
                        </div>
                    </div>
                ))}

                <div className="checkout-section">
                    <div className="total-price">Total: ₹{totalAmount}</div>
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <button className="nav-btn" onClick={() => setView('home')} style={{ border: '1px solid #ccc', padding: '0.8rem 1.5rem', fontSize: '1rem' }}>Back to Home</button>
                        <button className="action-btn" onClick={() => {
                            if (!localStorage.getItem('user')) {
                                alert("Please login to place an order!");
                                setView('login');
                            } else {
                                setView('payment');
                            }
                        }} style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>Proceed to Payment</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
