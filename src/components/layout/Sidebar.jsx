import React, { useMemo } from 'react';
import { LayoutDashboard, Store, ClipboardList, BarChart3, Bookmark, Settings as SettingsIcon, Moon, Sun, CalendarCheck, TrendingUp, Target, LogOut, User, X, Trash2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const Sidebar = ({ activeTab, setActiveTab, stats, theme, setTheme, onSelectStore, user, isOpen, onClose }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const completionRate = useMemo(() =>
    stats.totalActivities ? Math.round((stats.completedTasks / stats.totalActivities) * 100) : 0,
  [stats.completedTasks, stats.totalActivities]);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{ padding: '0.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarCheck size={26} /> Registry
          </h1>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.1em', marginTop: '2px' }}>v2.7 UNIVERSAL</p>
        </div>
        <button 
          onClick={onClose} 
          className="mobile-only"
          style={{ 
            padding: '8px', 
            borderRadius: '10px', 
            background: 'var(--surface-hover)',
            color: 'var(--text-secondary)',
            display: 'none' // Hidden by default, shown via CSS in mobile view
          }}
        >
          <X size={20} />
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-only { display: flex !important; }
        }
      `}</style>


      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('dashboard'); onSelectStore(null); }}
        >
          <LayoutDashboard size={20} /> Dashboard
        </button>
        <button 
          className={`nav-link ${activeTab === 'stores' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('stores'); onSelectStore(null); }}
        >
          <Store size={20} /> Restaurants
        </button>
        <button 
          className={`nav-link ${activeTab === 'activities' ? 'active' : ''}`} 
          onClick={() => setActiveTab('activities')} 
          style={{ position: 'relative' }}
        >
          <ClipboardList size={20} /> Daily Log
          {stats.pendingTasks > 0 && (
            <span style={{ 
              position: 'absolute', 
              right: '12px', 
              background: 'var(--danger)', 
              color: 'white', 
              fontSize: '0.65rem', 
              fontWeight: 800, 
              padding: '2px 6px', 
              borderRadius: '10px', 
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
              animation: 'pulse 2s infinite'
            }}>
              {stats.pendingTasks}
            </span>
          )}
        </button>
        <button className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          <BarChart3 size={20} /> Statistics
        </button>
        <button className={`nav-link ${activeTab === 'target' ? 'active' : ''}`} onClick={() => setActiveTab('target')}>
          <Target size={20} /> Target
        </button>
        <button className={`nav-link ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
          <Bookmark size={20} /> Library
        </button>
        <button className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <SettingsIcon size={20} /> Settings
        </button>
        <button 
          className={`nav-link ${activeTab === 'recycle' ? 'active' : ''}`} 
          onClick={() => setActiveTab('recycle')}
          style={{ color: 'var(--danger)', opacity: activeTab === 'recycle' ? 1 : 0.7 }}
        >
          <Trash2 size={20} /> Recycle Bin
        </button>
        
        <button 
          className="nav-link" 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
          style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', borderRadius: '0' }}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Summary card */}
        <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '60px', height: '60px', background: 'var(--primary-color)', opacity: 0.1, filter: 'blur(20px)', borderRadius: '50%' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', marginBottom: '8px' }}>
            <TrendingUp size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Summary</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Completion rate</span>
              <span style={{ fontWeight: 700 }}>{completionRate}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${completionRate}%`,
                  height: '100%',
                  background: 'var(--primary-color)',
                  transition: 'width 0.5s ease'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* User info + Logout */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '0.75rem 1rem',
            background: 'var(--surface-hover)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={16} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email?.split('@')[0] || 'Admin'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600 }}>Administrator</div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
              style={{
                flexShrink: 0, padding: '6px', borderRadius: '8px',
                color: 'var(--text-dim)', display: 'flex', alignItems: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
