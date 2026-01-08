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

        const drawStars = (scrollOffset) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw a subtle dark gradient phase
            const grad = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width
            );
            grad.addColorStop(0, '#0a0a12');
            grad.addColorStop(1, '#000000');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            stars.forEach(star => {
                // Parallax calculation
                const parallaxY = (star.y + (scrollOffset * star.speed)) % canvas.height;

                ctx.beginPath();
                ctx.arc(star.x, parallaxY, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();

                // Twinkle effect
                star.opacity += (Math.random() - 0.5) * 0.05;
                if (star.opacity < 0.1) star.opacity = 0.1;
                if (star.opacity > 0.8) star.opacity = 0.8;
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
