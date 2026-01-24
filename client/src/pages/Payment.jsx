import React, { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import API_BASE_URL from '../config';
import PaymentProcessing from '../components/PaymentProcessing';
import { AnimatePresence } from 'framer-motion';

const Payment = ({ setView }) => {
    const { cart, clearCart, totalAmount } = useContext(CartContext);
    const { user } = useContext(AuthContext);

    const [method, setMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [coupon, setCoupon] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponMsg, setCouponMsg] = useState('');
    const [processStatus, setProcessStatus] = useState('processing'); // 'processing', 'success', 'failure'

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
    const { updateUser } = useContext(AuthContext);

    const finalAmount = totalAmount - discount;

    const [walletError, setWalletError] = useState('');

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
                couponCode: appliedCoupon // Pass coupon to backend for verification/marketing
            };

            await axios.post(`${API_BASE_URL}/api/orders`, orderData);

            // Transition to Success Animation
            setProcessStatus('success');

            setTimeout(() => {
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

    if (showAddressPrompt) {
        return (
            <div className="page-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <h2>Almost there!</h2>
                    <p>We need your delivery address to place the order.</p>
                    <textarea
                        value={missingAddress}
                        onChange={(e) => setMissingAddress(e.target.value)}
                        placeholder="Enter your full address..."
                        style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', minHeight: '100px', marginBottom: '1rem' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="action-btn" onClick={handleConfirm}>Save & Pay</button>
                        <button className="nav-btn" onClick={() => setShowAddressPrompt(false)}>Cancel</button>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.2rem' }}>
                                    <span>To Pay</span>
                                    <span>₹{finalAmount}</span>
                                </div>
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
