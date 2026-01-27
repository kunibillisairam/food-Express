import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password });
            if (res.data.success) {
                const loggedInUser = res.data.user;

                // Sync FCM Token if exists in temp storage
                const tempToken = localStorage.getItem('tempFcmToken');
                if (tempToken) {
                    try {
                        await axios.put(`${API_BASE_URL}/api/users/${loggedInUser.username}`, { fcmToken: tempToken });
                        loggedInUser.fcmToken = tempToken; // Update local object
                        localStorage.removeItem('tempFcmToken');
                    } catch (syncErr) {
                        console.error("Failed to sync FCM token on login", syncErr);
                    }
                }

                setUser(loggedInUser);
                localStorage.setItem('user', JSON.stringify(loggedInUser));
                return { success: true, role: loggedInUser.role };
            }
        } catch (err) {
            console.error("Login Error:", err);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed';
            return { success: false, message: msg };
        }
    };

    const signup = async (userData) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, userData);
            return { success: true };
        } catch (err) {
            console.error("Signup Error:", err);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Signup failed';
            return { success: false, message: msg };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
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
        <AuthContext.Provider value={{ user, login, signup, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
