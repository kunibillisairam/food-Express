import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CartAnimationContext = createContext();

export const useCartAnimation = () => useContext(CartAnimationContext);

export const CartAnimationProvider = ({ children }) => {
    const [animations, setAnimations] = useState([]);
    const [cartPos, setCartPos] = useState(null);

    const triggerFly = useCallback((startPos, imgSrc) => {
        const id = Date.now();
        setAnimations(prev => [...prev, { id, startPos, imgSrc }]);
    }, []);

    const removeAnimation = useCallback((id) => {
        setAnimations(prev => prev.filter(anim => anim.id !== id));
    }, [animations]);

    return (
        <CartAnimationContext.Provider value={{ triggerFly, setCartPos, cartPos }}>
            {children}
            <div
                className="fly-animation-container"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 10000
                }}
            >
                <AnimatePresence>
                    {animations.map(anim => (
                        <FlyItem
                            key={anim.id}
                            anim={anim}
                            targetPos={cartPos}
                            onComplete={() => removeAnimation(anim.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </CartAnimationContext.Provider>
    );
};

const FlyItem = ({ anim, targetPos, onComplete }) => {
    if (!targetPos) return null;

    return (
        <motion.img
            src={anim.imgSrc}
            initial={{
                position: 'fixed',
                top: anim.startPos.top,
                left: anim.startPos.left,
                width: anim.startPos.width,
                height: anim.startPos.height,
                borderRadius: '12px',
                zIndex: 9999,
                opacity: 1,
                scale: 1,
            }}
            animate={{
                top: targetPos.top + 10,
                left: targetPos.left + 10,
                width: 20,
                height: 20,
                opacity: 0.5,
                scale: 0.2,
            }}
            transition={{
                duration: 0.8,
                ease: [0.45, 0, 0.55, 1], // Custom smooth cubic-bezier
                opacity: { duration: 0.6, delay: 0.2 },
                scale: { duration: 0.8 }
            }}
            onAnimationComplete={onComplete}
            style={{
                pointerEvents: 'none',
                objectFit: 'cover',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                border: '2px solid white'
            }}
        />
    );
};
