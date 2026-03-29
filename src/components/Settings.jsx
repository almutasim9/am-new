import React, { useState } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Shield, Database, Layout, Moon, Sun, Bell, BellOff, Info, Globe, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = ({ 
  outcomes, 
  zones, 
  categories, 
  onAddOutcome, 
  onDeleteOutcome, 
  onAddZone, 
  onDeleteZone, 
  onAddCategory, 
  onDeleteCategory, 
  notifPermission, 
  onRequestPermission 
}) => {
  const [newOutcome, setNewOutcome] = useState('');
  const [newZone, setNewZone] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleOutcomeSubmit = (e) => {
    e.preventDefault();
    if (newOutcome.trim()) {
      onAddOutcome(newOutcome.trim());
      setNewOutcome('');
    }
  };
  
  const handleZoneSubmit = (e) => {
    e.preventDefault();
    if (newZone.trim()) {
      onAddZone(newZone.trim());
      setNewZone('');
    }
  };
  
  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleClearCache = () => {
    const theme = localStorage.getItem('mp_theme');
    localStorage.clear();
    sessionStorage.clear();
    if (theme) localStorage.setItem('mp_theme', theme);
    window.location.reload();
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="gradient-text">Platform Settings</h2>
          <p className="stat-label">Configure activity types and system preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '2rem' }}>
        {/* Activity Status Manager */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              <Layout size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Activity Outcomes</h3>
            </div>
            
            <form onSubmit={handleOutcomeSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="e.g. Training Session" 
                value={newOutcome}
                onChange={e => setNewOutcome(e.target.value)}
                style={{ flexGrow: 1 }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}>
                <Plus size={20} />
              </button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(outcomes || []).map(o => (
                <div 
                  key={o.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '1rem', 
                    background: '#f8fafc', 
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{o.name}</span>
                  <button onClick={() => onDeleteOutcome(o.id)} aria-label={`Delete outcome: ${o.name}`} style={{ color: 'var(--danger)', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* New Section: Zones Manager */}
          <section className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              <Globe size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Management Zones</h3>
            </div>
            <form onSubmit={handleZoneSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input type="text" placeholder="e.g. Baghdad, Basra" value={newZone} onChange={e => setNewZone(e.target.value)} style={{ flexGrow: 1 }} />
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}><Plus size={20} /></button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(zones || []).map(z => (
                <div 
                  key={z.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '1rem', 
                    background: '#f8fafc', 
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{z.name}</span>
                  <button onClick={() => onDeleteZone(z.id)} aria-label={`Delete zone: ${z.name}`} style={{ color: 'var(--danger)', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* New Section: Store Categories */}
          <section className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              <Layers size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Store Categories</h3>
            </div>
            <form onSubmit={handleCategorySubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input type="text" placeholder="e.g. Supermarket" value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ flexGrow: 1 }} />
              <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}><Plus size={20} /></button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(categories || []).map(c => (
                <div 
                  key={c.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '1rem', 
                    background: '#f8fafc', 
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.name}</span>
                  <button onClick={() => onDeleteCategory(c.id)} aria-label={`Delete category: ${c.name}`} style={{ color: 'var(--danger)', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* New: Smart Reminders Settings */}
          <section className="glass-card" style={{ padding: '2rem', border: notifPermission === 'granted' ? '2px solid var(--success)' : '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: notifPermission === 'granted' ? 'var(--success)' : 'var(--text-dim)' }}>
              {notifPermission === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Smart Reminders</h3>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Get browser notifications for follow-up activities due today.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                className={notifPermission === 'granted' ? 'btn-secondary' : 'btn-primary'} 
                style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: '8px' }}
                onClick={onRequestPermission}
                disabled={notifPermission === 'granted'}
              >
                {notifPermission === 'granted' ? 'Reminders Enabled' : 'Enable Smart Reminders'}
              </button>
              
              {notifPermission === 'denied' && (
                <div style={{ padding: '0.75rem', background: '#ffeef0', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Info size={16} color="var(--danger)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 500 }}>
                    Permission denied. Please reset notification settings in your browser address bar.
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* System Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
              <Shield size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Security & Sync</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Supabase Connection</span>
                <span className="badge badge-success">Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Real-time Pipeline</span>
                <span className="badge badge-success">Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Access Role</span>
                <span className="badge badge-warning">Administrator</span>
              </div>
            </div>
          </section>

          <section className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              <Database size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Data Maintenance</h3>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Manage your local data persistence and cloud synchronization parameters. Clearing cache will log you out and reset local preferences.
            </p>
            {!showConfirm ? (
              <button 
                className="btn-secondary" 
                onClick={() => setShowConfirm(true)}
                style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: '8px' }}
              >
                <Database size={18} /> Clear Local Cache
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600, textAlign: 'center' }}>
                  Are you sure? The app will fully restart. / هل أنت متأكد؟ سيتم إعادة تشغيل التطبيق.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn-primary"
                    onClick={handleClearCache}
                    style={{ flex: 1, padding: '0.5rem', background: 'var(--danger)', fontSize: '0.875rem' }}
                  >
                    Yes, Clear Now
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowConfirm(false)}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
