import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiMapPin, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NotificationPrompt = () => {
    // Initial state true to "block" until we verify. 
    // We'll flip it to false immediately if we find permissions are already handled.
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const checkPermissionStatus = () => {
            const storedStatus = localStorage.getItem('permissionStatus');
            const browserPermission = 'Notification' in window ? Notification.permission : 'default';

            // If user already made a choice in our app, or browser permission is already settled (granted/denied)
            // We consider the flow complete.
            if (storedStatus || browserPermission !== 'default') {
                setIsVisible(false);
            } else {
                // No stored status AND browser is 'default', so we must ask
                // Small delay for better UX on app open
                setTimeout(() => setIsVisible(true), 800);
            }
        };

        checkPermissionStatus();
    }, []);

    const handleAllow = async () => {
        try {
            // We save 'allowed' locally FIRST, as per "Save decision locally" requirement before browser prompt optionally?
            // unique logic: The user wants "User clicks Allow -> Save decision -> Show website".
            // But usually we need the ACTUAL browser permission.
            // We'll try to get browser permission.

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

                // Optional: Send a welcome notification
                try {
                    new Notification('Welcome to Food Express!', {
                        body: 'You are all set for real-time updates!',
                        icon: '/pwa-192x192.png'
                    });
                } catch (e) { /* ignore */ }

            } else {
                // User clicked "Allow" on our UI but "Block" on browser prompt
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

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center pointer-events-auto">

                    {/* 
                      1. Background Blur / Overlay
                      "Background website should be blurred and disabled" 
                    */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-slate-900/80"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* 
                      2. Permission Card 
                    */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        className="
                            relative z-10 w-full sm:w-auto sm:max-w-md sm:rounded-3xl 
                            rounded-t-3xl bg-[#ffffff] dark:bg-[#1e272e] 
                            border-t border-x sm:border border-white/10 
                            shadow-2xl overflow-hidden
                        "
                        style={{
                            boxShadow: "0 -20px 40px -10px rgba(0,0,0,0.5)"
                        }}
                    >
                        {/* Brand Decorative Header */}
                        <div className="h-2 bg-[#ff4757] w-full" />

                        <div className="p-8 flex flex-col items-center text-center relative">

                            {/* Icon with Ring Animation */}
                            <div className="relative mb-6">
                                <motion.div
                                    animate={{
                                        boxShadow: ["0 0 0 0px rgba(255, 71, 87, 0.4)", "0 0 0 20px rgba(255, 71, 87, 0)"]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg text-white text-3xl"
                                    style={{ background: 'linear-gradient(135deg, #ff4757, #ff6b81)' }}
                                >
                                    <FiBell />
                                </motion.div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#2ed573] rounded-full flex items-center justify-center text-white text-sm border-2 border-white shadow-sm">
                                    <FiCheck />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                                Enable Updates
                            </h2>

                            {/* Subtitle */}
                            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                                Give us permission to update you on your food delivery status in real-time.
                            </p>

                            {/* Action Buttons */}
                            <div className="w-full space-y-3">
                                <button
                                    onClick={handleAllow}
                                    className="
                                        w-full py-4 px-6 rounded-xl font-bold text-lg
                                        text-white shadow-lg
                                        transform active:scale-[0.98] transition-all
                                        flex items-center justify-center gap-2
                                    "
                                    style={{
                                        background: 'linear-gradient(to right, #ff4757, #ff6b81)',
                                        boxShadow: '0 10px 20px rgba(255, 71, 87, 0.3)'
                                    }}
                                >
                                    Allow Access
                                </button>

                                <button
                                    onClick={handleNotNow}
                                    className="
                                        w-full py-4 px-6 rounded-xl font-medium text-base
                                        text-slate-500 hover:text-slate-700 dark:text-slate-400
                                        hover:bg-slate-100 dark:hover:bg-slate-800
                                        active:scale-[0.98] transition-all
                                    "
                                >
                                    Not Now
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NotificationPrompt;
