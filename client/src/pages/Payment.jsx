import React, { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import PaymentProcessing from '../components/PaymentProcessing';
import { AnimatePresence } from 'framer-motion';

const Payment = ({ setView }) => {
    const { cart, clearCart, totalAmount, setLastOrder } = useContext(CartContext);
    const { user } = useContext(AuthContext);

    const [method, setMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [coupon, setCoupon] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponMsg, setCouponMsg] = useState('');
    const [processStatus, setProcessStatus] = useState('processing'); // 'processing', 'success', 'failure'
    const [isLocating, setIsLocating] = useState(false);
    const [useXp, setUseXp] = useState(false);
    const [earnedRewards, setEarnedRewards] = useState(null);

    // Payment Details State
    const [upiId, setUpiId] = useState('');
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: ''
    });
    const [errors, setErrors] = useState({});

    const coupons = [
        { code: 'WELCOME50', discount: 50, desc: 'Flat ₹50 off on first order' },
        { code: 'ZOMATO20', discount: 20, desc: '20% off up to ₹100' }, // Logic implemented as flat for simplicity or percentage
        { code: 'SAI100', discount: 100, desc: 'For first time' },
        { code: 'FREEDEL', discount: 40, desc: 'Free Delivery (Save ₹40)' }
    ];

    const handleApplyCoupon = () => {
        if (!coupon) return;

        const found = coupons.find(c => c.code === coupon.toUpperCase());
        if (found) {
            // Simple logic for example: 
            // If percentage-like code (ZOMATO20), let's calculate % but cap it.
            // For now, let's keep it simple: use the 'discount' value from object as flat amount reduction
            // or if it's ZOMATO20, calculate 20%.

            let discAmt = found.discount;

            // Check if coupon is one-time use for user
            if (found.code === 'SAI100') {
                if (user && user.usedCoupons && user.usedCoupons.includes('SAI100')) {
                    setCouponMsg('Only one time for new user');
                    return;
                }
            }

            if (found.code === 'ZOMATO20') {
                discAmt = Math.round(totalAmount * 0.2);
                if (discAmt > 100) discAmt = 100;
            }

            if (totalAmount < discAmt) {
                setCouponMsg('Cart value too low for this coupon.');
                return;
            }

            setDiscount(discAmt);
            setAppliedCoupon(found.code);
            setCouponMsg(`Coupon ${found.code} applied! You saved ₹${discAmt}`);
        } else {
            setCouponMsg('Invalid Coupon Code');
            setDiscount(0);
            setAppliedCoupon(null);
        }
    };

    // State for address if missing
    const [missingAddress, setMissingAddress] = useState('');
    const [showAddressPrompt, setShowAddressPrompt] = useState(false);
    const [walletError, setWalletError] = useState('');
    const { updateUser } = useContext(AuthContext);

    const xpDiscount = useXp ? (user?.credits || 0) : 0;
    const finalAmount = Math.max(0, totalAmount - discount - xpDiscount);

    const handleConfirm = async () => {
        // Validation: Check Address
        if ((!user || !user.address) && !missingAddress) {
            setShowAddressPrompt(true);
            return;
        }

        if (method === 'wallet') {
            const currentBalance = user?.walletBalance || 0;
            if (currentBalance < finalAmount) {
                setWalletError(`Insufficient balance. You need ₹${finalAmount - currentBalance} more.`);
                return;
            }
        }

        // Validation: UPI and Card
        let newErrors = {};
        if (method === 'upi') {
            if (!upiId) {
                newErrors.upiId = 'UPI ID is required';
            } else if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{3,}$/.test(upiId)) {
                newErrors.upiId = 'Invalid UPI ID format';
            }
        } else if (method === 'card') {
            if (!cardDetails.number || cardDetails.number.length !== 16) {
                newErrors.cardNumber = 'Card number must be 16 digits';
            }
            if (!cardDetails.expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry)) {
                newErrors.cardExpiry = 'Invalid expiry (MM/YY)';
            }
            if (!cardDetails.cvv || cardDetails.cvv.length !== 3) {
                newErrors.cardCvv = 'CVV must be 3 digits';
            }
            if (!cardDetails.name) {
                newErrors.cardName = 'Cardholder name is required';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setProcessStatus('processing');
        setWalletError('');
        setErrors({});

        try {
            // Save address if we just collected it
            let addressToUse = user?.address;
            if (!addressToUse && missingAddress) {
                updateUser({ address: missingAddress });
                addressToUse = missingAddress;
            }

            // Deduct from Wallet if applicable
            if (method === 'wallet' && user) {
                const currentBalance = user.walletBalance || 0;
                const newBalance = currentBalance - finalAmount;

                const newTransaction = {
                    type: 'Debit',
                    amount: finalAmount,
                    description: 'Order Payment',
                    date: new Date()
                };

                const currentTransactions = user.transactions || [];
                updateUser({
                    walletBalance: newBalance,
                    transactions: [newTransaction, ...currentTransactions]
                });
            }

            const orderData = {
                userName: user?.username || 'Guest',
                items: cart.map(item => ({
                    name: item.name,
                    price: item.price.toString(),
                    quantity: item.qty,
                    image: item.image
                })),
                totalAmount: finalAmount,
                status: 'Pending',
                paymentMethod: method,
                address: addressToUse, // Send address to backend if needed
                couponCode: appliedCoupon, // Pass coupon to backend for verification/marketing
                useXp: useXp
            };

            const response = await axios.post(`${API_BASE_URL}/api/orders`, orderData);

            // Update rewards state for animation
            if (response.data) {
                setEarnedRewards({
                    xp: response.data.earnedXp || 0,
                    credits: response.data.earnedCredits || 0
                });
            }

            // Transition to Success Animation
            setProcessStatus('success');

            // Update user state with rewards from backend
            if (response.data && user) {
                // Fetch the latest user data from server to be sure, or update from response
                // For now, let's just update the specific fields we know changed
                const newXp = (user.xp || 0) + (response.data.earnedXp || 0) - (useXp ? (response.data.xpUsed || 0) : 0);
                const newCredits = (user.credits || 0) + (response.data.earnedCredits || 0) - (useXp ? (user.credits || 0) : 0);

                // Better approach: fetch full user if possible, or trust local math
                // Since our backend returns earnedXp and earnedCredits, we use those.
                // Note: useXp might have consumed all credits.

                // Let's just use the updateUser to sync if we had a simplified response, 
                // but since we want to be accurate, let's fetch the user data.
                try {
                    const userRes = await axios.get(`${API_BASE_URL}/api/users/${user.username}`);
                    if (userRes.data) {
                        updateUser(userRes.data);
                    }
                } catch (e) {
                    console.error("Failed to sync user data", e);
                }
            }

            setTimeout(() => {
                setLastOrder({
                    ...orderData,
                    orderId: response.data._id, // Use real MongoDB ID
                    displayId: 'ORD-' + response.data._id.slice(-6).toUpperCase(),
                    earnedXp: response.data.earnedXp,
                    earnedCredits: response.data.earnedCredits,
                    estimatedTime: '25-35 mins',
                    date: new Date().toLocaleString()
                });
                clearCart();
                setLoading(false);
                setProcessStatus('processing');
                setView('success');
            }, 3000);

        } catch (err) {
            console.error(err);
            setProcessStatus('failure');
        }
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
                        setMissingAddress(data.display_name);
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

    if (showAddressPrompt) {
        return (
            <div className="page-container address-prompt-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 2000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '1rem'
            }}>
                <div className="fade-in" style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '24px',
                    maxWidth: '500px',
                    width: '100%',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                    position: 'relative'
                }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>Where should we deliver?</h2>
                    <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>We need your delivery address to complete the order.</p>

                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <textarea
                            value={missingAddress}
                            onChange={(e) => setMissingAddress(e.target.value)}
                            placeholder="Apartment, Street, Area..."
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: '2px solid #f1f2f6',
                                borderRadius: '16px',
                                minHeight: '120px',
                                outline: 'none',
                                fontSize: '1rem',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#ff4757'}
                            onBlur={(e) => e.target.style.borderColor = '#f1f2f6'}
                        />
                        <button
                            onClick={handleUseLocation}
                            disabled={isLocating}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                bottom: '10px',
                                background: '#f1f2f6',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: '#2ed573',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            {isLocating ? 'Locating...' : '📍 Use Location'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            className="action-btn"
                            onClick={handleConfirm}
                            style={{ width: '100%', borderRadius: '16px', padding: '1rem' }}
                        >
                            Confirm Address & Pay
                        </button>
                        <button
                            className="nav-btn"
                            onClick={() => setShowAddressPrompt(false)}
                            style={{ background: 'transparent', color: '#999' }}
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <AnimatePresence>
                {loading && (
                    <PaymentProcessing
                        status={processStatus}
                        method={method}
                        mode={method === 'cod' ? 'order' : 'payment'}
                        rewards={earnedRewards}
                        onComplete={(action) => {
                            if (action === 'retry') {
                                setLoading(false);
                                setProcessStatus('processing');
                            }
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="page-container fade-in">
                <div className="cart-container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
                    <h2 className="page-title">Payment & Offers</h2>

                    <div className="payment-grid">
                        {/* Left Col: Payment Methods */}
                        <div>
                            <h3 style={{ marginBottom: '1rem' }}>Select Payment Method</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label className={`payment-option-card ${method === 'cod' ? 'selected' : ''}`} onClick={() => { setMethod('cod'); setWalletError(''); setErrors({}); }}>
                                    <input type="radio" value="cod" checked={method === 'cod'} onChange={() => { }} />
                                    <span style={{ fontWeight: '600' }}>Cash on Delivery</span>
                                </label>

                                {user && (
                                    <label className={`payment-option-card ${method === 'wallet' ? 'selected' : ''}`} onClick={() => { setMethod('wallet'); setWalletError(''); setErrors({}); }}>
                                        <input type="radio" value="wallet" checked={method === 'wallet'} onChange={() => { }} />
                                        <div>
                                            <div style={{ fontWeight: '600' }}>Pay via Wallet</div>
                                            <div style={{ fontSize: '0.8rem', color: '#777' }}>Balance: ₹{user?.walletBalance || 0}</div>
                                            {method === 'wallet' && walletError && <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '5px' }}>{walletError}</div>}
                                        </div>
                                    </label>
                                )}

                                <label className={`payment-option-card ${method === 'upi' ? 'selected' : ''}`} onClick={() => { setMethod('upi'); setWalletError(''); setErrors({}); }}>
                                    <input type="radio" value="upi" checked={method === 'upi'} onChange={() => { }} />
                                    <span style={{ fontWeight: '600' }}>UPI (GPay / PhonePe)</span>
                                </label>

                                {method === 'upi' && (
                                    <div style={{ padding: '0.5rem 0 0.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder="Enter UPI ID (e.g. user@upi)"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            style={{
                                                padding: '0.8rem',
                                                borderRadius: '8px',
                                                border: errors.upiId ? '1px solid red' : '1px solid #ddd',
                                                width: '100%'
                                            }}
                                        />
                                        {errors.upiId && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.upiId}</div>}
                                    </div>
                                )}

                                <label className={`payment-option-card ${method === 'card' ? 'selected' : ''}`} onClick={() => { setMethod('card'); setWalletError(''); setErrors({}); }}>
                                    <input type="radio" value="card" checked={method === 'card'} onChange={() => { }} />
                                    <span style={{ fontWeight: '600' }}>Debit / Credit Card</span>
                                </label>

                                {method === 'card' && (
                                    <div style={{ padding: '0.5rem 0 0.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder="Card Number (16 digits)"
                                            value={cardDetails.number}
                                            maxLength="16"
                                            onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, '') })}
                                            style={{
                                                padding: '0.8rem',
                                                borderRadius: '8px',
                                                border: errors.cardNumber ? '1px solid red' : '1px solid #ddd',
                                                width: '100%'
                                            }}
                                        />
                                        {errors.cardNumber && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.cardNumber}</div>}

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <div style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    value={cardDetails.expiry}
                                                    maxLength="5"
                                                    onChange={(e) => {
                                                        let val = e.target.value.replace(/[^\d/]/g, '');
                                                        if (val.length === 2 && !val.includes('/')) val += '/';
                                                        setCardDetails({ ...cardDetails, expiry: val });
                                                    }}
                                                    style={{
                                                        padding: '0.8rem',
                                                        borderRadius: '8px',
                                                        border: errors.cardExpiry ? '1px solid red' : '1px solid #ddd',
                                                        width: '100%'
                                                    }}
                                                />
                                                {errors.cardExpiry && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.cardExpiry}</div>}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    placeholder="CVV"
                                                    value={cardDetails.cvv}
                                                    maxLength="3"
                                                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                                                    style={{
                                                        padding: '0.8rem',
                                                        borderRadius: '8px',
                                                        border: errors.cardCvv ? '1px solid red' : '1px solid #ddd',
                                                        width: '100%'
                                                    }}
                                                />
                                                {errors.cardCvv && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.cardCvv}</div>}
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Cardholder Name"
                                            value={cardDetails.name}
                                            onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                            style={{
                                                padding: '0.8rem',
                                                borderRadius: '8px',
                                                border: errors.cardName ? '1px solid red' : '1px solid #ddd',
                                                width: '100%'
                                            }}
                                        />
                                        {errors.cardName && <div style={{ color: 'red', fontSize: '0.8rem' }}>{errors.cardName}</div>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Col: Order Summary & Coupons */}
                        <div>
                            <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
                            <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Item Total</span>
                                    <span>₹{totalAmount}</span>
                                </div>
                                {discount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#2ed573' }}>
                                        <span>Discount ({appliedCoupon})</span>
                                        <span>- ₹{discount}</span>
                                    </div>
                                )}
                                <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '1rem 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.2rem', marginBottom: '1rem' }}>
                                    <span>To Pay</span>
                                    <span>₹{finalAmount}</span>
                                </div>

                                {user && user.credits > 0 && (
                                    <div
                                        onClick={() => setUseXp(!useXp)}
                                        className={`xp-usage-card ${useXp ? 'active' : ''}`}
                                        style={{
                                            border: useXp ? '2px solid #00f2fe' : '1px solid #ddd',
                                            background: useXp ? 'rgba(0, 242, 254, 0.05)' : '#fff',
                                            padding: '1rem',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '1rem',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {useXp && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#00f2fe' }} />}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: 'linear-gradient(45deg, #0984e3, #6c5ce7)',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                color: 'white',
                                                fontSize: '1.2rem'
                                            }}>
                                                ⚡
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Use XP Credits</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>Available: {user.credits} CR (₹{user.credits})</div>
                                            </div>
                                        </div>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            border: '2px solid' + (useXp ? '#00f2fe' : '#ddd'),
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            background: useXp ? '#00f2fe' : 'transparent'
                                        }}>
                                            {useXp && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                                        </div>
                                    </div>
                                )}

                                {/* XP EARNINGS INDICATOR */}
                                {finalAmount >= 100 && (
                                    <div style={{
                                        background: 'linear-gradient(90deg, #0f0c29, #302b63)',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        marginTop: '15px',
                                        border: '1px solid rgba(0, 242, 254, 0.3)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '5px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#00f2fe', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>InterGalactic Rewards</span>
                                            <span style={{ fontSize: '0.7rem', color: 'white', opacity: 0.6 }}>PROMO ACTIVE</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                +{10 + Math.floor((finalAmount - 100.1) / 50) * 5} XP
                                            </div>
                                            <div style={{ color: '#00f2fe', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                +{(10 + Math.floor((finalAmount - 100.1) / 50) * 5) / 10} CR
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <h3 style={{ marginBottom: '1rem' }}>Offers & Coupons</h3>

                            {/* Coupon Input */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Enter Coupon Code"
                                    value={coupon}
                                    onChange={(e) => setCoupon(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        textTransform: 'uppercase'
                                    }}
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    style={{
                                        background: '#2f3542',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0 1.5rem',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Apply
                                </button>
                            </div>
                            {couponMsg && <div style={{ fontSize: '0.9rem', color: appliedCoupon ? '#2ed573' : 'red', marginBottom: '1rem' }}>{couponMsg}</div>}

                            {/* Available Coupons List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {coupons.map((c, i) => (
                                    <div key={i}
                                        className="coupon-card"
                                        onClick={() => { setCoupon(c.code); }}
                                        style={{
                                            border: '1px dashed #ff4757',
                                            background: '#fff5f6',
                                            padding: '0.8rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}
                                    >
                                        <div style={{ background: '#ff4757', color: 'white', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            {c.code}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#555' }}>{c.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: '2px solid #f1f2f6', marginTop: '2rem', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button className="nav-btn" onClick={() => setView('cart')} style={{ border: '1px solid #ccc' }}>Back to Cart</button>
                        <button
                            className="action-btn"
                            style={{ padding: '1rem 3rem', opacity: loading ? 0.7 : 1 }}
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : `Pay ₹${finalAmount}`}
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default Payment;
