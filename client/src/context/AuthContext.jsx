import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (username, password) => {
        // Admin check logic
        if (username === 'admin' && password === 'admin') {
            const adminUser = { username: 'admin', role: 'admin' };
            setUser(adminUser);
            localStorage.setItem('user', JSON.stringify(adminUser));
            return { success: true, role: 'admin' };
        }

        // Normal User Check
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const foundUser = users.find(u => u.username === username && u.password === password);

        if (foundUser) {
            const userObj = { ...foundUser, role: 'user' }; // Keep all properties like address
            setUser(userObj);
            localStorage.setItem('user', JSON.stringify(userObj));
            return { success: true, role: 'user' };
        }

        return { success: false, message: 'Invalid Request credentials' };
    };

    const signup = (userData) => {
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        if (users.find(u => u.username === userData.username)) {
            return { success: false, message: 'User already exists' };
        }
        users.push(userData);
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const updateUser = (updates) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Update current session

        if (user.role === 'user') {
            // Update persistent storage
            const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const index = users.findIndex(u => u.username === user.username);
            if (index !== -1) {
                // Merge updates into the stored user record
                users[index] = { ...users[index], ...updates };
                localStorage.setItem('registeredUsers', JSON.stringify(users));
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
