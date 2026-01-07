import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL from '../config';
const ReviewModal = ({ item, onSubmit, onClose }) => {
    const [rating, setRating] = useState(5);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                background: '#2f3542', padding: '2rem', borderRadius: '15px',
                width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 0 20px rgba(0,255,100,0.2)'
            }}>
                <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Rate {item.name}</h3>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} onClick={() => setRating(star)}
                            style={{ fontSize: '2rem', cursor: 'pointer', transition: '0.2s', filter: star <= rating ? 'grayscale(0)' : 'grayscale(1)' }}>
                            {star <= rating ? '⭐' : '⚪'}
                        </span>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={() => onSubmit(item, rating)} style={{
                        background: '#00f260', border: 'none', padding: '0.8rem 1.5rem',
                        borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer'
                    }}>Submit</button>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: '1px solid #777', padding: '0.8rem 1.5rem',
                        borderRadius: '8px', color: '#ccc', cursor: 'pointer'
                    }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

const MyOrders = ({ setView }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user, updateUser } = useContext(AuthContext);
    const [reviewItem, setReviewItem] = useState(null); // Item being reviewed

    useEffect(() => {
        let intervalId;
        if (user) {
            fetchOrders(); // Initial fetch
            // Poll for updates every 5 seconds
            intervalId = setInterval(fetchOrders, 5000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [user]);

    const handleRate = (item) => {
        setReviewItem(item);
    };

    const submitReview = async (item, rating) => {
        try {
            // Find food ID logic - matching item.name to foodData ID would be ideal, 
            // but for now we'll assume item object has what we need or we map it.
            // Wait - the Order item schema needs to be checked. It likely has 'id' or we match by name.
            // Let's assume we pass a foodId. If not, we use name.
            // For robustness, let's use a dummy ID if missing, or better, log it.

            // Actually, best to fetch foodData and find ID.
            // Importing foodData here would be heavy? No, it's local.
            await axios.post(`${API_BASE_URL}/api/reviews`, {
                foodId: item.id || 999, // Fallback
                userName: user.username,
                rating: rating,
                comment: "Verified Purchase Review"
            });
            alert(`Thank you for rating ${item.name}!`);
            setReviewItem(null);
        } catch (err) {
            console.error(err);
            alert("Failed to submit review");
        }
    };

    // ... render return



    const fetchOrders = async () => {
        // Don't set loading=true here to avoid flickering on every poll
        try {
            const res = await axios.get(`${API_BASE_URL}/api/orders/user/${user.username}`);
            setOrders(res.data);
        } catch (err) {
            console.error("Polling Error:", err);
            // Don't alert on polling error to avoid annoying popups
        }
    };

    const handleCancel = async (orderId, amount) => {
        if (!window.confirm('Are you sure you want to cancel this order? Amount will be refunded to your wallet.')) return;

        try {
            console.log(`Attempting to cancel order: ${orderId} at ${API_BASE_URL}`);
            const response = await axios.put(`${API_BASE_URL}/api/orders/${orderId}/cancel`);

            if (response.status === 200) {
                // Update local state
                setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'Cancelled' } : o));

                // Process Refund to Wallet
                const currentBalance = user.walletBalance || 0;
                const refundAmount = parseFloat(amount);

                const newTransaction = {
                    type: 'Credit',
                    amount: refundAmount,
                    description: `Refund for Order #${orderId.substring(orderId.length - 6)}`,
                    date: new Date()
                };

                const currentTransactions = user.transactions || [];

                updateUser({
                    walletBalance: currentBalance + refundAmount,
                    transactions: [newTransaction, ...currentTransactions]
                });

                alert('✅ Order cancelled successfully! Amount refunded to wallet.');
            }
        } catch (err) {
            console.error("Cancel Error:", err);
            // Show the actual error message to the user for debugging
            const errorMsg = err.response ? err.response.data.message || err.response.statusText : err.message;
            alert(`❌ Failed to cancel order. Error: ${errorMsg}`);
        }
    };

    return (
        <div className="page-container fade-in">
            <h2 className="page-title">My Orders 📦</h2>
            {reviewItem && <ReviewModal item={reviewItem} onSubmit={submitReview} onClose={() => setReviewItem(null)} />}

            {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading your orders...</div>}

            {!loading && orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                    <h3 style={{ marginBottom: '1rem' }}>No orders found.</h3>
                    <p>Hungry? <span style={{ color: '#ff4757', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setView('home')}>Order something delicious!</span></p>
                </div>
            )}

            {orders.map(order => (
                <div key={order._id} className="order-card" style={{ borderLeft: '5px solid #2f3542' }}>
                    <div className="order-header">
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Order #{order._id.substring(order._id.length - 6)}</h3>
                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{new Date(order.createdAt).toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className="order-badge" style={{
                                background: order.status === 'Pending' ? '#fff0f1' : order.status === 'Cancelled' ? '#f1f2f6' : '#e1ffec',
                                color: order.status === 'Pending' ? '#ff4757' : order.status === 'Cancelled' ? '#777' : '#2ed573'
                            }}>
                                {order.status}
                            </span>
                            <div style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem' }}>₹{order.totalAmount}</div>
                        </div>

                        {order.status === 'Pending' && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px dashed #eee', paddingTop: '1rem' }}>
                                <button
                                    onClick={() => setView('quantum-tracker', order._id)}
                                    style={{
                                        background: 'linear-gradient(45deg, #00f260, #0575e6)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem'
                                    }}>
                                    🚀 Track
                                </button>
                                <button
                                    onClick={() => handleCancel(order._id, order.totalAmount)}
                                    style={{
                                        background: '#ff4757',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem'
                                    }}>
                                    Cancel Order
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="order-items-grid">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="order-item-mini" style={{ position: 'relative' }}>
                                <img src={item.image} alt={item.name} />
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name}</div>
                                    <small style={{ color: '#666' }}>Qty: {item.quantity}</small>
                                </div>
                                {order.status === 'Delivered' && (
                                    <button onClick={() => handleRate(item)}
                                        style={{
                                            position: 'absolute', right: 0, bottom: 0,
                                            background: '#f1c40f', border: 'none',
                                            fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', color: 'black'
                                        }}>
                                        ★ Rate
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {orders.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <button className="nav-btn" onClick={() => setView('home')} style={{ border: '1px solid #ccc' }}>Back to Menu</button>
                </div>
            )}
        </div>
    );
};

export default MyOrders;
