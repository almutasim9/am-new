import React, { useState } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Shield, Database, Layout, Bell, Info, Globe, Layers, AlertTriangle } from 'lucide-react';

const Settings = ({ 
  outcomes, 
  zones, 
  categories, 
  closureReasons = [],
  onAddOutcome, 
  onDeleteOutcome, 
  onAddZone, 
  onDeleteZone, 
  onAddCategory, 
  onDeleteCategory, 
  onAddClosureReason,
  onDeleteClosureReason,
  notifPermission, 
  onRequestPermission 
}) => {
  const [newOutcome, setNewOutcome] = useState('');
  const [newZone, setNewZone] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newClosureReason, setNewClosureReason] = useState('');
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

  const handleClosureReasonSubmit = (e) => {
    e.preventDefault();
    if (newClosureReason.trim()) {
      onAddClosureReason(newClosureReason.trim());
      setNewClosureReason('');
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
    <div className="section-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 className="gradient-text">System Configuration</h2>
          <p className="stat-label">Configure taxonomies, business rules, and maintenance parameters</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Column: Taxonomies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className="glass-card" style={{ padding: '2rem' }}>
            <div className="settings-section-title">
              <Layout size={20} />
              <h3>Activity Outcomes / النتائج</h3>
            </div>
            <form onSubmit={handleOutcomeSubmit} className="settings-form-row">
              <input type="text" placeholder="e.g. Training Session" value={newOutcome} onChange={e => setNewOutcome(e.target.value)} />
              <button type="submit" className="btn-primary"><Plus size={20} /></button>
            </form>
            <div className="settings-list">
              {(outcomes || []).map(o => (
                <div key={o.id} className="settings-item">
                  <span>{o.name}</span>
                  <button onClick={() => onDeleteOutcome(o.id)} className="delete-btn"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card" style={{ padding: '2rem' }}>
            <div className="settings-section-title">
              <Globe size={20} />
              <h3>Management Zones / المناطق</h3>
            </div>
            <form onSubmit={handleZoneSubmit} className="settings-form-row">
              <input type="text" placeholder="e.g. Baghdad, Basra" value={newZone} onChange={e => setNewZone(e.target.value)} />
              <button type="submit" className="btn-primary"><Plus size={20} /></button>
            </form>
            <div className="settings-list">
              {(zones || []).map(z => (
                <div key={z.id} className="settings-item">
                  <span>{z.name}</span>
                  <button onClick={() => onDeleteZone(z.id)} className="delete-btn"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Categories & Closure */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className="glass-card" style={{ padding: '2rem' }}>
            <div className="settings-section-title">
              <Layers size={20} />
              <h3>Store Categories / التصنيفات</h3>
            </div>
            <form onSubmit={handleCategorySubmit} className="settings-form-row">
              <input type="text" placeholder="e.g. Supermarket" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
              <button type="submit" className="btn-primary"><Plus size={20} /></button>
            </form>
            <div className="settings-list">
              {(categories || []).map(c => (
                <div key={c.id} className="settings-item">
                  <span>{c.name}</span>
                  <button onClick={() => onDeleteCategory(c.id)} className="delete-btn"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card" style={{ padding: '2rem' }}>
            <div className="settings-section-title" style={{ color: 'var(--danger)' }}>
              <Shield size={20} />
              <h3>Closure Reasons / أسباب الإغلاق</h3>
            </div>
            <form onSubmit={handleClosureReasonSubmit} className="settings-form-row">
              <input type="text" placeholder="e.g. Poor Performance" value={newClosureReason} onChange={e => setNewClosureReason(e.target.value)} />
              <button type="submit" className="btn-primary" style={{ background: 'var(--danger)' }}><Plus size={20} /></button>
            </form>
            <div className="settings-list">
              {(closureReasons || []).map(cr => (
                <div key={cr.id} className="settings-item">
                  <span style={{ fontWeight: 600 }}>{cr.name}</span>
                  <button onClick={() => onDeleteClosureReason(cr.id)} className="delete-btn"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </section>

          {/* Notifications & Cache */}
          <section className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="settings-section-title">
              <Database size={20} />
              <h3>System Maintenance / صيانة</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                className={notifPermission === 'granted' ? 'btn-secondary' : 'btn-primary'} 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onRequestPermission}
                disabled={notifPermission === 'granted'}
              >
                 <Bell size={16} style={{ marginRight: '8px' }} />
                {notifPermission === 'granted' ? 'Notifications Active' : 'Enable System Alerts'}
              </button>
              
              <button 
                className="btn-secondary" 
                onClick={() => setShowConfirm(true)}
                style={{ width: '100%', justifyContent: 'center', border: '1px solid #fee2e2', color: '#ef4444' }}
              >
                Clear Local Storage / تصفير الموقع
              </button>
              
              {showConfirm && (
                 <div style={{ padding: '1rem', background: '#ffeef0', borderRadius: '12px', textAlign: 'center', border: '1px solid #fecaca' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '8px', justifyContent: 'center' }}>
                     <AlertTriangle size={16} />
                     <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>Full application reset? / تصفير التطبيق بالكامل؟</p>
                   </div>
                   <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                     <button className="btn-primary" onClick={handleClearCache} style={{ background: 'var(--danger)', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', color: 'white', border: 'none' }}>Yes, Reset</button>
                     <button className="btn-secondary" onClick={() => setShowConfirm(false)} style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}>Cancel</button>
                   </div>
                 </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .settings-grid {
          display: grid;
          grid-template-columns: minmax(min(300px, 100%), 1fr) 1.5fr;
          gap: 2rem;
        }

        .settings-section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; color: var(--primary-color); }
        .settings-section-title h3 { font-size: 1.1rem; font-weight: 700; margin: 0; }
        .settings-form-row { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
        .settings-form-row input { flex: 1; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid var(--border-color); font-weight: 600; outline: none; background: var(--bg-color); color: var(--text-primary); transition: 0.2s; }
        .settings-form-row input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }

        .settings-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .settings-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--surface-hover); border-radius: 12px; border: 1px solid var(--border-color); transition: 0.2s; }
        .settings-item:hover { border-color: var(--primary-light); background: white; }
        .settings-item span { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); }
        .delete-btn { color: var(--text-dim); border: none; background: transparent; cursor: pointer; padding: 10px; border-radius: 8px; transition: 0.2s; min-height: 44px; min-width: 44px; display: flex; align-items: center; justify-content: center; }
        .delete-btn:hover { color: var(--danger); background: #fee2e2; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) {
          .settings-grid { 
            grid-template-columns: 1fr; 
            gap: 1.5rem; 
          }
          section.glass-card {
            padding: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
