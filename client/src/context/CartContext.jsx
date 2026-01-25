import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config';
import { AuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';

export const CartContext = createContext();

const socket = io(API_BASE_URL);

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState([]);
    const [fleetCode, setFleetCode] = useState(localStorage.getItem('fleetCode') || null);
    const [isInternalUpdate, setIsInternalUpdate] = useState(false);

    // Initial Load
    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCart(JSON.parse(storedCart));
        }
    }, []);

    // Persist and Sync Cart
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));

        // Sync to Fleet if code exists AND this wasn't an external update
        if (fleetCode && !isInternalUpdate) {
            socket.emit('sync-cart', {
                fleetCode,
                cartItems: cart,
                senderName: user?.username || 'Guest'
            });
        }
        setIsInternalUpdate(false);
    }, [cart, fleetCode, user]);

    // Socket Event Listeners
    useEffect(() => {
        socket.on('cart-updated', ({ cartItems, updatedBy }) => {
            setIsInternalUpdate(true);
            setCart(cartItems);
            toast.success(`${updatedBy} updated the Fleet Cargo!`, {
                icon: '🚀',
                style: {
                    background: '#1a1a2e',
                    color: '#fff',
                    border: '1px solid #00f2fe'
                }
            });
        });

        socket.on('fleet-announcement', ({ message }) => {
            toast(message, {
                icon: '📡',
                style: {
                    background: '#16213e',
                    color: '#00d2ff'
                }
            });
        });

        return () => {
            socket.off('cart-updated');
            socket.off('fleet-announcement');
        };
    }, []);

    // Re-join fleet on mount/refresh if code exists
    useEffect(() => {
        if (fleetCode) {
            socket.emit('join-fleet', fleetCode);
        }
    }, [fleetCode]);

    const joinFleet = (code) => {
        const cleanCode = code.toUpperCase().trim();
        setFleetCode(cleanCode);
        localStorage.setItem('fleetCode', cleanCode);
        socket.emit('join-fleet', cleanCode);
        toast.success(`JOINED FLEET: ${cleanCode}`);
    };

    const leaveFleet = () => {
        setFleetCode(null);
        localStorage.removeItem('fleetCode');
        toast.error('EXITED FLEET CHANNEL');
    };

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

    const [lastOrder, setLastOrder] = useState(null);

    const clearCart = () => {
        setCart([]);
    };

    const totalAmount = cart.reduce((total, item) => total + item.price * item.qty, 0);

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, clearCart,
            totalAmount, lastOrder, setLastOrder,
            fleetCode, joinFleet, leaveFleet
        }}>
            {children}
        </CartContext.Provider>
    );
};
