import React from 'react';
import './HolographicCard.css';

const SkeletonCard = () => {
    const shimmerStyle = {
        animation: 'shimmer 1.5s infinite linear',
        background: 'linear-gradient(to right, #2d3436 0%, #3e4a4d 50%, #2d3436 100%)',
        backgroundSize: '1000px 100%',
    };

    return (
        <div className="holo-card-container" style={{ pointerEvents: 'none' }}>
            <div className="holo-card" style={{ background: '#1e272e', boxShadow: 'none', border: '1px solid #333' }}>
                {/* Image Placeholder */}
                <div style={{ ...shimmerStyle, width: '100%', height: '180px', borderRadius: '12px 12px 0 0' }}></div>

                {/* Content Placeholder */}
                <div style={{ padding: '1rem' }}>
                    {/* Title */}
                    <div style={{ ...shimmerStyle, width: '70%', height: '24px', borderRadius: '4px', marginBottom: '10px' }}></div>

                    {/* Category & Price */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div style={{ ...shimmerStyle, width: '30%', height: '16px', borderRadius: '4px' }}></div>
                        <div style={{ ...shimmerStyle, width: '20%', height: '16px', borderRadius: '4px' }}></div>
                    </div>

                    {/* Button */}
                    <div style={{ ...shimmerStyle, width: '100%', height: '40px', borderRadius: '8px' }}></div>
                </div>
            </div>
            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
            `}</style>
        </div>
    );
};

export default SkeletonCard;
