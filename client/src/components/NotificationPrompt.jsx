import React, { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { requestForToken } from '../firebase';
import { AuthContext } from '../context/AuthContext';

const NotificationPrompt = () => {
    // Initial state set to false, will check conditions to show
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const { updateUser, user } = useContext(AuthContext);

    useEffect(() => {
        console.log('[NotificationPrompt] Component Mounted - vRefreshed');
        const checkPermissionStatus = () => {
            // AGGRESSIVE MODE: Always ask if permission is 'default' (Unanswered)
            // We ignore localStorage history to ensure the user is prompted immediately on app open
            // until they explicitly Grant or Deny at the browser level.

            const browserPermission = 'Notification' in window ? Notification.permission : 'default';

            console.log('[NotificationPrompt] Status:', browserPermission);

            if (browserPermission === 'default') {
                // Show prompt immediately for faster engagement (100ms)
                setTimeout(() => setIsVisible(true), 100);
            } else {
                console.log('[NotificationPrompt] Permission already determined:', browserPermission);
            }
        };

        checkPermissionStatus();
    }, []);

    const handleAllow = async () => {
        setIsLoading(true);
        try {
            // 1. Request Permission immediately
            let permission = 'default';
            if ('Notification' in window) {
                permission = await Notification.requestPermission();
            }

            if (permission !== 'granted') {
                localStorage.setItem('permissionStatus', 'denied');
                toast.error('Notifications were denied.');
                setIsLoading(false);
                closeModal();
                return;
            }

            // 2. Permission Granted! 
            // Optimistic UI: Close modal immediately so user feels it's done.
            localStorage.setItem('permissionStatus', 'allowed');
            closeModal();

            // Show a loading toast that we will update later
            const toastId = toast.loading('Connecting to notification server...');

            // 3. Background: Get Token & Save (This takes time, but user is already back in app)
            setTimeout(async () => {
                try {
                    const token = await requestForToken();
                    console.log('🔔 [FCM TOKEN]:', token ? 'Generated' : 'Failed');

                    if (token) {
                        if (user) {
                            await updateUser({ fcmToken: token });
                        } else {
                            localStorage.setItem('tempFcmToken', token);
                        }

                        // Update the loading toast to success
                        toast.success('You are all set for updates!', {
                            id: toastId,
                            icon: '🔔',
                            style: { background: '#ff4757', color: 'white' }
                        });

                        // Send welcome ping
                        try {
                            new Notification('Welcome to Food Express!', {
                                body: 'Real-time updates enabled!',
                                icon: '/pwa-192x192.png'
                            });
                        } catch (e) { }

                    } else {
                        toast.error('Could not generate token.', { id: toastId });
                    }
                } catch (bgError) {
                    console.error('Background Token Error:', bgError);
                    toast.error('Setup failed slightly.', { id: toastId });
                }
            }, 100);

        } catch (error) {
            console.error('Permission request error:', error);
            setIsLoading(false); // Only needed if we crashed before optimistic close
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
            background: isLoading ? '#bdc3c7' : 'linear-gradient(to right, #ff4757, #ff6b81)',
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: isLoading ? 'wait' : 'pointer',
            boxShadow: isLoading ? 'none' : '0 10px 20px rgba(255, 71, 87, 0.3)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.1s',
            opacity: isLoading ? 0.7 : 1
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
                            damping: 20, // Reduced for snappier feel
                            stiffness: 400 // Increased for snappier feel
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
                                disabled={isLoading}
                                style={styles.buttonPrimary}
                                onMouseDown={(e) => !isLoading && (e.target.style.transform = 'scale(0.98)')}
                                onMouseUp={(e) => !isLoading && (e.target.style.transform = 'scale(1)')}
                                onMouseLeave={(e) => !isLoading && (e.target.style.transform = 'scale(1)')}
                            >
                                {isLoading ? (
                                    <>⏳ Enabling...</>
                                ) : (
                                    <><FiBell /> Allow Access</>
                                )}
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
// End of component
