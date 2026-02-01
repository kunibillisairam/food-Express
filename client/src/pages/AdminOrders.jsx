import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import NotificationSender from '../components/NotificationSender';
import CampaignManager from './CampaignManager'; // Integrated Campaign Manager
import toast from 'react-hot-toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminOrders = ({ setView }) => {
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [activeTab, setActiveTab] = useState('analytics');
    const [loading, setLoading] = useState(false);
    const [selectedUserOrders, setSelectedUserOrders] = useState(null); // For user history modal

    useEffect(() => {
        if (activeTab === 'orders') fetchOrders();
        else if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'analytics') fetchAnalytics();
    }, [activeTab]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/analytics/dashboard`);
            setAnalytics(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/orders`);
            setOrders(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Error fetching orders');
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
            toast.error('Error fetching users');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserOrders = async (username) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/orders/user/${username}`);
            setSelectedUserOrders({ username, orders: res.data });
        } catch (err) {
            toast.error("Could not fetch user history");
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`${API_BASE_URL}/api/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order updated to ${newStatus}`);
            fetchOrders(); // Refresh
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const handleRefund = async (orderId) => {
        if (!confirm("Are you sure you want to cancel and refund this order?")) return;
        try {
            await axios.put(`${API_BASE_URL}/api/orders/${orderId}/cancel`);
            toast.success('Order cancelled & refunded');
            fetchOrders();
        } catch (err) {
            toast.error('Refund failed');
        }
    };

    const handleBlockUser = async (userId, currentStatus) => {
        const action = currentStatus ? "Unblock" : "Block";
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            await axios.put(`${API_BASE_URL}/api/users/${userId}/block`, { isBlocked: !currentStatus });
            toast.success(`User ${action}ed successfully`);
            fetchUsers();
        } catch (err) {
            toast.error(`Failed to ${action} user`);
        }
    };

    const StatCard = ({ title, value, icon, color }) => (
        <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem',
                borderRadius: '15px',
                border: `1px solid ${color}`,
                color: 'white',
                flex: 1,
                minWidth: '200px',
                boxShadow: `0 4px 15px ${color}40`
            }}
        >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{title}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{value}</div>
        </motion.div>
    );

    return (
        <div className="admin-orders-container fade-in" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'white' }}>
            <div className="header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="page-title" style={{ fontSize: '2.5rem', margin: 0 }}>🏢 Admin HQ</h2>
                <button className="nav-btn" onClick={() => setView('home')}>Exit to App</button>
            </div>

            <div className="admin-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {['analytics', 'orders', 'users', 'campaigns', 'notifications'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.8rem 2rem',
                            background: activeTab === tab ? '#6c5ce7' : 'rgba(255,255,255,0.1)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '30px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            textTransform: 'capitalize',
                            transition: 'all 0.3s'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading ecosystem data...</div>}

            {!loading && (
                <div className="dashboard-content">
                    {activeTab === 'analytics' && analytics && (
                        <div className="analytics-view">
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
                                <StatCard title="Daily Orders" value={analytics.dailyOrders} icon="📦" color="#00C49F" />
                                <StatCard title="Daily Revenue" value={`₹${analytics.dailyRevenue}`} icon="💰" color="#0088FE" />
                                <StatCard title="Monthly Orders" value={analytics.monthlyOrders} icon="📅" color="#FFBB28" />
                                <StatCard title="Monthly Revenue" value={`₹${analytics.monthlyRevenue}`} icon="📈" color="#FF8042" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                                <div style={{ height: '400px', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '20px' }}>
                                    <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>🏆 Most Popular Items</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.popularItems}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                            <XAxis dataKey="_id" stroke="#ccc" />
                                            <YAxis stroke="#ccc" />
                                            <Tooltip contentStyle={{ background: '#333', border: 'none' }} />
                                            <Legend />
                                            <Bar dataKey="count" fill="#8884d8">
                                                {analytics.popularItems.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="orders-grid">
                            {orders.map(order => (
                                <motion.div
                                    key={order._id}
                                    layout
                                    className="order-card"
                                    style={{
                                        position: 'relative',
                                        borderLeft: `5px solid ${order.status === 'Cancelled' ? '#e74c3c' : '#2ecc71'}`
                                    }}
                                >
                                    <div className="order-header">
                                        <div>
                                            <h3 style={{ margin: 0 }}>Order #{order._id.substring(order._id.length - 6)}</h3>
                                            <small style={{ color: '#888' }}>{order.userName} • {new Date(order.createdAt).toLocaleString()}</small>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>₹{order.totalAmount}</div>
                                        </div>
                                    </div>

                                    <div className="order-items-grid">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="order-item-mini">
                                                <div style={{ fontWeight: '600' }}>{item.quantity}x {item.name}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="order-actions" style={{ marginTop: '1rem', borderTop: '1px solid #444', paddingTop: '1rem', display: 'flex', gap: '1rem' }}>
                                        <button
                                            onClick={() => handleRefund(order._id)}
                                            disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                                            style={{
                                                flex: 1,
                                                padding: '1rem',
                                                background: order.status === 'Cancelled' ? '#444' : '#ff4757',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                cursor: order.status === 'Cancelled' || order.status === 'Delivered' ? 'not-allowed' : 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                opacity: order.status === 'Delivered' ? 0.3 : 1
                                            }}
                                        >
                                            {order.status === 'Cancelled' ? '🚫 Cancelled' : '❌ Cancel Order'}
                                        </button>

                                        <button
                                            onClick={() => handleUpdateStatus(order._id, 'Delivered')}
                                            disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                                            style={{
                                                flex: 1,
                                                padding: '1rem',
                                                background: order.status === 'Delivered' ? '#444' : '#2ed573',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                cursor: order.status === 'Cancelled' || order.status === 'Delivered' ? 'not-allowed' : 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                opacity: order.status === 'Cancelled' ? 0.3 : 1
                                            }}
                                        >
                                            {order.status === 'Delivered' ? '✅ Completed' : '✨ Mark Completed'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="users-view">
                            <div className="table-responsive" style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #555' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>User</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Contact</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Wallet</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user._id} style={{ borderBottom: '1px solid #333' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                                                    <small style={{ opacity: 0.7 }}>{user.rank}</small>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{user.phone || user.email}</td>
                                                <td style={{ padding: '1rem', color: '#2ecc71', fontWeight: 'bold' }}>₹{user.walletBalance}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        padding: '0.3rem 0.8rem',
                                                        borderRadius: '20px',
                                                        background: user.isBlocked ? '#e74c3c' : '#2ecc71',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        onClick={() => fetchUserOrders(user.username)}
                                                        style={{ marginRight: '0.5rem', background: '#3498db', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '5px', color: 'white', cursor: 'pointer' }}
                                                    >
                                                        History
                                                    </button>
                                                    <button
                                                        onClick={() => handleBlockUser(user._id, user.isBlocked)}
                                                        style={{ background: user.isBlocked ? '#2ecc71' : '#e74c3c', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '5px', color: 'white', cursor: 'pointer' }}
                                                    >
                                                        {user.isBlocked ? 'Unblock' : 'Block'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'campaigns' && (
                        <div className="campaigns-wrapper">
                            <CampaignManager />
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '20px', color: '#333' }}>
                            <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#6c5ce7' }}>📢 Broadcast Center</h3>
                            <NotificationSender userId={null} />
                        </div>
                    )}
                </div>
            )}

            {/* User History Modal */}
            <AnimatePresence>
                {selectedUserOrders && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                        }}
                        onClick={() => setSelectedUserOrders(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            style={{ background: '#2d3436', padding: '2rem', borderRadius: '20px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={{ marginTop: 0 }}>📜 History: {selectedUserOrders.username}</h3>
                            {selectedUserOrders.orders.length === 0 ? <p>No orders found.</p> : (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {selectedUserOrders.orders.map(o => (
                                        <li key={o._id} style={{ padding: '1rem', borderBottom: '1px solid #444' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                                                <span style={{ fontWeight: 'bold' }}>₹{o.totalAmount}</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.5rem' }}>
                                                {o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button onClick={() => setSelectedUserOrders(null)} style={{ marginTop: '1rem', width: '100%', padding: '0.8rem' }} className="btn-primary">Close</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOrders;
