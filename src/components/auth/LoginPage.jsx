import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Mail, Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      onLogin(data.session);
    } catch (err) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please confirm your email address before signing in.');
      } else {
        setError('Sign in failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-color)',
      padding: '1.5rem',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', top: '-200px', right: '-200px',
        width: '600px', height: '600px',
        background: 'var(--primary-color)', opacity: 0.04,
        borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-200px', left: '-200px',
        width: '500px', height: '500px',
        background: 'var(--accent-color)', opacity: 0.04,
        borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
            marginBottom: '1.25rem',
          }}>
            <CalendarCheck size={32} color="white" />
          </div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800,
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '0.4rem',
          }}>
            Activity Registry
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', fontWeight: 500 }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{
          padding: '2.5rem',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <form onSubmit={handleSubmit} noValidate>
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '0.875rem 1rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px', marginBottom: '1.5rem',
                  color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 500,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </motion.div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 700,
                color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.05em',
              }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-dim)', pointerEvents: 'none',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-label="Email address"
                  disabled={loading}
                  style={{
                    width: '100%', paddingLeft: '42px',
                    fontSize: '0.9rem', borderRadius: '12px',
                    opacity: loading ? 0.6 : 1,
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 700,
                color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.05em',
              }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-dim)', pointerEvents: 'none',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-label="Password"
                  disabled={loading}
                  style={{
                    width: '100%', paddingLeft: '42px', paddingRight: '42px',
                    fontSize: '0.9rem', borderRadius: '12px',
                    opacity: loading ? 0.6 : 1,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-dim)', padding: '4px',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                width: '100%', padding: '0.875rem',
                background: loading
                  ? 'var(--text-dim)'
                  : 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                color: 'white', borderRadius: '12px',
                fontWeight: 700, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(79, 70, 229, 0.35)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : (
                <><LogIn size={18} /> Sign In</>
              )}
            </motion.button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          ACTIVITY CORE v2.7 &nbsp;·&nbsp; Admin Access Only
        </p>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginPage;
