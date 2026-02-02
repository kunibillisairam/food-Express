import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import API_BASE_URL from '../config';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaHome, FaUsers, FaBox, FaBell, FaCog, FaSearch, FaPlus,
    FaWallet, FaHistory, FaCheck, FaTimes, FaMapMarkerAlt, FaPhoneAlt,
    FaBullhorn, FaGift, FaLock, FaUnlock, FaTrash, FaSignOutAlt,
    FaChartLine, FaChartPie, FaCreditCard, FaUserPlus
} from 'react-icons/fa';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const AdminDashboard = ({ setView }) => {
    const { user, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('home');
    const [loading, setLoading] = useState(false);

    // Data States
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [userFilter, setUserFilter] = useState('All');
    const [orderStatusFilter, setOrderStatusFilter] = useState('Pending');
    const [selectedUser, setSelectedUser] = useState(null); // For bottom sheet
    const [selectedOrder, setSelectedOrder] = useState(null); // For order detail
    const [notificationForm, setNotificationForm] = useState({ title: '', message: '', target: 'All' });

    // Wallet State
    const [walletSearch, setWalletSearch] = useState('');
    const [walletUser, setWalletUser] = useState(null);
    const [walletAmount, setWalletAmount] = useState('');
    const [walletReason, setWalletReason] = useState('');

    // Chart Colors
    const COLORS = ['#8884d8', '#55efc4', '#ff7675', '#fdcb6e'];

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [ordersRes, analyticsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/orders`),
                axios.get(`${API_BASE_URL}/api/analytics/dashboard`)
            ]);
            setOrders(ordersRes.data);
            setAnalytics(analyticsRes.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/users/all`);
            setUsers(res.data);
        } catch (err) {
            toast.error("Failed to load users");
        }
    };

    // Handlers
    const handleOrderStatus = async (orderId, status) => {
        try {
            await axios.put(`${API_BASE_URL}/api/orders/${orderId}`, { status });
            toast.success(`Order ${status}`);
            fetchInitialData(); // Refresh
            if (selectedOrder) setSelectedOrder(null);
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleBlockUser = async (userId, currentStatus) => {
        try {
            await axios.put(`${API_BASE_URL}/api/users/${userId}/block`, { isBlocked: !currentStatus });
            toast.success(currentStatus ? "User Unblocked" : "User Blocked");
            fetchUsers();
            setSelectedUser(null);
        } catch (err) {
            toast.error("Action failed");
        }
    };

    const handleWalletAction = async (type) => {
        if (!walletUser || !walletAmount) return toast.error("Select user and amount");
        try {
            await axios.post(`${API_BASE_URL}/api/admin/economy`, {
                userId: walletUser._id,
                action: 'wallet',
                method: type === 'add' ? 'Credit' : 'Debit',
                amount: parseFloat(walletAmount),
                reason: walletReason || 'Admin Adjustment'
            });
            toast.success(`Wallet ${type === 'add' ? 'Credited' : 'Debited'}`);
            setWalletUser(null);
            setWalletAmount('');
            setWalletReason('');
        } catch (err) {
            toast.error("Transaction failed");
        }
    };

    const sendNotification = async () => {
        // Placeholder for notification logic
        toast.success("Notification Sent (Simulation)");
        setNotificationForm({ ...notificationForm, title: '', message: '' });
    };

    // --- Sub-Components ---
    const Sidebar = () => (
        <aside className="sidebar-desktop">
            <div className="sidebar-header">
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    backgroundImage: `url(${user?.avatar || 'https://via.placeholder.com/150'})`,
                    backgroundSize: 'cover', border: '2px solid #55efc4'
                }}></div>
                <div>
                    <div style={{ fontWeight: 'bold' }}>{user?.username || 'Admin'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#777' }}>Super Admin</div>
                </div>
            </div>

            <div className="sidebar-menu">
                <div className={`sidebar-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                    <FaHome /> Dashboard
                </div>
                <div className={`sidebar-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                    <FaBox /> Orders
                </div>
                <div className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); fetchUsers(); }}>
                    <FaUsers /> Users
                </div>
                <div className={`sidebar-nav-item ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => setActiveTab('campaigns')}>
                    <FaBullhorn /> Campaigns
                </div>
                <div className={`sidebar-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                    <FaBell /> Notifications
                </div>
                <div className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                    <FaCog /> Settings
                </div>
            </div>

            <div className="sidebar-nav-item sidebar-logout" onClick={() => { if (window.confirm('Go back to main app?')) setView('home'); }}>
                <FaHome /> Back to App
            </div>
            <div className="sidebar-nav-item sidebar-logout" onClick={logout} style={{ marginTop: '10px' }}>
                <FaSignOutAlt /> Logout
            </div>
        </aside>
    );

    const BottomNav = () => (
        <nav className="bottom-nav">
            <button className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                <FaHome className="nav-icon" />
            </button>
            <button className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); fetchUsers(); }}>
                <FaUsers className="nav-icon" />
            </button>
            <button className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                <FaBox className="nav-icon" />
            </button>
            <button className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                <FaBell className="nav-icon" />
            </button>
            <button className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                <FaCog className="nav-icon" />
            </button>
        </nav>
    );

    const Header = () => (
        <header className="glass-header">
            {/* Mobile Only Header Content */}
            <div className="mobile-header-content" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* We hide the avatar on desktop header since it's in sidebar */}
                <div className="hide-on-desktop" style={{
                    width: '35px', height: '35px', borderRadius: '50%',
                    backgroundImage: `url(${user?.avatar || 'https://via.placeholder.com/150'})`,
                    backgroundSize: 'cover'
                }}></div>
                <div>
                    <div className="hide-on-desktop" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>FoodExpress Admin</div>
                    <div style={{ fontSize: '0.8rem', color: '#55efc4' }}>
                        {activeTab === 'home' ? 'Dashboard Overview' :
                            activeTab === 'users' ? 'User Management' :
                                activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="hide-on-mobile search-bar-desktop" style={{ position: 'relative' }}>
                    <FaSearch style={{ position: 'absolute', left: '10px', top: '10px', color: '#aaa' }} />
                    <input type="text" placeholder="Search..." style={{
                        background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px 10px 8px 35px', borderRadius: '20px', color: 'white'
                    }} />
                </div>
                <div onClick={() => setActiveTab('notifications')} style={{ position: 'relative', cursor: 'pointer' }}>
                    <FaBell style={{ fontSize: '1.2rem', color: '#fff' }} />
                    <span style={{ position: 'absolute', top: -5, right: -5, width: '8px', height: '8px', background: '#ff7675', borderRadius: '50%' }}></span>
                </div>
            </div>
        </header>
    );

    // --- Views ---

    const HomeView = () => (
        <div className="animate-fade-in">
            {/* Top Request: KPI Grid (Desktop) / Scroller (Mobile) */}
            <div className="kpi-scroller">
                <div className="glass-card kpi-card">
                    <span className="kpi-label">Total Revenue</span>
                    <span className="kpi-value" style={{ color: '#55efc4' }}>₹{analytics?.dailyRevenue || 0}</span>
                    <div style={{ fontSize: '0.7rem', color: '#aaa' }}>+12% from yesterday</div>
                </div>
                <div className="glass-card kpi-card">
                    <span className="kpi-label">Orders Today</span>
                    <span className="kpi-value">{analytics?.dailyOrders || 0}</span>
                    <div style={{ fontSize: '0.7rem', color: '#aaa' }}>New orders</div>
                </div>
                <div className="glass-card kpi-card">
                    <span className="kpi-label">Active Users</span>
                    <span className="kpi-value">{analytics?.monthlyUniqueUsers || 0}</span>
                    <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Currently online</div>
                </div>
                <div className="glass-card kpi-card">
                    <span className="kpi-label">Pending</span>
                    <span className="kpi-value" style={{ color: '#fdcb6e' }}>{orders.filter(o => o.status === 'Pending').length}</span>
                    <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Action needed</div>
                </div>
            </div>

            {/* Desktop Main Grid */}
            <div className="desktop-grid" style={{ marginTop: '25px' }}>
                {/* Left Col: Charts */}
                <div className="chart-big-container hide-on-mobile" style={{ display: 'block' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Revenue Statistics</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analytics?.popularItems || []}> {/* Using popular items as dummy data if revenue timeline missing */}
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#55efc4" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#55efc4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="_id" stroke="#aaa" />
                            <YAxis stroke="#aaa" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e232d', border: 'none', borderRadius: '10px' }} />
                            <Area type="monotone" dataKey="count" stroke="#55efc4" fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Right Col: Traffic / Pie */}
                <div className="chart-small-container hide-on-mobile" style={{ display: 'block' }}>
                    <h3 style={{ marginTop: 0 }}>Traffic Source</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Direct', value: 400 },
                                    { name: 'Social', value: 300 },
                                    { name: 'Referral', value: 300 },
                                    { name: 'Organic', value: 200 }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {COLORS.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bottom-grid-row">
                {/* Recent Orders Table */}
                <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '20px' }}>
                    <div className="section-header" style={{ padding: 0 }}>
                        <span>Recent Live Orders</span>
                        <button className="action-btn secondary" style={{ fontSize: '0.8rem', minHeight: '30px', padding: '5px 15px' }} onClick={() => setActiveTab('orders')}>View All</button>
                    </div>

                    {/* Desktop Table View */}
                    <div className="desktop-table-container">
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ color: '#aaa', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '10px' }}>Order ID</th>
                                    <th style={{ padding: '10px' }}>Customer</th>
                                    <th style={{ padding: '10px' }}>Items</th>
                                    <th style={{ padding: '10px' }}>Amount</th>
                                    <th style={{ padding: '10px' }}>Status</th>
                                    <th style={{ padding: '10px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 5).map(order => (
                                    <tr key={order._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '15px 10px' }}>#{order._id.slice(-6)}</td>
                                        <td style={{ padding: '15px 10px' }}>{order.userName}</td>
                                        <td style={{ padding: '15px 10px' }}>{order.items.length} Items</td>
                                        <td style={{ padding: '15px 10px', color: '#55efc4' }}>₹{order.totalAmount}</td>
                                        <td style={{ padding: '15px 10px' }}>
                                            <span style={{
                                                background: order.status === 'Delivered' ? 'rgba(85, 239, 196, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                color: order.status === 'Delivered' ? '#55efc4' : '#fff',
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem'
                                            }}>{order.status}</span>
                                        </td>
                                        <td style={{ padding: '15px 10px' }}>
                                            <button className="action-btn" style={{ minHeight: '30px', padding: '5px 15px', fontSize: '0.8rem' }} onClick={() => setSelectedOrder(order)}>Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View (Original) - We can hide table on mobile via CSS if needed, but for now we keep the card list for mobile */}
                    <div className="mobile-order-list hide-on-desktop">
                        {orders.slice(0, 5).map(order => (
                            <div key={order._id} className="glass-card live-order-card" onClick={() => setSelectedOrder(order)}>
                                <div className="order-info">
                                    <h4>#{order._id.slice(-6)}</h4>
                                    <div className="order-meta">
                                        <span>{order.userName}</span> • <span style={{ color: '#55efc4' }}>₹{order.totalAmount}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const UsersView = () => (
        <div className="animate-fade-in">
            <div className="search-bar-container">
                <input
                    type="text"
                    className="modern-input"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="filter-pills">
                {['All', 'Active', 'Blocked'].map(f => (
                    <div
                        key={f}
                        className={`filter-pill ${userFilter === f ? 'active' : ''}`}
                        onClick={() => setUserFilter(f)}
                    >
                        {f}
                    </div>
                ))}
            </div>

            <div className="user-list">
                {users.filter(u => {
                    if (userFilter === 'Blocked' && !u.isBlocked) return false;
                    if (userFilter === 'Active' && u.isBlocked) return false;
                    return u.username.toLowerCase().includes(searchTerm.toLowerCase());
                }).map(u => (
                    <div key={u._id} className="glass-card user-card" onClick={() => setSelectedUser(u)}>
                        <div className="user-avatar">{u.username[0].toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600' }}>{u.username}</div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{u.phone || 'No Phone'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#55efc4', fontWeight: 'bold' }}>₹{u.walletBalance}</div>
                            <div style={{ fontSize: '0.7rem', color: u.isBlocked ? '#ff7675' : '#aaa' }}>
                                {u.isBlocked ? 'Blocked' : 'Active'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const OrdersView = () => {
        const statuses = ['Pending', 'Preparing', 'Out', 'Delivered', 'Cancelled'];
        return (
            <div className="animate-fade-in" style={{ paddingTop: '0' }}>
                <div className="sticky-tabs filter-pills">
                    {statuses.map(s => (
                        <div
                            key={s}
                            className={`filter-pill ${orderStatusFilter === s ? 'active' : ''}`}
                            onClick={() => setOrderStatusFilter(s)}
                        >
                            {s}
                        </div>
                    ))}
                </div>

                <div className="orders-list">
                    {orders.filter(o => {
                        if (orderStatusFilter === 'Out') return o.status === 'Out for Delivery';
                        return o.status === orderStatusFilter;
                    }).map(order => (
                        <div key={order._id} className="glass-card live-order-card" onClick={() => setSelectedOrder(order)}>
                            <div className="order-info" style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h4 style={{ color: '#55efc4' }}>#{order._id.slice(-6)}</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#fff' }}>₹{order.totalAmount}</span>
                                </div>
                                <div className="order-meta">
                                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ').slice(0, 30)}...
                                </div>
                                <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#aaa' }}>
                                    {new Date(order.createdAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const CampaignsView = () => (
        <div className="animate-fade-in" style={{ padding: '20px' }}>
            <h2 style={{ marginTop: 0 }}>Campaigns</h2>
            <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
                <h3>Create Coupon</h3>
                <input className="modern-input" placeholder="Coupon Code (e.g. WELCOME50)" style={{ marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input className="modern-input" placeholder="Discount %" type="number" />
                    <input className="modern-input" placeholder="Min Order ₹" type="number" />
                </div>
                <button className="action-btn" style={{ width: '100%', marginTop: '15px' }}>Launch Campaign</button>
            </div>

            <h3>Active Campaigns</h3>
            <div className="glass-card" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontWeight: 'bold', color: '#55efc4' }}>WEEKEND20</div>
                    <div style={{ fontSize: '0.8rem' }}>20% OFF • Min ₹200</div>
                </div>
                <div className="toggle-switch active"></div>
            </div>
        </div>
    );

    const SettingsView = () => (
        <div className="animate-fade-in">
            <div className="setting-item">
                <span>Maintenance Mode</span>
                <div className="toggle-switch"></div>
            </div>
            <div className="setting-item">
                <span>Disable Signups</span>
                <div className="toggle-switch active"></div>
            </div>
            <div className="setting-item">
                <span>Pause Orders</span>
                <div className="toggle-switch"></div>
            </div>
            <div className="setting-item" onClick={logout} style={{ color: '#ff7675', cursor: 'pointer' }}>
                <span>Logout</span>
                <FaSignOutAlt />
            </div>

            <div className="section-header" style={{ marginTop: '30px' }}>Wallet Manager</div>
            <div style={{ padding: '0 20px' }}>
                <div className="glass-card" style={{ padding: '20px' }}>
                    <input
                        className="modern-input"
                        placeholder="Find User for Wallet..."
                        value={walletSearch}
                        onChange={e => {
                            setWalletSearch(e.target.value);
                            const found = users.find(u => u.username.toLowerCase() === e.target.value.toLowerCase());
                            if (found) setWalletUser(found);
                        }}
                        style={{ marginBottom: '10px' }}
                    />
                    {walletUser && (
                        <div style={{ marginBottom: '15px', color: '#55efc4' }}>Selected: {walletUser.username} (₹{walletUser.walletBalance})</div>
                    )}
                    <input
                        className="modern-input"
                        type="number"
                        placeholder="Amount"
                        value={walletAmount}
                        onChange={e => setWalletAmount(e.target.value)}
                        style={{ marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="action-btn" style={{ flex: 1 }} onClick={() => handleWalletAction('add')}>Add</button>
                        <button className="action-btn secondary" style={{ flex: 1, backgroundColor: 'rgba(255, 118, 117, 0.2)', color: '#ff7675' }} onClick={() => handleWalletAction('deduct')}>Deduct</button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-mobile-container">
            <Sidebar />
            <Header />

            <main>
                {activeTab === 'home' && <HomeView />}
                {activeTab === 'users' && <UsersView />}
                {activeTab === 'orders' && <OrdersView />}
                {activeTab === 'campaigns' && <CampaignsView />}
                {activeTab === 'settings' && <SettingsView />}
            </main>

            {/* Mobile Only: Bottom Nav */}
            <BottomNav />

            {/* Overlay for Notifications */}
            {activeTab === 'notifications' && (
                <div className="animate-fade-in" style={{ padding: '20px', paddingBottom: '100px' }}>
                    <h2 style={{ marginTop: 0 }}>Create Notification</h2>
                    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
                        <input className="modern-input" placeholder="Title" style={{ marginBottom: '10px' }} value={notificationForm.title} onChange={e => setNotificationForm({ ...notificationForm, title: e.target.value })} />
                        <textarea className="modern-input" placeholder="Message" rows={3} style={{ marginBottom: '10px' }} value={notificationForm.message} onChange={e => setNotificationForm({ ...notificationForm, message: e.target.value })} />
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ color: '#aaa', fontSize: '0.8rem' }}>Target</label>
                            <select className="modern-input" style={{ marginTop: '5px' }}>
                                <option>All Users</option>
                                <option>Active Users</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="action-btn secondary" style={{ flex: 1 }}>Preview</button>
                            <button className="action-btn" style={{ flex: 1 }} onClick={sendNotification}>Send Now</button>
                        </div>
                    </div>

                    <h3>History</h3>
                    <div className="glass-card" style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontWeight: 'bold' }}>Weekend Sale</span>
                            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Yesterday</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#ddd' }}>Get 50% off on all biryanis...</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#55efc4' }}>Sent to 1,204 users</div>
                    </div>
                </div>
            )}

            {/* User Actions Bottom Sheet */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="bottom-sheet-overlay" onClick={() => setSelectedUser(null)}>
                        <motion.div
                            className="bottom-sheet"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sheet-handle"></div>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div className="user-avatar" style={{ width: '80px', height: '80px', margin: '0 auto 10px', fontSize: '2rem' }}>
                                    {selectedUser.username[0].toUpperCase()}
                                </div>
                                <h2 style={{ margin: 0 }}>{selectedUser.username}</h2>
                                <p style={{ color: '#aaa', margin: '5px 0' }}>{selectedUser.phone || 'No phone'}</p>
                                <div style={{ display: 'inline-block', background: '#333', padding: '5px 10px', borderRadius: '15px', marginTop: '5px' }}>
                                    Wallet: <span style={{ color: '#55efc4' }}>₹{selectedUser.walletBalance}</span>
                                </div>
                            </div>

                            <div className="sheet-actions">
                                <button className="action-btn secondary" onClick={() => { toast("View Orders Clicked"); }}>
                                    <FaBox style={{ marginRight: '10px' }} /> View Order History
                                </button>
                                <button className="action-btn secondary" onClick={() => handleBlockUser(selectedUser._id, selectedUser.isBlocked)}>
                                    {selectedUser.isBlocked ? <FaUnlock style={{ marginRight: '10px' }} /> : <FaLock style={{ marginRight: '10px' }} />}
                                    {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                                </button>
                                <button className="action-btn danger-btn" onClick={() => { toast.success("Tokens Cleared"); }}>
                                    <FaTrash style={{ marginRight: '10px' }} /> Clear FCM Tokens
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="bottom-sheet-overlay" onClick={() => setSelectedOrder(null)} style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            className="glass-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ width: '90%', maxHeight: '90vh', overflowY: 'auto', background: '#1e232d', padding: '0' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="glass-header" style={{ borderRadius: '20px 20px 0 0' }}>
                                <span>Order #{selectedOrder._id.slice(-6)}</span>
                                <FaTimes onClick={() => setSelectedOrder(null)} style={{ cursor: 'pointer' }} />
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ color: '#aaa', margin: '0 0 10px' }}>Items</h4>
                                    {selectedOrder.items.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                                            <span>{item.quantity} x {item.name}</span>
                                            <span>₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '10px' }}>
                                        Total: <span style={{ color: '#55efc4' }}>₹{selectedOrder.totalAmount}</span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ color: '#aaa', margin: '0 0 10px' }}>Delivery to</h4>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <FaMapMarkerAlt style={{ color: '#ff7675' }} />
                                        <div>{selectedOrder.address || '123, Main Street, Hyderabad'}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                                        <FaPhoneAlt style={{ color: '#74b9ff' }} />
                                        <div>{selectedOrder.userPhone || '9876543210'}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {['Preparing', 'Out for Delivery', 'Delivered'].map(status => (
                                        <button
                                            key={status}
                                            className={`action-btn ${selectedOrder.status === status ? '' : 'secondary'}`}
                                            style={{ fontSize: '0.8rem', padding: '10px' }}
                                            onClick={() => handleOrderStatus(selectedOrder._id, status)}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                    <button className="action-btn danger-btn" onClick={() => handleOrderStatus(selectedOrder._id, 'Cancelled')}>Cancel</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AdminDashboard;
