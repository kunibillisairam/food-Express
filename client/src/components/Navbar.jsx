import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaListAlt } from 'react-icons/fa';
import { categories } from '../data/foodData';
import useSound from '../hooks/useSound';

const Navbar = ({ setView, activeCategory, setCategory, setSearchTerm }) => {
    const { user, logout } = useContext(AuthContext);
    const { cart } = useContext(CartContext);
    const { playSound } = useSound();

    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

    const handleLogout = () => {
        playSound('click');
        logout();
        setView('login');
    };

    const handleCategoryClick = (cat) => {
        playSound('click');
        setView('home');
        setCategory(cat);
        setSearchTerm(''); // Clear search when category is clicked
    };

    return (
        <nav className="navbar fade-in">
            <div className="nav-brand"
                onClick={() => { playSound('click'); setView('home'); setSearchTerm(''); setCategory('All'); }}
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
                        onClick={() => handleCategoryClick(cat)}
                    >
                        {cat}
                    </button>
                ))}

                <button
                    className="nav-btn fabricator-btn"
                    onClick={() => { playSound('scan'); setView('fabricator'); }}
                    onMouseEnter={() => playSound('hover')}
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
                        <button className="nav-btn" onClick={() => setView('my-orders')} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FaListAlt /> <span className="desktop-only">My Orders</span>
                        </button>
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
