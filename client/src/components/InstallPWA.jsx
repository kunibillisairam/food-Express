import React, { useEffect, useState } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPWA = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Android / Chrome
        const handler = (e) => {
            e.preventDefault();
            setSupportsPWA(true);
            setPromptInstall(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Detection
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

        if (isIosDevice && !isStandalone) {
            setIsIOS(true);
            setSupportsPWA(true); // Treat as supported so UI shows
        }

        // Show prompt after 3s
        const timer = setTimeout(() => {
            if (isIosDevice && !isStandalone) {
                setIsVisible(true);
            } else if (promptInstall) {
                // Logic handled by the event listener effect implicitly? 
                // Actually promptInstall state might update later. 
                // Let's rely on the existence of promptInstall or isIOS to trigger visibility
            }
        }, 3000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(timer);
        };
    }, []);

    // Watch for changes to trigger visibility for Android
    useEffect(() => {
        if (promptInstall) {
            setTimeout(() => setIsVisible(true), 3000);
        }
    }, [promptInstall]);

    const onClick = (e) => {
        e.preventDefault();
        if (!promptInstall) return;
        promptInstall.prompt();
        promptInstall.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA install');
                localStorage.setItem('pwa_installed', 'true');
            } else {
                console.log('User dismissed the PWA install');
            }
            setIsVisible(false);
        });
    };

    const dismissPrompt = () => {
        setIsVisible(false);
    };

    // Inline Styles for Consistency & Premium Look
    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.8)', // slate-900/80
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 1
        },
        card: {
            position: 'relative',
            width: '90%',
            maxWidth: '400px',
            background: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 10001,
            padding: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        },
        iconContainer: {
            width: '64px',
            height: '64px',
            background: '#ff4757',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 10px 15px -3px rgba(255, 71, 87, 0.3)'
        },
        icon: {
            width: '32px',
            height: '32px',
            objectFit: 'contain'
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '0.5rem'
        },
        description: {
            fontSize: '1rem',
            color: '#64748b',
            marginBottom: '2rem',
            lineHeight: 1.5
        },
        buttonPrimary: {
            width: '100%',
            padding: '1rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(to right, #ff4757, #ff6b81)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(255, 71, 87, 0.3)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        },
        buttonSecondary: {
            width: '100%',
            padding: '0.8rem',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer'
        }
    };

    if (!supportsPWA) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div style={styles.overlay}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={styles.card}
                    >
                        <div style={styles.iconContainer}>
                            <img src="/logo.png" alt="App Icon" style={styles.icon} />
                        </div>

                        <h3 style={styles.title}>
                            {isIOS ? 'Install on iOS' : 'Install App'}
                        </h3>

                        <p style={styles.description}>
                            {isIOS
                                ? "Tap 'Share' then 'Add to Home Screen' to get the best experience."
                                : "Install Food Express for a faster, premium experience on your device."}
                        </p>

                        {!isIOS && (
                            <button
                                onClick={onClick}
                                style={styles.buttonPrimary}
                            >
                                <FiDownload /> Install Now
                            </button>
                        )}

                        <button
                            onClick={dismissPrompt}
                            style={styles.buttonSecondary}
                        >
                            <FiX style={{ marginRight: 4 }} /> Maybe Later
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InstallPWA;
