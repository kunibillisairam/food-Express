import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaLock, FaCheckCircle, FaTimesCircle, FaCreditCard, FaMobileAlt, FaWallet } from 'react-icons/fa';

const PaymentProcessing = ({ status = 'processing', onComplete, method = 'card' }) => {
    const [currentStatusIdx, setCurrentStatusIdx] = useState(0);
    const statusMessages = [
        "Connecting to bank...",
        "Verifying payment details...",
        "Securing transaction...",
        "Finalizing your order..."
    ];

    useEffect(() => {
        if (status === 'processing') {
            const interval = setInterval(() => {
                setCurrentStatusIdx((prev) => (prev + 1) % statusMessages.length);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [status]);

    const getModeIcon = () => {
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
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div style={{ textAlign: 'center', maxWidth: '400px', width: '90%' }}>
                <AnimatePresence mode="wait">
                    {status === 'processing' && (
                        <motion.div
                            key="loader"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            className="loader-content"
                        >
                            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 30px' }}>
                                {/* Progress Ring */}
                                <svg width="120" height="120">
                                    <circle
                                        cx="60" cy="60" r="54"
                                        fill="none"
                                        stroke="#f1f2f6"
                                        strokeWidth="8"
                                    />
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
                                            <stop offset="0%" style={{ stopColor: '#0984e3', stopOpacity: 1 }} />
                                            <stop offset="100%" style={{ stopColor: '#6c5ce7', stopOpacity: 1 }} />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Center Icon */}
                                <motion.div
                                    animate={{
                                        rotateY: [0, 360],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{
                                        rotateY: { duration: 2, repeat: Infinity, ease: "linear" },
                                        scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0, width: '100%', height: '100%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '2.5rem', color: '#6c5ce7'
                                    }}
                                >
                                    {getModeIcon()}
                                </motion.div>
                            </div>

                            <motion.h2
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ fontSize: '1.5rem', color: '#2f3542', margin: '0 0 10px' }}
                            >
                                Processing Payment
                            </motion.h2>

                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentStatusIdx}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -10, opacity: 0 }}
                                    style={{ color: '#747d8c', fontSize: '1rem' }}
                                >
                                    {statusMessages[currentStatusIdx]}
                                </motion.p>
                            </AnimatePresence>

                            <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#a4b0be', fontSize: '0.8rem' }}>
                                <FaLock /> 256-bit SSL Secure Payment
                            </div>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ padding: '20px' }}
                        >
                            <div style={{ width: '100px', height: '100px', background: '#2ed573', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(46, 213, 115, 0.3)' }}>
                                <motion.div
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <FaCheckCircle style={{ color: 'white', fontSize: '3rem' }} />
                                </motion.div>
                            </div>
                            <h2 style={{ fontSize: '1.8rem', color: '#2f3542' }}>Payment Successful!</h2>
                            <p style={{ color: '#747d8c' }}>Redirecting to order confirmation...</p>

                            {/* Confetti simulation would go here or Lottie */}
                        </motion.div>
                    )}

                    {status === 'failure' && (
                        <motion.div
                            key="failure"
                            initial={{ x: [-10, 10, -10, 10, 0], opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            style={{ padding: '20px' }}
                        >
                            <div style={{ width: '100px', height: '100px', background: '#ff4757', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(255, 71, 87, 0.3)' }}>
                                <FaTimesCircle style={{ color: 'white', fontSize: '3rem' }} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', color: '#2f3542' }}>Payment Failed</h2>
                            <p style={{ color: '#747d8c', marginBottom: '30px' }}>Something went wrong. Please check your details and try again.</p>
                            <button
                                onClick={() => onComplete('retry')}
                                style={{ background: '#2f3542', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 'bold' }}
                            >
                                Try Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default PaymentProcessing;
