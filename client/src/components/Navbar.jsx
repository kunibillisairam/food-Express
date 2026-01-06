import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { FaShoppingCart, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { categories } from '../data/foodData';
import useSound from '../hooks/useSound';

const Navbar = ({ setView, activeCategory, setCategory }) => {
    const { user, logout } = useContext(AuthContext);
    const { cart } = useContext(CartContext);
    const { playSound } = useSound();

    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

    const handleLogout = () => {
        playSound('click');
        logout();
        setView('login');
    };

    return (
        <nav className="navbar fade-in">
            <div className="nav-brand"
                onClick={() => { playSound('click'); setView('home'); }}
                onMouseEnter={() => playSound('hover')}
            >
                FoodExpress
            </div>

            <div className="nav-links">
                {/* Category Buttons for Home View */}
                {categories.slice(0, 4).map(cat => (
                    <button
                        key={cat}
                        className={`nav-btn ${activeCategory === cat ? 'active' : ''} ${cat !== 'All' ? 'desktop-only' : ''}`}
                        onMouseEnter={() => playSound('hover')}
                        onClick={() => {
                            playSound('click');
                            setView('home');
                            setCategory(cat);
                        }}
                    >
                        {cat}
                    </button>
                ))}

                <button
                    className="nav-btn"
                    onClick={() => { playSound('scan'); setView('fabricator'); }}
                    onMouseEnter={() => playSound('hover')}
                    style={{
                        background: 'linear-gradient(45deg, #000000, #434343)',
                        color: '#00ffff',
                        border: '1px solid #00ffff',
                        boxShadow: '0 0 5px #00ffff'
                    }}
                >
                    🔮 FABRICATOR
                </button>

                <div className="cart-icon" onClick={() => setView('cart')} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaShoppingCart />
                    <span className="desktop-only" style={{ fontSize: '1rem', fontWeight: '600' }}>Cart</span>
                    {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                </div>

                {!user ? (
                    <button className="nav-btn" onClick={() => setView('login')}>Login</button>
                ) : user.role === 'admin' ? (
                    <>
                        <button className="nav-btn" onClick={() => setView('admin-orders')}>Admin Orders</button>
                        <button className="nav-btn" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button className="nav-btn desktop-only" onClick={() => setView('my-orders')}>My Orders</button>
                        <div
                            onClick={() => setView('profile')}
                            className="nav-btn"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#fff0f1', color: '#ff4757' }}
                        >
                            <FaUser />
                            <span className="desktop-only" style={{ fontWeight: 'bold' }}>{user.username}</span>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
