import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import LoginPage from './LoginPage';

const AuthGuard = ({ children }) => {
  const [session, setSession] = useState(undefined); // undefined = still loading

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading state — checking session
  if (session === undefined) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
      }}>
        <Loader2 size={36} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--primary-color)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authenticated — show login page
  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  // Authenticated — render app
  return children;
};

export default AuthGuard;
