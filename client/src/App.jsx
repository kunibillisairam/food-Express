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
import DeliveryTracker from './pages/DeliveryTracker';
import Fabricator from './pages/Fabricator';
import DeliveryDashboard from './pages/DeliveryDashboard';
import CampaignManager from './pages/CampaignManager';
import Company from './pages/Company';

import Footer from './components/Footer';
import StarfieldBackground from './components/StarfieldBackground';
import VoiceCommander from './components/VoiceCommander';
import { initGlobalSound } from './utils/soundEffects';
import { CartAnimationProvider } from './context/CartAnimationContext';
import { Toaster } from 'react-hot-toast';
import InstallPWA from './components/InstallPWA';
import NotificationPrompt from './components/NotificationPrompt';
import { onMessageListener } from './firebase';

// FCM Notification System - Foreground message handler
const Main = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Initialize global click sounds
    const cleanup = initGlobalSound();

    // Online/Offline status
    const handleOnline = () => {
      import('react-hot-toast').then(({ toast }) => toast.success("You're back online!", { icon: '🌐' }));
    };
    const handleOffline = () => {
      import('react-hot-toast').then(({ toast }) => toast.error("You're offline. App is running in offline mode.", { icon: '📶', duration: 4000 }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // FCM Foreground Message Listener
    onMessageListener((payload) => {
      console.log('🔥 [FCM] Foreground message received:', payload);

      const title = payload.notification?.title || "New Message";
      const body = payload.notification?.body || "Check your app for updates.";

      // 1. Show Toast
      import('react-hot-toast').then(({ toast }) => {
        toast((t) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '1.5rem' }}>🔔</div>
            <div>
              <div style={{ fontWeight: 'bold' }}>{title}</div>
              <div style={{ fontSize: '0.8rem' }}>{body}</div>
            </div>
          </div>
        ), {
          duration: 6000,
          position: 'top-right',
          style: {
            background: '#2d3436',
            color: '#fff',
            borderRadius: '12px',
            border: '2px solid #55efc4'
          }
        });
      });

      // 2. Play Sound (Optional)
      console.log('🔊 Playing notification sound effect...');

      // 3. System Notification (if permission granted and browser supports)
      if (window.Notification && Notification.permission === 'granted') {
        const n = new Notification(title, {
          body: body,
          icon: '/logo.png',
          tag: 'food-express-order'
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      }
    });

    // Initial check for permission
    if (window.Notification) {
      console.log(`[Notification] Current Permission: ${Notification.permission}`);
    }

    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
      case 'quantum-tracker': return <DeliveryTracker setView={handleViewChange} orderId={selectedOrderId} />;
      case 'fabricator': return <Fabricator setView={handleViewChange} />;
      case 'delivery-partner': return <DeliveryDashboard setView={handleViewChange} />;
      case 'campaign-manager': return <CampaignManager setView={handleViewChange} />;
      case 'company': return <Company />;
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

      {/* Footer - Only show on Home page */}
      {view === 'home' && <Footer />}

      {/* Voice Commander */}
      {showNavbar && (
        <VoiceCommander
          setView={handleViewChange}
          setSearchTerm={setSearchTerm}
          setCategory={setCategory}
        />
      )}
      <InstallPWA />
      <NotificationPrompt />

    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <CartAnimationProvider>
          <Toaster position="bottom-center" />
          <Main />
        </CartAnimationProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
