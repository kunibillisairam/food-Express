import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaMobileAlt, FaHamburger, FaPizzaSlice, FaUtensils, FaIceCream } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { LuBike } from "react-icons/lu";
import { registerForPush } from '../utils/notifications';
import './Auth.css';

const Login = ({ setView }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Simulate minimum loading time for animation smoothness
            const start = Date.now();
            const res = await login(username, password);

            const duration = Date.now() - start;
            const minTime = 800; // ms
            if (duration < minTime) {
                await new Promise(resolve => setTimeout(resolve, minTime - duration));
            }

            if (res.success) {
                await registerForPush(username); // 🔔 Enable Mobile Push
                setView('home');
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
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
                    <div className="auth-title-box">
                        <h2>Welcome Back <span role="img" aria-label="wave">👋</span></h2>
                        <p>Enter your details to sign in</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <input
                                className="form-input"
                                placeholder="Username or Email"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                            <FaUtensils className="input-icon" />
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
                            <span className="forgot-password">Forgot Password?</span>
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
                </div>
            </div>
        </div>
    );
};

export default Login;
