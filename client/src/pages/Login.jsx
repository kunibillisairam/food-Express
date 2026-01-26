import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = ({ setView }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await login(username, password);
            if (res.success) {
                setView('home');
            } else {
                setError(res.message);
            }
        } finally {
            setLoading(false);
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
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                className="auth-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', paddingRight: '40px' }}
                            />
                            <span
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    cursor: 'pointer',
                                    color: 'rgba(0, 255, 255, 0.6)',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                            </span>
                        </div>
                        {error && <p style={{ color: '#ff4757', fontWeight: 'bold' }}>{error}</p>}
                        <button className="auth-submit-btn" disabled={loading}>
                            {loading ? <div className="spinner-mini" style={{ margin: '0 auto', borderColor: '#fff', borderTopColor: 'transparent' }}></div> : 'Login'}
                        </button>
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
