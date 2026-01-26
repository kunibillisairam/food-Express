import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSmartphone, FiGift, FiZap, FiDownload } from 'react-icons/fi';

const AppDownloadSection = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    const handleInstall = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                setDeferredPrompt(null);
            });
        } else {
            alert("To install: Open this site in Chrome and click 'Add to Home Screen' in settings.");
        }
    };

    return (
        <section className="app-promo-section">
            <div className="app-promo-container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="app-promo-content"
                >
                    <div className="app-promo-text">
                        <h2 className="promo-title">Experience <span className="text-highlight">Food Express</span> on Mobile</h2>
                        <p className="promo-subtitle">
                            Get the fastest ordering experience with our high-performance web app. No store download needed!
                        </p>

                        <div className="promo-features">
                            <div className="p-feature">
                                <div className="p-icon-v2"><FiZap /></div>
                                <span>Lightning Fast Ordering</span>
                            </div>
                            <div className="p-feature">
                                <div className="p-icon-v2"><FiGift /></div>
                                <span>Exclusive Mobile Offers</span>
                            </div>
                            <div className="p-feature">
                                <div className="p-icon-v2"><FiSmartphone /></div>
                                <span>Real-time Order Tracking</span>
                            </div>
                        </div>

                        <button className="download-btn-premium" onClick={handleInstall}>
                            <FiDownload className="btn-icon-large" />
                            <div className="btn-label-group">
                                <span className="btn-tagline">Web App</span>
                                <span className="btn-main-text">Install Now</span>
                            </div>
                        </button>
                    </div>

                    <div className="app-promo-visual">
                        <div className="visual-glow-v2"></div>
                        <div className="phone-mockup-v2">
                            <div className="phone-bezel">
                                <div className="phone-screen-v2">
                                    <div className="app-splash">
                                        <img src="/logo.png" alt="App Content" className="floating-logo" />
                                        <div className="loading-bar-mini"></div>
                                        <p className="app-tagline">Optimized for mobile</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default AppDownloadSection;
