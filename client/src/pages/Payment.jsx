import React, { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import API_BASE_URL from '../config';

const Payment = ({ setView }) => {
    const { cart, clearCart, totalAmount } = useContext(CartContext);
    const { user } = useContext(AuthContext);

    const [method, setMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [coupon, setCoupon] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponMsg, setCouponMsg] = useState('');

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
        if (!user.address && !missingAddress) {
            setShowAddressPrompt(true);
            return;
        }

        // Validation: Wallet Balance
        if (method === 'wallet') {
            const currentBalance = user.walletBalance || 0;
            if (currentBalance < finalAmount) {
                setWalletError(`Insufficient balance. You need ₹${finalAmount - currentBalance} more.`);
                return;
            }
        }

        setLoading(true);
        setWalletError('');

        try {
            // Save address if we just collected it
            let addressToUse = user.address;
            if (!addressToUse && missingAddress) {
                updateUser({ address: missingAddress });
                addressToUse = missingAddress;
            }

            // Deduct from Wallet if applicable
            if (method === 'wallet') {
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
                address: addressToUse // Send address to backend if needed
            };

            await axios.post(`${API_BASE_URL}/api/orders`, orderData);

            // Simulate payment processing delay
            setTimeout(() => {
                clearCart();
                setLoading(false);
                setView('success');
            }, 1000);

        } catch (err) {
            console.error(err);
            alert('Failed to place order. Ensure server is running.');
            setLoading(false);
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
        <div className="page-container fade-in">
            <div className="cart-container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
                <h2 className="page-title">Payment & Offers</h2>

                <div className="payment-grid">
                    {/* Left Col: Payment Methods */}
                    <div>
                        <h3 style={{ marginBottom: '1rem' }}>Select Payment Method</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label className={`payment-option-card ${method === 'cod' ? 'selected' : ''}`} onClick={() => { setMethod('cod'); setWalletError(''); }}>
                                <input type="radio" value="cod" checked={method === 'cod'} onChange={() => { }} />
                                <span style={{ fontWeight: '600' }}>Cash on Delivery</span>
                            </label>

                            <label className={`payment-option-card ${method === 'wallet' ? 'selected' : ''}`} onClick={() => { setMethod('wallet'); setWalletError(''); }}>
                                <input type="radio" value="wallet" checked={method === 'wallet'} onChange={() => { }} />
                                <div>
                                    <div style={{ fontWeight: '600' }}>Pay via Wallet</div>
                                    <div style={{ fontSize: '0.8rem', color: '#777' }}>Balance: ₹{user.walletBalance || 0}</div>
                                    {method === 'wallet' && walletError && <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '5px' }}>{walletError}</div>}
                                </div>
                            </label>

                            <label className={`payment-option-card ${method === 'upi' ? 'selected' : ''}`} onClick={() => { setMethod('upi'); setWalletError(''); }}>
                                <input type="radio" value="upi" checked={method === 'upi'} onChange={() => { }} />
                                <span style={{ fontWeight: '600' }}>UPI (GPay / PhonePe)</span>
                            </label>

                            <label className={`payment-option-card ${method === 'card' ? 'selected' : ''}`} onClick={() => { setMethod('card'); setWalletError(''); }}>
                                <input type="radio" value="card" checked={method === 'card'} onChange={() => { }} />
                                <span style={{ fontWeight: '600' }}>Debit / Credit Card</span>
                            </label>
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
    );
};

export default Payment;
