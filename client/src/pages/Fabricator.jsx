import React, { useContext, useRef, useState, useEffect } from 'react';
import './Fabricator.css';
import { foodData } from '../data/foodData';
import { CartContext } from '../context/CartContext';
import { useSound } from '../hooks/useSound';

// Ingredients mapping
const INGREDIENTS_DB = {
    Burger: [
        { name: "Cheddar Cheese", cost: 20, type: "solid" },
        { name: "Extra Patty", cost: 50, type: "solid" },
        { name: "Spicy Mayo", cost: 10, type: "liquid" },
        { name: "Pickles", cost: 5, type: "solid" }
    ],
    Noodles: [
        { name: "Extra Sauce", cost: 10, type: "liquid" },
        { name: "Chili Flakes", cost: 5, type: "particle" },
        { name: "Fried Garlic", cost: 5, type: "particle" },
        { name: "Tofu Cubes", cost: 20, type: "solid" }
    ],
    Biryani: [
        { name: "Extra Raitha", cost: 0, type: "liquid" },
        { name: "Boiled Egg", cost: 15, type: "solid" },
        { name: "Fried Onions", cost: 10, type: "particle" }
    ],
    default: [
        { name: "Extra Spice", cost: 0, type: "particle" },
        { name: "Cheese Layer", cost: 20, type: "solid" },
        { name: "Butter Glaze", cost: 15, type: "liquid" }
    ]
};

const getIngredients = (category) => {
    return INGREDIENTS_DB[category] || INGREDIENTS_DB.default;
};

const HologramCard = ({ item, onCustomize, onQuickAdd }) => {
    const cardRef = useRef(null);
    const { playSound } = useSound();

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    };

    return (
        <div
            className="hologram-card"
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => onCustomize(item)}
        >
            <div className="corner-accent top-left"></div>
            <div className="corner-accent top-right"></div>
            <div className="corner-accent bottom-left"></div>
            <div className="corner-accent bottom-right"></div>

            <div className="hover-content">
                <img src={item.image} alt={item.name} className="hologram-image" />
                <div className="hologram-info">
                    <h3 className="hologram-name">{item.name}</h3>
                    <p className="hologram-price">CR-{item.price}</p>
                </div>
                <div className="card-actions">
                    <button className="action-btn customize-btn"
                        onMouseEnter={() => playSound('hover')}
                        onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                            onCustomize(item);
                        }}>
                        CUSTOMIZE
                    </button>
                    <button className="action-btn quick-btn"
                        onMouseEnter={() => playSound('hover')}
                        onClick={(e) => {
                            e.stopPropagation();
                            playSound('success');
                            onQuickAdd(item);
                        }}>
                        QUICK ADD
                    </button>
                </div>
            </div>
        </div>
    );
};

const FabricatorInterface = ({ item, onBack, onComplete }) => {
    const [customizations, setCustomizations] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState("FABRICATOR READY. AWAITING INPUT.");
    const [scanProgress, setScanProgress] = useState(0);
    const { playSound } = useSound();

    const availableIngredients = getIngredients(item.category);

    const handleAddIngredient = (ing) => {
        if (isScanning) return;
        playSound('click');

        setIsScanning(true);
        setScanProgress(0);

        // Dynamic messaging based on type
        const actions = {
            solid: "CONSTRUCTING",
            liquid: "DISPENSING",
            particle: "ATOMIZING"
        };
        const action = actions[ing.type] || "SYNTHESIZING";

        setScanMessage(`${action} ${ing.name.toUpperCase()}...`);

        // Animation duration 2s
        const duration = 2000;
        const interval = 50;
        const steps = duration / interval;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            setScanProgress((step / steps) * 100);

            if (step >= steps) {
                clearInterval(timer);
                setCustomizations(prev => [...prev, ing]);
                setIsScanning(false);
                setScanMessage(`${ing.name.toUpperCase()} INTEGRATED.`);
                setScanProgress(0);
            }
        }, interval);
    };

    const handleReplicate = () => {
        playSound('scan');
        setScanMessage("INITIATING FINAL REPLICATION SEQUENCE...");
        setIsScanning(true);
        setScanProgress(0);

        let p = 0;
        const t = setInterval(() => {
            p += 5;
            setScanProgress(p);
            if (p >= 100) {
                clearInterval(t);
                onComplete(item, customizations);
            }
        }, 50);
    };

    const totalPrice = item.price + customizations.reduce((acc, c) => acc + c.cost, 0);

    return (
        <div className="fabricator-interface">
            <div className="fabricator-overlay-grid"></div>

            <div className="left-panel">
                <button className="back-btn" onClick={onBack}>&lt; RETURN TO SELECTION</button>
                <div className="item-specs">
                    <h2>{item.name}</h2>
                    <p className="spec-row"><span>CLASS:</span> {item.category.toUpperCase()}</p>
                    <p className="spec-row"><span>BASE_COST:</span> CR-{item.price}</p>
                    <div className="custom-list">
                        <h4>MODIFICATIONS:</h4>
                        {customizations.length === 0 ? <p className="empty-text">NO MODIFICATIONS</p> :
                            <ul>
                                {customizations.map((c, i) => (
                                    <li key={i} className="custom-item">
                                        <span>+ {c.name}</span>
                                        <span>CR-{c.cost}</span>
                                    </li>
                                ))}
                            </ul>
                        }
                    </div>
                    <div className="total-display">
                        TOTAL: <span className="highlight">CR-{totalPrice}</span>
                    </div>
                </div>
            </div>

            <div className="center-stage">
                <div className={`scan-container ${isScanning ? 'active' : ''}`}>
                    <img src={item.image} alt={item.name} className="subject-image" />
                    {isScanning && (
                        <div className="laser-scanner" style={{ top: `${scanProgress}%` }}>
                            <div className="laser-beam"></div>
                        </div>
                    )}
                    <div className="blueprint-lines"></div>
                </div>
                <div className="status-terminal">
                    <span className="blink-cursor">&gt;</span> {scanMessage}
                </div>
            </div>

            <div className="right-panel">
                <h3 className="panel-title">AVAILABLE MATERIAL</h3>
                <div className="ingredients-grid">
                    {availableIngredients.map((ing, idx) => (
                        <button
                            key={idx}
                            className="ingredient-btn"
                            disabled={isScanning}
                            onMouseEnter={() => playSound('hover')}
                            onClick={() => handleAddIngredient(ing)}
                        >
                            <span className="ing-name">{ing.name}</span>
                            <span className="ing-cost">+{ing.cost}</span>
                        </button>
                    ))}
                </div>
                <button className="replicate-main-btn" onClick={handleReplicate} disabled={isScanning}>
                    ADD TO CART
                </button>
            </div>
        </div>
    );
};

