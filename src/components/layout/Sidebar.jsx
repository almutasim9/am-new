import React, { useMemo } from 'react';
import { LayoutDashboard, Store, ClipboardList, BarChart3, Bookmark, Settings as SettingsIcon, Moon, Sun, CalendarCheck, TrendingUp, Target, LogOut, User, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const Sidebar = ({ activeTab, setActiveTab, stats, theme, setTheme, onSelectStore, user, isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const completionRate = useMemo(() =>
    stats.totalActivities ? Math.round((stats.completedTasks / stats.totalActivities) * 100) : 0,
  [stats.completedTasks, stats.totalActivities]);

  const navItems = [
    { id: 'dashboard',   icon: LayoutDashboard, label: 'Dashboard',    onClick: () => { setActiveTab('dashboard'); onSelectStore(null); } },
    { id: 'stores',      icon: Store,            label: 'Restaurants',  onClick: () => { setActiveTab('stores'); onSelectStore(null); } },
    { id: 'activities',  icon: ClipboardList,    label: 'Daily Log',    badge: stats.pendingTasks > 0 ? stats.pendingTasks : null },
    { id: 'stats',       icon: BarChart3,        label: 'Statistics'   },
    { id: 'performance', icon: TrendingUp,       label: 'Performance'  },
    { id: 'target',      icon: Target,           label: 'Target'       },
    { id: 'library',     icon: Bookmark,         label: 'Library'      },
    { id: 'settings',    icon: SettingsIcon,     label: 'Settings'     },
    { id: 'recycle',     icon: Trash2,           label: 'Recycle Bin', danger: true },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

      <style>{`
        @media (max-width: 768px) {
          .mobile-only { display: flex !important; }
        }
        .sidebar.collapsed { width: 68px; padding: 1rem 0.6rem; }
        .sidebar.collapsed .sidebar-label,
        .sidebar.collapsed .sidebar-summary,
        .sidebar.collapsed .sidebar-user-info { display: none !important; }
        .sidebar.collapsed .nav-link { justify-content: center; padding: 10px; }
        .sidebar.collapsed .sidebar-user { justify-content: center; padding: 8px; }
        .sidebar { transition: width 0.25s ease, padding 0.25s ease; overflow: hidden; }
        .collapse-btn {
          position: absolute;
          top: 1.2rem;
          right: -14px;
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--surface-color);
          color: var(--text-dim);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow);
          z-index: 100;
          transition: all 0.2s;
        }
        .collapse-btn:hover { color: var(--primary-color); border-color: var(--primary-color); }
        @media (max-width: 768px) { .collapse-btn { display: none !important; } }
      `}</style>

      {/* Collapse toggle — desktop only */}
      <button className="collapse-btn" onClick={onToggleCollapse} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header */}
      <div style={{ padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
        <div style={{ overflow: 'hidden' }}>
          {isCollapsed ? (
            <CalendarCheck size={24} color="var(--primary-color)" />
          ) : (
            <>
              <h1 className="gradient-text" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
                <CalendarCheck size={26} style={{ flexShrink: 0 }} /> Registry
              </h1>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.1em', marginTop: '2px' }}>v2.7 UNIVERSAL</p>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="mobile-only"
          style={{ padding: '8px', borderRadius: '10px', background: 'var(--surface-hover)', color: 'var(--text-secondary)', display: 'none', flexShrink: 0 }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={item.onClick || (() => setActiveTab(item.id))}
              title={isCollapsed ? item.label : undefined}
              style={{
                position: 'relative',
                ...(item.danger ? { color: 'var(--danger)', opacity: activeTab === item.id ? 1 : 0.7 } : {}),
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-label">{item.label}</span>
              {item.badge && (
                <span style={{
                  position: 'absolute', right: isCollapsed ? '-6px' : '12px', top: isCollapsed ? '-4px' : undefined,
                  background: 'var(--danger)', color: 'white',
                  fontSize: '0.6rem', fontWeight: 800, padding: '2px 5px',
                  borderRadius: '10px', boxShadow: '0 2px 4px rgba(239,68,68,0.3)',
                  animation: 'pulse 2s infinite'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <button
          className="nav-link"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          title={isCollapsed ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : undefined}
          style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', borderRadius: '0', whiteSpace: 'nowrap' }}
        >
          {theme === 'light' ? <Moon size={20} style={{ flexShrink: 0 }} /> : <Sun size={20} style={{ flexShrink: 0 }} />}
          <span className="sidebar-label">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </nav>

      {/* Bottom */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Summary card */}
        <div className="glass-card sidebar-summary" style={{ padding: '1.25rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow)', position: 'relative', overflow: 'hidden' }}>
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
              <div style={{ width: `${completionRate}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

        {/* User info + Logout */}
        {user && (
          <div className="sidebar-user" style={{
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
            <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email?.split('@')[0] || 'Admin'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600 }}>Administrator</div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
              style={{ flexShrink: 0, padding: '6px', borderRadius: '8px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
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
