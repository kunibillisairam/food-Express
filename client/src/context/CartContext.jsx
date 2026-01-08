import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCart(JSON.parse(storedCart));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item) => {
        setCart((prevCart) => {
            const existing = prevCart.find((i) => i.id === item.id);
            if (existing) {
                return prevCart.map((i) =>
                    i.id === item.id ? { ...i, qty: i.qty + 1 } : i
                );
            }
            return [...prevCart, { ...item, qty: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart((prevCart) => {
            const existing = prevCart.find((i) => i.id === id);
            if (!existing) return prevCart;
            if (existing.qty === 1) {
                return prevCart.filter((i) => i.id !== id);
            }
            return prevCart.map((i) =>
                i.id === id ? { ...i, qty: i.qty - 1 } : i
            );
        });
    };

    const clearCart = () => {
        setCart([]);
    };

    const totalAmount = cart.reduce((total, item) => total + item.price * item.qty, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalAmount }}>
            {children}
        </CartContext.Provider>
    );
};
