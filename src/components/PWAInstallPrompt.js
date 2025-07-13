import React, { useState, useEffect } from 'react';
import { FaDownload, FaBell, FaTimes } from 'react-icons/fa';

function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed/running as PWA
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              window.navigator.standalone ||
                              document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      
      // Only show prompts if NOT running as installed app
      if (!isStandaloneMode) {
        // Check for install prompt
        const installPromptDismissed = localStorage.getItem('pwaInstallDismissed');
        if (!installPromptDismissed) {
          setShowInstallPrompt(true);
        }
        
        // Always show notification prompt if permission not granted
        if (Notification.permission === 'default') {
          setShowNotificationPrompt(true);
        }
      }
    };

    checkStandalone();

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Install prompt outcome:', outcome);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      // For iOS or other browsers without native install prompt
      alert('To install this app:\n\n• Safari: Tap the Share button, then "Add to Home Screen"\n• Chrome: Tap the menu (⋮), then "Add to Home Screen"');
    }
  };

  const handleNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setShowNotificationPrompt(false);
        console.log('Notification permission granted');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwaInstallDismissed', 'true');
  };

  const dismissNotificationPrompt = () => {
    setShowNotificationPrompt(false);
  };

  // Don't show anything if app is installed/standalone
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#000',
          color: '#fff',
          padding: '16px 20px',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <img src="/LOGO.png" alt="App Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>Install My Reminder</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Add to home screen for quick access</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleInstallClick}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FaDownload /> Install
            </button>
            <button
              onClick={dismissInstallPrompt}
              style={{
                background: 'transparent',
                color: '#fff',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <div style={{
          position: 'fixed',
          top: showInstallPrompt ? '70px' : '0',
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
          color: '#fff',
          padding: '16px 20px',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <img src="/LOGO.png" alt="App Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>Enable Notifications</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Get reminded on birthdays</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleNotificationPermission}
              style={{
                background: '#fff',
                color: '#ff6b6b',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FaBell /> Allow
            </button>
            <button
              onClick={dismissNotificationPrompt}
              style={{
                background: 'transparent',
                color: '#fff',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default PWAInstallPrompt; 