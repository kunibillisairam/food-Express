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
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="app-promo-content"
                >
                    <div className="app-promo-text">
                        <h2 className="promo-title">Get Our Official App</h2>
                        <p className="promo-subtitle">
                            Download for faster ordering and exclusive deals.
                        </p>

                        <button className="download-btn-premium" onClick={handleInstall}>
                            <FiDownload className="btn-icon" />
                            <div>
                                <span className="btn-small">Web App</span>
                                <span className="btn-large">Install Now</span>
                            </div>
                        </button>
                    </div>

                    <div className="app-promo-visual">
                        <div className="phone-mockup">
                            <div className="phone-screen">
                                <img src="/logo.png" alt="App Content" className="screen-logo" />
                                <p style={{ fontSize: '0.6rem', color: '#94a3b8', textAlign: 'center' }}>Optimized for mobile</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default AppDownloadSection;
