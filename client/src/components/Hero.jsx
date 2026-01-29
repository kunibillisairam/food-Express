import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiZap, FiTarget, FiStar } from 'react-icons/fi';

const Hero = ({ setView }) => {
    return (
        <section className="hero-section">
            <div className="hero-content">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hero-text-container"
                >
                    <div className="hero-badge">
                        <FiZap className="zap-icon" />
                        <span>Fastest Delivery in Town</span>
                    </div>
                    <h1 className="hero-title">
                        Savor the Future of Dining
                    </h1>
                    <p className="hero-subtitle">
                        Experience lightning-fast delivery and gourmet flavors.
                    </p>

                    <div className="hero-actions">
                        <button className="hero-primary-btn" onClick={() => {
                            const el = document.getElementById('food-explore');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}>
                            Order Now <FiArrowRight />
                        </button>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-value">50k+</span>
                                <span className="stat-label">Happy Customers</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-value">4.5</span>
                                <FiStar className="star-icon" />
                                <span className="stat-label">Avg Rating</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="hero-image-wrapper"
                >
                    <div className="hero-image-glow"></div>
                    <img src="/hero_food.png" alt="Delicious Food" className="hero-main-img" />
                    <div className="floating-card card-1">
                        <FiTarget className="card-icon" />
                        <div>
                            <p className="card-top">Real-time</p>
                            <p className="card-bottom">Tracking</p>
                        </div>
                    </div>
                    <div className="floating-card card-2">
                        <FiStar className="card-icon text-orange-500" />
                        <div>
                            <p className="card-top">Premium</p>
                            <p className="card-bottom">Quality</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
