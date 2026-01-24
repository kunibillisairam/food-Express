import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaMapMarkerAlt, FaSignOutAlt, FaGift, FaWallet, FaQuestionCircle, FaListAlt, FaMotorcycle, FaCreditCard, FaMobileAlt, FaUniversity, FaArrowLeft, FaCheckCircle, FaLocationArrow } from 'react-icons/fa';
import axios from 'axios';
import API_BASE_URL from '../config';

const Profile = ({ setView }) => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const [address, setAddress] = useState(user?.address || '');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [orders, setOrders] = useState([]);
    const [walletStep, setWalletStep] = useState('view'); // 'view', 'amount', 'methods', 'card_details', 'upi_details', 'netbanking_details', 'netbanking_login', 'netbanking_otp', 'success'
    const [addAmount, setAddAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('');
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [upiId, setUpiId] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [nbUserId, setNbUserId] = useState('');
    const [nbPassword, setNbPassword] = useState('');
    const [nbOtp, setNbOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');
    const [hasPaidMock, setHasPaidMock] = useState(false); // To simulate actual payment
    const [isLocating, setIsLocating] = useState(false);
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    // Device detection
    useEffect(() => {
        const checkDevice = () => {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                setIsMobileDevice(true);
            } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
                setIsMobileDevice(true);
            } else {
                setIsMobileDevice(false);
            }
        };
        checkDevice();
    }, []);

    // Timer logic for UPI QR
    useEffect(() => {
        let timer;
        if (walletStep === 'upi_details' && !isMobileDevice && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            alert('Payment session expired. Please try again.');
            setWalletStep('methods');
            setTimeLeft(300);
        }
        return () => clearInterval(timer);
    }, [walletStep, isMobileDevice, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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

    // Reset wallet state when modal closes
    useEffect(() => {
        if (!activeModal) {
            setWalletStep('view');
            setAddAmount('');
            setSelectedMethod('');
            setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
            setUpiId('');
            setSelectedBank('');
            setNbUserId('');
            setNbPassword('');
            setNbOtp('');
            setTimeLeft(300);
            setIsVerifying(false);
            setVerificationError('');
            setHasPaidMock(false);
        }
    }, [activeModal]);

    // Save address handler
    const handleSaveAddress = () => {
        updateUser({ address });
        setIsEditingAddress(false);
    };

    const handleLogout = () => {
        logout();
        setView('login');
    };

    const handleAddMoney = () => {
        const amount = parseFloat(addAmount);
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        let details = selectedMethod.name;
        if (selectedMethod.id === 'card') details += ` (${cardDetails.number.slice(-4)})`;
        if (selectedMethod.id === 'upi') details += ` (${upiId || 'Direct'})`;
        if (selectedMethod.id === 'netbanking') details += ` (${selectedBank})`;

        const currentBalance = user.walletBalance || 0;
        const newTransaction = {
            type: 'Credit',
            amount: amount,
            description: `Wallet Top-up (${details})`,
            date: new Date()
        };

        const currentTransactions = user.transactions || [];

        updateUser({
            walletBalance: currentBalance + amount,
            transactions: [newTransaction, ...currentTransactions]
        });

        setWalletStep('success');
        setTimeout(() => {
            setWalletStep('view');
            setActiveModal(null);
            setAddAmount('');
            setSelectedMethod('');
            setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
            setUpiId('');
            setSelectedBank('');
            setNbUserId('');
            setNbPassword('');
            setNbOtp('');
        }, 2000);
    };

    const handleUseLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data.display_name) {
                        setAddress(data.display_name);
                        setIsEditingAddress(true);
                    } else {
                        alert('Could not fetch address for this location.');
                    }
                } catch (error) {
                    console.error('Error fetching address:', error);
                    alert('Error fetching address. Please try again.');
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Error getting your location. Please check your permissions.');
                setIsLocating(false);
            }
        );
    };

    const handleVerifyUPIPayment = () => {
        setIsVerifying(true);
        setVerificationError('');

        // Finalize detection delay
        setTimeout(() => {
            setIsVerifying(false);

            // STRICT SIMULATION: 
            // In this demo, we check if the user "simulated" a payment via our mock button.
            // In production, this would be a secure API call to your payment gateway.
            if (hasPaidMock) {
                handleAddMoney();
            } else {
                setVerificationError('Amount not paid. Please scan the QR code and complete the payment on your mobile first.');
            }
        }, 4000);
    };

    const paymentMethods = [
        { id: 'upi', name: 'UPI Payments', icon: <FaMobileAlt />, color: '#6c5ce7' },
        { id: 'card', name: 'Cards (Debit/Credit)', icon: <FaCreditCard />, color: '#0984e3' },
        { id: 'netbanking', name: 'Net Banking', icon: <FaUniversity />, color: '#e17055' },
    ];

    const copyReferral = () => {
        navigator.clipboard.writeText('SAI100');
        alert('Referral code copied!');
    };

    const handleCardPayment = (e) => {
        e.preventDefault();
        // Validation would go here
        handleAddMoney();
    };

    const handleUPIPayment = () => {
        if (isMobileDevice) {
            // Simulated UPI app redirect
            const upiLink = `upi://pay?pa=${upiId || 'merchant@upi'}&pn=FoodExpress&am=${addAmount}&cu=INR`;
            window.location.href = upiLink;
        }
        handleAddMoney();
    };

    const popularBanks = [
        { name: 'State Bank of India', code: 'SBI', icon: '🏦' },
        { name: 'HDFC Bank', code: 'HDFC', icon: '🏢' },
        { name: 'ICICI Bank', code: 'ICICI', icon: '🏛️' },
        { name: 'Axis Bank', code: 'AXIS', icon: '🏢' },
        { name: 'Kotak Mahindra', code: 'KOTAK', icon: '🏛️' },
        { name: 'Punjab National Bank', code: 'PNB', icon: '🏦' },
    ];

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
                        <div className="modal-body" style={{ padding: '0 5px' }}>
                            {walletStep === 'view' && (
                                <div className="fade-in">
                                    <div className="modal-header-flex" style={{ marginBottom: '20px' }}>
                                        <h2>My Wallet</h2>
                                        <FaWallet style={{ color: '#6c5ce7', fontSize: '1.5rem' }} />
                                    </div>
                                    <div className="wallet-gradient-card" style={{ textAlign: 'left', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>Wallet Balance</div>
                                                <div style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '5px' }}>₹{user.walletBalance || 0}</div>
                                            </div>
                                            <FaWallet style={{ fontSize: '1.8rem', opacity: 0.5 }} />
                                        </div>
                                        <div style={{ marginTop: 'auto' }}>
                                            <div style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.8 }}>**** **** **** {user.phone.slice(-4)}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>{user.username}</div>
                                                <div style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>PLATINUM</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="action-btn w-full mb-8" onClick={() => setWalletStep('amount')} style={{ background: '#6c5ce7', marginTop: '1.5rem', boxShadow: '0 10px 20px rgba(108, 92, 231, 0.2)' }}>+ Add Money</button>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <h3 style={{ margin: 0 }}>Transaction History</h3>
                                        <div className="txn-badge-credit" style={{ fontSize: '0.7rem' }}>LATEST LOGS</div>
                                    </div>
                                    <div className="transaction-history-list">
                                        {(user.transactions && user.transactions.length > 0) ? (
                                            user.transactions.map((txn, idx) => (
                                                <div key={idx} className="transaction-item" style={{ borderLeft: `4px solid ${txn.type === 'Debit' ? '#ff4757' : '#2ed573'}`, paddingLeft: '15px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="txn-desc" style={{ fontWeight: '600' }}>{txn.description}</div>
                                                        <div className="txn-date" style={{ color: '#aaa', fontSize: '0.8rem' }}>{new Date(txn.date).toLocaleString()}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div className={`txn-amount ${txn.type === 'Debit' ? 'color-error' : 'color-success'}`} style={{ fontWeight: '800' }}>
                                                            {txn.type === 'Debit' ? '-' : '+'} ₹{txn.amount}
                                                        </div>
                                                        <span className={txn.type === 'Debit' ? 'txn-badge-debit' : 'txn-badge-credit'} style={{ fontSize: '0.6rem' }}>
                                                            {txn.type === 'Debit' ? 'DEBIT' : 'CREDIT'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-transactions">No transactions yet.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {walletStep === 'amount' && (
                                <div className="fade-in">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                        <div
                                            onClick={() => setWalletStep('view')}
                                            style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#f1f2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <FaArrowLeft style={{ fontSize: '0.9rem' }} />
                                        </div>
                                        <h2 style={{ margin: 0 }}>Add Money</h2>
                                    </div>

                                    <div className="wallet-gradient-card" style={{ padding: '40px 20px' }}>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '10px' }}>Enter Recharge Amount</div>
                                        <div className="premium-input-container">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>₹</span>
                                                <input
                                                    type="number"
                                                    value={addAmount}
                                                    onChange={(e) => setAddAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        fontSize: '2.5rem',
                                                        fontWeight: 'bold',
                                                        width: '180px',
                                                        textAlign: 'center',
                                                        outline: 'none',
                                                        color: 'white'
                                                    }}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '20px' }}>
                                        {[100, 200, 500].map(amt => (
                                            <button
                                                key={amt}
                                                className={`amount-chip ${addAmount === amt.toString() ? 'selected' : ''}`}
                                                onClick={() => setAddAmount(amt.toString())}
                                            >
                                                + ₹{amt}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        className="action-btn w-full mt-10"
                                        disabled={!addAmount || parseFloat(addAmount) <= 0}
                                        onClick={() => setWalletStep('methods')}
                                        style={{
                                            background: '#6c5ce7',
                                            opacity: (!addAmount || parseFloat(addAmount) <= 0) ? 0.6 : 1,
                                        }}
                                    >
                                        Proceed to Pay
                                    </button>
                                </div>
                            )}

                            {walletStep === 'methods' && (
                                <div className="fade-in">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                        <div
                                            onClick={() => setWalletStep('amount')}
                                            style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#f1f2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <FaArrowLeft style={{ fontSize: '0.9rem' }} />
                                        </div>
                                        <h2 style={{ margin: 0 }}>Payment Mode</h2>
                                    </div>

                                    <div style={{ background: '#f8f9fc', padding: '15px', borderRadius: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#666' }}>Amount to add:</span>
                                        <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#6c5ce7' }}>₹{addAmount}</span>
                                    </div>

                                    <div className="payment-method-grid">
                                        {paymentMethods.map(method => (
                                            <div
                                                key={method.id}
                                                className={`method-card-v2 ${selectedMethod?.id === method.id ? 'active' : ''}`}
                                                onClick={() => setSelectedMethod(method)}
                                            >
                                                <div className="method-icon-box" style={{ background: method.color, color: 'white' }}>
                                                    {method.icon}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{method.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#999' }}>Fast & Secure Payment</div>
                                                </div>
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    border: `2px solid ${selectedMethod?.id === method.id ? '#6c5ce7' : '#ddd'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {selectedMethod?.id === method.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6c5ce7' }} />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        className="action-btn w-full mt-10"
                                        disabled={!selectedMethod}
                                        onClick={() => {
                                            if (selectedMethod.id === 'card') setWalletStep('card_details');
                                            else if (selectedMethod.id === 'upi') setWalletStep('upi_details');
                                            else if (selectedMethod.id === 'netbanking') setWalletStep('netbanking_details');
                                            else handleAddMoney();
                                        }}
                                        style={{
                                            background: '#6c5ce7',
                                            opacity: !selectedMethod ? 0.6 : 1,
                                            marginTop: '20px',
                                        }}
                                    >
                                        Proceed with {selectedMethod?.name || 'Payment'}
                                    </button>
                                </div>
                            )}

                            {walletStep === 'card_details' && (
                                <div className="fade-in">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                        <div
                                            onClick={() => setWalletStep('methods')}
                                            style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#f1f2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <FaArrowLeft style={{ fontSize: '0.9rem' }} />
                                        </div>
                                        <h2 style={{ margin: 0 }}>Card Details</h2>
                                    </div>

                                    <form onSubmit={handleCardPayment} className="card-form-container">
                                        <div className="card-viz">
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>CREDIT CARD</div>
                                            <div style={{ fontSize: '1.4rem', letterSpacing: '4px', margin: '20px 0' }}>
                                                {cardDetails.number.padEnd(16, '•').replace(/(.{4})/g, '$1 ')}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>CARD HOLDER</div>
                                                    <div style={{ fontSize: '0.9rem' }}>{cardDetails.name || 'YOUR NAME'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>EXPIRES</div>
                                                    <div style={{ fontSize: '0.9rem' }}>{cardDetails.expiry || 'MM/YY'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="input-group">
                                            <label>Card Number</label>
                                            <input
                                                type="text"
                                                maxLength="16"
                                                placeholder="0000 0000 0000 0000"
                                                value={cardDetails.number}
                                                onChange={e => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, '') })}
                                                required
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Card Holder Name</label>
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                value={cardDetails.name}
                                                onChange={e => setCardDetails({ ...cardDetails, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="input-group">
                                                <label>Expiry Date</label>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    maxLength="5"
                                                    value={cardDetails.expiry}
                                                    onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>CVV</label>
                                                <input
                                                    type="password"
                                                    placeholder="•••"
                                                    maxLength="3"
                                                    value={cardDetails.cvv}
                                                    onChange={e => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <button className="action-btn w-full mt-6" type="submit" style={{ background: '#0984e3' }}>
                                            Pay ₹{addAmount}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {walletStep === 'upi_details' && (
                                <div className="fade-in">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                        <div
                                            onClick={() => setWalletStep('methods')}
                                            style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#f1f2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <FaArrowLeft style={{ fontSize: '0.9rem' }} />
                                        </div>
                                        <h2 style={{ margin: 0 }}>UPI Payment</h2>
                                    </div>

                                    {!isMobileDevice ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <p style={{ marginBottom: '20px', color: '#666' }}>Scan this QR code using any UPI App</p>
                                            <div style={{
                                                background: 'white',
                                                padding: '20px',
                                                borderRadius: '20px',
                                                display: 'inline-block',
                                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                                marginBottom: '20px'
                                            }}>
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=foodexpress@upi&pn=FoodExpress&am=${addAmount}&cu=INR`)}`}
                                                    alt="UPI QR Code"
                                                    style={{ width: '200px', height: '200px' }}
                                                />
                                            </div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#6c5ce7' }}>₹{addAmount}</div>

                                            <div style={{ marginTop: '20px', background: '#fff9f9', padding: '15px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Time Remaining</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444' }}>{formatTime(timeLeft)}</div>
                                            </div>

                                            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '15px' }}>Waiting for payment confirmation...</p>

                                            <button
                                                className="action-btn w-full mt-6"
                                                disabled={isVerifying}
                                                onClick={handleVerifyUPIPayment}
                                                style={{ background: isVerifying ? '#95a5a6' : '#6c5ce7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                            >
                                                {isVerifying ? (
                                                    <>
                                                        <div className="spinner-mini"></div>
                                                        Verifying Payment...
                                                    </>
                                                ) : (
                                                    'Complete Transaction'
                                                )}
                                            </button>

                                            {verificationError && (
                                                <div className="fade-in" style={{ marginTop: '15px', padding: '12px', borderRadius: '10px', background: '#fff5f5', color: '#e74c3c', fontSize: '0.85rem', border: '1px solid #fab1a0', textAlign: 'left', lineHeight: '1.4' }}>
                                                    <strong>Payment Not Detected:</strong> {verificationError}
                                                </div>
                                            )}

                                            {!hasPaidMock && !isVerifying && (
                                                <div
                                                    onClick={() => {
                                                        setHasPaidMock(true);
                                                        setVerificationError('');
                                                        alert('Payment Simulated! Now you can click Complete Transaction.');
                                                    }}
                                                    style={{ marginTop: '20px', fontSize: '0.7rem', color: '#6c5ce7', cursor: 'pointer', textDecoration: 'underline', opacity: 0.6 }}
                                                >
                                                    (Demo: Click here to simulate payment via mobile)
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <div className="input-group" style={{ textAlign: 'left' }}>
                                                <label>Enter UPI ID (Optional)</label>
                                                <input
                                                    type="text"
                                                    placeholder="username@upi"
                                                    value={upiId}
                                                    onChange={e => setUpiId(e.target.value)}
                                                    style={{ marginBottom: '20px' }}
                                                />
                                            </div>
                                            <div className="upi-apps-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
                                                {/* Placeholder for UPI app icons */}
                                                <div style={{ width: '50px', height: '50px', background: '#f1f2f6', borderRadius: '12px' }}></div>
                                                <div style={{ width: '50px', height: '50px', background: '#f1f2f6', borderRadius: '12px' }}></div>
                                                <div style={{ width: '50px', height: '50px', background: '#f1f2f6', borderRadius: '12px' }}></div>
                                            </div>
                                            <button className="action-btn w-full" onClick={handleUPIPayment} style={{ background: '#6c5ce7' }}>
                                                Pay via Installed App
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {walletStep === 'netbanking_details' && (
                                <div className="fade-in">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                        <div
                                            onClick={() => setWalletStep('methods')}
                                            style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#f1f2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <FaArrowLeft style={{ fontSize: '0.9rem' }} />
                                        </div>
                                        <h2 style={{ margin: 0 }}>Net Banking</h2>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <p style={{ fontWeight: '600', color: '#666', marginBottom: '15px' }}>Popular Banks</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            {popularBanks.map(bank => (
                                                <div
                                                    key={bank.code}
                                                    onClick={() => setSelectedBank(bank.code)}
                                                    style={{
                                                        padding: '15px',
                                                        borderRadius: '12px',
                                                        border: `2px solid ${selectedBank === bank.code ? '#e17055' : '#f1f2f6'}`,
                                                        background: selectedBank === bank.code ? '#fff9f7' : 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        transition: 'all 0.3s'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '1.2rem' }}>{bank.icon}</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{bank.code}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label>All Other Banks</label>
                                        <select
                                            value={selectedBank}
                                            onChange={(e) => setSelectedBank(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '2px solid #f1f2f6',
                                                background: '#f8f9fc',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="">Select your bank</option>
                                            <option value="IDBI">IDBI Bank</option>
                                            <option value="BOB">Bank of Baroda</option>
                                            <option value="CANARA">Canara Bank</option>
                                            <option value="FED">Federal Bank</option>
                                        </select>
                                    </div>

                                    <button
                                        className="action-btn w-full mt-8"
                                        disabled={!selectedBank}
                                        onClick={() => setWalletStep('netbanking_login')}
                                        style={{ background: '#e17055', opacity: !selectedBank ? 0.6 : 1 }}
                                    >
                                        Proceed to Net Banking
                                    </button>
                                </div>
                            )}

                            {walletStep === 'netbanking_login' && (
                                <div className="fade-in">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                        <div
                                            onClick={() => setWalletStep('netbanking_details')}
                                            style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#f1f2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <FaArrowLeft style={{ fontSize: '0.9rem' }} />
                                        </div>
                                        <h2 style={{ margin: 0 }}>Secure Login</h2>
                                    </div>

                                    <div className="bank-login-banner" style={{ background: '#fef5f0', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #e17055', marginBottom: '25px' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#e17055' }}>{selectedBank} Net Banking</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Please enter your credentials to authenticate</div>
                                    </div>

                                    <div className="input-group">
                                        <label>User ID / Customer ID</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your ID"
                                            value={nbUserId}
                                            onChange={e => setNbUserId(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Login Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={nbPassword}
                                            onChange={e => setNbPassword(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        className="action-btn w-full mt-6"
                                        disabled={!nbUserId || !nbPassword}
                                        onClick={() => setWalletStep('netbanking_otp')}
                                        style={{ background: '#e17055', opacity: (!nbUserId || !nbPassword) ? 0.6 : 1 }}
                                    >
                                        Verify Credentials
                                    </button>
                                </div>
                            )}

                            {walletStep === 'netbanking_otp' && (
                                <div className="fade-in">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                        <div
                                            onClick={() => setWalletStep('netbanking_login')}
                                            style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#f1f2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <FaArrowLeft style={{ fontSize: '0.9rem' }} />
                                        </div>
                                        <h2 style={{ margin: 0 }}>OTP Verification</h2>
                                    </div>

                                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                        <p style={{ color: '#666' }}>A 6-digit OTP has been sent to your registered mobile number linked with <b>{selectedBank}</b>.</p>

                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '30px 0' }}>
                                            <input
                                                type="text"
                                                maxLength="6"
                                                placeholder="0 0 0 0 0 0"
                                                value={nbOtp}
                                                onChange={e => setNbOtp(e.target.value.replace(/\D/g, ''))}
                                                style={{
                                                    width: '200px',
                                                    fontSize: '2rem',
                                                    textAlign: 'center',
                                                    letterSpacing: '8px',
                                                    border: 'none',
                                                    borderBottom: '2px solid #e17055',
                                                    background: 'transparent',
                                                    outline: 'none',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </div>

                                        <p style={{ fontSize: '0.85rem', color: '#999' }}>Didn't receive code? <span style={{ color: '#e17055', cursor: 'pointer', fontWeight: 'bold' }}>Resend</span></p>

                                        <button
                                            className="action-btn w-full mt-10"
                                            disabled={nbOtp.length !== 6}
                                            onClick={handleAddMoney}
                                            style={{ background: '#2ed573', border: 'none', boxShadow: '0 10px 20px rgba(46, 213, 115, 0.2)', opacity: nbOtp.length !== 6 ? 0.6 : 1 }}
                                        >
                                            Confirm & Pay ₹{addAmount}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {walletStep === 'success' && (
                                <div className="modal-body-centered recharge-success-ani" style={{ padding: '60px 0' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: '#2ed573',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '4rem',
                                        margin: '0 auto 25px',
                                        boxShadow: '0 10px 30px rgba(46, 213, 115, 0.4)'
                                    }}>
                                        <FaCheckCircle />
                                    </div>
                                    <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Recharge Successful!</h2>
                                    <p style={{ color: '#666', fontSize: '1.1rem' }}>₹{addAmount} has been credited to your wallet.</p>
                                    <div style={{ marginTop: '20px', fontStyle: 'italic', color: '#888' }}>Redirecting to balance...</div>
                                </div>
                            )}
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
            </div >
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
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={handleSaveAddress} style={{ flex: 1, background: '#ff4757', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '800' }}>Save</button>
                                    <button onClick={() => setIsEditingAddress(false)} style={{ flex: 1, background: '#eee', color: '#333', padding: '10px', borderRadius: '8px', border: 'none' }}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <p style={{ margin: 0, color: '#444' }}>{address || 'No address added yet.'}</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setIsEditingAddress(true)}
                                        style={{ flex: 1, color: '#ff4757', border: '1px solid #ff4757', background: 'transparent', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleUseLocation}
                                        disabled={isLocating}
                                        style={{ flex: 1, color: 'white', background: '#2ed573', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', opacity: isLocating ? 0.7 : 1 }}
                                    >
                                        {isLocating ? <div className="spinner-mini" style={{ width: '15px', height: '15px' }}></div> : <FaLocationArrow style={{ fontSize: '0.8rem' }} />}
                                        {isLocating ? 'Locating...' : 'Use Location'}
                                    </button>
                                </div>
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
