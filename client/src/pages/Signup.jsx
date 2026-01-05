import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Signup = ({ setView }) => {
    const [formData, setFormData] = useState({ username: '', phone: '', password: '' });
    const { signup } = useContext(AuthContext);
    const [error, setError] = useState('');

    const handleSignup = (e) => {
        e.preventDefault();
        if (formData.username && formData.phone && formData.password) {
            const res = signup(formData);
            if (res.success) {
                alert('Signup successful! Please login.');
                setView('login');
            } else {
                setError(res.message);
            }
        }
    };

    return (
        <div className="auth-wrapper fade-in">
            <div className="auth-card">
                <h2 className="auth-header">Create Account</h2>
                <form onSubmit={handleSignup}>
                    <input className="auth-input" placeholder="Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                    <input className="auth-input" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                    <input className="auth-input" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    {error && <p style={{ color: '#ff4757', fontWeight: 'bold' }}>{error}</p>}
                    <button className="auth-submit-btn">Sign Up</button>
                </form>
                <div className="switch-auth">
                    Already have an account? <span onClick={() => setView('login')}>Login</span>
                </div>
            </div>
        </div>
    );
};

export default Signup;
