import React, { useRef, useState } from 'react';
import './HolographicCard.css';

const HolographicCard = ({ item, handleAdd, setCategory }) => {
    const cardRef = useRef(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

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
                        src={item.image}
                        alt={item.name}
                        className="food-img"
                        loading="lazy"
                        style={{
                            transform: isHovered ? 'translateZ(30px) scale(1.1)' : 'translateZ(0) scale(1)'
                        }}
                    />
                    {item.offer && (
                        <span
                            className="offer-badge"
                            style={{
                                transform: isHovered ? 'translateZ(50px)' : 'translateZ(0)'
                            }}
                        >
                            {item.offer}
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
                    <button className="add-btn" onClick={() => handleAdd(item)}>Add to Cart</button>
                </div>
            </div>
        </div>
    );
};

export default HolographicCard;
