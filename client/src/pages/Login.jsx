import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Login = ({ setView }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await login(username, password);
        if (res.success) {
            setView('home');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="auth-split-wrapper fade-in">
            <div className="auth-split-left"></div>
            <div className="auth-split-right">
                <div className="auth-card">
                    <h2 className="auth-header">Welcome Back</h2>
                    <form onSubmit={handleLogin}>
                        <input className="auth-input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
                        <input className="auth-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                        {error && <p style={{ color: '#ff4757', fontWeight: 'bold' }}>{error}</p>}
                        <button className="auth-submit-btn">Login</button>
                    </form>
                    <div className="switch-auth">
                        New here? <span onClick={() => setView('signup')}>Create an account</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
