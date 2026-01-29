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
    // FCM Foreground Message Listener
    onMessageListener((payload) => {
      console.log('[FCM] Foreground message received:', payload);
      if (payload && payload.notification) {
        // Show notification when app is open
        // Using Toast for better in-app experience + System Notification
        import('react-hot-toast').then(({ toast }) => {
          toast(
            (t) => (
              <div onClick={() => {
                toast.dismiss(t.id);
                if (payload.data?.orderId) handleViewChange('my-orders');
              }}>
                <div style={{ fontWeight: 'bold' }}>{payload.notification.title}</div>
                <div style={{ fontSize: '0.9em' }}>{payload.notification.body}</div>
              </div>
            ),
            { duration: 4000, icon: '🔔' }
          );
        });

        // Also try system notification if visible
        if (Notification.permission === 'granted') {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/logo.png',
            tag: payload.data?.orderId || 'food-express'
          });
        }
      }
    });

    return () => {
      cleanup();
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
