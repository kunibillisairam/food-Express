import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL from '../config';

const MyOrders = ({ setView }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user, updateUser } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/orders/user/${user.username}`);
            setOrders(res.data);
        } catch (err) {
            console.error(err);
            alert('Error fetching your orders.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (orderId, amount) => {
        if (!window.confirm('Are you sure you want to cancel this order? Amount will be refunded to your wallet.')) return;

        try {
            await axios.put(`${API_BASE_URL}/api/orders/${orderId}/cancel`);

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

            alert('Order cancelled successfully. Amount refunded to wallet.');
        } catch (err) {
            console.error(err);
            alert('Failed to cancel order');
        }
    };

    return (
        <div className="page-container fade-in">
            <h2 className="page-title">My Orders 📦</h2>

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
                                    onClick={() => setView('quantum-tracker')}
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
                            <div key={idx} className="order-item-mini">
                                <img src={item.image} alt={item.name} />
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name}</div>
                                    <small style={{ color: '#666' }}>Qty: {item.quantity}</small>
                                </div>
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
