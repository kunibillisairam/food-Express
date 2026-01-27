import React, { useEffect, useState } from 'react';
import { FiBell, FiX, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const NotificationPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkPermission = () => {
            // Check if app is in standalone mode (installed)
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone ||
                document.referrer.includes('android-app://');

            // Check if permission is not yet granted or denied
            const isPermissionDefault = Notification.permission === 'default';

            // Check if we haven't dismissed it recently (optional, good UX)
            const hasDismissed = localStorage.getItem('notification-prompt-dismissed');

            // For testing purposes, we might want to skip isStandalone check or make it optional
            // But per user request "if the user is downloaded and opened an app", we should keep it.
            // However, to ensure it works for many users, we usually ask on mobile even if not installed.
            // Let's stick strict to "downloaded and opened" for now, which implies standalone.

            if (isStandalone && isPermissionDefault && !hasDismissed) {
                // Show after a small delay to not overwhelm on launch
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 3000);
                return () => clearTimeout(timer);
            }
        };

        checkPermission();
    }, []);

    const handleAllow = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                toast.success('Notifications enabled! We will keep you updated.', {
                    icon: '🔔',
                    style: {
                        background: '#10B981',
                        color: 'white',
                    },
                });
                // Send a test notification
                new Notification('Welcome to Food Express!', {
                    body: 'You will now receive updates about your orders and offers.',
                    icon: '/logo.png'
                });
            } else {
                toast.error('Notifications denied.', {
                    icon: '🔕'
                });
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        } finally {
            setIsVisible(false);
        }
    };

    const handleDeny = () => {
        setIsVisible(false);
        localStorage.setItem('notification-prompt-dismissed', 'true');
        toast('Maybe later!', {
            icon: '👋',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
                        onClick={handleDeny}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2001] w-[90%] max-w-sm"
                    >
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-4 text-2xl">
                                    <FiBell />
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Enable Notifications?
                                </h3>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                    Stay updated with your order status, exclusive offers, and lightning-fast delivery alerts!
                                </p>

                                <div className="flex flex-col w-full gap-3">
                                    <button
                                        onClick={handleAllow}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                                    >
                                        <FiCheck size={18} />
                                        Allow Notifications
                                    </button>

                                    <button
                                        onClick={handleDeny}
                                        className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                                    >
                                        Don't Allow
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationPrompt;
