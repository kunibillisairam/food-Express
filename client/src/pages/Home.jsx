import React, { useState, useContext, useEffect } from 'react';
import { foodData, categories } from '../data/foodData';
import { CartContext } from '../context/CartContext';
import axios from 'axios';
import API_BASE_URL from '../config';

import AboutUs from '../components/AboutUs';
import HolographicCard from '../components/HolographicCard';
import Hero from '../components/Hero';
import AppDownloadSection from '../components/AppDownloadSection';
import { AuthContext } from '../context/AuthContext';
import CampaignBanner from '../components/CampaignBanner';

const Home = ({ activeCategory, setCategory, searchTerm, setSearchTerm, setView }) => {
    const { user } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const [isStandalone, setIsStandalone] = useState(false);
    const [ratings, setRatings] = useState({});

    // Dynamic Menu Data
    const [foodItems, setFoodItems] = useState([]);
    const [derivedCategories, setDerivedCategories] = useState(["All"]);

    // Fetch Menu Data
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/menu`);
                setFoodItems(res.data);

                // Derive unique categories
                const uniqueCats = ["All", ...new Set(res.data.map(item => item.category))];
                setDerivedCategories(uniqueCats);
            } catch (err) {
                console.error("Failed to fetch menu", err);
                // Fallback to local data if sensitive (Optional)
            }
        };
        fetchMenu();
    }, []);

    // Fetch ratings summary
    useEffect(() => {
        const fetchRatings = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/reviews/summary`);
                const ratingMap = {};
                res.data.forEach(item => {
                    ratingMap[item._id] = item.averageRating;
                });
                setRatings(ratingMap);
            } catch (err) {
                console.error("Failed to fetch ratings", err);
            }
        };
        fetchRatings();
    }, []);

    useEffect(() => {
        const checkStandalone = () => {
            const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone ||
                document.referrer.includes('android-app://');
            setIsStandalone(standalone);
        };

        checkStandalone();

        const handleInstall = () => {
            setIsStandalone(true);
            localStorage.setItem('pwa_installed', 'true');
        };

        window.addEventListener('appinstalled', handleInstall);

        // Listen for changes
        const mql = window.matchMedia('(display-mode: standalone)');
        const listener = (e) => setIsStandalone(e.matches || localStorage.getItem('pwa_installed') === 'true');
        mql.addEventListener('change', listener);

        return () => {
            window.removeEventListener('appinstalled', handleInstall);
            mql.removeEventListener('change', listener);
        };
    }, []);

    const showHero = !user && !isStandalone && (localStorage.getItem('pwa_installed') !== 'true');
    const showAppSection = !isStandalone && (localStorage.getItem('pwa_installed') !== 'true');



    // Filter logic
    const filteredFood = foodItems.filter(item => {
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAdd = (item) => {
        addToCart(item);
    };

    return (
        <div className="home-page fade-in">
            {showHero && <Hero setView={setView} />}

            {/* Campaign Banner */}
            <CampaignBanner />

            <div id="food-explore" className="explore-section">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search for food (e.g. Burger, Noodles)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-bar"
                    />
                </div>

                <div className="categories">
                    {derivedCategories.map(cat => (
                        <button
                            key={cat}
                            className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => {
                                setCategory(cat);
                                setSearchTerm('');
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {activeCategory !== 'All' && (
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <span className="link-text" onClick={() => { setCategory('All'); setSearchTerm(''); }} style={{ fontSize: '0.9rem' }}>Currently viewing {activeCategory}. Click here to View All</span>
                    </div>
                )}

                <div className="food-grid">
                    {filteredFood.map(item => (
                        <HolographicCard
                            key={item.id}
                            item={item}
                            handleAdd={handleAdd}
                            setCategory={setCategory}
                            rating={ratings[item.id] || 0}
                        />
                    ))}
                </div>

                {filteredFood.length === 0 && (
                    <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#888', marginTop: '3rem' }}>
                        No items found. Try a different search.
                    </div>
                )}

                {showAppSection && <AppDownloadSection />}

                <AboutUs />


            </div>
        </div>
    );
};

export default Home;
