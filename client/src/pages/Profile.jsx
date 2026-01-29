import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaMapMarkerAlt, FaSignOutAlt, FaGift, FaWallet, FaQuestionCircle, FaListAlt, FaMotorcycle, FaCreditCard, FaMobileAlt, FaUniversity, FaArrowLeft, FaCheckCircle, FaLocationArrow, FaRocket, FaStar, FaAward } from 'react-icons/fa';
import axios from 'axios';
import API_BASE_URL from '../config';
import { requestForToken } from '../firebase';

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
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'wallet', 'orders', 'address', 'help'
    const [upiError, setUpiError] = useState('');
    const [isPaymentPending, setIsPaymentPending] = useState(false);
    const [paymentReturnedFromApp, setPaymentReturnedFromApp] = useState(false);

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
            setUpiError('');
            setIsPaymentPending(false);
            setPaymentReturnedFromApp(false);
        }
    }, [activeModal]);

    // Save address handler
    const handleSaveAddress = () => {
        updateUser({ address });
        setIsEditingAddress(false);
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            logout();
            setView('login');
        }
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

    // Validate UPI ID format
    const validateUPIId = (upiIdStr) => {
        // UPI ID format: username@provider (e.g., user@paytm, 9876543210@ybl, etc.)
        const upiRegex = /^[\w\.\-]{3,}@[a-zA-Z]{2,}$/;
        return upiRegex.test(upiIdStr);
    };

    const handleUPIPayment = () => {
        // Validate UPI ID if provided
        if (upiId && !validateUPIId(upiId)) {
            setUpiError('Invalid UPI ID format. Please enter a valid UPI ID (e.g., username@paytm)');
            return;
        }

        setUpiError('');

        if (isMobileDevice) {
            // Set payment pending status
            setIsPaymentPending(true);

            // Construct UPI deep link
            const merchantUpi = upiId || 'foodexpress@upi';
            const upiLink = `upi://pay?pa=${merchantUpi}&pn=FoodExpress&am=${addAmount}&cu=INR&tn=Wallet Recharge`;

            console.log('Redirecting to UPI app:', upiLink);

            // Try to open UPI app
            window.location.href = upiLink;

            // Set a timeout to check if user returned from the app
            setTimeout(() => {
                setPaymentReturnedFromApp(true);
            }, 3000); // Wait 3 seconds for app to open
        } else {
            // For desktop, proceed to QR code flow (already handled in UI)
            setUpiError('');
        }
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
                            <div className="referral-code-box" onClick={() => navigator.clipboard.writeText(user.referralCode)}>
                                {user.referralCode || "LOADING..."} <span className="tap-to-copy">(Tap to copy)</span>
                            </div>
                            <button className="action-btn" onClick={() => { navigator.clipboard.writeText(user.referralCode); alert("Copied!"); }} style={{ marginTop: '1rem' }}>Share Now</button>
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

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div className="profile-dashboard-container">
                    {/* LEFT PANEL: Side UI */}
                    {/* SIDEBAR REMOVED AS PER REQUEST */}

                    {/* RIGHT PANEL: Main Content */}
                    <div className="profile-main-content px-4">
                        {/* Navigation Tabs */}
                        <div className="profile-tabs" style={{ display: 'flex', overflowX: 'auto', gap: '15px', padding: '10px 0', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
                            {['profile', 'wallet', 'rewards', 'orders', 'address', 'help'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`profile-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    style={{
                                        padding: '10px 20px',
                                        background: activeTab === tab ? '#ff4757' : 'transparent',
                                        color: activeTab === tab ? 'white' : '#666',
                                        border: 'none',
                                        borderRadius: '25px',
                                        fontWeight: '600',
                                        textTransform: 'capitalize',
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {tab === 'rewards' ? '🏆 Rewards' : tab}
                                </button>
                            ))}
                        </div>

                        {/* REWARDS TAB */}
                        {activeTab === 'rewards' && (
                            <div className="rewards-section fade-in">
                                <div className="rewards-card" style={{ background: 'linear-gradient(135deg, #FF9966, #FF5E62)', borderRadius: '20px', padding: '2rem', color: 'white', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(255, 94, 98, 0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ margin: 0, opacity: 0.9 }}>Available XP</h3>
                                            <h1 style={{ margin: '0.5rem 0', fontSize: '3rem' }}>{user.xp || 0} <span style={{ fontSize: '1rem', opacity: 0.8 }}>XP</span></h1>
                                            <div className="rank-badge" style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold' }}>
                                                🎖️ {user.rank || 'Cadet'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <FaAward style={{ fontSize: '4rem', opacity: 0.8 }} />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '2rem' }}>
                                        <p style={{ marginBottom: '10px', fontSize: '0.9rem' }}>Progress to Next Rank</p>
                                        <div style={{ height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: '70%', background: 'white', borderRadius: '4px' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.8rem', opacity: 0.8 }}>
                                            <span>Current</span>
                                            <span>Next: Admiral</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="redeem-section" style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                                    <h3>💎 Redeem Points</h3>
                                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>Convert your hard-earned XP into Wallet Balance. 10 XP = ₹1.</p>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm(`Redeem 100 XP for ₹10?`)) {
                                                    try {
                                                        const res = await axios.post(`${API_BASE_URL}/api/users/redeem-xp`, { username: user.username, xpAmount: 100 });
                                                        alert(res.data.message);
                                                        window.location.reload(); // Simple reload to refresh data
                                                    } catch (err) {
                                                        alert(err.response?.data?.message || "Failed to redeem");
                                                    }
                                                }
                                            }}
                                            style={{ flex: 1, padding: '1rem', border: '2px solid #ff4757', color: '#ff4757', background: 'transparent', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Redeem 100 XP
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm(`Redeem ALL ${user.xp} XP for ₹${Math.floor(user.xp / 10)}?`)) {
                                                    try {
                                                        const res = await axios.post(`${API_BASE_URL}/api/users/redeem-xp`, { username: user.username, xpAmount: user.xp });
                                                        alert(res.data.message);
                                                        window.location.reload();
                                                    } catch (err) {
                                                        alert(err.response?.data?.message || "Failed to redeem");
                                                    }
                                                }
                                            }}
                                            style={{ flex: 1, padding: '1rem', background: '#ff4757', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Redeem All
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EXISTING PROFILE CONTENT (Hidden if not active) */}
                        {activeTab === 'profile' && (
                            <>
                                {/* MOBILE VIEW */}
                                <div className="fade-in mobile-profile-section mobile-only">
                                    <div className="mobile-user-header">
                                        <div className="mobile-avatar">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#2d3436' }}>
                                                {user.username}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#636e72' }}>
                                                {user.email || user.phone}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mobile-quick-grid">
                                        <div className="mobile-quick-card" onClick={() => setView('my-orders')}>
                                            <FaMotorcycle size={24} color="#2d3436" />
                                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#2d3436' }}>Your Orders</div>
                                        </div>
                                        <div className="mobile-quick-card" onClick={() => setActiveTab('help')}>
                                            <FaQuestionCircle size={24} color="#2d3436" />
                                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#2d3436' }}>Help & Support</div>
                                        </div>
                                        <div className="mobile-quick-card" onClick={() => setActiveTab('orders')}>
                                            <FaListAlt size={24} color="#2d3436" />
                                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#2d3436' }}>Order Logs</div>
                                        </div>
                                    </div>

                                    <div className="mobile-wallet-banner">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ background: 'white', padding: '8px', borderRadius: '10px' }}>
                                                    <FaWallet color="#9333ea" size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#4c1d95' }}>FoodExpress Cash</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#6b21a8' }}>Seamless Checkout</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b21a8' }}>Available Balance</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4c1d95' }}>₹{user.walletBalance || 0}</div>
                                            </div>
                                            <button
                                                onClick={() => setActiveModal('wallet')}
                                                style={{ background: '#9333ea', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem' }}
                                            >
                                                Add Balance
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '15px', color: '#2d3436' }}>Your Information</div>
                                    <div className="mobile-menu-list">
                                        <div className="mobile-menu-item" onClick={() => setActiveTab('address')}>
                                            <div className="mobile-menu-icon" style={{ color: '#2d3436' }}><FaMapMarkerAlt /></div>
                                            <div style={{ flex: 1 }}>Saved Addresses</div>
                                            <div style={{ color: '#bbb' }}>&gt;</div>
                                        </div>
                                        <div className="mobile-menu-item" onClick={() => setActiveModal('refer')}>
                                            <div className="mobile-menu-icon" style={{ color: '#2d3436' }}><FaGift /></div>
                                            <div style={{ flex: 1 }}>Refer & Earn</div>
                                            <div style={{ color: '#bbb' }}>&gt;</div>
                                        </div>
                                        <div className="mobile-menu-item" onClick={() => setActiveTab('wallet')}>
                                            <div className="mobile-menu-icon" style={{ color: '#2d3436' }}><FaCreditCard /></div>
                                            <div style={{ flex: 1 }}>Payment Methods</div>
                                            <div style={{ color: '#bbb' }}>&gt;</div>
                                        </div>
                                        <div className="mobile-menu-item" onClick={handleLogout}>
                                            <div className="mobile-menu-icon" style={{ color: '#ff4757' }}><FaSignOutAlt /></div>
                                            <div style={{ flex: 1, color: '#ff4757' }}>Log Out</div>
                                        </div>
                                    </div>

                                    {/* Mobile Notification Debug Helper */}
                                    <div style={{
                                        background: '#fff',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        border: '1px solid #e9ecef',
                                        textAlign: 'center',
                                        marginTop: '20px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                                    }}>
                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#495057' }}>Notification Settings</h3>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    alert("Requesting Permission...");
                                                    const permission = await Notification.requestPermission();
                                                    alert(`Permission Status: ${permission}`);

                                                    if (permission === 'granted') {
                                                        alert("Fetching Token...");
                                                        const token = await requestForToken();
                                                        if (token) {
                                                            alert("✅ Success! Token generated.");
                                                            updateUser({ fcmToken: token });
                                                        } else {
                                                            alert("❌ Failed to generate token. 1. Check internet. 2. If on iOS, Add to Home Screen.");
                                                        }
                                                    }
                                                } catch (e) {
                                                    alert(`Error: ${e.message}`);
                                                }
                                            }}
                                            style={{
                                                background: '#2d3436',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '10px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                width: '100%',
                                                marginBottom: '10px'
                                            }}
                                        >
                                            Force Enable Notifications
                                        </button>

                                        <button
                                            onClick={async () => {
                                                try {
                                                    alert("🚀 Sending Test Notification...");
                                                    const res = await axios.post(`${API_BASE_URL}/api/users/test-notification`, { username: user.username });
                                                    if (res.data.success) {
                                                        alert(`✅ Done! Sent to ${res.data.sent} device(s). Check your status bar!`);
                                                    } else {
                                                        alert(`⚠️ Server received request but no devices found.`);
                                                    }
                                                } catch (e) {
                                                    alert(`❌ Error: ${e.response?.data?.error || e.message}`);
                                                }
                                            }}
                                            style={{
                                                background: '#6c5ce7',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '10px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                width: '100%'
                                            }}
                                        >
                                            🚀 Test Notification
                                        </button>
                                    </div>
                                </div>

                                {/* DESKTOP VIEW */}
                                <div className="fade-in desktop-profile-section desktop-only" style={{ position: 'relative' }}>
                                    {/* Floating Top-Right Badges */}
                                    <div className="floating-badge-group" style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
                                        <div className="rank-badge-glow" style={{
                                            background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
                                            color: '#00f2fe',
                                            padding: '10px 20px',
                                            borderRadius: '25px',
                                            fontSize: '0.95rem',
                                            fontWeight: '700',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            cursor: 'pointer'
                                        }}>
                                            <FaRocket /> {user.rank || 'Cadet'}
                                            <span style={{ fontSize: '0.85rem', opacity: 0.8, marginLeft: '6px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '10px' }}>
                                                {user.xp || 0} XP
                                            </span>
                                        </div>
                                    </div>

                                    {/* Welcome Header */}
                                    <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '10px' }}>
                                        <div style={{
                                            width: '60px', height: '60px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '1.5rem', color: 'white', fontWeight: '800',
                                            boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)', border: '3px solid white'
                                        }}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '800', color: '#2f3542' }}>
                                            Welcome, {user.username}!
                                        </h2>
                                        <p style={{ margin: '4px 0 0', color: '#747d8c', fontSize: '0.75rem' }}>
                                            +91 {user.phone}
                                        </p>
                                    </div>

                                    {/* Dashboard Grid */}
                                    <div className="desktop-dashboard-grid" style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                        gap: '15px',
                                        marginTop: '20px'
                                    }}>
                                        {/* Wallet Card */}
                                        <div onClick={() => setActiveTab('wallet')} style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            padding: '18px',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                            className="desktop-action-card">
                                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
                                            <div style={{ position: 'relative', zIndex: 2 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    <FaWallet style={{ fontSize: '1rem' }} />
                                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>Wallet</h3>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', opacity: 0.9, marginBottom: '6px' }}>Available Balance</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '10px' }}>₹{user.walletBalance || 0}</div>
                                                <button onClick={(e) => { e.stopPropagation(); setActiveModal('wallet'); }}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.2)',
                                                        color: 'white',
                                                        border: '1px solid rgba(255,255,255,0.3)',
                                                        padding: '6px 14px',
                                                        borderRadius: '10px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        backdropFilter: 'blur(10px)',
                                                        fontSize: '0.75rem'
                                                    }}>
                                                    + Add Money
                                                </button>
                                            </div>
                                        </div>

                                        {/* My Orders Card */}
                                        <div onClick={() => setView('my-orders')} style={{
                                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                            color: 'white',
                                            padding: '18px',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            boxShadow: '0 8px 20px rgba(245, 87, 108, 0.3)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                            className="desktop-action-card">
                                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
                                            <div style={{ position: 'relative', zIndex: 2 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    <FaMotorcycle style={{ fontSize: '1rem' }} />
                                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>My Orders</h3>
                                                </div>
                                                <p style={{ fontSize: '0.7rem', opacity: 0.95, margin: '0 0 10px', lineHeight: '1.4' }}>
                                                    Track your live orders and view delivery status
                                                </p>
                                                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>→ Track Now</div>
                                            </div>
                                        </div>

                                        {/* Order History Card */}
                                        <div onClick={() => setActiveTab('orders')} style={{
                                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                            color: 'white',
                                            padding: '18px',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            boxShadow: '0 8px 20px rgba(0, 242, 254, 0.3)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                            className="desktop-action-card">
                                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
                                            <div style={{ position: 'relative', zIndex: 2 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    <FaListAlt style={{ fontSize: '1rem' }} />
                                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>History</h3>
                                                </div>
                                                <p style={{ fontSize: '0.7rem', opacity: 0.95, margin: '0 0 10px', lineHeight: '1.4' }}>
                                                    View past orders and reorder favorites
                                                </p>
                                                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>→ View Logs</div>
                                            </div>
                                        </div>

                                        {/* Address Card */}
                                        <div onClick={() => setActiveTab('address')} style={{
                                            background: 'white',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }}
                                            className="desktop-action-card-white">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <div style={{ padding: '8px', background: '#fff5f5', borderRadius: '10px', color: '#ff4757' }}>
                                                    <FaMapMarkerAlt style={{ fontSize: '0.9rem' }} />
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#2f3542' }}>Saved Addresses</h3>
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: '#747d8c', margin: 0, lineHeight: '1.3' }}>
                                                Manage delivery locations
                                            </p>
                                        </div>

                                        {/* Help & Support Card */}
                                        <div onClick={() => setActiveTab('help')} style={{
                                            background: 'white',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }}
                                            className="desktop-action-card-white">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <div style={{ padding: '8px', background: '#f0f7ff', borderRadius: '10px', color: '#0984e3' }}>
                                                    <FaQuestionCircle style={{ fontSize: '0.9rem' }} />
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#2f3542' }}>Help & Support</h3>
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: '#747d8c', margin: 0, lineHeight: '1.3' }}>
                                                Get assistance and FAQs
                                            </p>
                                        </div>

                                        {/* Refer & Earn Card */}
                                        <div onClick={() => setActiveModal('refer')} style={{
                                            background: 'white',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }}
                                            className="desktop-action-card-white">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <div style={{ padding: '8px', background: '#fff9ee', borderRadius: '10px', color: '#ff9f43' }}>
                                                    <FaGift style={{ fontSize: '0.9rem' }} />
                                                </div>
                                                <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#2f3542' }}>Refer & Earn</h3>
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: '#747d8c', margin: 0, lineHeight: '1.3' }}>
                                                Share and get rewards
                                            </p>
                                        </div>

                                        {/* Mobile Notification Debug Helper */}
                                        <div style={{
                                            background: '#f8f9fa',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            border: '1px solid #e9ecef',
                                            textAlign: 'center',
                                            marginBottom: '10px',
                                            marginTop: '15px'
                                        }}>
                                            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#495057' }}>Issues with Notifications?</h3>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        alert("Requesting Permission...");
                                                        const permission = await Notification.requestPermission();
                                                        alert(`Permission Status: ${permission}`);

                                                        if (permission === 'granted') {
                                                            alert("Fetching Token...");
                                                            const token = await requestForToken();
                                                            if (token) {
                                                                alert("✅ Success! Token generated.");
                                                                updateUser({ fcmToken: token });
                                                            } else {
                                                                alert("❌ Failed to generate token. 1. Check internet. 2. If on iOS, Add to Home Screen.");
                                                            }
                                                        }
                                                    } catch (e) {
                                                        alert(`Error: ${e.message}`);
                                                    }
                                                }}
                                                style={{
                                                    background: '#2d3436',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '10px 20px',
                                                    borderRadius: '10px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                Force Enable Notifications
                                            </button>

                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e9ecef' }}>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            alert("🚀 Sending Test Notification...");
                                                            const res = await axios.post(`${API_BASE_URL}/api/users/test-notification`, { username: user.username });
                                                            if (res.data.success) {
                                                                alert(`✅ Done! Sent to ${res.data.sent} device(s). Check your status bar!`);
                                                            } else {
                                                                alert(`⚠️ Server received request but no devices found.`);
                                                            }
                                                        } catch (e) {
                                                            alert(`❌ Error: ${e.response?.data?.error || e.message}`);
                                                        }
                                                    }}
                                                    style={{
                                                        background: '#6c5ce7',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '10px 20px',
                                                        borderRadius: '10px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        margin: '0 auto',
                                                        width: '100%'
                                                    }}
                                                >
                                                    🔔 Send Test Alert
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Small Logout Button at Bottom */}
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', paddingBottom: '20px' }}>
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: 'transparent',
                                                color: '#ff4757',
                                                border: '1px solid #fee2e2',
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s'
                                            }}
                                            className="nav-btn-hover"
                                        >
                                            <FaSignOutAlt /> Log Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'wallet' && (
                            <div className="fade-in">
                                <div className="section-header" style={{ marginBottom: '25px' }}>
                                    <div className="back-btn-hover" onClick={() => setActiveTab('profile')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ff4757', fontWeight: 'bold', marginBottom: '15px', cursor: 'pointer' }}>
                                        <FaArrowLeft /> Back to Profile
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Wallet & Recharge</h2>
                                    <p style={{ color: '#747d8c' }}>Manage your funds and transaction history</p>
                                </div>

                                <div className="wallet-gradient-card" style={{ textAlign: 'left', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '200px', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>Available Balance</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '5px' }}>₹{user.walletBalance || 0}</div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user.username}</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>**** **** **** {user.phone.slice(-4)}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem' }}>VISA / UPI</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '25px' }}>
                                    <button className="action-btn w-full" onClick={() => setActiveModal('wallet')} style={{ padding: '1rem', borderRadius: '15px' }}>+ Add Money to Wallet</button>
                                </div>

                                <div style={{ marginTop: '30px' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Recent Transactions</h3>
                                    <div className="transaction-history-list">
                                        {(user.transactions && user.transactions.length > 0) ? (
                                            user.transactions.map((txn, idx) => (
                                                <div key={idx} className="transaction-item" style={{ background: 'white', marginBottom: '10px', borderRadius: '15px', border: '1px solid #f1f2f6' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600' }}>{txn.description}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(txn.date).toLocaleString()}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div className={txn.type === 'Debit' ? 'color-error' : 'color-success'} style={{ fontWeight: '700' }}>
                                                            {txn.type === 'Debit' ? '-' : '+'} ₹{txn.amount}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No transaction history found.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="fade-in">
                                <div className="section-header" style={{ marginBottom: '25px' }}>
                                    <div className="back-btn-hover" onClick={() => setActiveTab('profile')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ff4757', fontWeight: 'bold', marginBottom: '15px', cursor: 'pointer' }}>
                                        <FaArrowLeft /> Back
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Order History</h2>
                                    <p style={{ color: '#747d8c' }}>Track and review your past hunger satisfyers</p>
                                </div>

                                {orders.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {orders.map((order, idx) => (
                                            <div key={idx} className="profile-card-mini" style={{ cursor: 'default' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Order #{order._id.substring(order._id.length - 6)}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#747d8c', marginTop: '4px' }}>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</div>
                                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', background: order.status === 'Delivered' ? '#e3fff0' : '#fff5f5', color: order.status === 'Delivered' ? '#2ed573' : '#ff4757', fontWeight: 'bold' }}>{order.status}</span>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>₹{order.totalAmount}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => setView('my-orders')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer' }}>Track</button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '20px', border: '1px dashed #ddd' }}>
                                        <FaMotorcycle style={{ fontSize: '3rem', color: '#eee', marginBottom: '15px' }} />
                                        <h3 style={{ margin: 0, color: '#999' }}>No orders yet</h3>
                                        <p style={{ color: '#bbb', fontSize: '0.9rem' }}>Delicious food is just a click away!</p>
                                        <button className="nav-btn mt-4" onClick={() => setView('home')}>Order Now</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'address' && (
                            <div className="fade-in">
                                <div className="section-header" style={{ marginBottom: '25px' }}>
                                    <div className="back-btn-hover" onClick={() => setActiveTab('profile')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ff4757', fontWeight: 'bold', marginBottom: '15px', cursor: 'pointer' }}>
                                        <FaArrowLeft /> Back to Profile
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Delivery Address</h2>
                                    <p style={{ color: '#747d8c' }}>Where should we bring your food?</p>
                                </div>

                                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: '#fff5f5', color: '#ff4757', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                            <FaMapMarkerAlt />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Active Landmark</div>
                                            <div style={{ fontSize: '0.85rem', color: '#747d8c' }}>Set as default for future orders</div>
                                        </div>
                                    </div>

                                    {isEditingAddress ? (
                                        <div className="fade-in">
                                            <textarea
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Enter full address..."
                                                style={{ width: '100%', padding: '20px', borderRadius: '15px', border: '2px solid #ff4757', minHeight: '150px', outline: 'none', background: '#fffafa' }}
                                            />
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                <button onClick={handleSaveAddress} style={{ flex: 2, background: '#ff4757', color: 'white', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Save Address</button>
                                                <button onClick={() => setIsEditingAddress(false)} style={{ flex: 1, background: '#f1f2f6', color: '#747d8c', padding: '15px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="fade-in">
                                            <div style={{ padding: '20px', background: '#fdfdfd', borderRadius: '15px', border: '1px dashed #ddd', lineHeight: '1.6', color: address ? '#2f3542' : '#999' }}>
                                                {address || 'No address set. Update now for faster delivery.'}
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                                <button onClick={() => setIsEditingAddress(true)} style={{ flex: 1, color: '#ff4757', border: '2px solid #ff4757', background: 'transparent', padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Edit Address</button>
                                                <button onClick={handleUseLocation} disabled={isLocating} style={{ flex: 1, background: '#2ed573', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                                    {isLocating ? 'Scanning...' : <><FaLocationArrow /> Use Current</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'help' && (
                            <div className="fade-in">
                                <div className="section-header" style={{ marginBottom: '25px' }}>
                                    <div className="back-btn-hover" onClick={() => setActiveTab('profile')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ff4757', fontWeight: 'bold', marginBottom: '15px', cursor: 'pointer' }}>
                                        <FaArrowLeft /> Back to Profile
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Help & Support</h2>
                                    <p style={{ color: '#747d8c' }}>We're here to help you 24/7</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                    <div style={{ padding: '20px', background: 'white', borderRadius: '20px', border: '1px solid #f1f2f6' }}>
                                        <div style={{ fontSize: '1.5rem', color: '#0984e3', marginBottom: '10px' }}>📧</div>
                                        <div style={{ fontWeight: '700' }}>Email Us</div>
                                        <div style={{ fontSize: '0.85rem', color: '#747d8c' }}>support@foodexpress.com</div>
                                    </div>
                                    <div style={{ padding: '20px', background: 'white', borderRadius: '20px', border: '1px solid #f1f2f6' }}>
                                        <div style={{ fontSize: '1.5rem', color: '#2ed573', marginBottom: '10px' }}>📞</div>
                                        <div style={{ fontWeight: '700' }}>Call Center</div>
                                        <div style={{ fontSize: '0.85rem', color: '#747d8c' }}>1800-200-100</div>
                                    </div>
                                </div>

                                <div className="faq-section">
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Frequently Asked Questions</h3>
                                    <details style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #f1f2f6' }}>
                                        <summary style={{ fontWeight: '600', cursor: 'pointer' }}>Where is my order?</summary>
                                        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>Track your orders in real-time from the "Order Logs" or "My Active Orders" section.</p>
                                    </details>
                                    <details style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #f1f2f6' }}>
                                        <summary style={{ fontWeight: '600', cursor: 'pointer' }}>How to cancel an order?</summary>
                                        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>Cancellations are allowed within 120 seconds of placement. Post that, please contact support.</p>
                                    </details>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ height: '100px' }}></div>
        </div>
    );
};

export default Profile;
