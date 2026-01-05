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

import Footer from './components/Footer';
import { initGlobalSound } from './utils/soundEffects';

const Main = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const cleanup = initGlobalSound();
    return cleanup;
  }, []);

  const [view, setView] = useState('home');
  const [category, setCategory] = useState('All');

  const renderView = () => {
    switch (view) {
      case 'home': return <Home activeCategory={category} setCategory={setCategory} setView={setView} />;
      case 'cart': return <Cart setView={setView} />;
      case 'payment': return <Payment setView={setView} />;
      case 'success': return <Success setView={setView} />;
      case 'admin-orders': return <AdminOrders setView={setView} />;
      case 'my-orders': return <MyOrders setView={setView} />;
      case 'profile': return <Profile setView={setView} />;
      case 'login': return <Login setView={setView} />;
      case 'signup': return <Signup setView={setView} />;
      case 'quantum-tracker': return <QuantumTracker setView={setView} />;
      case 'fabricator': return <Fabricator setView={setView} />;
      default: return <Home activeCategory={category} setCategory={setCategory} setView={setView} />;
    }
  };

  const showNavbar = view !== 'login' && view !== 'signup';
  const isYellowBg = ['home', 'admin-orders', 'my-orders'].includes(view);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: isYellowBg ? '#fff9c4' : 'var(--bg)', transition: 'background 0.3s' }}>
      {showNavbar && <Navbar setView={setView} activeCategory={category} setCategory={setCategory} />}
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
