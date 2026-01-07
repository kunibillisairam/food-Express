import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import '../index.css';

const QuantumTracker = ({ setView, orderId }) => {
    const [step, setStep] = useState(0);
    const [status, setStatus] = useState('Pending');
    const [error, setError] = useState(null);
    const [searching, setSearching] = useState(true);
    const [scanText, setScanText] = useState("Initializing Scanner...");

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

        // Simulate Searching Phase
        if (searching) {
            const timeouts = [];
            timeouts.push(setTimeout(() => setScanText("Scanning Sector 7..."), 1000));
            timeouts.push(setTimeout(() => setScanText("Triangulating Delivery Partner..."), 2500));
            timeouts.push(setTimeout(() => setScanText("Signal Locking..."), 4000));
            timeouts.push(setTimeout(() => setSearching(false), 5500)); // End search after 5.5s

            return () => timeouts.forEach(t => clearTimeout(t));
        }

        const fetchStatus = async () => {
            try {
                // We need an endpoint to get a single order by ID
                const res = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`);
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
    }, [orderId, searching]);

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
                <h1 className="quantum-title">{searching ? "SEARCHING..." : "Quantum Delivery"}</h1>

                {error ? (
                    <div style={{ color: '#ff4757', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '10px' }}>
                        {error}
                        <button className="quantum-btn" onClick={() => setView('my-orders')} style={{ marginTop: '1rem' }}>Back</button>
                    </div>
                ) : searching ? (
                    <div className="radar-container fade-in">
                        <div className="radar-scope">
                            <div className="radar-sweep-cone"></div>
                            {/* Simulated Dots */}
                            <div className="radar-dot" style={{ top: '20%', left: '30%', animationDelay: '0.5s', opacity: 0.5 }}></div>
                            <div className="radar-dot" style={{ top: '60%', left: '80%', animationDelay: '1.2s', opacity: 0.3 }}></div>
                            <div className="radar-dot found" style={{ top: '40%', left: '60%', animationDelay: '3.5s' }}></div>
                        </div>
                        <div className="scanning-text">{scanText}</div>
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
