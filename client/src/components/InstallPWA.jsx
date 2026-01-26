import React, { useEffect, useState } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPWA = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setSupportsPWA(true);
            setPromptInstall(e);
            // Show the prompt after 5 seconds of the user being on the page
            setTimeout(() => {
                const dismissed = localStorage.getItem('pwa-prompt-dismissed');
                if (!dismissed) {
                    setIsVisible(true);
                }
            }, 5000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

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
        localStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    if (!supportsPWA) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md"
                >
                    <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <img src="/logo.png" alt="App Icon" className="w-8 h-8 object-contain" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Install Food Express</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Get the best experience on your phone!</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClick}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                            >
                                <FiDownload /> Install
                            </button>
                            <button
                                onClick={dismissPrompt}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPWA;
