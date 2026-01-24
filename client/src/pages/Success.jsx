import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FaCheckCircle, FaRocket, FaHome, FaHistory } from 'react-icons/fa';

const Success = ({ setView }) => {
    const { user } = useContext(AuthContext);

    useEffect(() => {
        // Trigger high-end confetti celebration
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="page-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="success-card"
                style={{
                    background: 'white',
                    padding: '3rem 2rem',
                    borderRadius: '24px',
                    textAlign: 'center',
                    maxWidth: '500px',
                    width: '90%',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                    style={{
                        width: '100px',
                        height: '100px',
                        background: '#2ed573',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 10px 20px rgba(46, 213, 115, 0.3)'
                    }}
                >
                    <FaCheckCircle style={{ fontSize: '3.5rem', color: 'white' }} />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{ fontSize: '1.8rem', color: '#2f3542', marginBottom: '1rem' }}
                >
                    Order Placed Successfully!
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ color: '#747d8c', marginBottom: '2.5rem' }}
                >
                    Hunger is about to end! Your order is being transmitted to the kitchen.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}
                >
                    <button
                        className="premium-action-btn"
                        onClick={() => setView('quantum-tracker')}
                        style={{ background: 'linear-gradient(45deg, #2ed573, #009432)', color: 'white', padding: '1rem', borderRadius: '12px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
                    >
                        <FaRocket /> Live Track Order
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button
                            className="nav-btn"
                            onClick={() => setView('home')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.8rem', borderRadius: '12px' }}
                        >
                            <FaHome /> Home
                        </button>
                        <button
                            className="nav-btn"
                            onClick={() => setView('my-orders')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.8rem', borderRadius: '12px' }}
                        >
                            <FaHistory /> Orders
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Success;
