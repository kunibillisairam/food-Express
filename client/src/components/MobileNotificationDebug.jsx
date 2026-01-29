import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { requestForToken } from '../firebase';


const MobileNotificationDebug = ({ user, updateUser }) => {
    const [status, setStatus] = useState('checking');
    const [tokenExists, setTokenExists] = useState(false);

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
            }
        };
        check();
        const interval = setInterval(check, 2000);
        return () => clearInterval(interval);
    }, [user]);

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
                    {tokenExists ? '📡 LINKED' : '🔌 NO TOKEN'}
                </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '15px' }}>
                {status === 'denied' && "You blocked notifications. Please reset them in Browser Settings."}
                {status === 'default' && "Tap 'Enable' below to allow permissions."}
                {status === 'granted' && !tokenExists && "Permission granted but no connection. Tap Re-Sync."}
            </div>

            <button
                onClick={async () => {
                    try {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                            const token = await requestForToken();
                            if (token) {
                                alert("✅ Success! ID: " + token.slice(0, 6) + "...");
                                updateUser({ fcmToken: token });
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
                    marginBottom: '10px',
                    display: status === 'granted' && tokenExists ? 'none' : 'block'
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%'
                }}
            >
                🚀 Test {user.username}'s Devices
            </button>
        </div>
    );
};

export default MobileNotificationDebug;
