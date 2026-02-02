
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaMobileAlt, FaHamburger, FaPizzaSlice, FaUtensils, FaIceCream, FaPhone } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { registerForPush } from '../utils/notifications';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = ({ setView }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, forgotPassword, verifyOtp, resetPassword } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Forgot Password Flow States
    const [authMode, setAuthMode] = useState('login'); // 'login', 'forgot', 'otp', 'reset'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const start = Date.now();
            const res = await login(phone, password);

            const duration = Date.now() - start;
            const minTime = 400; // ms
            if (duration < minTime) {
                await new Promise(resolve => setTimeout(resolve, minTime - duration));
            }

            if (res.success) {
                toast.success('Welcome back!');
                // Check if user object has username for push registration
                // Since we logged in via phone, we might need to get username from the res or user object
                // Let's assume the user object returned by login has username
                const loggedInUserString = localStorage.getItem('user');
                if (loggedInUserString) {
                    const loggedInUser = JSON.parse(loggedInUserString);
                    await registerForPush(loggedInUser.username);
                }
                setView('home');
            } else {
                setError(res.message);
                toast.error(res.message);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await forgotPassword(email);
        setLoading(false);
        if (res.success) {
            toast.success(res.message);
            setAuthMode('otp');
        } else {
            toast.error(res.message);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await verifyOtp(email, otp);
        setLoading(false);
        if (res.success) {
            toast.success(res.message);
            setAuthMode('reset');
        } else {
            toast.error(res.message);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await resetPassword(email, otp, newPassword);
        setLoading(false);
        if (res.success) {
            toast.success(res.message);
            setAuthMode('login');
        } else {
            toast.error(res.message);
        }
    };

    const renderForm = () => {
        switch (authMode) {
            case 'forgot':
                return (
                    <form onSubmit={handleForgotPassword}>
                        <div className="auth-title-box">
                            <h2>Forgot Password? 🔑</h2>
                            <p>Enter your email to receive an OTP</p>
                        </div>
                        <div className="form-group">
                            <input
                                className="form-input"
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                            <div className="input-icon">📧</div>
                        </div>
                        <button className="auth-btn-primary" disabled={loading}>
                            {loading ? <div className="spinner-mini"></div> : 'Send OTP'}
                        </button>
                        <div className="auth-footer" style={{ marginTop: '15px' }}>
                            <span className="link-text" onClick={() => setAuthMode('login')}>Back to Login</span>
                        </div>
                    </form>
                );
            case 'otp':
                return (
                    <form onSubmit={handleVerifyOtp}>
                        <div className="auth-title-box">
                            <h2>Verify OTP 🔢</h2>
                            <p>Sent to {email}</p>
                        </div>
                        <div className="form-group">
                            <input
                                className="form-input"
                                placeholder="6-digit OTP"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                required
                            />
                            <div className="input-icon">🔢</div>
                        </div>
                        <button className="auth-btn-primary" disabled={loading}>
                            {loading ? <div className="spinner-mini"></div> : 'Verify OTP'}
                        </button>
                    </form>
                );
            case 'reset':
                return (
                    <form onSubmit={handleResetPassword}>
                        <div className="auth-title-box">
                            <h2>New Password 🔒</h2>
                            <p>Create a secure password</p>
                        </div>
                        <div className="form-group">
                            <input
                                className="form-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                            />
                            <div className="input-icon">🔒</div>
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        <button className="auth-btn-primary" disabled={loading}>
                            {loading ? <div className="spinner-mini"></div> : 'Reset Password'}
                        </button>
                    </form>
                );
            default: // login
                return (
                    <form onSubmit={handleLogin}>
                        <div className="auth-title-box">
                            <h2>Welcome Back <span role="img" aria-label="wave">👋</span></h2>
                            <p>Enter your details to sign in</p>
                        </div>
                        <div className="form-group">
                            <input
                                className="form-input"
                                placeholder="Phone Number"
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                required
                            />
                            <FaPhone className="input-icon" />
                        </div>

                        <div className="form-group">
                            <input
                                className="form-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <div className="input-icon">🔒</div>
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        <div className="auth-options">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    className="remember-checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember me</span>
                            </label>
                            <button
                                type="button"
                                className="forgot-password"
                                style={{
                                    cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.7)',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '0.85rem',
                                    fontFamily: 'inherit',
                                    padding: '5px'
                                }}
                                onClick={() => setAuthMode('forgot')}
                            >
                                Forgot Password?
                            </button>
                        </div>

                        {error && (
                            <div className="error-message" style={{
                                color: '#ff4757',
                                background: 'rgba(255, 71, 87, 0.1)',
                                padding: '10px',
                                borderRadius: '8px',
                                marginBottom: '15px',
                                textAlign: 'center',
                                fontSize: '0.9rem',
                                border: '1px solid rgba(255, 71, 87, 0.2)'
                            }}>
                                {error}
                            </div>
                        )}

                        <button className="auth-btn-primary" disabled={loading}>
                            {loading ? <div className="spinner-mini"></div> : 'Login'}
                        </button>
                    </form>
                );
        }
    };

    return (
        <div className="auth-page-container fade-in">
            {/* Left Side - Hero */}
            <div className="auth-hero-section">
                <div className="auth-hero-bg"></div>
                <div className="hero-content">
                    <div className="hero-image-container">
                        <img
                            src="/images/food_delivery_hero.png"
                            alt="Food Delivery"
                            className="hero-image"
                        />
                    </div>
                    <div className="hero-text">
                        <h1>Fast. Fresh. <br /><span className="highlight-text">Delivered.</span></h1>
                        <p>Login to continue your delicious journey with FoodExpress.</p>
                    </div>
                </div>

                {/* Floating Background Icons for Hero */}
                <div className="floating-shapes">
                    <FaHamburger className="shape s1" color="rgba(255,255,255,0.2)" />
                    <FaPizzaSlice className="shape s2" color="rgba(255,255,255,0.2)" />
                    <FaUtensils className="shape s3" color="rgba(255,255,255,0.2)" />
                    <FaIceCream className="shape s4" color="rgba(255,255,255,0.2)" />
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-form-section">
                {/* Mobile Background Shapes */}
                <div className="mobile-bg-shapes">
                    <div className="floating-shapes">
                        <FaHamburger className="shape s1" color="rgba(255,255,255,0.05)" />
                        <FaPizzaSlice className="shape s2" color="rgba(255,255,255,0.05)" />
                    </div>
                </div>

                <div className="auth-glass-card">
                    {renderForm()}

                    {authMode === 'login' && (
                        <>
                            <div className="divider">
                                <span>OR CONTINUE WITH</span>
                            </div>

                            <div className="social-login">
                                <button className="social-btn">
                                    <FcGoogle size={22} />
                                    <span>Google</span>
                                </button>
                                <button className="social-btn">
                                    <FaMobileAlt size={20} color="#fff" />
                                    <span>Mobile OTP</span>
                                </button>
                            </div>

                            <div className="auth-footer">
                                Don't have an account?
                                <span className="link-text" onClick={() => setView('signup')}>Create one</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
