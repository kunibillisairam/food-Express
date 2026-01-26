import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import API_BASE_URL from '../config';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const DeliveryDashboard = ({ setView }) => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [driverLocation, setDriverLocation] = useState([12.9716, 77.5946]); // Default Bangalore
    const [route, setRoute] = useState(null);

    // Fetch orders on mount and polling
    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/orders`);
            // Filter only active orders for simulation or show all but highlight active
            setOrders(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        // Simulate a route: Restaurant (Fixed) -> Customer (Random nearby)
        // In a real app, these would come from the order address
        const restaurantLoc = [12.9716, 77.5946];
        const customerLoc = [
            12.9716 + (Math.random() - 0.5) * 0.05,
            77.5946 + (Math.random() - 0.5) * 0.05
        ];
        setRoute([restaurantLoc, customerLoc]);
    };

    const updateStatus = async (status) => {
        if (!selectedOrder) return;
        try {
            await axios.put(`${API_BASE_URL}/api/orders/${selectedOrder._id}/status`, { status });
            // Optimistic update
            const updated = { ...selectedOrder, status };
            setSelectedOrder(updated);
            setOrders(orders.map(o => o._id === updated._id ? updated : o));

            if (status === 'Delivered') {
                setTimeout(() => {
                    setSelectedOrder(null);
                    setRoute(null);
                }, 2000); // Clear after delay
            }
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    return (
        <div className="delivery-dashboard fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>🛵 Delivery Partner</h2>
                <button onClick={() => setView('home')} className="nav-btn">Back to Home</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Order List */}
                <div style={{ background: 'var(--white)', padding: '1.5rem', borderRadius: '20px', boxShadow: 'var(--shadow)', height: '70vh', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1rem', borderBottom: '2px dashed var(--bg)', paddingBottom: '0.5rem' }}>Active Orders</h3>
                    {orders.length === 0 ? (
                        <p style={{ color: 'var(--gray)' }}>No orders available.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {orders.map(order => (
                                <div
                                    key={order._id}
                                    onClick={() => handleSelectOrder(order)}
                                    style={{
                                        padding: '1rem',
                                        background: selectedOrder?._id === order._id ? 'var(--bg)' : 'white',
                                        border: selectedOrder?._id === order._id ? '2px solid var(--primary)' : '1px solid var(--light-gray)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '700' }}>#{order._id.slice(-6)}</span>
                                        <span style={{
                                            background: order.status === 'Delivered' ? '#2ecc71' : '#f1c40f',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '0.8rem'
                                        }}>{order.status}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>
                                        {order.userName} • ₹{order.totalAmount}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--dark)', marginTop: '0.5rem' }}>
                                        {order.items.map(i => i.name).join(', ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Map View */}
                <div style={{ background: 'var(--white)', borderRadius: '20px', boxShadow: 'var(--shadow)', overflow: 'hidden', height: '70vh', position: 'relative' }}>
                    {selectedOrder ? (
                        <>
                            <div style={{ height: '70%', width: '100%' }}>
                                <MapContainer center={[12.9716, 77.5946]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    {route && (
                                        <>
                                            <Marker position={route[0]}>
                                                <Popup>Restaurant</Popup>
                                            </Marker>
                                            <Marker position={route[1]}>
                                                <Popup>Customer: {selectedOrder.userName}</Popup>
                                            </Marker>
                                            <Polyline positions={route} color="var(--primary)" />
                                        </>
                                    )}
                                </MapContainer>
                            </div>

                            {/* Controls */}
                            <div style={{ padding: '1.5rem', height: '30%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Order Status: <span style={{ color: 'var(--primary)' }}>{selectedOrder.status}</span></h3>

                                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => updateStatus('Picked Up')}
                                        disabled={selectedOrder.status !== 'Pending' && selectedOrder.status !== 'Preparing'}
                                        style={{
                                            padding: '1rem 2rem',
                                            borderRadius: '50px',
                                            border: 'none',
                                            background: selectedOrder.status === 'Pending' || selectedOrder.status === 'Preparing' ? 'var(--primary)' : 'var(--light-gray)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            flex: 1
                                        }}
                                    >
                                        Picked Up
                                    </button>
                                    <button
                                        onClick={() => updateStatus('On the Way')}
                                        disabled={selectedOrder.status !== 'Picked Up'}
                                        style={{
                                            padding: '1rem 2rem',
                                            borderRadius: '50px',
                                            border: 'none',
                                            background: selectedOrder.status === 'Picked Up' ? '#ffa502' : 'var(--light-gray)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            flex: 1
                                        }}
                                    >
                                        On the Way
                                    </button>
                                    <button
                                        onClick={() => updateStatus('Delivered')}
                                        disabled={selectedOrder.status !== 'On the Way'}
                                        style={{
                                            padding: '1rem 2rem',
                                            borderRadius: '50px',
                                            border: 'none',
                                            background: selectedOrder.status === 'On the Way' ? '#2ecc71' : 'var(--light-gray)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            flex: 1
                                        }}
                                    >
                                        Delivered
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</div>
                            <h3>Select an order to start delivery</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryDashboard;
