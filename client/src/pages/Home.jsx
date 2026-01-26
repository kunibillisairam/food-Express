import React, { useState, useContext } from 'react';
import { foodData, categories } from '../data/foodData';
import { CartContext } from '../context/CartContext';

import AboutUs from '../components/AboutUs';
import HolographicCard from '../components/HolographicCard';
import Hero from '../components/Hero';
import AppDownloadSection from '../components/AppDownloadSection';
import { AuthContext } from '../context/AuthContext';

const Home = ({ activeCategory, setCategory, searchTerm, setSearchTerm, setView }) => {
    const { user } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);

    // Detect if app is running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;


    // Filter logic
    const filteredFood = foodData.filter(item => {
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAdd = (item) => {
        addToCart(item);
    };

    return (
        <div className="home-page fade-in">
            {!user && <Hero setView={setView} />}


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
                    {categories.map(cat => (
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
                        />
                    ))}
                </div>

                {filteredFood.length === 0 && (
                    <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#888', marginTop: '3rem' }}>
                        No items found. Try a different search.
                    </div>
                )}

                {!isStandalone && <AppDownloadSection />}

                <AboutUs />

            </div>
        </div>
    );
};

export default Home;
