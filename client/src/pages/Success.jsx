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

        </div>
    );
};

export default Success;
