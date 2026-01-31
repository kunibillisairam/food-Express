import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            // Sync FCM Token immediately if user is already logged in (keeps token fresh)
            const syncToken = async () => {
                const { requestForToken } = await import('../firebase');
                const token = await requestForToken();
                if (token) {
                    try {
                        await axios.post(`${API_BASE_URL}/api/users/save-fcm-token`, {
                            username: parsedUser.username,
                            token
                        });
                        console.log("🔄 FCM Token synced on app load");
                    } catch (err) {
                        console.warn("FCM Sync failed on load", err.message);
                    }
                }
            };
            syncToken();
        }
    }, []);

    const login = async (phone, password) => {
        try {
            // Updated to use phone+password
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { phone, password });
            if (res.data.success) {
                const loggedInUser = res.data.user;

                setUser(loggedInUser);
                localStorage.setItem('user', JSON.stringify(loggedInUser));

                // Always try to get a fresh token on login and associate it
                try {
                    const { requestForToken } = await import('../firebase');
                    const freshToken = await requestForToken();
                    if (freshToken) {
                        await axios.post(`${API_BASE_URL}/api/users/save-fcm-token`, {
                            username: loggedInUser.username,
                            token: freshToken
                        });
                        console.log("✅ FCM Token re-associated on successful login");
                        localStorage.removeItem('tempFcmToken');
                    }
                } catch (tokErr) {
                    console.warn("Post-login FCM sync failed", tokErr);
                }

                return { success: true, role: loggedInUser.role };
            }
        } catch (err) {
            console.error("Login Error:", err);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed';
            return { success: false, message: msg };
        }
    };

    // New Forgot Password Methods
    const forgotPassword = async (email) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
            return { success: true, message: res.data.message };
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to send OTP';
            return { success: false, message: msg };
        }
    };

    const verifyOtp = async (email, otp) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, { email, otp });
            return { success: true, message: res.data.message };
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid OTP';
            return { success: false, message: msg };
        }
    };

    const resetPassword = async (email, otp, newPassword) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { email, otp, newPassword });
            return { success: true, message: res.data.message };
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to reset password';
            return { success: false, message: msg };
        }
    };

    const signup = async (userData) => {
        try {
            console.log(`[AuthContext] Sending signup request to: ${API_BASE_URL}/api/auth/signup`, userData);
            const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, userData);
            return { success: true };
        } catch (err) {
            console.error("Signup Error Detail:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            const msg = err.response?.data?.message || err.response?.data?.error || 'Signup failed';
            return { success: false, message: msg };
        }
    };

    const logout = async () => {
        // Try to remove FCM token from backend before clearing local state
        try {
            const { requestForToken } = await import('../firebase');
            const token = await requestForToken();
            if (user && token) {
                await axios.post(`${API_BASE_URL}/api/auth/logout`, {
                    username: user.username,
                    token
                });
            }
        } catch (err) {
            console.warn("Backend logout notification failed", err.message);
        }

        setUser(null);
        localStorage.removeItem('user');
        // Clear anything related to notifications permission history if needed
        // localStorage.removeItem('permissionStatus');
    };

    const updateUser = async (updates) => {
        if (!user) return;

        try {
            // Optimistic update locally
            const updatedLocalUser = { ...user, ...updates };
            setUser(updatedLocalUser);
            localStorage.setItem('user', JSON.stringify(updatedLocalUser));

            // Sync with DB
            await axios.put(`${API_BASE_URL}/api/users/${user.username}`, updates);
        } catch (err) {
            console.error("Failed to update user", err);
            // Optionally revert local state here if strict consistency is needed
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            signup,
            logout,
            updateUser,
            forgotPassword,
            verifyOtp,
            resetPassword
        }}>
            {children}
        </AuthContext.Provider>
    );
};
