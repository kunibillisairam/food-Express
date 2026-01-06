import React, { useState, useContext, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import Success from './pages/Success';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminOrders from './pages/AdminOrders';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import QuantumTracker from './pages/QuantumTracker';
import Fabricator from './pages/Fabricator';
import DeliveryDashboard from './pages/DeliveryDashboard';

import Footer from './components/Footer';
import { initGlobalSound } from './utils/soundEffects';

const Main = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Initialize global click sounds
    const cleanup = initGlobalSound();
    return cleanup;
  }, []);

  const [view, setView] = useState('home');
  const [category, setCategory] = useState('All');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const handleViewChange = (targetView, orderId = null) => {
    if (orderId) setSelectedOrderId(orderId);
    setView(targetView);
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    switch (view) {
      case 'home': return <Home activeCategory={category} setCategory={setCategory} setView={handleViewChange} />;
      case 'cart': return <Cart setView={handleViewChange} />;
      case 'payment': return <Payment setView={handleViewChange} />;
      case 'success': return <Success setView={handleViewChange} />;
      case 'admin-orders': return <AdminOrders setView={handleViewChange} />;
      case 'my-orders': return <MyOrders setView={handleViewChange} />;
      case 'profile': return <Profile setView={handleViewChange} />;
      case 'login': return <Login setView={handleViewChange} />;
      case 'signup': return <Signup setView={handleViewChange} />;
      case 'quantum-tracker': return <QuantumTracker setView={handleViewChange} orderId={selectedOrderId} />;
      case 'fabricator': return <Fabricator setView={handleViewChange} />;
      case 'delivery-partner': return <DeliveryDashboard setView={handleViewChange} />;
      default: return <Home activeCategory={category} setCategory={setCategory} setView={handleViewChange} />;
    }
  };

  const showNavbar = view !== 'login' && view !== 'signup';
  const isYellowBg = ['home', 'admin-orders', 'my-orders'].includes(view);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isYellowBg ? '#fff9c4' : 'var(--bg)', transition: 'background 0.3s' }}>
      {showNavbar && <Navbar setView={handleViewChange} activeCategory={category} setCategory={setCategory} />}
      <div style={{ flex: 1 }}>
        {renderView()}
      </div>

      {/* Footer */}
      {showNavbar && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Main />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
