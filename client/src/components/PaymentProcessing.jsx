import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaLock, FaCheckCircle, FaTimesCircle, FaCreditCard, FaMobileAlt, FaWallet, FaBoxOpen } from 'react-icons/fa';

const PaymentProcessing = ({
    status = 'processing',
    onComplete,
    method = 'card',
    mode = 'payment', // 'payment' or 'order'
    rewards = null // { xp: number, credits: number }
}) => {
    const [currentStatusIdx, setCurrentStatusIdx] = useState(0);

    const paymentMessages = [
        "Connecting to bank...",
        "Verifying payment details...",
        "Securing transaction...",
        "Finalizing your order..."
    ];

    const orderMessages = [
        "Transmitting order to kitchen...",
        "Authenticating with server...",
        "Securing your table in queue...",
        "Confirming with restaurant..."
    ];

    const messages = mode === 'payment' ? paymentMessages : orderMessages;

    useEffect(() => {
        if (status === 'processing') {
            const interval = setInterval(() => {
                setCurrentStatusIdx((prev) => (prev + 1) % messages.length);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [status, messages]);

    const getModeIcon = () => {
        if (mode === 'order') return <FaBoxOpen />;
        switch (method) {
            case 'upi': return <FaMobileAlt />;
            case 'wallet': return <FaWallet />;
            default: return <FaCreditCard />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="payment-processing-overlay"
        >
            <div className="payment-processing-card">
                <AnimatePresence mode="wait">
                    {status === 'processing' && (
                        <motion.div
                            key="loader"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            className="loader-content"
                        >
                            <div className="processing-ring-container">
                                <svg className="processing-svg" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f2f6" strokeWidth="8" />
                                    <motion.circle
                                        cx="60" cy="60" r="54"
                                        fill="none"
                                        stroke="url(#grad1)"
                                        strokeWidth="8"
                                        strokeDasharray="339"
                                        initial={{ strokeDashoffset: 339 }}
                                        animate={{ strokeDashoffset: [339, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        strokeLinecap="round"
                                    />
                                    <defs>
                                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" style={{ stopColor: mode === 'payment' ? '#0984e3' : '#2ed573', stopOpacity: 1 }} />
                                            <stop offset="100%" style={{ stopColor: mode === 'payment' ? '#6c5ce7' : '#0575e6', stopOpacity: 1 }} />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                <motion.div
                                    animate={{ rotateY: [0, 360], scale: [1, 1.1, 1] }}
                                    transition={{ rotateY: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity, ease: "easeInOut" } }}
                                    className="processing-mode-icon"
                                    style={{ color: mode === 'payment' ? '#6c5ce7' : '#2ed573' }}
                                >
                                    {getModeIcon()}
                                </motion.div>
                            </div>

                            <motion.h2
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="processing-title"
                            >
                                {mode === 'payment' ? 'Processing Payment' : 'Confirming Order'}
                            </motion.h2>

                            <div className="status-msg-container">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={currentStatusIdx}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -10, opacity: 0 }}
                                        className="status-msg-text"
                                    >
                                        {messages[currentStatusIdx]}
                                    </motion.p>
                                </AnimatePresence>
                            </div>

                            <div className="secure-badge">
                                <FaShieldAlt /> {mode === 'payment' ? 'Enrypted Payment Gateway' : 'Secure Order Transmission'}
                            </div>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="status-result-container"
                        >
                            <div className="result-icon-circle success-bg">
                                <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}>
                                    <FaCheckCircle className="result-icon" />
                                </motion.div>
                            </div>
                            <h2 className="result-title">{mode === 'payment' ? 'Payment Successful!' : 'Order Placed!'}</h2>
                            <p className="result-desc">Wrapping things up for you...</p>

                            {rewards && (rewards.xp > 0 || rewards.credits > 0) && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0, scale: 0.8 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                                    style={{
                                        marginTop: '1.5rem',
                                        padding: '12px 24px',
                                        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
                                        borderRadius: '20px',
                                        border: '1px solid #00f2fe',
                                        boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)',
                                        display: 'inline-flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <div style={{ color: '#00f2fe', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Rewards Earned</div>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
                                            +{rewards.xp} XP
                                        </div>
                                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
                                        <div style={{ color: '#f1c40f', fontSize: '1.2rem', fontWeight: '900', textShadow: '0 0 10px rgba(241,196,15,0.5)' }}>
                                            +{rewards.credits} CR
                                        </div>
                                    </div>
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{ fontSize: '0.7rem', color: '#fff', opacity: 0.7, marginTop: '2px' }}
                                    >
                                        Level Up Incoming! 🚀
                                    </motion.div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {status === 'failure' && (
                        <motion.div
                            key="failure"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                x: [0, -10, 10, -10, 10, 0]
                            }}
                            transition={{
                                x: { duration: 0.5, delay: 0.2 },
                                opacity: { duration: 0.3 }
                            }}
                            className="status-result-container failure"
                        >
                            <div className="result-icon-circle failure-bg pulse-error">
                                <svg className="error-checkmark-svg" viewBox="0 0 52 52">
                                    <motion.circle
                                        cx="26" cy="26" r="25" fill="none"
                                        stroke="#ff4757" strokeWidth="3"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5 }}
                                    />
                                    <motion.path
                                        fill="none" stroke="#ff4757" strokeWidth="5" strokeLinecap="round"
                                        d="M16 16 L36 36 M36 16 L16 36"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.3, delay: 0.5 }}
                                    />
                                </svg>
                            </div>
                            <h2 className="result-title fail-text">{mode === 'payment' ? 'Payment Failed' : 'Order Failed'}</h2>
                            <p className="result-desc">Something went wrong. Please check your connection or payment details.</p>
                            <div className="failure-actions">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onComplete('retry')}
                                    className="premium-retry-btn"
                                >
                                    Try Again
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default PaymentProcessing;
