import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="glass-card"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          style={{ 
            position: 'fixed', 
            bottom: '24px', 
            right: '24px', 
            padding: '1.25rem', 
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '2px solid var(--primary-color)',
            maxWidth: '350px'
          }}
        >
          <div style={{ background: 'var(--primary-color)', padding: '10px', borderRadius: '12px', color: 'white' }}>
            <Download size={24} />
          </div>
          <div style={{ flexGrow: 1 }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Install Registry</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Add this app to your home screen for quick access.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button className="btn-primary" onClick={handleInstall} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Install</button>
            <button onClick={() => setIsVisible(false)} style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>Not now</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
