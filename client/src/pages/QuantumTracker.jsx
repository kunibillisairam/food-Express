import React, { useState, useEffect } from 'react';
import '../index.css';

const QuantumTracker = ({ setView }) => {
    const [step, setStep] = useState(0);
    const steps = [
        "Initializing Molecular Reassembly...",
        "Locking on Coordinates...",
        "Warp Speed Engaged...",
        "Materializing at Doorstep!"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => {
                if (prev < steps.length - 1) return prev + 1;
                return prev;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [steps.length]);

    return (
        <div className="quantum-container">
            <div className="stars"></div>
            <div className="twinkling"></div>

            <div className="tracker-content">
                <h1 className="quantum-title">Quantum Delivery</h1>
                <div className="portal-container">
                    <div className="portal-ring ring-1"></div>
                    <div className="portal-ring ring-2"></div>
                    <div className="portal-ring ring-3"></div>
                    <div className="portal-core">
                        <span className="status-icon">
                            {step === 0 && "🧬"}
                            {step === 1 && "🎯"}
                            {step === 2 && "🚀"}
                            {step === 3 && "🏠"}
                        </span>
                    </div>
                </div>

                <div className="status-display">
                    <h2 className={`status-text fade-in-up key-${step}`}>
                        {steps[step]}
                    </h2>
                    <div className="quantum-progress-bar">
                        <div
                            className="quantum-progress-fill"
                            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {step === steps.length - 1 && (
                    <button
                        className="quantum-btn"
                        onClick={() => setView('home')}
                    >
                        Return to Dimension C-137
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuantumTracker;
