import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaMobileAlt, FaHamburger, FaPizzaSlice, FaUtensils, FaIceCream, FaUser, FaPhone } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import './Auth.css';

const Signup = ({ setView }) => {
    const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signup } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const calculateStrength = (pass) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 5) score += 1;
        if (pass.length > 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return score;
    };

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setFormData({ ...formData, password: val });
        setPasswordStrength(calculateStrength(val));
    };

    const getStrengthColor = () => {
        if (passwordStrength < 2) return '#ff4757';
        if (passwordStrength < 4) return '#ffa502';
        return '#2ed573';
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            toast.error("Passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.phone.length !== 10) {
            setError("Phone number must be exactly 10 digits");
            toast.error("Phone number must be exactly 10 digits");
            setLoading(false);
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address");
            toast.error("Please enter a valid email address");
            setLoading(false);
            return;
        }

        if (formData.username && formData.email && formData.phone && formData.password) {
            console.log("[Signup] Form data valid, calling AuthContext.signup", formData);
            try {
                // Simulate minimum loading time for animation
                const start = Date.now();

                const res = await signup({
                    username: formData.username,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password
                });

                const duration = Date.now() - start;
                const minTime = 1000;
                if (duration < minTime) {
                    await new Promise(resolve => setTimeout(resolve, minTime - duration));
                }

                if (res.success) {
                    toast.success('Account created! Please login.');
                    setView('login');
                } else {
                    const errorMsg = typeof res.message === 'string' ? res.message : JSON.stringify(res.message);
                    setError(errorMsg);
                    toast.error(errorMsg);
                }
            } catch (err) {
                console.error("Signup Client Error:", err);
                const errorDetail = err.response?.data?.message || err.message || "An unexpected error occurred";
                setError(errorDetail);
                toast.error(errorDetail);
            } finally {
                setLoading(false);
            }
        } else {
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
                            style={{ animationDelay: '-2s' }} // Offset animation
                        />
                    </div>
                    <div className="hero-text">
                        <h1>Join the <br /><span className="highlight-text">Revolution.</span></h1>
                        <p>Create your account and start ordering instantly from the best restaurants.</p>
                    </div>
                </div>

                <div className="floating-shapes">
                    <FaPizzaSlice className="shape s1" color="rgba(255,255,255,0.2)" />
                    <FaUtensils className="shape s2" color="rgba(255,255,255,0.2)" />
                    <FaHamburger className="shape s3" color="rgba(255,255,255,0.2)" />
                    <FaIceCream className="shape s4" color="rgba(255,255,255,0.2)" />
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-form-section">
                {/* Mobile Background Shapes */}
                <div className="mobile-bg-shapes">
                    <div className="floating-shapes">
                        <FaIceCream className="shape s1" color="rgba(255,255,255,0.05)" />
                        <FaHamburger className="shape s2" color="rgba(255,255,255,0.05)" />
                    </div>
                </div>

                <div className="auth-glass-card">
                    <div className="auth-title-box">
                        <h2>Create Account 🚀</h2>
                        <p>Fast signup. Delicious rewards.</p>
                    </div>

                    <form onSubmit={handleSignup}>
                        <div className="form-group">
                            <input
                                className="form-input"
                                placeholder="Username"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                            <FaUser className="input-icon" />
                        </div>

                        <div className="form-group">
                            <input
                                className="form-input"
                                placeholder="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <div className="input-icon">📧</div>
                        </div>

                        <div className="form-group">
                            <input
                                className="form-input"
                                placeholder="Phone Number"
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                style={{
                                    borderColor: formData.phone && formData.phone.length !== 10 ? '#ff4757' : ''
                                }}
                                required
                            />
                            <FaPhone className="input-icon" />
                        </div>

                        <div className="form-group">
                            <input
                                className="form-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={formData.password}
                                onChange={handlePasswordChange}
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

                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div style={{ height: '4px', width: '100%', background: '#333', borderRadius: '2px', marginBottom: '1.2rem', marginTop: '-1rem', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(passwordStrength / 5) * 100}%`,
                                    background: getStrengthColor(),
                                    transition: 'all 0.3s ease'
                                }}></div>
                            </div>
                        )}

                        <div className="form-group">
                            <input
                                className="form-input"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                            <div className="input-icon">🔐</div>
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
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
                            {loading ? <div className="spinner-mini"></div> : 'Create Account'}
                        </button>
                    </form>

                    <div className="divider">
                        <span>OR SIGNUP WITH</span>
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
                        Already have an account?
                        <span className="link-text" onClick={() => setView('login')}>Login</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
