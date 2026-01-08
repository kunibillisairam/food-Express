import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaMapMarkerAlt, FaSignOutAlt, FaGift, FaWallet, FaQuestionCircle, FaListAlt, FaMotorcycle } from 'react-icons/fa';
import axios from 'axios';
import API_BASE_URL from '../config';

const Profile = ({ setView }) => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const [address, setAddress] = useState(user?.address || '');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [orders, setOrders] = useState([]);

    // Fetch orders for history
    useEffect(() => {
        if (user?.username) {
            axios.get(`${API_BASE_URL}/api/orders/user/${user.username}`)
                .then(res => setOrders(res.data))
                .catch(err => console.error(err));
        }
    }, [user?.username]);

    useEffect(() => {
        if (user?.address) {
            setAddress(user.address);
        }
    }, [user]);

    const [activeModal, setActiveModal] = useState(null);

    // Save address handler
    const handleSaveAddress = () => {
        updateUser({ address });
        setIsEditingAddress(false);
    };

    const handleLogout = () => {
        logout();
        setView('login');
    };

    const addMoney = () => {
        const amount = 500;
        const currentBalance = user.walletBalance || 0;

        const newTransaction = {
            type: 'Credit',
            amount: amount,
            description: 'Wallet Top-up',
            date: new Date()
        };

        const currentTransactions = user.transactions || [];

        updateUser({
            walletBalance: currentBalance + amount,
            transactions: [newTransaction, ...currentTransactions]
        });
        alert(`₹${amount} added to your wallet!`);
    };

    const copyReferral = () => {
        navigator.clipboard.writeText('SAI100');
        alert('Referral code copied!');
    };

    if (!user) return <div className="page-container">Please login.</div>;

    const renderModal = () => {
        if (!activeModal) return null;

        return (
            <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={() => setActiveModal(null)}>&times;</button>

                    {activeModal === 'refer' && (
                        <div className="modal-body-centered">
                            <FaGift className="modal-main-icon color-refer" />
                            <h2>Refer & Earn</h2>
                            <p>Share this code with your friends and earn ₹50 when they place their first order!</p>
                            <div className="referral-code-box" onClick={copyReferral}>
                                SAI100 <span className="tap-to-copy">(Tap to copy)</span>
                            </div>
                            <button className="action-btn" onClick={copyReferral} style={{ marginTop: '1rem' }}>Share Now</button>
                        </div>
                    )}

                    {activeModal === 'wallet' && (
                        <div className="modal-body">
                            <div className="modal-header-flex">
                                <h2>My Wallet</h2>
                                <FaWallet className="icon-success" />
                            </div>
                            <div className="balance-card">
                                <span className="balance-label">Current Balance</span>
                                <div className="balance-amount">₹{user.walletBalance || 0}</div>
                            </div>
                            <button className="action-btn w-full mb-8" onClick={addMoney}>+ Add ₹500 Money</button>

                            <h3>Transaction History</h3>
                            <div className="transaction-history-list">
                                {(user.transactions && user.transactions.length > 0) ? (
                                    user.transactions.map((txn, idx) => (
                                        <div key={idx} className="transaction-item">
                                            <div>
                                                <div className="txn-desc">{txn.description}</div>
                                                <div className="txn-date">{new Date(txn.date).toLocaleString()}</div>
                                            </div>
                                            <div className={`txn-amount ${txn.type === 'Debit' ? 'color-error' : 'color-success'}`}>
                                                {txn.type === 'Debit' ? '-' : '+'} ₹{txn.amount}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-transactions">No transactions yet.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeModal === 'history' && (
                        <div className="modal-body">
                            <div className="modal-header-flex">
                                <h2>Order History</h2>
                                <FaListAlt className="icon-primary" />
                            </div>
                            <div className="transaction-history-list" style={{ maxHeight: '400px' }}>
                                {orders.length > 0 ? (
                                    orders.map((order, idx) => (
                                        <div key={idx} className="transaction-item">
                                            <div>
                                                <div className="txn-desc">Order #{order._id.substring(order._id.length - 6)}</div>
                                                <div className="txn-date">{new Date(order.createdAt).toLocaleString()}</div>
                                                <div style={{ fontSize: '0.8rem', color: order.status === 'Delivered' ? 'green' : '#ff4757' }}>{order.status}</div>
                                            </div>
                                            <div className="txn-amount">
                                                ₹{order.totalAmount}
                                            </div>
                                        </div>
                                    ))
                                ) : ( // No orders
                                    <div className="no-transactions">No orders placed yet.</div>
                                )}
                            </div>
                            <button className="nav-btn w-full mt-4" onClick={() => setView('my-orders')}>View Details</button>
                        </div>
                    )}

                    {activeModal === 'help' && (
                        <div className="modal-body">
                            <div className="modal-body-centered mb-6">
                                <FaQuestionCircle className="modal-main-icon color-dark" />
                                <h2>Help & Support</h2>
                            </div>

                            <div className="faq-section mb-8">
                                <h3 className="faq-title">FAQs</h3>
                                <details className="faq-item">
                                    <summary>Where is my order?</summary>
                                    <p>You can track your order status in real-time from the "My Orders" section.</p>
                                </details>
                                <details className="faq-item">
                                    <summary>How do I cancel?</summary>
                                    <p>Orders can be cancelled within 2 minutes of placing them by contacting support.</p>
                                </details>
                                <details className="faq-item">
                                    <summary>My payment failed</summary>
                                    <p>If money was deducted, it will be refunded to your source account within 5-7 business days.</p>
                                </details>
                            </div>

                            <div className="contact-card">
                                <h4>Contact Us</h4>
                                <p><strong>Email:</strong> support@foodexpress.com</p>
                                <p><strong>Phone:</strong> 1800-200-100</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: '#fffbeb', width: '100%' }}>
            {renderModal()}

            {/* DEBUG INDICATOR */}
            <div style={{ background: 'black', color: 'yellow', padding: '15px', textAlign: 'center', fontWeight: 'bold', borderRadius: '10px', marginBottom: '20px' }}>
                LATEST UPDATE: V3.0 (BRIGHT NEON)
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '60px', height: '60px', background: '#eee', borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        <FaUser />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{user.username}</h2>
                    <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.9rem' }}>+91 {user.phone}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* 1. WALLET (WHITE) */}
                    <div
                        style={{ display: 'flex', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'black' }}
                        onClick={() => setActiveModal('wallet')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FaWallet style={{ fontSize: '1.5rem', color: '#ff4757' }} />
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Wallet Balance</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>₹{user.walletBalance || 0}</p>
                            </div>
                        </div>
                        <span style={{ fontSize: '1.5rem' }}>›</span>
                    </div>

                    {/* 2. HISTORY (WHITE) */}
                    <div
                        style={{ display: 'flex', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'black' }}
                        onClick={() => setActiveModal('history')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FaListAlt style={{ fontSize: '1.5rem', color: '#ff4757' }} />
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Order History</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Check Logs</p>
                            </div>
                        </div>
                        <span style={{ fontSize: '1.5rem' }}>›</span>
                    </div>

                    {/* 3. HELP (WHITE) */}
                    <div
                        style={{ display: 'flex', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'black' }}
                        onClick={() => setActiveModal('help')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FaQuestionCircle style={{ fontSize: '1.5rem', color: '#ff4757' }} />
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Help & Support</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Get Assistance</p>
                            </div>
                        </div>
                        <span style={{ fontSize: '1.5rem' }}>›</span>
                    </div>

                    {/* 4. MY ORDERS */}
                    <div
                        style={{ display: 'flex', background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #000', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setView('my-orders')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FaListAlt style={{ color: '#ff4757' }} />
                            <h4 style={{ margin: 0 }}>My Active Orders</h4>
                        </div>
                        <span>›</span>
                    </div>

                    {/* 5. ADDRESS SECTION */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #ddd' }}>
                        <h4 style={{ marginTop: 0, color: '#ff4757' }}><FaMapMarkerAlt /> Address</h4>
                        {isEditingAddress ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <textarea value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: '100%', padding: '10px' }} />
                                <button onClick={handleSaveAddress} style={{ background: '#ff4757', color: 'white', padding: '10px' }}>Save</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <p>{address || 'No address.'}</p>
                                <button onClick={() => setIsEditingAddress(true)} style={{ color: '#ff4757' }}>Edit</button>
                            </div>
                        )}
                    </div>

                    {/* 6. LOGOUT */}
                    <button
                        onClick={handleLogout}
                        style={{ width: '100%', padding: '15px', background: '#333', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem' }}
                    >
                        Log Out
                    </button>
                </div>
            </div>
            <div style={{ height: '100px' }}></div>
        </div>
    );
};

export default Profile;
