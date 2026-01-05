import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import '../index.css'; // Ensure we can use global vars if needed, but we'll inline some specific styles

const HoloCart = ({ setView }) => {
    const { cart, removeFromCart, addToCart, totalAmount } = useContext(CartContext);

    // Calculate total explicitly if not available
    const total = totalAmount || cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (cart.length === 0) {
        return (
            <div className="holo-container empty-state">
                <div className="holo-grid-bg"></div>
                <div className="content-wrapper" style={{ textAlign: 'center', zIndex: 2 }}>
                    <div className="hologram-icon">🛒</div>
                    <h2 className="holo-title">VOID DETECTED</h2>
                    <p className="holo-subtitle">Your matter storage is empty.</p>
                    <button className="holo-btn" onClick={() => setView('home')}>
                        INITIATE FOOD PROTOCOL
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="holo-container">
            <div className="holo-grid-bg"></div>
            <div className="holo-overlay"></div>

            <div className="holo-content fade-in">
                <div className="holo-header">
                    <h2 className="holo-title blink-text">MATTER MANIFEST // CART</h2>
                    <div className="holo-badge">{cart.length} UNITS</div>
                </div>

                <div className="holo-list">
                    {cart.map((item, index) => (
                        <div key={item.id} className="holo-item" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="holo-item-glow"></div>

                            <div className="holo-img-container">
                                <img src={item.image} alt={item.name} className="holo-img" />
                                <div className="scan-line"></div>
                            </div>

                            <div className="holo-item-details">
                                <h3 className="item-name">{item.name}</h3>
                                <div className="item-price">UNIT COST: <span className="mono">₹{item.price}</span></div>
                            </div>

                            <div className="holo-controls">
                                <button className="holo-control-btn" onClick={() => removeFromCart(item.id)}>−</button>
                                <span className="holo-qty mono">{item.qty || item.quantity}</span>
                                <button className="holo-control-btn" onClick={() => addToCart(item)}>+</button>
                            </div>

                            <div className="holo-total mono">
                                ₹{(item.price * (item.qty || item.quantity))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="holo-checkout-panel">
                    <div className="holo-summary">
                        <div className="summary-row">
                            <span>SUBTOTAL</span>
                            <span className="mono">₹{total}</span>
                        </div>
                        <div className="summary-row">
                            <span>TAX (GALACTIC)</span>
                            <span className="mono">₹{Math.round(total * 0.05)}</span>
                        </div>
                        <div className="summary-total">
                            <span>TOTAL ENERGY</span>
                            <span className="mono highlight">₹{total + Math.round(total * 0.05)}</span>
                        </div>
                    </div>

                    <div className="holo-actions">
                        <button className="holo-btn secondary" onClick={() => setView('home')}>
                            &lt; ABORT
                        </button>
                        <button className="holo-btn primary" onClick={() => setView('payment')}>
                            ENGAGE &gt;
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .holo-container {
                    min-height: 100vh;
                    background-color: #050510;
                    color: #00f3ff;
                    font-family: 'Courier New', monospace;
                    position: relative;
                    overflow-x: hidden;
                    padding: 2rem;
                }

                .holo-grid-bg {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-image: 
                        linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px);
                    background-size: 40px 40px;
                    z-index: 0;
                    pointer-events: none;
                }

                .holo-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: radial-gradient(circle at center, transparent 0%, #000 120%);
                    z-index: 1;
                    pointer-events: none;
                }

                .holo-content {
                    position: relative;
                    z-index: 2;
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .holo-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid rgba(0, 243, 255, 0.3);
                    padding-bottom: 1rem;
                    margin-bottom: 2rem;
                }

                .holo-title {
                    font-size: 2rem;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    text-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
                    margin: 0;
                }

                .holo-badge {
                    background: rgba(0, 243, 255, 0.1);
                    border: 1px solid #00f3ff;
                    padding: 0.5rem 1rem;
                    font-weight: bold;
                    box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
                }

                .holo-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .holo-item {
                    display: grid;
                    grid-template-columns: 100px 2fr 1.5fr 1fr;
                    align-items: center;
                    background: rgba(0, 20, 40, 0.6);
                    border: 1px solid rgba(0, 243, 255, 0.2);
                    padding: 1rem;
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(5px);
                    transition: all 0.3s;
                    animation: slideIn 0.5s cubic-bezier(0.23, 1, 0.32, 1) backwards;
                }

                .holo-item:hover {
                    border-color: #00f3ff;
                    box-shadow: 0 0 20px rgba(0, 243, 255, 0.2);
                    transform: translateX(10px);
                }

                .holo-img-container {
                    width: 80px;
                    height: 80px;
                    position: relative;
                    border: 1px solid rgba(0, 243, 255, 0.3);
                }

                .holo-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    filter: sepia(100%) hue-rotate(130deg) saturate(200%);
                    opacity: 0.8;
                }

                .scan-line {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #fff;
                    animation: scan 2s linear infinite;
                    opacity: 0.5;
                }

                .item-name {
                    font-size: 1.2rem;
                    margin: 0 0 0.5rem 0;
                    color: #fff;
                    text-transform: uppercase;
                }

                .item-price {
                    font-size: 0.9rem;
                    color: rgba(0, 243, 255, 0.7);
                }

                .holo-controls {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .holo-control-btn {
                    background: transparent;
                    border: 1px solid #00f3ff;
                    color: #00f3ff;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .holo-control-btn:hover {
                    background: #00f3ff;
                    color: #000;
                    box-shadow: 0 0 10px #00f3ff;
                }

                .holo-qty {
                    font-size: 1.2rem;
                    width: 30px;
                    text-align: center;
                }

                .holo-total {
                    font-size: 1.5rem;
                    text-align: right;
                    font-weight: bold;
                    text-shadow: 0 0 10px rgba(0, 243, 255, 0.4);
                }

                .holo-checkout-panel {
                    margin-top: 3rem;
                    border-top: 2px dashed rgba(0, 243, 255, 0.3);
                    padding-top: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }

                .holo-summary {
                    width: 300px;
                }

                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    color: rgba(255, 255, 255, 0.7);
                }

                .summary-total {
                    display: flex;
                    justify-content: space-between;
                    font-size: 1.5rem;
                    margin-top: 1rem;
                    padding-top: 0.5rem;
                    border-top: 1px solid rgba(0, 243, 255, 0.3);
                    color: #fff;
                }

                .holo-actions {
                    display: flex;
                    gap: 1rem;
                }

                .holo-btn {
                    padding: 1rem 2rem;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    font-size: 1.1rem;
                    cursor: pointer;
                    text-transform: uppercase;
                    transition: all 0.3s;
                }

                .primary {
                    background: rgba(0, 243, 255, 0.1);
                    border: 2px solid #00f3ff;
                    color: #00f3ff;
                    box-shadow: 0 0 20px rgba(0, 243, 255, 0.2);
                }

                .primary:hover {
                    background: #00f3ff;
                    color: #000;
                    box-shadow: 0 0 40px rgba(0, 243, 255, 0.6);
                    letter-spacing: 2px;
                }

                .secondary {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: rgba(255, 255, 255, 0.7);
                }

                .secondary:hover {
                    border-color: #ff4757;
                    color: #ff4757;
                }

                .mono {
                    font-family: 'Consolas', monospace;
                }

                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }

                @keyframes slideIn {
                    from { transform: translateX(-50px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }

                .hologram-icon {
                    font-size: 5rem;
                    filter: drop-shadow(0 0 20px rgba(0, 243, 255, 0.5));
                    margin-bottom: 2rem;
                    animation: float 3s ease-in-out infinite;
                }

                @media (max-width: 768px) {
                    .holo-item {
                        grid-template-columns: 80px 1fr;
                        gap: 1rem;
                    }
                    .holo-controls {
                        grid-column: 2;
                        margin-top: 1rem;
                    }
                    .holo-total {
                        grid-column: 2;
                        text-align: left;
                    }
                    .holo-checkout-panel {
                        flex-direction: column;
                        gap: 2rem;
                    }
                    .holo-summary {
                        width: 100%;
                    }
                    .holo-actions {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
            `}</style>
        </div>
    );
};

export default HoloCart;
