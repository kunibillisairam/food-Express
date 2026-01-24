import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMotorcycle, FaHome, FaUtensils, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import API_BASE_URL from '../config';

const DeliveryTracker = ({ setView, orderId }) => {
    const [status, setStatus] = useState('Pending');
    const [step, setStep] = useState(0);
    const [progress, setProgress] = useState(0);

    const statusMap = {
        'Pending': 0,
        'Preparing': 1,
        'Picked Up': 2,
        'On the Way': 3,
        'Delivered': 4
    };

    const steps = [
        { label: "Order Confirmed", icon: <FaCheckCircle /> },
        { label: "Food Being Prepared", icon: <FaUtensils /> },
        { label: "Out for Delivery", icon: <FaMotorcycle /> },
        { label: "Arriving Soon", icon: <FaMotorcycle /> },
        { label: "Delivered Successfully", icon: <FaHome /> }
    ];

    useEffect(() => {
        if (!orderId) return;

        const fetchStatus = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`);
                if (res.data) {
                    const currentStatus = res.data.status;
                    setStatus(currentStatus);
                    const stepIdx = statusMap[currentStatus] || 0;
                    setStep(stepIdx);
                    // Map steps to progress percentage
                    setProgress((stepIdx / (steps.length - 1)) * 100);
                }
            } catch (err) {
                console.error("Tracker Error:", err);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [orderId]);

    return (
        <div className="delivery-tracker-page fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
                <div
                    onClick={() => setView('my-orders')}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                >
                    <FaArrowLeft />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Track Order</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Order ID: #{orderId.slice(-6)}</p>
                </div>
            </div>

            <div className="road-container">
                {/* Environment Elements */}
                <div className="environment">
                    <motion.div
                        className="cloud"
                        animate={{ x: [-20, 800] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        style={{ top: '20px', left: '10%', width: '60px', height: '30px' }}
                    />
                    <motion.div
                        className="cloud"
                        animate={{ x: [-50, 800] }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
                        style={{ top: '40px', left: '40%', width: '80px', height: '40px' }}
                    />

                    {[100, 300, 500, 700].map(x => (
                        <div key={x} className="tree" style={{ left: `${x}px` }}>🌳</div>
                    ))}
                </div>

                {/* Road Path */}
                <div className="road-path">
                    <div className="road-stripes"></div>
                </div>

                {/* Restaurant & Home Icons */}
                <div style={{ position: 'absolute', bottom: '55px', left: '20px', fontSize: '2rem' }}>🏪</div>
                <div style={{ position: 'absolute', bottom: '55px', right: '20px', fontSize: '2.4rem' }}>🏠</div>

                {/* Moving Bike */}
                <motion.div
                    style={{
                        position: 'absolute',
                        bottom: '48px',
                        left: '40px',
                        fontSize: '2.5rem',
                        zIndex: 10,
                    }}
                    animate={{
                        left: `${Math.max(40, (progress / 100) * 85)}%`,
                        y: [0, -4, 0]
                    }}
                    transition={{
                        left: { duration: 2, ease: "easeInOut" },
                        y: { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        <FaMotorcycle style={{ color: '#ff4757' }} />
                        {/* Wheel Rotations */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                            style={{ position: 'absolute', bottom: '5px', left: '5px', width: '10px', height: '10px', border: '2px dashed #333', borderRadius: '50%' }}
                        />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                            style={{ position: 'absolute', bottom: '5px', right: '5px', width: '10px', height: '10px', border: '2px dashed #333', borderRadius: '50%' }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Status Timeline */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ color: '#2ed573' }}>{steps[step].label}</h2>
                    <p style={{ color: '#888' }}>Estimated Arrival: 25 - 30 mins</p>
                </div>

                <div className="progress-timeline">
                    <div className="timeline-line">
                        <div className="timeline-progress" style={{ width: `${progress}%` }}></div>
                    </div>

                    {steps.map((s, idx) => (
                        <div key={idx} className="timeline-step">
                            <div className={`step-dot ${idx <= step ? 'active' : ''} ${idx < step ? 'completed' : ''}`}>
                                {idx < step ? <FaCheckCircle /> : idx + 1}
                            </div>
                            <span className={`step-label ${idx <= step ? 'active' : ''}`}>
                                {s.label.split(' ')[0]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '15px' }}>
                    <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Delivery Partner</p>
                    <h4 style={{ margin: '5px 0' }}>Rahul Sharma</h4>
                    <span style={{ color: '#ff4757', fontWeight: 'bold' }}>⭐ 4.8</span>
                </div>
                <button
                    onClick={() => alert("Connecting to delivery partner...")}
                    style={{ background: '#2ed573', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}
                >
                    📞 Call Partner
                </button>
            </div>
        </div>
    );
};

export default DeliveryTracker;
