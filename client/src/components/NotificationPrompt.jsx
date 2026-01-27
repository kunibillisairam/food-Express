import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NotificationPrompt = () => {
    // Initial state set to false, will check conditions to show
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const checkPermissionStatus = () => {
            const storedStatus = localStorage.getItem('permissionStatus');
            const browserPermission = 'Notification' in window ? Notification.permission : 'default';

            // Check if app is "downloaded" / installed (running in standalone mode)
            // Note: This check might prevent it from showing in browser. 
            // If user wants it to show in browser too, we can remove 'isStandalone' check or make it optional.
            // For now, I'll relax the 'isStandalone' requirement to ensure the user sees it (since they are debugging).
            // But we will respect the storage.

            if (storedStatus || browserPermission !== 'default') {
                setIsVisible(false);
            } else {
                // Show after delay
                setTimeout(() => setIsVisible(true), 1500);
            }
        };

        checkPermissionStatus();
    }, []);

    const handleAllow = async () => {
        try {
            let permission = 'default';
            if ('Notification' in window) {
                permission = await Notification.requestPermission();
            }

            if (permission === 'granted') {
                localStorage.setItem('permissionStatus', 'allowed');
                toast.success('Awesome! You will receive order updates.', {
                    icon: '🔔',
                    style: {
                        background: '#ff4757',
                        color: 'white',
                    },
                });

                try {
                    new Notification('Welcome to Food Express!', {
                        body: 'You are all set for real-time updates!',
                        icon: '/pwa-192x192.png'
                    });
                } catch (e) { /* ignore */ }

            } else {
                localStorage.setItem('permissionStatus', 'denied');
                toast.error('Notifications were denied by browser.');
            }
        } catch (error) {
            console.error('Permission request error:', error);
            localStorage.setItem('permissionStatus', 'denied');
        } finally {
            closeModal();
        }
    };

    const handleNotNow = () => {
        localStorage.setItem('permissionStatus', 'denied');
        toast('Maybe next time!', { icon: '👋' });
        closeModal();
    };

    const closeModal = () => {
        setIsExiting(true);
        setTimeout(() => setIsVisible(false), 500);
    };

    if (!isVisible && !isExiting) return null;

    // Inline Styles
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
            maxWidth: '450px',
            background: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 10001
        },
        headerBar: {
            height: '8px',
            width: '100%',
            background: '#ff4757'
        },
        content: {
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            color: '#1e293b' // slate-800
        },
        iconRing: {
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '2rem',
            marginBottom: '1.5rem',
            position: 'relative',
            boxShadow: '0 10px 15px -3px rgba(255, 71, 87, 0.3)'
        },
        checkBadge: {
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '32px',
            height: '32px',
            background: '#2ed573',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.9rem',
            border: '3px solid white'
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: '800',
            marginBottom: '0.75rem',
            color: '#1e293b'
        },
        description: {
            fontSize: '1rem',
            color: '#64748b', // slate-500
            marginBottom: '2rem',
            lineHeight: 1.6
        },
        buttonPrimary: {
            width: '100%',
            padding: '1rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(to right, #ff4757, #ff6b81)',
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(255, 71, 87, 0.3)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.1s'
        },
        buttonSecondary: {
            width: '100%',
            padding: '1rem',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: '#64748b',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div style={styles.overlay}>
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300
                        }}
                        style={styles.card}
                    >
                        {/* Brand Decorative Header */}
                        <div style={styles.headerBar} />

                        <div style={styles.content}>

                            {/* Icon with Ring */}
                            <div style={styles.iconRing}>
                                <FiBell />
                                <div style={styles.checkBadge}>
                                    <FiCheck />
                                </div>
                            </div>

                            <h2 style={styles.title}>Enable Updates</h2>
                            <p style={styles.description}>
                                Give us permission to update you on your food delivery status in real-time.
                            </p>

                            <button
                                onClick={handleAllow}
                                style={styles.buttonPrimary}
                                onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
                                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                <FiBell /> Allow Access
                            </button>

                            <button
                                onClick={handleNotNow}
                                style={styles.buttonSecondary}
                                onMouseOver={(e) => e.target.style.background = '#f1f5f9'} // Hover effect
                                onMouseOut={(e) => e.target.style.background = 'transparent'}
                            >
                                Not Now
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NotificationPrompt;
