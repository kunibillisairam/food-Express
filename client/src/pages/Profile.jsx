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
                            <button className="nav-btn w-full mt-4" onClick={() => setView('my-orders')}>View My Orders</button>
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

                <div className="profile-items-list">
                    <div className="profile-action-item" onClick={() => setView('my-orders')}>
                        <div className="action-item-content">
                            <FaListAlt className="action-icon" />
                            <div className="action-text">
                                <h4 className="action-title">My Orders</h4>
                                <p className="action-desc">Track and view past orders</p>
                            </div>
                        </div>
                        <span className="arrow-icon">›</span>
                    </div>

                    <div className="profile-action-item" onClick={() => setActiveModal('refer')}>
                        <div className="action-item-content">
                            <FaGift className="action-icon" />
                            <div className="action-text">
                                <h4 className="action-title">Refer & Earn</h4>
                                <p className="action-desc">Invite friends and earn ₹50</p>
                            </div>
                        </div>
                        <span className="referral-tag">code: SAI100</span>
                    </div>

                    <div className="profile-action-item" onClick={() => setActiveModal('wallet')}>
                        <div className="action-item-content">
                            <FaWallet className="action-icon" />
                            <div className="action-text">
                                <h4 className="action-title">Wallet Balance</h4>
                                <p className="action-desc">Available: ₹{user.walletBalance || 0}</p>
                            </div>
                        </div>
                        <span className="arrow-icon">›</span>
                    </div>

                    <div className="profile-action-item" onClick={() => setActiveModal('history')}>
                        <div className="action-item-content">
                            <FaListAlt className="action-icon" />
                            <div className="action-text">
                                <h4 className="action-title">Transactions</h4>
                                <p className="action-desc">View credit/debit history</p>
                            </div>
                        </div>
                        <span className="arrow-icon">›</span>
                    </div>

                    <div className="profile-action-item" onClick={() => setActiveModal('help')}>
                        <div className="action-item-content">
                            <FaQuestionCircle className="action-icon" />
                            <div className="action-text">
                                <h4 className="action-title">Help & Support</h4>
                                <p className="action-desc">Contact us & FAQs</p>
                            </div>
                        </div>
                        <span className="arrow-icon">›</span>
                    </div>

                    <div className="profile-action-item" onClick={() => setView('delivery-partner')}>
                        <div className="action-item-content">
                            <FaMotorcycle className="action-icon" />
                            <div className="action-text">
                                <h4 className="action-title">Delivery Partner</h4>
                                <p className="action-desc">Earn money by delivery</p>
                            </div>
                        </div>
                        <span className="arrow-icon">›</span>
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
