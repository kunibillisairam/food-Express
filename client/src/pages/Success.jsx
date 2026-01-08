import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Success = ({ setView }) => {
    const { user } = useContext(AuthContext);

    return (
        <div className="page-container fade-in" style={{ textAlign: 'center', marginTop: '4rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
            <h1 className="page-title">Order Placed Successfully!</h1>
            <p style={{ fontSize: '1.2rem', color: '#888', marginBottom: '3rem' }}>
                Thank you for your order. Your food will be delivered soon.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="nav-btn" onClick={() => setView('quantum-tracker')} style={{ background: 'linear-gradient(45deg, #00f260, #0575e6)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(5, 117, 230, 0.4)' }}>🚀 Quantum Track</button>
                <button className="nav-btn" onClick={() => setView('home')} style={{ border: '1px solid #ddd' }}>Back to Home</button>
                {user && user.role !== 'admin' && (
                    <button className="nav-btn" onClick={() => setView('my-orders')} style={{ background: '#2f3542', color: 'white' }}>View My Orders</button>
                )}
                {user && user.role === 'admin' && (
                    <button className="nav-btn" onClick={() => setView('admin-orders')} style={{ background: '#2f3542', color: 'white' }}>View Admin Orders</button>
                )}
            </div>
        </div>
    );
};

export default Success;
