import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaMapMarkerAlt, FaSignOutAlt, FaGift, FaWallet, FaQuestionCircle, FaListAlt } from 'react-icons/fa';

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
            <div style={{ maxWidth: '600px', margin: '2rem auto', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', background: '#f1f2f6', borderRadius: '50%',
                        margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', color: '#2f3542'
                    }}>
                        <FaUser />
                    </div>
                    <h2 style={{ margin: 0 }}>{user.username}</h2>
                    <p style={{ color: '#777', marginTop: '0.5rem' }}>{user.phone || 'No phone number'}</p>
                </div>

                <div className="profile-section" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: '#ff4757' }}>
                        <FaMapMarkerAlt /> Delivery Address
                    </h3>

                    {isEditingAddress ? (
                        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter your full delivery address..."
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="action-btn" onClick={handleSaveAddress}>Save Address</button>
                                <button className="nav-btn" onClick={() => setIsEditingAddress(false)} style={{ border: '1px solid #ddd' }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, color: address ? '#333' : '#999' }}>
                                {address || 'No address saved yet.'}
                            </p>
                            <button
                                onClick={() => setIsEditingAddress(true)}
                                style={{ background: 'none', border: 'none', color: '#ff4757', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>

                <div className="profile-actions" style={{ display: 'grid', gap: '1rem' }}>
                    <div className="profile-item icon-hover-card" style={itemStyle} onClick={() => setView('my-orders')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FaListAlt style={{ color: '#ff4757', fontSize: '1.2rem' }} />
                            <div>
                                <h4 style={{ margin: 0 }}>My Orders</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#777' }}>View past orders</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-item icon-hover-card" style={itemStyle} onClick={() => setActiveModal('refer')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FaGift style={{ color: '#ff4757', fontSize: '1.2rem' }} />
                            <div>
                                <h4 style={{ margin: 0 }}>Refer & Earn</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#777' }}>Invite friends and earn ₹50</p>
                            </div>
                        </div>
                        <span style={{ fontWeight: 'bold', color: '#2ed573' }}>code: SAI100</span>
                    </div>

                    <div className="profile-item icon-hover-card" style={itemStyle} onClick={() => setActiveModal('wallet')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FaWallet style={{ color: '#ff4757', fontSize: '1.2rem' }} />
                            <div>
                                <h4 style={{ margin: 0 }}>Wallet</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#777' }}>Balance: ₹{user.walletBalance || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-item icon-hover-card" style={itemStyle} onClick={() => setActiveModal('wallet')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FaListAlt style={{ color: '#ff4757', fontSize: '1.2rem' }} />
                            <div>
                                <h4 style={{ margin: 0 }}>History</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#777' }}>View Transactions</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-item icon-hover-card" style={itemStyle} onClick={() => setActiveModal('help')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <FaQuestionCircle style={{ color: '#ff4757', fontSize: '1.2rem' }} />
                            <div>
                                <h4 style={{ margin: 0 }}>Help & Support</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#777' }}>FAQs and Contact</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%', marginTop: '3rem', padding: '1rem',
                        background: '#f1f2f6', color: '#2f3542', border: 'none',
                        borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}
                >
                    <FaSignOutAlt /> Log Out
                </button>
            </div>
        </div>
    );
};

const itemStyle = {
    padding: '1rem',
    background: '#fff',
    border: '1px solid #f1f2f6',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: '0.2s'
};

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto'
};

const modalContentStyle = {
    background: 'white', width: '90%', maxWidth: '400px',
    padding: '2rem', borderRadius: '16px', position: 'relative'
};

const closeBtnStyle = {
    position: 'absolute', top: '10px', right: '15px',
    background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
};

const codeBoxStyle = {
    background: '#f1f2f6', padding: '1rem', borderRadius: '8px',
    fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '2px',
    cursor: 'pointer', margin: '1rem 0', border: '2px dashed #ccc'
};

const balanceCardStyle = {
    background: 'linear-gradient(135deg, #2f3542 0%, #57606f 100%)',
    color: 'white', padding: '1.5rem', borderRadius: '16px',
    marginBottom: '1.5rem', textAlign: 'center'
};

const transactionStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.8rem', borderBottom: '1px solid #f1f2f6'
};

export default Profile;
