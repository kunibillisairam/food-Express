import React, { useEffect, useRef } from 'react';
import './WarpTransition.css';

const WarpTransition = ({ isActive, onTransitionPeak }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const starsRef = useRef([]);
    const speedRef = useRef(2);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const centerX = width / 2;
        const centerY = height / 2;

        // Initialize stars
        const initStars = () => {
            const stars = [];
            for (let i = 0; i < 1000; i++) {
                stars.push({
                    x: Math.random() * width - centerX,
                    y: Math.random() * height - centerY,
                    z: Math.random() * width
                });
            }
            starsRef.current = stars;
        };

        initStars();

        const draw = () => {
            // Trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, width, height);

            if (isActive) {
                // Accelerate
                speedRef.current = speedRef.current < 50 ? speedRef.current * 1.1 : 50;
            } else {
                // Decelerate or idle
                speedRef.current = 2;
            }

            const stars = starsRef.current;

            ctx.fillStyle = '#fff';

            for (let i = 0; i < stars.length; i++) {
                const star = stars[i];

                // Move star closer
                star.z -= speedRef.current;

                // Reset star if it passes screen
                if (star.z <= 0) {
                    star.z = width;
                    star.x = Math.random() * width - centerX;
                    star.y = Math.random() * height - centerY;
                }

                // Project star
                const k = 128.0 / star.z;
                const px = star.x * k + centerX;
                const py = star.y * k + centerY;

                // Draw
                if (px >= 0 && px <= width && py >= 0 && py <= height) {
                    const size = (1 - star.z / width) * 4;

                    // Create streak if speed is high
                    if (speedRef.current > 10) {
                        const prevK = 128.0 / (star.z + speedRef.current * 2);
                        const prevPx = star.x * prevK + centerX;
                        const prevPy = star.y * prevK + centerY;

                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - star.z / width})`;
                        ctx.lineWidth = size;
                        ctx.moveTo(prevPx, prevPy);
                        ctx.lineTo(px, py);
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.arc(px, py, size / 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initStars();
        };

        window.addEventListener('resize', handleResize);
        draw();

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, [isActive]);

    // Handle the timing of the transition peak (when to actually swap the page)
    useEffect(() => {
        let timer;
        if (isActive) {
            // Trigger the "page swap" halfway through the high speed phase
            // Let's say we give it 300ms to speed up
            timer = setTimeout(() => {
                if (onTransitionPeak) onTransitionPeak();
            }, 500);
        }
        return () => clearTimeout(timer);
    }, [isActive, onTransitionPeak]);

    if (!isActive && speedRef.current <= 2) return null; // Or keep it rendered constantly if we want persistent background? 
    // Creating "Exit" transition:
    // User wants "stars in background stretch". 
    // If we return null, it vanishes. Let's keep it mounted but hidden via CSS opacity if needed, 
    // or just let it unmount. 
    // The request implies it appears during transition.

    return (
        <div className={`warp-container ${isActive ? 'active' : ''}`} style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.2s' }}>
            <canvas ref={canvasRef} className="warp-canvas" />
        </div>
    );
};

export default WarpTransition;
