import React, { useEffect, useRef } from 'react';
import './StarfieldBackground.css';

const StarfieldBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let stars = [];
        const starCount = 150;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            stars = [];
            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2,
                    speed: Math.random() * 0.5 + 0.1,
                    opacity: Math.random()
                });
            }
        };

        const drawStars = () => {
            const scrollOffset = window.scrollY;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            stars.forEach(star => {
                // Parallax calculation
                let y = star.y + (scrollOffset * star.speed);
                if (y > canvas.height) y = y % canvas.height;

                ctx.beginPath();
                ctx.arc(star.x, y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.8, Math.max(0.1, star.opacity))})`;
                ctx.fill();

                // Twinkle effect (simplified)
                if (Math.random() > 0.9) {
                    star.opacity = Math.random();
                }
            });
        };

        const animate = () => {
            const scrollOffset = window.scrollY;
            drawStars(scrollOffset);
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="starfield-canvas" />;
};

export default StarfieldBackground;
