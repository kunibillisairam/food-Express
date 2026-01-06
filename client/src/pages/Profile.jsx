import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaMapMarkerAlt, FaSignOutAlt, FaGift, FaWallet, FaQuestionCircle, FaListAlt, FaMotorcycle } from 'react-icons/fa';

const Profile = ({ setView }) => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const [address, setAddress] = useState(user?.address || '');
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    // If we want to force asking for address on first load if missing, we could trigger editing here,
    // but the user prompt implies 'when I click on my account'.

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
            <div className="modal-overlay" onClick={() => setActiveModal(null)} style={modalOverlayStyle}>
                <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={modalContentStyle}>
                    <button onClick={() => setActiveModal(null)} style={closeBtnStyle}>&times;</button>

                    {activeModal === 'refer' && (
                        <div style={{ textAlign: 'center' }}>
                            <FaGift style={{ fontSize: '3rem', color: '#ff4757', marginBottom: '1rem' }} />
                            <h2>Refer & Earn</h2>
                            <p>Share this code with your friends and earn ₹50 when they place their first order!</p>
                            <div style={codeBoxStyle} onClick={copyReferral}>
                                SAI100 <span style={{ fontSize: '0.8rem', color: '#777', marginLeft: '10px' }}>(Tap to copy)</span>
                            </div>
                            <button className="action-btn" onClick={copyReferral} style={{ marginTop: '1rem' }}>Share Now</button>
                        </div>
                    )}

                    {activeModal === 'wallet' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2>My Wallet</h2>
                                <FaWallet style={{ fontSize: '2rem', color: '#2ed573' }} />
                            </div>
                            <div style={balanceCardStyle}>
                                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Current Balance</span>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>₹{user.walletBalance || 0}</div>
                            </div>
                            <button className="action-btn" style={{ width: '100%', marginBottom: '2rem' }} onClick={addMoney}>+ Add ₹500 Money</button>

                            <h3>Transaction History</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                                {(user.transactions && user.transactions.length > 0) ? (
                                    user.transactions.map((txn, idx) => (
                                        <div key={idx} style={transactionStyle}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{txn.description}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#777' }}>{new Date(txn.date).toLocaleString()}</div>
                                            </div>
                                            <div style={{
                                                color: txn.type === 'Debit' ? '#ff4757' : '#2ed573',
                                                fontWeight: 'bold'
                                            }}>
                                                {txn.type === 'Debit' ? '-' : '+'} ₹{txn.amount}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#777', padding: '1rem' }}>No transactions yet.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeModal === 'help' && (
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <FaQuestionCircle style={{ fontSize: '3rem', color: '#2f3542', marginBottom: '0.5rem' }} />
                                <h2>Help & Support</h2>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>FAQs</h3>
                                <details style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f2f6' }}>
                                    <summary style={{ fontWeight: '600', cursor: 'pointer' }}>Where is my order?</summary>
                                    <p style={{ marginTop: '0.5rem', color: '#555' }}>You can track your order status in real-time from the "My Orders" section.</p>
                                </details>
                                <details style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f2f6' }}>
                                    <summary style={{ fontWeight: '600', cursor: 'pointer' }}>How do I cancel?</summary>
                                    <p style={{ marginTop: '0.5rem', color: '#555' }}>Orders can be cancelled within 2 minutes of placing them by contacting support.</p>
                                </details>
                                <details style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f2f6' }}>
                                    <summary style={{ fontWeight: '600', cursor: 'pointer' }}>My payment failed</summary>
                                    <p style={{ marginTop: '0.5rem', color: '#555' }}>If money was deducted, it will be refunded to your source account within 5-7 business days.</p>
                                </details>
                            </div>

                            <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 1rem' }}>Contact Us</h4>
                                <p style={{ margin: '0.5rem 0' }}><strong>Email:</strong> support@foodexpress.com</p>
                                <p style={{ margin: '0.5rem 0' }}><strong>Phone:</strong> 1800-200-100</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="page-container fade-in">
            {renderModal()}
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <FaUser />
                    </div>
                    <h2 className="profile-name">{user.username}</h2>
                    <p className="profile-phone">{user.phone || 'No phone number'}</p>
                </div>

                <div className="profile-section">
                    <h3 className="section-subtitle">
                        <FaMapMarkerAlt /> Delivery Address
                    </h3>

                    {isEditingAddress ? (
                        <div className="edit-address-form">
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter your full delivery address..."
                                className="address-textarea"
                            />
                            <div className="address-actions">
                                <button className="action-btn" onClick={handleSaveAddress}>Save Address</button>
                                <button className="nav-btn cancel-btn" onClick={() => setIsEditingAddress(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="address-display">
                            <p className="address-text">
                                {address || 'No address saved yet.'}
                            </p>
                            <button
                                onClick={() => setIsEditingAddress(true)}
                                className="edit-address-btn"
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>

                <div className="profile-actions-grid">
                    <div className="profile-action-item icon-hover-card" onClick={() => setView('my-orders')}>
                        <div className="action-item-content">
                            <FaListAlt className="action-icon" />
                            <div>
                                <h4 className="action-title">My Orders</h4>
                                <p className="action-desc">View past orders</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-action-item icon-hover-card" onClick={() => setActiveModal('refer')}>
                        <div className="action-item-content">
                            <FaGift className="action-icon" />
                            <div>
                                <h4 className="action-title">Refer & Earn</h4>
                                <p className="action-desc">Invite friends and earn ₹50</p>
                            </div>
                        </div>
                        <span className="referral-tag">code: SAI100</span>
                    </div>

                    <div className="profile-action-item icon-hover-card" onClick={() => setActiveModal('wallet')}>
                        <div className="action-item-content">
                            <FaWallet className="action-icon" />
                            <div>
                                <h4 className="action-title">Wallet</h4>
                                <p className="action-desc">Balance: ₹{user.walletBalance || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-action-item icon-hover-card" onClick={() => setActiveModal('wallet')}>
                        <div className="action-item-content">
                            <FaListAlt className="action-icon" />
                            <div>
                                <h4 className="action-title">History</h4>
                                <p className="action-desc">View Transactions</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-action-item icon-hover-card" onClick={() => setActiveModal('help')}>
                        <div className="action-item-content">
                            <FaQuestionCircle className="action-icon" />
                            <div>
                                <h4 className="action-title">Help & Support</h4>
                                <p className="action-desc">FAQs and Contact</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-action-item icon-hover-card" onClick={() => setView('delivery-partner')}>
                        <div className="action-item-content">
                            <FaMotorcycle className="action-icon" />
                            <div>
                                <h4 className="action-title">Drive with Us</h4>
                                <p className="action-desc">Delivery Partner App</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="logout-btn"
                >
                    <FaSignOutAlt /> Log Out
                </button>
            </div>
        </div>
    );
};

export default Profile;
