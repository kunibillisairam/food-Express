import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config';
import { AuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [cart, setCart] = useState([]);
    const [fleetCode, setFleetCode] = useState(localStorage.getItem('fleetCode') || null);
    const [isInternalUpdate, setIsInternalUpdate] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize Socket
    useEffect(() => {
        const newSocket = io(API_BASE_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10
        });

        newSocket.on('connect', () => {
            console.log(`[Socket] Connected to Fleet Command: ${newSocket.id}`);
            setIsConnected(true);
            // Re-join fleet if code exists
            const savedCode = localStorage.getItem('fleetCode');
            if (savedCode) {
                newSocket.emit('join-fleet', savedCode);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('[Socket] Disconnected from Fleet Command');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('[Socket] Connection Error:', err.message);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    // Initial Load Cart
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
        if (socket && fleetCode && !isInternalUpdate && isConnected) {
            socket.emit('sync-cart', {
                fleetCode,
                cartItems: cart,
                senderName: user?.username || 'Guest'
            });
        }
        setIsInternalUpdate(false);
    }, [cart, fleetCode, user, socket, isConnected]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

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
    }, [socket]);

    // Join fleet whenever code changes
    useEffect(() => {
        if (socket && fleetCode && isConnected) {
            socket.emit('join-fleet', fleetCode);
        }
    }, [fleetCode, socket, isConnected]);

    const joinFleet = (code) => {
        const cleanCode = code.toUpperCase().trim();
        setFleetCode(cleanCode);
        localStorage.setItem('fleetCode', cleanCode);
        if (socket && isConnected) {
            socket.emit('join-fleet', cleanCode);
        }
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
