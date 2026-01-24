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
                                {/* Progress Ring */}
                                <svg className="processing-svg" viewBox="0 0 120 120">
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
                                    className="processing-mode-icon"
                                >
                                    {getModeIcon()}
                                </motion.div>
                            </div>

                            <motion.h2
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="processing-title"
                            >
                                Processing Payment
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
                                        {statusMessages[currentStatusIdx]}
                                    </motion.p>
                                </AnimatePresence>
                            </div>

                            <div className="secure-badge">
                                <FaLock /> 256-bit SSL Secure Payment
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
                                <motion.div
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <FaCheckCircle className="result-icon" />
                                </motion.div>
                            </div>
                            <h2 className="result-title">Payment Successful!</h2>
                            <p className="result-desc">Redirecting to order confirmation...</p>
                        </motion.div>
                    )}

                    {status === 'failure' && (
                        <motion.div
                            key="failure"
                            initial={{ x: [-10, 10, -10, 10, 0], opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="status-result-container"
                        >
                            <div className="result-icon-circle failure-bg">
                                <FaTimesCircle className="result-icon" />
                            </div>
                            <h2 className="result-title">Payment Failed</h2>
                            <p className="result-desc">Something went wrong. Please check your details and try again.</p>
                            <button
                                onClick={() => onComplete('retry')}
                                className="retry-btn"
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
