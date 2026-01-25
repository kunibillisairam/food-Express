import React, { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { useSound } from '../hooks/useSound';
import './FleetManager.css';

const FleetManager = () => {
    const { fleetCode, joinFleet, leaveFleet } = useContext(CartContext);
    const [inputCode, setInputCode] = useState('');
    const { playSound } = useSound();

    const handleCreateFleet = () => {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        joinFleet(randomCode);
        playSound('success');
    };

    const handleJoinFleet = (e) => {
        e.preventDefault();
        if (inputCode.length > 2) {
            joinFleet(inputCode);
            setInputCode('');
            playSound('scan');
        }
    };

    return (
        <div className="fleet-manager-panel">
            <div className="fleet-glitch-overlay"></div>
            {fleetCode ? (
                <div className="active-fleet">
                    <div className="fleet-status">
                        <span className="pulse-dot"></span> FLEET CHANNEL ACTIVE
                    </div>
                    <div className="fleet-info">
                        <span className="label">SECURE LINK:</span>
                        <span className="code">{fleetCode}</span>
                        <button
                            className="copy-btn"
                            onClick={() => {
                                navigator.clipboard.writeText(fleetCode);
                                playSound('click');
                            }}
                            title="Copy Code"
                        >
                            📋
                        </button>
                    </div>
                    <button className="leave-fleet-btn" onClick={() => { leaveFleet(); playSound('error'); }}>
                        DISCONNECT CHANNEL
                    </button>
                </div>
            ) : (
                <div className="join-fleet-prompt">
                    <h3>🔗 SQUAD SUSTENANCE</h3>
                    <p>Connect with your fleet to share cargo (cart).</p>
                    <div className="fleet-actions">
                        <button className="create-fleet-btn" onClick={handleCreateFleet}>
                            GENERATE NEW LINK
                        </button>
                        <div className="divider">OR</div>
                        <form onSubmit={handleJoinFleet} className="join-form">
                            <input
                                type="text"
                                placeholder="ENTER LINK CODE"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value)}
                                maxLength={8}
                            />
                            <button type="submit" disabled={!inputCode}>JOIN</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FleetManager;
