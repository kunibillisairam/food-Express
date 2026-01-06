import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const QuantumTracker = ({ setView, orderId }) => {
    const [step, setStep] = useState(0);
    const [status, setStatus] = useState('Pending');
    const [error, setError] = useState(null);

    // Map backend statuses to sci-fi steps
    // Pending -> Preparing -> Picked Up -> On the Way -> Delivered
    const statusMap = {
        'Pending': 0,
        'Preparing': 1,
        'Picked Up': 2,
        'On the Way': 3,
        'Delivered': 4,
        'Cancelled': -1
    };

    const steps = [
        "Awaiting Quantum Signal...",        // Pending
        "Initializing Molecular Reassembly...", // Preparing
        "Package Secured. Drones Dispatched.",  // Picked Up
        "Warp Speed Engaged. Approach Vector Set.", // On the Way
        "Materialized at Doorstep!"          // Delivered
    ];

    useEffect(() => {
        if (!orderId) {
            setError("No Order ID provided.");
            return;
        }

        const fetchStatus = async () => {
            try {
                // We need an endpoint to get a single order by ID
                const res = await axios.get(`http://localhost:5000/api/orders/${orderId}`);
                if (res.data) {
                    const currentStatus = res.data.status;
                    setStatus(currentStatus);

                    if (statusMap[currentStatus] !== undefined) {
                        setStep(statusMap[currentStatus]);
                    }
                }
            } catch (err) {
                console.error("Error fetching order status:", err);
            }
        };

        // Initial fetch
        fetchStatus();

        // Poll every 3 seconds
        const interval = setInterval(fetchStatus, 3000);

        return () => clearInterval(interval);
    }, [orderId]);

    const getIcon = (s) => {
        switch (s) {
            case 0: return "📡";
            case 1: return "🧬";
            case 2: return "📦";
            case 3: return "🚀";
            case 4: return "🏠";
            default: return "❌";
        }
    };

    return (
        <div className="quantum-container">
            <div className="stars"></div>
            <div className="twinkling"></div>

            <div className="tracker-content">
                <h1 className="quantum-title">Quantum Delivery</h1>

                {error ? (
                    <div style={{ color: '#ff4757', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '10px' }}>
                        {error}
                        <button className="quantum-btn" onClick={() => setView('my-orders')} style={{ marginTop: '1rem' }}>Back</button>
                    </div>
                ) : step === -1 ? (
                    <div style={{ textAlign: 'center' }}>
                        <h2 className="status-text" style={{ color: '#ff4757' }}>Order Aborted. Returned to Void.</h2>
                        <button className="quantum-btn" onClick={() => setView('my-orders')}>Back</button>
                    </div>
                ) : (
                    <>
                        <div className="portal-container">
                            <div className="portal-ring ring-1"></div>
                            <div className="portal-ring ring-2"></div>
                            <div className="portal-ring ring-3"></div>
                            <div className="portal-core">
                                <span className="status-icon">
                                    {getIcon(step)}
                                </span>
                            </div>
                        </div>

                        <div className="status-display">
                            <h2 className={`status-text fade-in-up key-${step}`}>
                                {steps[step]}
                            </h2>
                            <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                Status: {status}
                            </div>
                            <div className="quantum-progress-bar">
                                <div
                                    className="quantum-progress-fill"
                                    style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {step === 4 && (
                            <button
                                className="quantum-btn"
                                onClick={() => setView('home')}
                            >
                                Return to Dimension C-137
                            </button>
                        )}

                        <button
                            style={{
                                marginTop: '2rem',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: '#aaa',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                cursor: 'pointer'
                            }}
                            onClick={() => setView('my-orders')}
                        >
                            Close Tracker
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default QuantumTracker;
