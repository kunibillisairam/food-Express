import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaListAlt } from 'react-icons/fa';
import { categories } from '../data/foodData';
import useSound from '../hooks/useSound';
import { useCartAnimation } from '../context/CartAnimationContext';
import { motion, useAnimation } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useEffect, useRef } from 'react';

const Navbar = ({ setView, activeCategory, setCategory, setSearchTerm }) => {
    const { user, logout } = useContext(AuthContext);
    const { totalAmount, cart } = useContext(CartContext);
    const { playSound } = useSound();
    const { setCartPos } = useCartAnimation();
    const cartIconRef = useRef(null);
    const bounceControls = useAnimation();

    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

    // Update cart position on resize or mount
    useEffect(() => {
        const updatePos = () => {
            if (cartIconRef.current) {
                setCartPos(cartIconRef.current.getBoundingClientRect());
            }
        };
        updatePos();
        window.addEventListener('resize', updatePos);
        return () => window.removeEventListener('resize', updatePos);
    }, [setCartPos]);

    // Bounce effect when items change
    useEffect(() => {
        if (totalItems > 0) {
            bounceControls.start({
                scale: [1, 1.4, 1],
                rotate: [0, -10, 10, 0],
                transition: { duration: 0.4 }
            });
        }
    }, [totalItems, bounceControls]);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            playSound('click');
            logout();
            setView('login');
        }
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
                <span className="logo-text">Food</span><span className="logo-accent">Express</span>
            </div>


            <div className="nav-links">
                {/* Category Buttons for Home View */}
                <div className="nav-categories desktop-only">
                    {categories.slice(0, 5).map(cat => (
                        <button
                            key={cat}
                            className={`nav-cat-link ${activeCategory === cat ? 'active' : ''}`}
                            onMouseEnter={() => playSound('hover')}
                            onClick={() => handleCategoryClick(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>


                <button
                    className="nav-btn fabricator-btn"
                    onClick={() => { playSound('scan'); setView('fabricator'); }}
                    onMouseEnter={() => playSound('hover')}
                >
                    🔮 FABRICATOR
                </button>

                <motion.div
                    ref={cartIconRef}
                    animate={bounceControls}
                    className="cart-icon"
                    onClick={() => setView('cart')}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    <FaShoppingCart />
                    <span className="desktop-only" style={{ fontSize: '1rem', fontWeight: '600' }}>Cart</span>
                    {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                </motion.div>

                {!user ? (
                    <button className="nav-btn" onClick={() => setView('login')}>Login</button>
                ) : user.role === 'admin' ? (
                    <>
                        <button className="nav-btn" onClick={() => setView('admin-orders')}>Admin Orders</button>
                        <button className="nav-btn" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button className="nav-btn desktop-only" onClick={() => setView('my-orders')} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FaListAlt />
                            <span>My Orders</span>
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
