import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminOrders = ({ setView }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/orders');
            setOrders(res.data);
        } catch (err) {
            console.error(err);
            alert('Error fetching orders. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-orders-container fade-in">
            <h2 className="page-title">Admin Dashboard - Live Orders</h2>

            {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</div>}

            {!loading && orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No orders found yet.</div>
            )}

            {orders.map(order => (
                <div key={order._id} className="order-card">
                    <div className="order-header">
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Order #{order._id.substring(order._id.length - 6)}</h3>
                            <small style={{ color: '#888' }}>Customer: {order.userName}</small>
                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{new Date(order.createdAt).toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className="order-badge">{order.status}</span>
                            <div style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem', color: '#2f3542' }}>₹{order.totalAmount}</div>
                        </div>
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

            <div style={{ textAlign: 'center', marginTop: '3rem', paddingBottom: '2rem' }}>
                <button className="nav-btn" onClick={() => setView('home')}>Back to Home</button>
            </div>
        </div>
    );
};

export default AdminOrders;
