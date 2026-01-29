import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import NotificationSender from '../components/NotificationSender';

const AdminOrders = ({ setView }) => {
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('orders');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'orders') fetchOrders();
        else fetchUsers();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/orders`);
            setOrders(res.data);
        } catch (err) {
            console.error(err);
            alert('Error fetching orders. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            alert('Error fetching users.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-orders-container fade-in">
            <h2 className="page-title">Admin Dashboard</h2>

            <div className="admin-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('orders')}
                    style={{
                        padding: '0.5rem 2rem',
                        background: activeTab === 'orders' ? '#2f3542' : 'transparent',
                        color: activeTab === 'orders' ? '#fff' : '#2f3542',
                        border: '2px solid #2f3542',
                        borderRadius: '30px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Live Orders
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        padding: '0.5rem 2rem',
                        background: activeTab === 'users' ? '#2f3542' : 'transparent',
                        color: activeTab === 'users' ? '#fff' : '#2f3542',
                        border: '2px solid #2f3542',
                        borderRadius: '30px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    User Database
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    style={{
                        padding: '0.5rem 2rem',
                        background: activeTab === 'notifications' ? '#2f3542' : 'transparent',
                        color: activeTab === 'notifications' ? '#fff' : '#2f3542',
                        border: '2px solid #2f3542',
                        borderRadius: '30px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    📢 Broadcast
                </button>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>}

            {/* ORDERS VIEW */}
            {!loading && activeTab === 'orders' && (
                <>
                    {orders.length === 0 && (
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
                </>
            )}

            {/* USERS VIEW */}
            {!loading && activeTab === 'users' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', padding: '1rem' }}>
                    {users.map(user => (
                        <div key={user._id} className="order-card" style={{ padding: '1.5rem', borderLeft: '4px solid #3498db' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, color: '#2c3e50' }}>{user.username}</h3>
                                <span style={{ background: '#ecf0f1', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.8rem' }}>{user.role}</span>
                            </div>

                            <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#7f8c8d' }}>Phone:</span>
                                <span style={{ fontWeight: 'bold' }}>{user.phone}</span>
                            </div>

                            <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#7f8c8d' }}>Password:</span>
                                <span style={{ background: '#ffeaa7', padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace', color: '#d35400' }}>
                                    {user.password}
                                </span>
                            </div>

                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Wallet Balance</div>
                                <div style={{ fontSize: '1.2rem', color: '#27ae60', fontWeight: 'bold' }}>₹{user.walletBalance}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* NOTIFICATIONS VIEW */}
            {!loading && activeTab === 'notifications' && (
                <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#6c5ce7' }}>📢 Send Push Notification</h3>
                    <NotificationSender userId={null} />
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '3rem', paddingBottom: '2rem' }}>
                <button className="nav-btn" onClick={() => setView('home')}>Back to Home</button>
            </div>
        </div>
    );
};

export default AdminOrders;
