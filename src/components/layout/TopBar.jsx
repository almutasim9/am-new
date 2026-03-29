import React from 'react';
import { Bell, BellOff, Search, Command } from 'lucide-react';

const TopBar = ({ 
  overdueCount, 
  notifPermission, 
  onHandleRequestPermission, 
  setActiveTab,
  onOpenSearch // New prop for global search
}) => {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '0.5rem 0', 
      marginBottom: '1.5rem' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>


        {/* Global Search Trigger Area */}
        <div 
          onClick={onOpenSearch}
          className="glass-card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '8px 16px', 
            cursor: 'pointer',
            minWidth: '300px',
            border: '1px solid var(--border-color)',
            background: 'var(--surface-hover)',
            borderRadius: '12px',
            transition: 'all 0.2s ease'
          }}
        >
          <Search size={18} color="var(--text-dim)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)', flexGrow: 1 }}>
            Quick search...
          </span>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '2px', 
            background: 'var(--card-bg)', 
            padding: '2px 6px', 
            borderRadius: '6px', 
            border: '1px solid var(--border-color)',
            fontSize: '0.7rem',
            color: 'var(--text-dim)'
          }}>
            <Command size={10} /> K
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div 
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => notifPermission !== 'granted' ? onHandleRequestPermission() : setActiveTab('dashboard')}
        >
          <div className="glass-card" style={{ 
            padding: '10px', 
            borderRadius: '12px', 
            border: overdueCount > 0 ? '1px solid #fee2e2' : '1px solid var(--border-color)' 
          }}>
            {notifPermission === 'granted' ? (
              <Bell size={20} color={overdueCount > 0 ? 'var(--danger)' : 'var(--text-secondary)'} />
            ) : (
              <BellOff size={20} color="var(--text-dim)" />
            )}
          </div>
          {overdueCount > 0 && (
            <span style={{ 
              position: 'absolute', 
              top: '-4px', 
              right: '-4px', 
              background: 'var(--danger)', 
              color: 'white', 
              fontSize: '10px', 
              fontWeight: 700, 
              width: '18px', 
              height: '18px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '2px solid white' 
            }}>
              {overdueCount}
            </span>
          )}
        </div>

        <div style={{ 
          background: 'var(--surface-hover)', 
          padding: '6px 12px', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          border: '1px solid var(--border-color)' 
        }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: 'var(--success)', 
            boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.1)' 
          }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Live Sync Active
          </span>
        </div>
        <div style={{ 
          width: '44px', 
          height: '44px', 
          background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', 
          borderRadius: '14px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'white', 
          fontWeight: 700, 
          boxShadow: '0 4px 6px -1px rgb(79 70 229 / 0.3)' 
        }}>
          A
        </div>
      </div>
    </header>
  );
};

export default TopBar;
