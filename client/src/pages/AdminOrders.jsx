import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './AdminOrders.css';
import API_BASE_URL from '../config';
import NotificationSender from '../components/NotificationSender';
import CampaignManager from './CampaignManager';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaHome, FaBox, FaUsers, FaChartLine, FaBullhorn, FaBell, FaSearch,
    FaUserCircle, FaCog, FaSignOutAlt, FaWallet
} from 'react-icons/fa';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminOrders = ({ setView }) => {
    const { user, logout } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [activeTab, setActiveTab] = useState('analytics');
    const [loading, setLoading] = useState(false);

    // Management states
    const [selectedUserOrders, setSelectedUserOrders] = useState(null);
    const [managingUser, setManagingUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    // Forms
    const [ecoAmount, setEcoAmount] = useState('');
    const [ecoReason, setEcoReason] = useState('');
    const [editFormData, setEditFormData] = useState({ username: '', phone: '', walletBalance: '', rank: 'Cadet' });
    const [searchTerm, setSearchTerm] = useState('');

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
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            console.log('[Status Update] Attempting update:', { orderId, newStatus });
            console.log('[Status Update] Request URL:', `${API_BASE_URL}/api/orders/${orderId}/status`);
            console.log('[Status Update] Request Body:', { status: newStatus });

            const response = await axios.put(`${API_BASE_URL}/api/orders/${orderId}/status`, { status: newStatus });

            console.log('[Status Update] Success:', response.data);
            toast.success(`Order updated to ${newStatus}`);
            fetchOrders();
        } catch (err) {
            console.error("[Status Update] Full Error:", err);
            console.error("[Status Update] Error Response:", err.response);
            const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update status';
            toast.error(errMsg);
        }
    };

    const handleRefund = async (orderId) => {
        if (!window.confirm("Are you sure you want to refund and cancel this order?")) return;
        try {
            await axios.put(`${API_BASE_URL}/api/orders/${orderId}/cancel`);
            toast.success('Order cancelled and refunded');
            fetchOrders();
        } catch (err) {
            console.error(err);
            toast.error('Refund failed');
        }
    };

    // User Action Extensions
    const handleBlockUser = async (userId, isBlocked) => {
        try {
            await axios.put(`${API_BASE_URL}/api/users/${userId}/block`, { isBlocked: !isBlocked });
            toast.success(isBlocked ? 'User Unblocked' : 'User Blocked');
            fetchUsers();
        } catch (err) {
            toast.error('Action Failed');
        }
    };

    const handleResetPassword = async (userId) => {
        if (!window.confirm("Reset password to 'password123'?")) return;
        try {
            await axios.put(`${API_BASE_URL}/api/users/${userId}/reset-password`);
            toast.success('Password reset to default');
        } catch (err) {
            toast.error('Reset Failed');
        }
    };

    const handleEconomyAction = async (actionType, method, amountOverride = null, reasonOverride = null) => {
        const amount = amountOverride || parseFloat(ecoAmount);
        const reason = reasonOverride || ecoReason || 'Admin Adjustment';

        if (!amount || amount <= 0) return toast.error('Check Amount');
        if (!managingUser) return;

        try {
            console.log('[Economy Action] Attempting:', { userId: managingUser._id, actionType, method, amount, reason });

            // The backend expects: type, amount, description, target
            // target: 'wallet', 'credits', 'xp', 'compensation'
            // type: 'Credit', 'Debit', 'Reset'
            const response = await axios.post(`${API_BASE_URL}/api/admin/users/${managingUser._id}/transaction`, {
                type: method, // 'Credit' or 'Debit'
                amount: amount,
                description: reason,
                target: actionType // 'wallet' or 'credits'
            });

            console.log('[Economy Action] Success:', response.data);
            toast.success('Economy updated!');
            setEcoAmount('');
            setEcoReason('');
            setManagingUser(null);
            fetchUsers();
        } catch (err) {
            console.error('[Economy Action] Error:', err);
            console.error('[Economy Action] Error response:', err.response?.data);
            const errorMsg = err.response?.data?.message || err.message || 'Economy action failed';
            toast.error(errorMsg);
        }
    };

    // Edit User Handlers
    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            username: user.username,
            phone: user.phone || '',
            walletBalance: user.walletBalance,
            rank: user.rank || 'Cadet'
        });
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleEditSave = async () => {
        try {
            console.log('[User Update] Attempting to update user:', editingUser._id);
            console.log('[User Update] Update data:', editFormData);

            const response = await axios.put(`${API_BASE_URL}/api/users/${editingUser._id}`, editFormData);

            console.log('[User Update] Success:', response.data);
            toast.success('User updated successfully');

            setEditingUser(null);

            // Fetch fresh data from server to ensure consistency
            fetchUsers();
        } catch (err) {
            console.error('[User Update] Error:', err);
            console.error('[User Update] Error response:', err.response?.data);
            const errorMsg = err.response?.data?.message || err.message || 'Update failed';
            toast.error(errorMsg);
        }
    };

    const fetchUserOrders = async (username) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/orders/user/${username}`);
            setSelectedUserOrders({ username, orders: res.data });
        } catch (err) {
            toast.error('Could not fetch history');
        }
    };


    // Search Logic
    const getFilteredOrders = () => {
        if (!searchTerm) return orders;
        const term = searchTerm.toLowerCase();
        return orders.filter(order =>
            order._id.toLowerCase().includes(term) ||
            order.userName.toLowerCase().includes(term) ||
            (order.status && order.status.toLowerCase().includes(term))
        );
    };

    const getNextStatus = (currentStatus) => {
        const flow = ['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
        const index = flow.indexOf(currentStatus);
        if (index === -1 || index === flow.length - 1) return null;
        return flow[index + 1];
    };

    const handleProcessNext = (order) => {
        const next = getNextStatus(order.status);
        if (next) handleUpdateStatus(order._id, next);
    };

    const SidebarItem = ({ id, label, icon }) => (
        <button
            className={`nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
        >
            <span className="nav-icon">{icon}</span>
            {label}
        </button>
    );

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-profile">
                    <div className="sidebar-avatar" style={{ backgroundImage: user?.avatar ? `url(${user.avatar})` : undefined }}></div>
                    <div className="sidebar-name">{user?.username || 'Admin'}</div>
                    <div className="sidebar-role">Super Admin</div>
                </div>

                <div className="sidebar-nav">
                    <SidebarItem id="analytics" label="Dashboard" icon={<FaChartLine />} />
                    <SidebarItem id="orders" label="Orders" icon={<FaBox />} />
                    <SidebarItem id="users" label="Users" icon={<FaUsers />} />
                    <SidebarItem id="campaigns" label="Campaigns" icon={<FaBullhorn />} />
                    <SidebarItem id="notifications" label="Broadcast" icon={<FaBell />} />
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button className="nav-item" onClick={() => setView('home')}>
                        <span className="nav-icon"><FaHome /></span>
                        Back to App
                    </button>
                    <button className="nav-item" onClick={logout} style={{ color: '#ff4757' }}>
                        <span className="nav-icon"><FaSignOutAlt /></span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Topbar */}
                <header className="top-bar">
                    <div className="top-bar-search">
                        <FaSearch className="search-icon-abs" />
                        <input
                            type="text"
                            className="top-search-input"
                            placeholder="Search orders, users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        // Removed disabled attribute
                        />
                    </div>
                    <div className="top-bar-actions">
                        <button className="icon-btn"><FaBell /></button>
                        <button className="icon-btn"><FaCog /></button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{user?.username}</div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>Administrator</div>
                            </div>
                            <button className="icon-btn"><FaUserCircle style={{ fontSize: '1.5rem' }} /></button>
                        </div>
                    </div>
                </header>

                <div className="dashboard-container">

                    {/* Dashboard Analytics View */}
                    {activeTab === 'analytics' && (
                        <div className="fade-in">
                            <h2 className="section-title">Dashboard Overview</h2>

                            {/* Stats Row 1 */}
                            <div className="stats-row">
                                <div className="modern-stat-card">
                                    <div>
                                        <div style={{ color: '#888', fontSize: '0.9rem' }}>Daily Orders</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '5px' }}>
                                            {analytics?.dailyOrders || 0}
                                        </div>
                                    </div>
                                    <div className="stat-icon-circle" style={{ background: '#6c5ce7' }}><FaBox /></div>
                                </div>
                                <div className="modern-stat-card">
                                    <div>
                                        <div style={{ color: '#888', fontSize: '0.9rem' }}>Daily Revenue</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '5px' }}>
                                            ₹{analytics?.dailyRevenue || 0}
                                        </div>
                                    </div>
                                    <div className="stat-icon-circle" style={{ background: '#00cec9' }}><FaWallet /></div>
                                </div>
                                <div className="modern-stat-card">
                                    <div>
                                        <div style={{ color: '#888', fontSize: '0.9rem' }}>Monthly Orders</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '5px' }}>
                                            {analytics?.monthlyOrders || 0}
                                        </div>
                                    </div>
                                    <div className="stat-icon-circle" style={{ background: '#fdcb6e' }}><FaBox /></div>
                                </div>
                                <div className="modern-stat-card">
                                    <div>
                                        <div style={{ color: '#888', fontSize: '0.9rem' }}>Monthly Reven..</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '5px' }}>
                                            ₹{analytics?.monthlyRevenue || 0}
                                        </div>
                                    </div>
                                    <div className="stat-icon-circle" style={{ background: '#ff7675' }}><FaChartLine /></div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="charts-row">
                                <div className="chart-card">
                                    <div className="card-header">
                                        <div className="card-title">Revenue & Traffic</div>
                                        <button className="table-btn btn-purple">Last Month Summary</button>
                                    </div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analytics?.popularItems || []}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} />
                                            <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={1} fill="url(#colorCount)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="chart-card">
                                    <div className="card-header">
                                        <div className="card-title">Traffic Source</div>
                                    </div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics?.popularItems || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="count"
                                            >
                                                {(analytics?.popularItems || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Colored Widgets */}
                            <div className="widget-row">
                                <div className="colored-widget pink">
                                    <div>Revenue Status</div>
                                    <FaChartLine style={{ fontSize: '2rem', opacity: 0.8 }} />
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$500</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Jan 05 - Jan 10</div>
                                    </div>
                                </div>
                                <div className="colored-widget purple">
                                    <div>Page View</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>60K</div>
                                    <AreaChart width={100} height={40} data={[{ uv: 10 }, { uv: 30 }, { uv: 20 }, { uv: 40 }, { uv: 30 }]} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                        <Area type="monotone" dataKey="uv" stroke="#fff" fill="rgba(255,255,255,0.3)" />
                                    </AreaChart>
                                </div>
                                <div className="colored-widget blue">
                                    <div>Bounce Rate</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>432</div>
                                    <div>Monthly ▼</div>
                                </div>
                                <div className="colored-widget orange">
                                    <div>New Visitors</div>
                                    <FaUsers style={{ fontSize: '2rem', opacity: 0.8 }} />
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>800</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Jan 07 - Jan 10</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Orders View */}
                    {activeTab === 'orders' && (
                        <div className="fade-in">
                            <h2 className="section-title">Order Management</h2>
                            <div className="table-card">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredOrders().map(order => {
                                            const nextStatus = getNextStatus(order.status);
                                            return (
                                                <tr key={order._id}>
                                                    <td>#{order._id.substring(order._id.length - 6)}</td>
                                                    <td>{order.userName}</td>
                                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ fontWeight: 'bold' }}>₹{order.totalAmount}</td>
                                                    <td>
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                                            className={`status-badge ${order.status === 'Delivered' ? 'success' :
                                                                order.status === 'Cancelled' ? 'danger' : 'pending'
                                                                }`}
                                                            style={{ border: 'none', cursor: 'pointer' }}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Preparing">Preparing</option>
                                                            <option value="Ready">Ready</option>
                                                            <option value="Out for Delivery">Out for Delivery</option>
                                                            <option value="Delivered">Delivered</option>
                                                            <option value="Cancelled">Cancelled</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <div className="action-btn-group">
                                                            <button
                                                                className="table-btn btn-blue"
                                                                onClick={() => handleProcessNext(order)}
                                                                disabled={!nextStatus}
                                                                title={nextStatus ? `Advance to ${nextStatus}` : 'Order Completed'}
                                                            >
                                                                {nextStatus ? `➡ ${nextStatus}` : '✅ Completed'}
                                                            </button>
                                                            <button
                                                                className="table-btn btn-red"
                                                                onClick={() => handleRefund(order._id)}
                                                                disabled={order.status === 'Delivered' || order.status === 'Cancelled'}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {getFilteredOrders().length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No orders found</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Users View */}
                    {activeTab === 'users' && (
                        <div className="fade-in">
                            <h2 className="section-title">User Management</h2>
                            <div className="table-card">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>User Info</th>
                                            <th>Contact</th>
                                            <th>Wallet</th>
                                            <th>Rank</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.filter(user =>
                                            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (user.phone && user.phone.includes(searchTerm)) ||
                                            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                        ).map(user => (
                                            <tr key={user._id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#6c5ce7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                            {user.username[0].toUpperCase()}
                                                        </div>
                                                        <div>{user.username}</div>
                                                    </div>
                                                </td>
                                                <td>{user.phone || 'N/A'}</td>
                                                <td style={{ color: '#2ecc71', fontWeight: 'bold' }}>₹{user.walletBalance}</td>
                                                <td><span style={{ padding: '2px 8px', background: '#eee', borderRadius: '4px', fontSize: '0.8rem' }}>{user.rank || 'Cadet'}</span></td>
                                                <td>
                                                    <span className={`status-badge ${user.isBlocked ? 'danger' : 'success'}`}>
                                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-btn-group">
                                                        <button className="table-btn btn-purple" onClick={() => setManagingUser(user)}> Manage</button>
                                                        <button className="table-btn btn-blue" onClick={() => handleEditClick(user)}>Edit</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Campaigns View */}
                    {activeTab === 'campaigns' && (
                        <div className="fade-in">
                            <h2 className="section-title">Marketing Campaigns</h2>
                            <CampaignManager />
                        </div>
                    )}

                    {/* Notifications View */}
                    {activeTab === 'notifications' && (
                        <div className="fade-in">
                            <h2 className="section-title">Broadcast Center</h2>
                            <div className="chart-card" style={{ height: 'auto', maxWidth: '600px' }}>
                                <NotificationSender userId={null} />
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Modals (Managing / Editing) - Kept mostly same but updated styles slightly via global CSS if needed */}
            <AnimatePresence>
                {/* Economy Manager Modal */}
                {managingUser && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
                        }}
                        onClick={() => setManagingUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', color: '#333' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={{ marginTop: 0 }}>Manage: {managingUser.username}</h3>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '10px', flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Wallet</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{managingUser.walletBalance}</div>
                                </div>
                                <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '10px', flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Credits</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{managingUser.credits}</div>
                                </div>
                            </div>

                            <input
                                type="number" placeholder="Amount" value={ecoAmount} onChange={e => setEcoAmount(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px' }}
                            />
                            <input
                                type="text" placeholder="Reason" value={ecoReason} onChange={e => setEcoReason(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                <button className="table-btn btn-purple" onClick={() => handleEconomyAction('wallet', 'Credit')}>+ Credit Wallet</button>
                                <button className="table-btn btn-red" onClick={() => handleEconomyAction('wallet', 'Debit')}>- Debit Wallet</button>
                            </div>

                            <button onClick={() => setManagingUser(null)} style={{ width: '100%', padding: '10px', border: 'none', background: 'transparent', color: '#666', cursor: 'pointer' }}>Close</button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Edit Modal */}
                {editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
                        }}
                        onClick={() => setEditingUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                            style={{ background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', color: '#333' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 style={{ marginTop: 0 }}>Edit User</h3>
                            <input type="text" name="username" value={editFormData.username} onChange={handleEditChange} placeholder="Username" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }} />
                            <input type="text" name="phone" value={editFormData.phone} onChange={handleEditChange} placeholder="Phone" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }} />
                            <input type="number" name="walletBalance" value={editFormData.walletBalance} onChange={handleEditChange} placeholder="Wallet" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '5px' }} />

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="table-btn btn-blue" style={{ flex: 1, padding: '10px' }} onClick={handleEditSave}>Save</button>
                                <button className="table-btn btn-red" style={{ flex: 1, padding: '10px', background: '#ccc', color: '#333' }} onClick={() => setEditingUser(null)}>Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* User History Modal (Existing) */}
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
                            <h3 style={{ marginTop: 0, color: 'white' }}>📜 History: {selectedUserOrders.username}</h3>
                            {selectedUserOrders.orders.length === 0 ? <p style={{ color: 'white' }}>No orders found.</p> : (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {selectedUserOrders.orders.map(o => (
                                        <li key={o._id} style={{ padding: '1rem', borderBottom: '1px solid #444', color: 'white' }}>
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
