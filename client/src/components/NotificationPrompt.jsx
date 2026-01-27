import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiMapPin, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NotificationPrompt = () => {
    // Initial state true to "block" until we verify. 
    // We'll flip it to false immediately if we find permissions are already handled.
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const checkPermissionStatus = () => {
            const storedStatus = localStorage.getItem('permissionStatus');
            const browserPermission = Notification.permission;

            // If user already made a choice in our app, or browser permission is already settled (granted/denied)
            // We consider the flow complete.
            if (storedStatus || browserPermission !== 'default') {
                setIsVisible(false);
            } else {
                // No stored status AND browser is 'default', so we must ask
                setIsVisible(true);
            }
        };

        checkPermissionStatus();
    }, []);

    const handleAllow = async () => {
        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                localStorage.setItem('permissionStatus', 'allowed');
                toast.success('Notifications enabled! You\'re all set.', {
                    icon: '🔔',
                    style: {
                        background: '#10B981',
                        color: 'white',
                    },
                });

                // Optional: Send a welcome notification
                new Notification('Welcome to Food Express!', {
                    body: 'You will now receive updates about your orders.',
                    icon: '/pwa-192x192.png' // Assuming standard PWA icon name
                });

            } else {
                // User clicked "Allow" on our UI but "Block" on browser prompt
                localStorage.setItem('permissionStatus', 'denied');
                toast.error('Notifications were denied by browser settings.');
            }
        } catch (error) {
            console.error('Permission request error:', error);
            // Fallback: save as denied so we don't loop
            localStorage.setItem('permissionStatus', 'denied');
        } finally {
            closeModal();
        }
    };

    const handleNotNow = () => {
        localStorage.setItem('permissionStatus', 'denied'); // Or 'later' if you want to re-ask in future sessions
        toast('Maybe next time!', { icon: '👋' });
        closeModal();
    };

    const closeModal = () => {
        setIsExiting(true);
        setTimeout(() => setIsVisible(false), 500); // Wait for animation
    };

    if (!isVisible && !isExiting) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-auto">

                    {/* 
                      1. Background Blur / Overlay
                      "Background website should be blurred and disabled" 
                    */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-slate-900/60"
                    // We block clicks here so they MUST choose an option
                    />

                    {/* 
                      2. Permission Card 
                      Bottom Sheet on Mobile, Center Card on Desktop
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
                            rounded-t-3xl bg-white/90 dark:bg-slate-900/90 
                            backdrop-blur-xl border-t border-x sm:border border-white/20 
                            shadow-2xl overflow-hidden
                        "
                        style={{
                            boxShadow: "0 -20px 40px -10px rgba(0,0,0,0.5)"
                        }}
                    >
                        {/* Decorative Gradient Orb */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 bg-gradient-to-b from-orange-500/20 to-transparent opacity-60 pointer-events-none" />

                        <div className="p-8 flex flex-col items-center text-center relative">

                            {/* Icon with Ring Animation */}
                            <div className="relative mb-6">
                                <motion.div
                                    animate={{
                                        boxShadow: ["0 0 0 0px rgba(249, 115, 22, 0.4)", "0 0 0 20px rgba(249, 115, 22, 0)"]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-20 h-20 bg-gradient-to-tr from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40 text-white text-3xl"
                                >
                                    <FiBell />
                                </motion.div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm border-2 border-slate-900 shadow-sm">
                                    <FiMapPin />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                                Enable Notifications 🔔
                            </h2>

                            {/* Subtitle */}
                            <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                                Get real-time updates about your orders, exclusive offers, and live delivery tracking status.
                            </p>

                            {/* Action Buttons */}
                            <div className="w-full space-y-3">
                                <button
                                    onClick={handleAllow}
                                    className="
                                        w-full py-4 px-6 rounded-xl font-bold text-lg
                                        bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700
                                        text-white shadow-lg shadow-orange-500/30
                                        transform active:scale-[0.98] transition-all
                                        flex items-center justify-center gap-2
                                    "
                                >
                                    Allow Access
                                </button>

                                <button
                                    onClick={handleNotNow}
                                    className="
                                        w-full py-4 px-6 rounded-xl font-medium text-base
                                        text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                                        hover:bg-slate-100/50 dark:hover:bg-slate-800/50
                                        active:scale-[0.98] transition-all
                                    "
                                >
                                    Not Now
                                </button>
                            </div>

                            {/* Footer micro-copy */}
                            <p className="mt-6 text-xs text-slate-400">
                                You can change this anytime in settings.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NotificationPrompt;
