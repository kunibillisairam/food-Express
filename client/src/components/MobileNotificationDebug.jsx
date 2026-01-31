import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { requestForToken } from '../firebase';


const MobileNotificationDebug = ({ user, updateUser }) => {
    const [status, setStatus] = useState('checking');
    const [tokenExists, setTokenExists] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        const check = () => {
            if (!('Notification' in window)) {
                setStatus('unsupported');
                return;
            }
            setStatus(Notification.permission);
            // Check if user has token in DB or LocalStorage
            if (user?.fcmTokens?.length > 0 || user?.fcmToken || localStorage.getItem('tempFcmToken')) {
                setTokenExists(true);
            } else {
                setTokenExists(false);
            }
        };
        check();
        const interval = setInterval(check, 2000);
        return () => clearInterval(interval);
    }, [user]);

    const handleUnregisterSW = async () => {
        if (!confirm("This will unregister the notification service worker. Continue?")) return;
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (let reg of regs) {
                await reg.unregister();
            }
            alert("✅ Service Worker(s) unregistered. Refresh the page to re-register.");
            window.location.reload();
        } catch (e) {
            alert("Error: " + e.message);
        }
    };

    const handleClearBackendTokens = async () => {
        if (!confirm("This will delete all stored device IDs from your account on our server. Continue?")) return;
        setIsClearing(true);
        try {
            await axios.post(`${API_BASE_URL}/api/users/clear-fcm-tokens`, { username: user.username });
            alert("✅ Backend tokens cleared. Now perform 'Re-Sync' to add this device back.");
            window.location.reload();
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #e9ecef',
            textAlign: 'center',
            marginTop: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#495057' }}>Notification Status</h3>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                <div style={{ padding: '5px 10px', borderRadius: '8px', background: status === 'granted' ? '#d1fae5' : '#fee2e2', color: status === 'granted' ? '#065f46' : '#991b1b', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {status === 'granted' ? '✅ PERMISSION GRANTED' : (status === 'denied' ? '❌ BLOCKED' : '⚠️ ' + status.toUpperCase())}
                </div>
                <div style={{ padding: '5px 10px', borderRadius: '8px', background: tokenExists ? '#dbeafe' : '#f3f4f6', color: tokenExists ? '#1e40af' : '#6b7280', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {tokenExists ? `📡 LINKED (${user?.fcmTokens?.length || (user?.fcmToken ? 1 : 0)})` : '🔌 NO TOKEN'}
                </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '15px' }}>
                {status === 'denied' && "You blocked notifications. Please reset them in Browser Settings."}
                {status === 'default' && "Tap 'Enable' below to allow permissions."}
                {status === 'granted' && !tokenExists && "Permission granted but no connection. Tap Re-Sync."}
                {status === 'granted' && tokenExists && "System is active. If still failing, try 'Clean Reset' below."}
            </div>

            <button
                onClick={async () => {
                    try {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                            const token = await requestForToken();
                            if (token) {
                                alert("✅ Success! ID: " + token.slice(0, 6) + "...");
                                await axios.post(`${API_BASE_URL}/api/users/save-fcm-token`, {
                                    username: user.username,
                                    token
                                });
                                setTokenExists(true);
                            } else {
                                alert("❌ Failed to get token. Check Internet or Add to Home Screen (iOS).");
                            }
                        } else {
                            alert("⚠️ Permission denied/dismissed.");
                        }
                    } catch (e) {
                        alert(`Error: ${e.message}`);
                    }
                }}
                style={{
                    background: '#2d3436',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    width: '100%',
                    marginBottom: '10px'
                }}
            >
                {status === 'granted' ? '🔄 Re-Sync Connection' : '🔔 Enable Notifications'}
            </button>

            <button
                onClick={async () => {
                    try {
                        const res = await axios.post(`${API_BASE_URL}/api/users/test-notification`, { username: user.username });
                        if (res.data.success) {
                            alert(`✅ Server Sent! (Success: ${res.data.sent}, Failed: ${res.data.failed})`);
                        } else {
                            alert(`⚠️ Server sent 0. No registered devices found.`);
                        }
                    } catch (e) {
                        alert(`❌ Error: ${e.response?.data?.error || e.message}`);
                    }
                }}
                style={{
                    background: '#6c5ce7',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    width: '100%',
                    marginBottom: '10px'
                }}
            >
                🚀 Test My Devices
            </button>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <button
                    onClick={handleUnregisterSW}
                    style={{ flex: 1, padding: '8px', fontSize: '0.7rem', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
                    Reset SW
                </button>
                <button
                    onClick={handleClearBackendTokens}
                    disabled={isClearing}
                    style={{ flex: 1, padding: '8px', fontSize: '0.7rem', background: '#fff5f5', border: '1px solid #feb2b2', color: '#c53030', borderRadius: '8px', cursor: 'pointer' }}>
                    {isClearing ? '...' : 'Clear DB Tokens'}
                </button>
            </div>
        </div>
    );
};

export default MobileNotificationDebug;