const SearchControls = ({ searchTerm, setSearchTerm, category, setCategory, priceRange, setPriceRange, maxPriceLimit, categories }) => {
    return (
        <div className="search-panel">
            <div className="search-group">
                <label>SEARCH MODULE</label>
                <input
                    type="text"
                    placeholder="ENTER ITEM DESIGNATION..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="scifi-input"
                />
            </div>

            <div className="search-group">
                <label>FILTER: CATEGORY</label>
                <div className="category-options">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`cat-btn ${category === cat ? 'active' : ''}`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="search-group">
                <label>FILTER: PRICE (MAX: {priceRange})</label>
                <input
                    type="range"
                    min="0"
                    max={maxPriceLimit}
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="scifi-range"
                />
                <div className="range-labels">
                    <span>0</span>
                    <span>{maxPriceLimit}</span>
                </div>
            </div>
        </div>
    );
};

const Fabricator = ({ setView }) => {
    const { addToCart } = useContext(CartContext);
    const [selectedItem, setSelectedItem] = useState(null);

    const handleQuickAdd = (item) => {
        addToCart(item);
        // Could show a quick toast here
        alert("ITEM MATERIALIZED TO CART");
    };

    // --- SMART SEARCH LOGIC ---
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('All');

    // Calculate max price dynamically
    const maxDataPrice = Math.max(...foodData.map(i => i.price), 0);
    const [priceRange, setPriceRange] = useState(maxDataPrice);

    const filteredItems = foodData.filter(item => {
        const matchesName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = category === 'All' || item.category === category;
        const matchesPrice = item.price <= priceRange;
        return matchesName && matchesCategory && matchesPrice;
    });
    // ---------------------------

    const handleReplicationComplete = (item, mods) => {
        // Create a custom item object
        const finalItem = {
            ...item,
            id: Date.now(), // Unique ID for cart
            name: `${item.name} (Custom)`,
            price: item.price + mods.reduce((a, b) => a + b.cost, 0),
            modifiers: mods
        };
        addToCart(finalItem);
        alert("REPLICATION SUCCESSFUL. UNIT TRANSFERRED TO CARGO.");
        setSelectedItem(null);
    };

    return (
        <div className="fabricator-container">
            <div className="scanlines"></div>

            {selectedItem ? (
                <FabricatorInterface
                    item={selectedItem}
                    onBack={() => setSelectedItem(null)}
                    onComplete={handleReplicationComplete}
                />
            ) : (
                <>
                    <div className="fabricator-header">
                        <h1 className="fabricator-title">Matter Fabricator v9.0</h1>
                        <p className="subtitle">SELECT ORGANIC SUSTENANCE MODULES</p>
                        <button className="exit-btn" onClick={() => setView('home')}>
                            EXIT SIMULATION
                        </button>
                    </div>

                    {/* SMART SEARCH CONTROLS */}
                    <SearchControls
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        category={category}
                        setCategory={setCategory}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        maxPriceLimit={maxDataPrice}
                        categories={['All', ...new Set(foodData.map(item => item.category))]}
                    />

                    <div className="hologram-grid">
                        {filteredItems.map(item => (
                            <HologramCard
                                key={item.id}
                                item={item}
                                onCustomize={setSelectedItem}
                                onQuickAdd={handleQuickAdd}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Fabricator;
