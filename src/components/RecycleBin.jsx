import React from 'react';
import { Trash2, RotateCcw, AlertTriangle, Search, Info, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ConfirmationModal from './layout/ConfirmationModal';

const RecycleBin = ({ 
  deletedStores, 
  onRestoreStore, 
  onPermanentDeleteStore 
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewMode, setViewMode] = React.useState('grid'); // 'grid' or 'list'
  const [confirmConfig, setConfirmConfig] = React.useState({ isOpen: false, type: 'danger', store: null });

  const getDaysRemaining = (deletedAt) => {
    if (!deletedAt) return 30;
    const diff = new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  };

  // Auto-surface stores that passed 30 days (should be hard-deleted but no backend job exists yet)
  const filtered = deletedStores
    .filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => getDaysRemaining(a.deleted_at) - getDaysRemaining(b.deleted_at));

  const openDeleteConfirm = (store) => {
    setConfirmConfig({
      isOpen: true,
      type: 'danger',
      store,
      title: 'Permanent Delete',
      titleAr: 'مسح نهائي للمتجر',
      message: `Are you sure you want to PERMANENTLY delete ${store.name}? This action cannot be reversed.`,
      messageAr: `هل أنت متأكد من مسح ${store.name} نهائياً؟ مكنك التراجع عن هذا الإجراء لاحقاً.`,
      confirmText: 'Delete Permanently',
      confirmTextAr: 'مسح الآن'
    });
  };

  const openRestoreConfirm = (store) => {
    setConfirmConfig({
      isOpen: true,
      type: 'success',
      store,
      title: 'Restore Record',
      titleAr: 'استرجاع السجل',
      message: `Do you want to restore ${store.name} back to the main list?`,
      messageAr: `هل تود استرجاع متجر ${store.name} إلى القائمة الرئيسية؟`,
      confirmText: 'Restore Now',
      confirmTextAr: 'استرجاع الآن'
    });
  };

  const handleConfirmAction = () => {
    if (confirmConfig.type === 'danger') {
      onPermanentDeleteStore(confirmConfig.store.id);
    } else {
      onRestoreStore(confirmConfig.store.id);
    }
    setConfirmConfig({ ...confirmConfig, isOpen: false });
  };

  return (
    <div className="section-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 className="gradient-text">Recycle Bin</h2>
          <p className="stat-label">Recover deleted restaurant records and archives</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} color="var(--text-dim)" />
            <input 
              type="text" 
              placeholder="Search bin..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}
            />
          </div>
          
          <div className="view-toggle-v2">
             <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><LayoutGrid size={16} /></button>
             <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><List size={16} /></button>
          </div>
        </div>
      </div>

      <div className="bin-content-area">
        {deletedStores.length === 0 ? (
          <div className="empty-recycle-premium glass-card">
            <div className="empty-icon-bin">
              <Trash2 size={64} strokeWidth={1} />
            </div>
            <h3>Your archive is pristine</h3>
            <p>Deleted restaurant records will appear here for 30 days before permanent removal.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-recycle-premium glass-card" style={{ padding: '4rem' }}>
             <Search size={48} opacity={0.2} />
             <p>No results found for "{searchTerm}"</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'deleted-stores-grid-v2' : 'deleted-stores-list-v2'}>
            <AnimatePresence>
              {filtered.map(store => (
                <motion.div 
                  key={store.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="deleted-store-card-premium glass-card"
                >
                  <div className="d-card-header">
                    <div className="d-icon-box">
                      <Trash2 size={24} />
                    </div>
                    <div className="d-title-group">
                      <h4>{store.name}</h4>
                      <span className="d-id">#{store.id}</span>
                    </div>
                  </div>

                  <div className="d-card-body">
                    <div className="d-info-row">
                      <span className="label">Category:</span>
                      <span className="val">{store.category}</span>
                    </div>
                    <div className="d-info-row">
                      <span className="label">Zone:</span>
                      <span className="val">{store.zone}</span>
                    </div>
                    <div className="d-footer-meta">
                      {(() => {
                        const days = getDaysRemaining(store.deleted_at);
                        return days === 0
                          ? <><AlertTriangle size={12} color="#ef4444" /> Expires today — delete permanently</>
                          : days <= 7
                          ? <><AlertTriangle size={12} /> {days} days left before auto-removal</>
                          : <><AlertTriangle size={12} /> Deleted {store.deleted_at ? new Date(store.deleted_at).toLocaleDateString() : '—'} · {days}d remaining</>;
                      })()}
                    </div>
                  </div>

                  <div className="d-card-actions">
                    <button 
                      className="btn-restore-premium" 
                      onClick={() => openRestoreConfirm(store)}
                    >
                      <RotateCcw size={18} /> Restore Record
                    </button>
                    <button 
                      className="btn-permanent-delete-premium" 
                      onClick={() => openDeleteConfirm(store)}
                      title="Delete Permanently"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={handleConfirmAction}
        type={confirmConfig.type}
        title={confirmConfig.title}
        titleAr={confirmConfig.titleAr}
        message={confirmConfig.message}
        messageAr={confirmConfig.messageAr}
        confirmText={confirmConfig.confirmText}
        confirmTextAr={confirmConfig.confirmTextAr}
      />

      <style>{`
        .empty-recycle-premium { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 2rem; text-align: center; color: var(--text-secondary); border: 2px dashed var(--border-color); }
        .empty-icon-bin { width: 100px; height: 100px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; color: var(--text-dim); }
        .empty-recycle-premium h3 { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem; }
        
        .view-toggle-v2 { display: flex; background: var(--surface-hover); padding: 4px; border-radius: 12px; border: 1px solid var(--border-color); }
        .view-toggle-v2 button { padding: 6px 12px; border: none; background: transparent; border-radius: 8px; cursor: pointer; color: var(--text-dim); transition: 0.2s; }
        .view-toggle-v2 button.active { background: white; color: var(--primary-color); box-shadow: var(--shadow-sm); }

        .deleted-stores-grid-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .deleted-stores-list-v2 { display: flex; flex-direction: column; gap: 1rem; max-width: 900px; margin: 0 auto; width: 100%; }

        .deleted-store-card-premium { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; border: 1px solid var(--border-color); }
        .d-card-header { display: flex; align-items: center; gap: 1rem; }
        .d-icon-box { width: 48px; height: 48px; background: rgba(239,68,68,0.08); color: var(--danger); border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .d-title-group h4 { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
        .d-id { font-size: 0.75rem; font-family: monospace; color: var(--text-dim); font-weight: 700; }
        
        .d-card-body { display: flex; flex-direction: column; gap: 6px; }
        .d-info-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding-bottom: 4px; border-bottom: 1px solid #f8fafc; }
        .d-info-row .label { color: var(--text-dim); }
        .d-info-row .val { font-weight: 700; color: var(--text-primary); }
        
        .d-footer-meta { margin-top: 8px; font-size: 0.75rem; color: var(--danger); font-weight: 700; display: flex; align-items: center; gap: 6px; }

        .d-card-actions { display: flex; gap: 10px; margin-top: auto; }
        .btn-restore-premium { flex: 1; height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(16,185,129,0.08); color: var(--success); border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-restore-premium:hover { background: rgba(16,185,129,0.15); transform: translateY(-2px); }

        .btn-permanent-delete-premium { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(239,68,68,0.08); color: var(--danger); border: none; border-radius: 12px; cursor: pointer; transition: 0.2s; }
        .btn-permanent-delete-premium:hover { background: rgba(239,68,68,0.15); transform: translateY(-2px); }

        .deleted-stores-list-v2 .deleted-store-card-premium { flex-direction: row; align-items: center; padding: 1rem 1.5rem; }
        .deleted-stores-list-v2 .d-card-body { flex: 1; flex-direction: row; gap: 2rem; align-items: center; }
        .deleted-stores-list-v2 .d-info-row { border: none; padding: 0; }
        .deleted-stores-list-v2 .d-card-actions { margin: 0; width: auto; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default RecycleBin;
