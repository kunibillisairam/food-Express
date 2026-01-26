import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Signup = ({ setView }) => {
    const [formData, setFormData] = useState({ username: '', phone: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signup } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.phone.length !== 10) {
            setError("Phone number must be exactly 10 digits");
            setLoading(false);
            return;
        }

        if (formData.username && formData.phone && formData.password) {
            try {
                const res = await signup({
                    username: formData.username,
                    phone: formData.phone,
                    password: formData.password
                });

                if (res.success) {
                    alert('Signup successful! Please login.');
                    setView('login');
                } else {
                    setError(res.message);
                }
            } catch (err) {
                setError("An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };


    return (
        <div className="auth-split-wrapper fade-in">
            <div className="auth-split-left"></div>
            <div className="auth-split-right">
                <div className="auth-card">
                    <h2 className="auth-header">Create Account</h2>
                    <form onSubmit={handleSignup}>
                        <input className="auth-input" placeholder="Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                        <input
                            className="auth-input"
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            style={{
                                borderBottom: formData.phone && formData.phone.length !== 10 ? '2px solid red' : '1px solid rgba(0, 255, 255, 0.2)'
                            }}
                            required
                        />
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                className="auth-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
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
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                className="auth-input"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Re-enter Password"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                style={{ width: '100%', paddingRight: '40px' }}
                            />
                            <span
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                            </span>
                        </div>
                        <button className="auth-submit-btn" disabled={loading}>
                            {loading ? <div className="spinner-mini" style={{ margin: '0 auto', borderColor: '#fff', borderTopColor: 'transparent' }}></div> : 'Sign Up'}
                        </button>

                    </form>
                    <div className="switch-auth">
                        Already have an account? <span onClick={() => setView('login')}>Login</span>
                    </div>
                </div>
                {error && <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    background: 'rgba(255, 0, 0, 0.1)',
                    border: '1px solid red',
                    borderRadius: '5px',
                    color: '#ff4444',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)'
                }}>
                    {error}
                </div>}
            </div>
        </div>
    );
};

export default Signup;
