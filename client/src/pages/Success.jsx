import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Lottie from 'lottie-react';
import {
    FaCheckCircle,
    FaRocket,
    FaShoppingBag,
    FaMapMarkerAlt,
    FaClock,
    FaCreditCard,
    FaChevronRight,
    FaArrowLeft
} from 'react-icons/fa';

// Animation Data (A simple high-quality checkmark lottie or fallback)
// For robustness, I will provide a curated SVG-based animation that looks premium
// but also attempt to use Lottie if I had a URL. Since I'm an AI, I'll use 
// Framer Motion to create a better-than-Lottie custom animation.

const Success = ({ setView }) => {
    const { user } = useContext(AuthContext);
    const { lastOrder } = useContext(CartContext);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Trigger high-end confetti celebration
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Confetti from sides
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#2ed573', '#ff4757', '#ffa502', '#5352ed']
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#2ed573', '#ff4757', '#ffa502', '#5352ed']
            });
        }, 250);

        // Boom! Center confetti on mount
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2ed573', '#ffffff']
        });

        // Show details after 1 second
        const timer = setTimeout(() => setShowDetails(true), 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    const floatingEmojis = ['🍕', '🍔', '🍩', '🍦', '🌮', '🍜', '🍣', '🥨'];

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    const cardVariants = {
        hidden: { y: 40, opacity: 0, scale: 0.95 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: 'spring',
                damping: 20,
                stiffness: 100,
                delay: 0.8
            }
        }
    };

    if (!lastOrder && !user) {
        // Fallback or preview mode if no order
        // In a real app, maybe redirect or show a "No order found" state
    }

    // Default values if lastOrder is missing (for safety)
    const orderItems = lastOrder?.items || [];
    const orderId = lastOrder?.orderId || "ORD-B4C2D8E0";
    const totalAmount = lastOrder?.totalAmount || 0;
    const address = lastOrder?.address || "Your saved address";
    const estTime = lastOrder?.estimatedTime || "30-45 mins";
    const payMethod = lastOrder?.paymentMethod || "Online";

    return (
        <div className="success-page-wrapper">
            {/* Background Animations */}
            <div className="success-bg-glow"></div>
            <div className="floating-elements-container">
                {floatingEmojis.map((emoji, i) => (
                    <motion.div
                        key={i}
                        className="floating-emoji"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: window.innerHeight + 100,
                            rotate: 0,
                            opacity: 0
                        }}
                        animate={{
                            y: -100,
                            rotate: 360,
                            opacity: [0, 0.7, 0.7, 0],
                            x: (Math.random() - 0.5) * 200 + (Math.random() * window.innerWidth)
                        }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "linear"
                        }}
                    >
                        {emoji}
                    </motion.div>
                ))}
            </div>

            <motion.div
                className="success-main-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Step 1 & 2: Icon Animation */}
                <motion.div className="success-icon-container" variants={itemVariants}>
                    <div className="icon-pulse-effect"></div>
                    <motion.div
                        className="check-circle"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                    >
                        <svg className="checkmark-svg" viewBox="0 0 52 52">
                            <motion.circle
                                className="checkmark-circle"
                                cx="26" cy="26" r="25" fill="none"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                            <motion.path
                                className="checkmark-check"
                                fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
                            />
                        </svg>
                    </motion.div>
                </motion.div>

                {/* Step 3: Success Messages */}
                <motion.div className="success-text" variants={itemVariants}>
                    <motion.h1
                        className="main-success-title"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        🎉 Order Confirmed!
                    </motion.h1>
                    <p className="sub-success-text">
                        Your delicious food is being prepared 🍽️
                    </p>
                </motion.div>

                {/* Step 4: Order Details Card */}
                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            className="order-details-glass-card"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <div className="card-header">
                                <span className="order-id-label">Order <span className="highlight">#{orderId}</span></span>
                                <span className="order-status-badge">Processing</span>
                            </div>

                            <div className="details-grid">
                                <div className="detail-item">
                                    <div className="detail-icon"><FaClock /></div>
                                    <div className="detail-info">
                                        <label>Delivery In</label>
                                        <span>{estTime}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-icon"><FaMapMarkerAlt /></div>
                                    <div className="detail-info">
                                        <label>Deliver to</label>
                                        <span className="truncate">{address}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-icon"><FaCreditCard /></div>
                                    <div className="detail-info">
                                        <label>Paid via</label>
                                        <span className="capitalize">{payMethod.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                <div className="detail-item total">
                                    <div className="detail-info">
                                        <label>Total Paid</label>
                                        <span className="amount">₹{totalAmount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="order-items-minimal">
                                {orderItems.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="item-row">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                                {orderItems.length > 2 && (
                                    <div className="more-items">+ {orderItems.length - 2} more items</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step 5: CTA Buttons */}
                <motion.div className="success-actions" variants={itemVariants}>
                    <motion.button
                        className="btn-track-order"
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(46, 213, 115, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setView('quantum-tracker', lastOrder?.orderId)}
                    >
                        <FaRocket /> Track Your Order
                    </motion.button>

                    <motion.button
                        className="btn-continue"
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setView('home')}
                    >
                        <FaArrowLeft /> Continue Shopping
                    </motion.button>
                </motion.div>
            </motion.div>

            {/* Custom Styles for this page */}
            <style jsx>{`
                .success-page-wrapper {
                    position: relative;
                    min-height: 100vh;
                    width: 100%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    background: linear-gradient(135deg, #f0fdf4 0%, #fff7ed 50%, #f0f9ff 100%);
                }

                .success-bg-glow {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(46, 213, 115, 0.15) 0%, transparent 70%);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    filter: blur(80px);
                    z-index: 0;
                    animation: pulseBg 6s infinite alternate;
                }

                @keyframes pulseBg {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
                    100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
                }

                .floating-emoji {
                    position: absolute;
                    font-size: 2rem;
                    pointer-events: none;
                    z-index: 1;
                }

                .success-main-content {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    max-width: 550px;
                    width: 100%;
                }

                .success-icon-container {
                    position: relative;
                    margin-bottom: 2rem;
                    display: inline-block;
                }

                .icon-pulse-effect {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 120px;
                    height: 120px;
                    background: rgba(46, 213, 115, 0.2);
                    border-radius: 50%;
                    z-index: -1;
                    animation: pulseCircle 2s infinite;
                }

                @keyframes pulseCircle {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
                }

                .check-circle {
                    width: 120px;
                    height: 120px;
                    background: #2ed573;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 15px 35px rgba(46, 213, 115, 0.4);
                }

                .checkmark-svg {
                    width: 70px;
                    height: 70px;
                }

                .checkmark-circle {
                    stroke: white;
                    stroke-width: 3;
                }

                .checkmark-check {
                    stroke: white;
                    stroke-width: 5;
                    stroke-linecap: round;
                }

                .main-success-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(45deg, #1e293b, #2ed573);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .sub-success-text {
                    font-size: 1.1rem;
                    color: #64748b;
                    margin-bottom: 2.5rem;
                }

                .order-details-glass-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    border-radius: 24px;
                    padding: 2rem;
                    text-align: left;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
                    margin-bottom: 2.5rem;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    padding-bottom: 1rem;
                }

                .order-id-label {
                    font-weight: 600;
                    color: #475569;
                }

                .order-id-label .highlight {
                    color: #2ed573;
                }

                .order-status-badge {
                    background: #f0fdf4;
                    color: #16a34a;
                    padding: 0.4rem 0.8rem;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    border: 1px solid #dcfce7;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                .detail-item {
                    display: flex;
                    gap: 12px;
                }

                .detail-icon {
                    width: 36px;
                    height: 36px;
                    background: #f1f5f9;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #475569;
                    flex-shrink: 0;
                }

                .detail-info label {
                    display: block;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-bottom: 2px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                .detail-info span {
                    font-weight: 600;
                    color: #334155;
                    font-size: 0.95rem;
                }

                .detail-item.total {
                    grid-column: span 2;
                    background: #f8fafc;
                    padding: 1rem;
                    border-radius: 12px;
                    margin-top: 0.5rem;
                }

                .detail-item.total .detail-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }

                .amount {
                    font-size: 1.25rem !important;
                    color: #2ed573 !important;
                    font-weight: 800 !important;
                }

                .order-items-minimal {
                    margin-top: 1.5rem;
                }

                .item-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-bottom: 4px;
                }

                .more-items {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    font-style: italic;
                    margin-top: 4px;
                }

                .success-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .btn-track-order {
                    background: linear-gradient(to right, #2ed573, #16a34a);
                    color: white;
                    border: none;
                    padding: 1.2rem;
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    box-shadow: 0 10px 20px rgba(46, 213, 115, 0.2);
                }

                .btn-continue {
                    background: transparent;
                    color: #64748b;
                    border: none;
                    padding: 0.8rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .truncate {
                    display: block;
                    max-width: 180px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                @media (max-width: 640px) {
                    .main-success-title { font-size: 2rem; }
                    .details-grid { grid-template-columns: 1fr; }
                    .detail-item.total { grid-column: span 1; }
                    .success-page-wrapper { padding: 1rem; }
                    .order-details-glass-card { padding: 1.25rem; }
                }
            `}</style>
        </div>
    );
};

export default Success;
