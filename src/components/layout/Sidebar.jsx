import React, { useMemo } from 'react';
import { LayoutDashboard, Store, ClipboardList, BarChart3, Bookmark, Settings as SettingsIcon, Moon, Sun, CalendarCheck, TrendingUp, Target, LogOut, User, X, Trash2, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
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
    { id: 'offers',      icon: Gift,              label: 'العروض'       },
    { id: 'library',     icon: Bookmark,         label: 'Library'      },
    { id: 'settings',    icon: SettingsIcon,     label: 'Settings'     },
    { id: 'recycle',     icon: Trash2,           label: 'Recycle Bin', danger: true },
  ];

  return (
    <>
      <style>{`
        .sidebar {
          display: flex;
          flex-direction: column;
          width: 240px;
          flex-shrink: 0;
          padding: 1.25rem 0.875rem;
          position: sticky;
          top: 1.5rem;
          height: calc(100vh - 3rem);
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          box-shadow: var(--shadow);
          transition: width 0.25s cubic-bezier(.4,0,.2,1), padding 0.25s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
        }
        .sidebar.collapsed {
          width: 64px;
          padding: 1.25rem 0.5rem;
        }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: -260px;
            height: 100vh;
            border-radius: 0;
            z-index: 1000;
            width: 240px !important;
            transition: left 0.3s cubic-bezier(.4,0,.2,1);
            box-shadow: 4px 0 24px rgba(0,0,0,0.15);
          }
          .sidebar.open { left: 0; }
          .sidebar-mobile-close { display: flex !important; }
          .sidebar-collapse-btn { display: none !important; }
        }

        /* Header */
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.25rem 0.5rem;
          margin-bottom: 1.25rem;
          min-height: 44px;
        }
        .sidebar.collapsed .sidebar-header {
          justify-content: center;
          padding: 0;
        }
        .sidebar-brand {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sidebar.collapsed .sidebar-brand { display: none; }
        .sidebar-brand-title {
          font-size: 1.35rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .sidebar-brand-sub {
          font-size: 0.6rem;
          color: var(--text-dim);
          font-weight: 700;
          letter-spacing: 0.12em;
          margin-top: 2px;
          padding-left: 2px;
        }
        /* sidebar-header-icon removed — collapse btn is shown alone when collapsed */

        /* Collapse button */
        .sidebar-collapse-btn {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          border: 1px solid var(--border-color);
          background: var(--surface-hover);
          color: var(--text-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .sidebar-collapse-btn:hover {
          color: var(--primary-color);
          border-color: var(--primary-color);
          background: rgba(79,70,229,0.08);
        }

        /* Mobile close */
        .sidebar-mobile-close {
          display: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--surface-hover);
          color: var(--text-secondary);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid var(--border-color);
          flex-shrink: 0;
        }

        /* Nav */
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          position: relative;
          white-space: nowrap;
          text-align: left;
          width: 100%;
        }
        .sidebar.collapsed .sidebar-nav-item {
          padding: 10px;
          justify-content: center;
        }
        .sidebar-nav-item:hover {
          background: var(--surface-hover);
          color: var(--text-primary);
        }
        .sidebar-nav-item.active {
          background: rgba(79,70,229,0.1);
          color: var(--primary-color);
        }
        .sidebar-nav-item.active .sidebar-nav-icon {
          color: var(--primary-color);
        }
        .sidebar-nav-item.danger { color: var(--danger); }
        .sidebar-nav-item.danger:hover { background: rgba(239,68,68,0.08); }

        .sidebar-nav-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar.collapsed .sidebar-nav-label { display: none; }

        .sidebar-nav-badge {
          background: var(--danger);
          color: white;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 999px;
          line-height: 1.4;
          flex-shrink: 0;
        }
        .sidebar.collapsed .sidebar-nav-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          padding: 1px 4px;
        }

        /* Divider */
        .sidebar-divider {
          height: 1px;
          background: var(--border-color);
          margin: 6px 4px;
        }

        /* Theme toggle */
        .sidebar-theme-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--text-dim);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          width: 100%;
        }
        .sidebar.collapsed .sidebar-theme-btn {
          padding: 10px;
          justify-content: center;
        }
        .sidebar-theme-btn:hover {
          background: var(--surface-hover);
          color: var(--text-primary);
        }
        .sidebar.collapsed .sidebar-theme-label { display: none; }

        /* Bottom */
        .sidebar-bottom {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 8px;
        }

        /* Summary card */
        .sidebar-summary {
          padding: 1rem;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          box-shadow: var(--shadow);
          overflow: hidden;
          position: relative;
        }
        .sidebar.collapsed .sidebar-summary { display: none; }

        /* User row */
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: var(--surface-hover);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }
        .sidebar.collapsed .sidebar-user {
          padding: 8px;
          justify-content: center;
        }
        .sidebar-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sidebar-user-text {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .sidebar.collapsed .sidebar-user-text { display: none; }
        .sidebar-user-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-user-role {
          font-size: 0.62rem;
          color: var(--text-dim);
          font-weight: 600;
        }
        .sidebar-logout-btn {
          padding: 5px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: var(--text-dim);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .sidebar.collapsed .sidebar-logout-btn { display: none; }
        .sidebar-logout-btn:hover {
          color: var(--danger);
          background: rgba(239,68,68,0.1);
        }
      `}</style>

      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

        {/* Header */}
        <div className="sidebar-header">
          {/* Brand (expanded) */}
          <div className="sidebar-brand">
            <div className="sidebar-brand-title gradient-text">
              <CalendarCheck size={22} style={{ flexShrink: 0 }} />
              Registry
            </div>
            <div className="sidebar-brand-sub">v2.7 UNIVERSAL</div>
          </div>

          {/* Desktop collapse button */}
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          {/* Mobile close button */}
          <button className="sidebar-mobile-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''} ${item.danger ? 'danger' : ''}`}
                onClick={item.onClick || (() => setActiveTab(item.id))}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={19} className="sidebar-nav-icon" style={{ flexShrink: 0 }} />
                <span className="sidebar-nav-label">{item.label}</span>
                {item.badge && (
                  <span className="sidebar-nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}

          <div className="sidebar-divider" />

          <button
            className="sidebar-theme-btn"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={isCollapsed ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : undefined}
          >
            {theme === 'light'
              ? <Moon size={19} style={{ flexShrink: 0 }} />
              : <Sun size={19} style={{ flexShrink: 0 }} />}
            <span className="sidebar-theme-label">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </button>
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          {/* Summary card */}
          <div className="sidebar-summary">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', marginBottom: '8px' }}>
              <TrendingUp size={14} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Summary</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Completion rate</span>
              <span style={{ fontWeight: 700 }}>{completionRate}%</span>
            </div>
            <div style={{ width: '100%', height: '5px', background: 'var(--surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${completionRate}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.5s ease', borderRadius: '3px' }} />
            </div>
          </div>

          {/* User */}
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                <User size={15} color="white" />
              </div>
              <div className="sidebar-user-text">
                <div className="sidebar-user-name">{user.email?.split('@')[0] || 'Admin'}</div>
                <div className="sidebar-user-role">Administrator</div>
              </div>
              <button
                className="sidebar-logout-btn"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
