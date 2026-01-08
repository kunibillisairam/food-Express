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
import StarfieldBackground from './components/StarfieldBackground';
import VoiceCommander from './components/VoiceCommander';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const handleViewChange = (targetView, orderId = null) => {
    if (orderId) setSelectedOrderId(orderId);

    // Automatically reset searching/filtering when navigating
    if (targetView !== 'home') {
      setSearchTerm('');
      setCategory('All');
    }

    setView(targetView);
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    switch (view) {
      case 'home': return (
        <Home
          activeCategory={category}
          setCategory={setCategory}
          setView={handleViewChange}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      );
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
  const isYellowBg = ['home', 'admin-orders', 'my-orders', 'profile'].includes(view);

  // For sci-fi feel, we use a semi-transparent overlay if yellow is needed, 
  // otherwise we let the Starfield shine through.
  const mainBg = isYellowBg ? 'rgba(255, 249, 196, 0.5)' : 'transparent';

  return (
    <div className={`app-container view-${view}`} style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', background: mainBg, transition: 'background 0.3s' }}>
      <StarfieldBackground />
      {showNavbar && (
        <Navbar
          setView={handleViewChange}
          activeCategory={category}
          setCategory={setCategory}
          setSearchTerm={setSearchTerm}
        />
      )}
      <div style={{ flex: 1, width: '100%' }}>
        {renderView()}
      </div>

      {/* Footer */}
      {showNavbar && <Footer />}

      {/* Voice Commander */}
      {showNavbar && (
        <VoiceCommander
          setView={handleViewChange}
          setSearchTerm={setSearchTerm}
          setCategory={setCategory}
        />
      )}
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
