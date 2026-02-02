import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminOrders.css';
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
    const [managingUser, setManagingUser] = useState(null);
    const [ecoAmount, setEcoAmount] = useState('');
    const [ecoReason, setEcoReason] = useState('');

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

    const handleResetPassword = async (userId) => {
        if (!confirm("Are you sure? This will reset the user's password to 'password123'.")) return;
        try {
            await axios.put(`${API_BASE_URL}/api/users/${userId}/reset-password`);
            toast.success("Password reset to 'password123'");
        } catch (err) {
            toast.error("Failed to reset password");
        }
    };

    const handleEconomyAction = async (target, type, fixedAmount = null, fixedReason = null) => {
        if (!managingUser) return;
        const amount = fixedAmount || ecoAmount;
        const description = fixedReason || ecoReason;

        if ((!amount || isNaN(amount)) && type !== 'Reset') {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/api/admin/users/${managingUser._id}/transaction`, {
                target,
                type,
                amount: Number(amount),
                description
            });
            toast.success("Transaction Successful! 💸");

            // Update local user state
            setManagingUser(res.data.user);
            setUsers(users.map(u => u._id === res.data.user._id ? res.data.user : u));

            // Clear inputs
            setEcoAmount('');
            setEcoReason('');
        } catch (err) {
            toast.error(err.response?.data?.message || "Transaction Failed");
        }
    };

    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            username: user.username,
            phone: user.phone || '',
            walletBalance: user.walletBalance,
            rank: user.rank || 'Cadet',
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSave = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/users/${editingUser._id}`, editFormData);
            toast.success('User details updated!');
            setEditingUser(null);
            fetchUsers(); // Refresh list realtime
        } catch (err) {
            toast.error('Failed to update user');
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
        <div className="admin-orders-container fade-in">
            <div className="header-flex">
                <h2 className="page-title">🏢 Admin HQ</h2>
                <button className="nav-btn" onClick={() => setView('home')}>Exit to App</button>
            </div>

            <div className="admin-tabs">
                {['analytics', 'orders', 'users', 'campaigns', 'notifications'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
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
                            {orders.length === 0 ? <p>No active orders.</p> : orders.map(order => (
                                <motion.div
                                    key={order._id}
                                    layout
                                    className={`order-card ${order.status === 'Cancelled' ? 'cancelled' : ''}`}
                                >
                                    <div className="order-header">
                                        <div>
                                            <h3 className="order-id">#{order._id.substring(order._id.length - 6)}</h3>
                                            <small className="order-meta">{order.userName} • {new Date(order.createdAt).toLocaleString()}</small>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#2d3436' }}>₹{order.totalAmount}</div>
                                        </div>
                                    </div>

                                    <div className="order-items-scroll">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="order-item-row">
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span className="item-badge">{item.quantity}</span>
                                                    <span style={{ fontWeight: '600' }}>{item.name}</span>
                                                </div>
                                                <span style={{ fontWeight: 'bold' }}>{item.price ? `₹${item.price}` : ''}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid #eee' }}>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                            className="status-select"
                                        >
                                            <option value="Pending">🕒 Pending</option>
                                            <option value="Preparing">🍳 Cooking</option>
                                            <option value="Ready">🥡 Ready</option>
                                            <option value="Out for Delivery">🚀 Out for Delivery</option>
                                            <option value="Delivered">✅ Delivered</option>
                                            <option value="Cancelled">🚫 Cancelled</option>
                                        </select>

                                        <div className="order-actions-row">
                                            <button
                                                onClick={() => handleRefund(order._id)}
                                                disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                                                className={`btn-action btn-cancel ${order.status === 'Cancelled' || order.status === 'Delivered' ? 'btn-disabled' : ''}`}
                                            >
                                                ❌ Cancel
                                            </button>

                                            <button
                                                onClick={() => handleUpdateStatus(order._id, 'Delivered')}
                                                disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                                                className={`btn-action btn-complete ${order.status === 'Cancelled' || order.status === 'Delivered' ? 'btn-disabled' : ''}`}
                                            >
                                                ✨ Complete
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="users-view">
                            <div className="users-table-container">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Contact</th>
                                            <th>Wallet</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user._id}>
                                                <td data-label="User">
                                                    <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                                                    <small style={{ opacity: 0.7 }}>{user.rank}</small>
                                                </td>
                                                <td data-label="Contact">{user.phone || user.email}</td>
                                                <td data-label="Wallet" style={{ color: '#2ecc71', fontWeight: 'bold' }}>₹{user.walletBalance}</td>
                                                <td data-label="Status">
                                                    <span style={{
                                                        padding: '0.3rem 0.8rem',
                                                        borderRadius: '20px',
                                                        background: user.isBlocked ? '#e74c3c' : '#2ecc71',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="user-actions">
                                                        <button
                                                            onClick={() => setManagingUser(user)}
                                                            className="user-btn btn-manage"
                                                        >
                                                            💰 Manage
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(user)}
                                                            className="user-btn btn-edit"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => fetchUserOrders(user.username)}
                                                            className="user-btn btn-history"
                                                        >
                                                            📜 History
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetPassword(user._id)}
                                                            className="user-btn btn-reset"
                                                            title="Reset Password"
                                                        >
                                                            🔑 Reset
                                                        </button>
                                                        <button
                                                            onClick={() => handleBlockUser(user._id, user.isBlocked)}
                                                            className={`user-btn ${user.isBlocked ? 'btn-unblock' : 'btn-block'}`}
                                                        >
                                                            {user.isBlocked ? '🔓 Unblock' : '🚫 Block'}
                                                        </button>
                                                    </div>
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

            {/* Ecosystem Manager Modal */}
            <AnimatePresence>
                {managingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
                        }}
                        onClick={() => setManagingUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{
                                background: '#2d3436',
                                padding: '2rem',
                                borderRadius: '20px',
                                maxWidth: '500px',
                                width: '90%',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                color: 'white'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 style={{ marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' }}>
                                👑 Manage: {managingUser.username}
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: '#2c3e50', padding: '1rem', borderRadius: '10px' }}>
                                    <small>Wallet Balance</small>
                                    <div style={{ fontSize: '1.5rem', color: '#2ecc71', fontWeight: 'bold' }}>₹{managingUser.walletBalance}</div>
                                </div>
                                <div style={{ background: '#2c3e50', padding: '1rem', borderRadius: '10px' }}>
                                    <small>Credits / XP</small>
                                    <div style={{ fontSize: '1.5rem', color: '#f1c40f', fontWeight: 'bold' }}>{managingUser.credits} CR</div>
                                    <small>{managingUser.xp} XP</small>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Amount</label>
                                <input
                                    type="number"
                                    placeholder="Enter Amount"
                                    value={ecoAmount}
                                    onChange={e => setEcoAmount(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', marginBottom: '1rem' }}
                                />
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Reason (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Compensation, Promo"
                                    value={ecoReason}
                                    onChange={e => setEcoReason(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                <button onClick={() => handleEconomyAction('wallet', 'Credit')} className='btn-primary' style={{ background: '#2ecc71', padding: '0.8rem', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                                    ➕ Add to Wallet
                                </button>
                                <button onClick={() => handleEconomyAction('wallet', 'Debit')} style={{ background: '#e74c3c', padding: '0.8rem', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                                    ➖ Deduct Wallet
                                </button>
                                <button onClick={() => handleEconomyAction('credits', 'Credit')} style={{ background: '#f1c40f', padding: '0.8rem', border: 'none', borderRadius: '8px', color: '#2c3e50', cursor: 'pointer', fontWeight: 'bold' }}>
                                    🪙 Give Credits
                                </button>
                                <button onClick={() => handleEconomyAction('credits', 'Debit')} style={{ background: '#d35400', padding: '0.8rem', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                                    🔻 Deduct Credits
                                </button>
                            </div>

                            <div style={{ borderTop: '1px solid #444', paddingTop: '1.5rem' }}>
                                <button
                                    onClick={() => handleEconomyAction('compensation', 'Credit', 500, 'Admin Compensation')}
                                    style={{ width: '100%', background: 'linear-gradient(45deg, #FF8008, #FFC837)', border: 'none', padding: '1rem', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginBottom: '1rem', boxShadow: '0 4px 15px rgba(255, 128, 8, 0.4)' }}
                                >
                                    🔥 Compensate Unhappy User (Instant ₹500)
                                </button>

                                <button
                                    onClick={() => {
                                        if (confirm("Are you sure you want to reset all XP and Credits for this user?"))
                                            handleEconomyAction('xp', 'Reset')
                                    }}
                                    style={{ width: '100%', background: 'transparent', border: '1px solid #7f8c8d', padding: '0.8rem', borderRadius: '8px', color: '#95a5a6', cursor: 'pointer' }}
                                >
                                    🔄 Reset Reward Points
                                </button>
                            </div>

                            <button onClick={() => setManagingUser(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit User Modal */}
            <AnimatePresence>
                {editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
                        }}
                        onClick={() => setEditingUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            style={{ background: '#2d3436', padding: '2rem', borderRadius: '20px', maxWidth: '400px', width: '90%' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={{ marginTop: 0 }}>✏️ Edit User</h3>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Username</label>
                                <input
                                    type="text" name="username" value={editFormData.username} onChange={handleEditChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Phone</label>
                                <input
                                    type="text" name="phone" value={editFormData.phone} onChange={handleEditChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Wallet Balance (₹)</label>
                                <input
                                    type="number" name="walletBalance" value={editFormData.walletBalance} onChange={handleEditChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Rank</label>
                                <select
                                    name="rank" value={editFormData.rank} onChange={handleEditChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
                                >
                                    <option value="Cadet">Cadet</option>
                                    <option value="Captain">Captain</option>
                                    <option value="Major">Major</option>
                                    <option value="Colonel">Colonel</option>
                                    <option value="General">General</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={handleEditSave} style={{ flex: 1, padding: '10px', background: '#2ed573', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Save Changes</button>
                                <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '10px', background: '#636e72', border: 'none', borderRadius: '5px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User History Modal (Existing) */}
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
