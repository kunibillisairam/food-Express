import React, { useRef, useState, useContext } from 'react';
import { useCartAnimation } from '../context/CartAnimationContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import './HolographicCard.css';

const HolographicCard = ({ item, handleAdd, setCategory, rating }) => {
    const cardRef = useRef(null);
    const imgRef = useRef(null);
    const { triggerFly } = useCartAnimation();
    const { user, toggleFavorite } = useContext(AuthContext);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const isFavorite = user?.favorites?.includes(item.id);

    const handleFavoriteClick = async (e) => {
        e.stopPropagation();
        if (!user) {
            toast.error("Please login to add favorites", {
                icon: '🔒',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
            return;
        }

        const result = await toggleFavorite(item.id);
        if (result.success) {
            toast(result.isFavorite ? "Added to Favorites" : "Removed from Favorites", {
                icon: result.isFavorite ? '❤️' : '💔',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        }
    };

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();

        // Calculate mouse position relative to card center
        const x = e.clientX - rect.left; // x position within the element.
        const y = e.clientY - rect.top;  // y position within the element.

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation values (max +/- 10 degrees is usually subtle and nice)
        // RotateY corresponds to X movement (left/right)
        // RotateX corresponds to Y movement (up/down) - inverted

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setRotation({ x: 0, y: 0 });
    };

    return (
        <div className="holo-card-container">
            <div
                ref={cardRef}
                className="holo-card"
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    transform: isHovered
                        ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.02, 1.02, 1.02)`
                        : `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
                }}
            >
                <div className="food-img-container" onClick={() => setCategory(item.category)}>
                    <img
                        ref={imgRef}
                        src={item.imageUrl || item.image}
                        alt={item.name}
                        className="food-img"
                        loading="lazy"
                        style={{
                            transform: isHovered ? 'translateZ(30px) scale(1.1)' : 'translateZ(0) scale(1)'
                        }}
                    />

                    {/* Favorite Button */}
                    <div
                        className="favorite-btn"
                        onClick={handleFavoriteClick}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            zIndex: 10,
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            color: isFavorite ? '#ff4757' : 'rgba(255, 255, 255, 0.6)',
                            transform: isHovered ? 'translateZ(60px)' : 'translateZ(0)',
                            transition: 'all 0.3s ease',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                        }}
                    >
                        {isFavorite ? <FaHeart /> : <FaRegHeart />}
                    </div>

                    {(item.offer || item.offerTag?.text) && (
                        <span
                            className="offer-badge"
                            style={{
                                transform: isHovered ? 'translateZ(50px)' : 'translateZ(0)',
                                backgroundColor: item.offerTag?.color || '#ff4757'
                            }}
                        >
                            {item.offer || item.offerTag?.text}
                        </span>
                    )}
                </div>
                <div
                    className="food-info"
                    style={{
                        transform: isHovered ? 'translateZ(20px)' : 'translateZ(0)',
                    }}
                >
                    <h3 className="food-title" onClick={() => setCategory(item.category)}>{item.name}</h3>
                    <div className="food-meta">
                        <span className="food-category">{item.category}</span>
                        <span className="food-price">₹{item.price}</span>
                    </div>
                    {/* Rating Display */}
                    {rating > 0 && (
                        <div style={{ margin: '0.2rem 0', color: '#f1c40f', fontSize: '0.9rem', fontWeight: 'bold', textShadow: '0 0 5px rgba(241, 196, 15, 0.5)' }}>
                            ⭐ {rating.toFixed(1)} <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 'normal' }}>(Verified)</span>
                        </div>
                    )}
                    <button className="add-btn" onClick={(e) => {
                        const rect = imgRef.current.getBoundingClientRect();
                        triggerFly(rect, item.imageUrl || item.image);
                        handleAdd(item);
                        toast.success(`${item.name} added to cart!`, {
                            duration: 2000,
                            icon: '🍕',
                            style: {
                                borderRadius: '10px',
                                background: '#333',
                                color: '#fff',
                            },
                        });
                    }}>Add to Cart</button>
                </div>
            </div>
        </div>
    );
};

export default HolographicCard;
