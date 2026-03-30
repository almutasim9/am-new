import React, { useState } from 'react';
import './StoreProfile.css';
import { 
  ArrowLeft, Pencil, Check, X, Phone, User, Database, Globe, MapPin, 
  ExternalLink, MessageCircle, TrendingUp, ShieldCheck, Clock, 
  Smartphone, Activity, Trash2, Calendar, Target, Hash, AlertCircle,
  Archive, Power, ShieldOff, Info, Copy, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import ActivityForm from './ActivityForm';


const StoreProfile = ({ 
  store, 
  activities, 
  outcomes, 
  closureReasons = [],
  onClose, 
  onUpdate, 
  onDeleteStore,
  onAddActivity,
  onNotify
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(store ? { ...store } : {});
  const [activeTab, setActiveTab] = useState('overview');
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  
  // State for Dialogs
  const [showClosureDialog, setShowClosureDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClosureReasonId, setSelectedClosureReasonId] = useState('');
  const [isProcessingClosure, setIsProcessingClosure] = useState(false);

  if (!store) return null;

  const storeActivities = activities.filter(a => a.store_id === store.id);
  const resolvedCount = storeActivities.filter(a => a.is_resolved).length;
  const successRate = storeActivities.length ? Math.round((resolvedCount / storeActivities.length) * 100) : 0;

  const isSchemaOutdated = store.has_pos === undefined || store.has_sim === undefined;

  const handleSave = () => {
    const { 
      id, name, category, owner_name, phone, zone, area, 
      address, map_link, cashier_phone, accounts_manager_phone, 
      restaurant_manager_phone, has_pos, has_sim, is_active, brand_id 
    } = editForm;
    
    const sanitizedData = { 
      name, category, owner_name, phone, zone, area, 
      address, map_link, cashier_phone, accounts_manager_phone, 
      restaurant_manager_phone, has_pos, has_sim, is_active, brand_id 
    };

    onUpdate(id, sanitizedData);
    setIsEditing(false);
  };

  const handleToggleHardware = (field) => {
    if (isEditing) {
      setEditForm({ ...editForm, [field]: !editForm[field] });
    } else {
      onUpdate(store.id, { [field]: !store[field] });
    }
  };

  const handleConfirmStoreClosure = async () => {
    if (!selectedClosureReasonId) return;
    
    setIsProcessingClosure(true);
    try {
      const reasonObj = closureReasons.find(r => r.id === selectedClosureReasonId);
      await onUpdate(store.id, { is_active: false });
      await onAddActivity({
        store_id: store.id,
        outcome_id: outcomes.find(o => o.name.toLowerCase().includes('close'))?.id || outcomes[0]?.id,
        notes: `STORE CLOSED. Reason: ${reasonObj?.name || 'Manual Closure'}`,
        is_resolved: true
      });
      setShowClosureDialog(false);
    } catch (err) {
      console.error("Closure failed:", err);
    } finally {
      setIsProcessingClosure(false);
    }
  };

  const handleConfirmDelete = () => {
    onDeleteStore(store.id);
    setShowDeleteDialog(false);
    onClose();
  };

  const HardwareControl = ({ label, field, icon: Icon }) => {
    const isActive = isEditing ? !!editForm[field] : !!store[field];
    return (
      <div 
        className={`hardware-card ${isActive ? 'active' : ''} ${isSchemaOutdated ? 'disabled' : ''}`}
        onClick={() => !isSchemaOutdated && handleToggleHardware(field)}
        style={{ cursor: isSchemaOutdated ? 'not-allowed' : 'pointer', opacity: isSchemaOutdated ? 0.6 : 1 }}
      >
        <div className="hw-icon-box">
          <Icon size={24} />
        </div>
        <div className="hw-info">
          <span className="hw-label">{label}</span>
          <span className="hw-status">{isActive ? 'ENABLED' : 'DISABLED'}</span>
        </div>
        <div className={`hw-toggle ${isActive ? 'on' : 'off'}`}>
          <div className="toggle-knob"></div>
        </div>
      </div>
    );
  };

  const InfoField = ({ label, icon: Icon, value, field, placeholder }) => (
    <div className="info-field-group">
      <div className="field-header">
        <Icon size={14} /> 
        <span>{label}</span>
      </div>
      {isEditing ? (
        <input 
          type="text" 
          className="edit-input-premium"
          value={editForm[field] || ''}
          placeholder={placeholder}
          onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="field-value">{value || 'Not provided'}</div>
          {value && (label.includes('Phone') || field.includes('phone')) && (
            <button 
              className="copy-btn-subtle" 
              onClick={() => { 
                navigator.clipboard.writeText(value); 
                onNotify?.('success', `${label} copied!`);
              }}
              title="Copy"
            >
              <Copy size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="internal-page-container">
      {/* Top Header & Actions */}
      <div className="profile-header-v3">
        <div className="header-left">
          <button className="back-circle-btn" onClick={onClose}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-titles">
            <h1 className="hero-name" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {store.name}
              <button className="copy-btn-subtle" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(store.name); onNotify?.('success', 'Name copied'); }} title="Copy Name">
                <Copy size={16} />
              </button>
            </h1>
            <div className="hero-meta">
              <span className="tag-id" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                ID: {store.id}
                <button className="copy-btn-subtle" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(store.id); onNotify?.('success', 'ID copied'); }} title="Copy ID">
                  <Copy size={12} />
                </button>
              </span>
              <span className="meta-sep"></span>
              <span className="tag-cat">{store.category}</span>
              <span className="meta-sep"></span>
              <div className={`status-pill ${store.is_active ? 'active' : 'closed'}`}>
                <div className="dot"></div> {store.is_active ? 'Active Partner' : 'Closed / Inactive'}
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {store.is_active ? (
            <button className="btn-closure-start" onClick={() => setShowClosureDialog(true)}>
              <Power size={18} /> Close Store
            </button>
          ) : (
            <button className="btn-activate-store" onClick={() => onUpdate(store.id, { is_active: true })}>
              <Check size={18} /> Re-activate
            </button>
          )}

          <button 
            className={`btn-edit-toggle-premium ${isEditing ? 'active' : ''}`}
            onClick={isEditing ? handleSave : () => { setIsEditing(true); setEditForm({...store}); }}
          >
            {isEditing ? (
              <><Check size={18} /> Save / حفظ</>
            ) : (
              <><Pencil size={18} /> Edit / تعديل</>
            )}
          </button>

          <button className="btn-soft-delete-premium" onClick={() => setShowDeleteDialog(true)} title="Move to Recycle Bin">
            <Trash2 size={18} />
          </button>

          {isEditing && (
            <button className="btn-cancel-edit-v2" onClick={() => setIsEditing(false)}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Closure Dialog Overlay */}
      <AnimatePresence>
        {showClosureDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dialog-overlay-premium">
            <motion.div initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 30, opacity: 0 }} className="closure-dialog-premium glass-card">
              <button className="dialog-close-btn" onClick={() => setShowClosureDialog(false)}><X size={20} /></button>
              <div className="dialog-header-v2">
                <div className="icon-badge-danger"><ShieldOff size={32} /></div>
                <h2>Confirm Closure</h2>
                <h3>تأكيد إغلاق المتجر</h3>
                <p>Please select a reason for closing this partner account.</p>
                <p className="ar-sub">يرجى اختيار سبب إغلاق حساب الشريك</p>
              </div>
              <div className="reason-selector-premium">
                {closureReasons.length > 0 ? (
                  closureReasons.map(reason => (
                    <button key={reason.id} className={`premium-reason-btn ${selectedClosureReasonId === reason.id ? 'selected' : ''}`} onClick={() => setSelectedClosureReasonId(reason.id)}>
                      <div className="reason-dot"></div>
                      <span className="reason-text">{reason.name}</span>
                      {selectedClosureReasonId === reason.id && <Check size={16} className="reason-check" />}
                    </button>
                  ))
                ) : (
                  <div className="empty-reasons-state">
                    <Info size={24} />
                    <p>No closure reasons found.</p>
                    <p className="ar-p">لا توجد أسباب إغلاق مضافة</p>
                    <span className="hint">Add reasons in Settings &gt; Configuration</span>
                  </div>
                )}
              </div>
              <div className="dialog-footer-v2">
                <button className="btn-secondary-v2" onClick={() => setShowClosureDialog(false)}>Cancel / إلغاء</button>
                <button className="btn-danger-premium" disabled={!selectedClosureReasonId || isProcessingClosure} onClick={handleConfirmStoreClosure}>
                  {isProcessingClosure ? <div className="loader-small"></div> : <>Confirm Closure / تأكيد الإغلاق</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDeleteDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dialog-overlay-premium">
            <motion.div initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 30, opacity: 0 }} className="closure-dialog-premium glass-card">
              <button className="dialog-close-btn" onClick={() => setShowDeleteDialog(false)}><X size={20} /></button>
              <div className="dialog-header-v2">
                <div className="icon-badge-danger" style={{ background: '#fef2f2', color: '#ef4444' }}><Trash2 size={32} /></div>
                <h2>Move to Recycle Bin</h2>
                <h3>نقل إلى سلة المهملات</h3>
                <p>Are you sure you want to archive this restaurant? It will be hidden from reports.</p>
                <p className="ar-sub">هل أنت متأكد من أرشفة هذا المتجر؟ سيتم إخفاؤه من التقارير والقائمة الرئيسية.</p>
              </div>
              <div className="dialog-footer-v2">
                <button className="btn-secondary-v2" onClick={() => setShowDeleteDialog(false)}>Cancel / إلغاء</button>
                <button className="btn-danger-premium" onClick={handleConfirmDelete}>Archive Now / أرشفة الآن</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="profile-grid">
        <div className="grid-col-left">
          <div className="metrics-row">
            <div className="metric-card glass-card"><div className="m-icon blue"><Activity size={20} /></div><div className="m-data"><span className="m-val">{storeActivities.length}</span><span className="m-lab">Total Interactions</span></div></div>
            <div className="metric-card glass-card"><div className="m-icon green"><Target size={20} /></div><div className="m-data"><span className="m-val">{successRate}%</span><span className="m-lab">Resolution Rate</span></div></div>
          </div>

          <div className="section-card glass-card">
            <h3 className="section-card-title"><Smartphone size={16} /> Technical Infrastructure</h3>
            <div className="hardware-controls-grid">
              <HardwareControl label="Point of Sale (POS)" field="has_pos" icon={Database} />
              <HardwareControl label="SIM Integration" field="has_sim" icon={Globe} />
            </div>
          </div>

          <div className="section-card glass-card">
            <h3 className="section-card-title"><Hash size={16} /> Registry Information</h3>
            <div className="info-fields-grid">
              <InfoField label="Primary Contact" icon={User} value={store.owner_name} field="owner_name" placeholder="Contact Name" />
              <InfoField label="Business Phone" icon={Phone} value={store.phone} field="phone" placeholder="Phone Number" />
              <InfoField label="Brand ID / رقم البراند" icon={Bookmark} value={store.brand_id} field="brand_id" placeholder="Brand Code" />
              <InfoField label="Zone / Region" icon={MapPin} value={store.zone} field="zone" placeholder="Assign Zone" />
              <InfoField label="Area / Neighborhood" icon={TrendingUp} value={store.area} field="area" placeholder="Specific Area" />
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <InfoField label="Official Address" icon={MapPin} value={store.address} field="address" placeholder="Full Address" />
            </div>
            {(store.map_link || isEditing) && (
              <div style={{ marginTop: '1rem' }}>
                <InfoField label="Google Maps Link" icon={ExternalLink} value={store.map_link} field="map_link" placeholder="Map URL" />
                {store.map_link && !isEditing && (
                  <a href={store.map_link} target="_blank" rel="noopener noreferrer" className="btn-map-hero">
                    <ExternalLink size={14} /> View Location
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="section-card glass-card">
            <h3 className="section-card-title"><ShieldCheck size={16} /> Team / سجل التواصل</h3>
            <div className="contacts-stack">
              <div className="sub-contact-row">
                <div className="s-icon"><Smartphone size={16} /></div>
                <div className="s-info">
                  <div className="s-label">Cashier Desk (كاشير)</div>
                  {isEditing ? (
                    <input className="edit-input-minimal" value={editForm.cashier_phone || ''} onChange={e => setEditForm({...editForm, cashier_phone: e.target.value})} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="s-val">{store.cashier_phone || 'Unset'}</div>
                      {store.cashier_phone && (
                        <button className="copy-btn-subtle" onClick={() => { navigator.clipboard.writeText(store.cashier_phone); onNotify?.('success', 'Cashier Phone copied'); }}>
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="sub-contact-row">
                <div className="s-icon"><User size={16} /></div>
                <div className="s-info">
                  <div className="s-label">Floor Manager (مدير صالة)</div>
                  {isEditing ? (
                    <input className="edit-input-minimal" value={editForm.restaurant_manager_phone || ''} onChange={e => setEditForm({...editForm, restaurant_manager_phone: e.target.value})} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="s-val">{store.restaurant_manager_phone || 'Unset'}</div>
                      {store.restaurant_manager_phone && (
                        <button className="copy-btn-subtle" onClick={() => { navigator.clipboard.writeText(store.restaurant_manager_phone); onNotify?.('success', 'Manager Phone copied'); }}>
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="sub-contact-row">
                <div className="s-icon"><Database size={16} /></div>
                <div className="s-info">
                  <div className="s-label">Accounting (حسابات)</div>
                  {isEditing ? (
                    <input className="edit-input-minimal" value={editForm.accounts_manager_phone || ''} onChange={e => setEditForm({...editForm, accounts_manager_phone: e.target.value})} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="s-val">{store.accounts_manager_phone || 'Unset'}</div>
                      {store.accounts_manager_phone && (
                        <button className="copy-btn-subtle" onClick={() => { navigator.clipboard.writeText(store.accounts_manager_phone); onNotify?.('success', 'Accounting Phone copied'); }}>
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-col-right">
          <div className="section-card glass-card" style={{ height: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <div className="profile-tab-nav">
              <button className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📋 Full Feed</button>
              <button className={`profile-tab-btn ${activeTab === 'calls' ? 'active' : ''}`} onClick={() => setActiveTab('calls')}>📞 Tasks</button>
            </div>
            <div className="activity-timeline-v3">
              {storeActivities.length === 0 ? (
                <div className="empty-state-v3"><Activity size={48} opacity={0.1} /><p>No history found.</p></div>
              ) : (
                storeActivities.map((act, idx) => (
                  <div key={act.id} className="timeline-v3-item">
                     <div className="v3-marker">
                       <div className={`v3-dot ${act.is_resolved ? 'done' : 'pending'}`}>{act.is_resolved ? <Check size={10} /> : <AlertCircle size={10} />}</div>
                       {idx !== storeActivities.length - 1 && <div className="v3-line"></div>}
                     </div>
                     <div className="v3-content">
                       <div className="v3-header">
                         <span className="v3-outcome">{outcomes.find(o => o.id === act.outcome_id)?.name || 'Activity'}</span>
                         <span className="v3-date">{format(new Date(act.created_at), 'MMM dd, HH:mm')}</span>
                       </div>
                       <p className="v3-notes">{act.notes}</p>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fab-container mobile-only"><button className="fab-main-btn" onClick={() => setIsActivityFormOpen(true)}><Activity size={24} /><span className="fab-label">Refill Log</span></button></div>
      <ActivityForm isOpen={isActivityFormOpen} onClose={() => setIsActivityFormOpen(false)} onSubmit={onAddActivity} stores={[store]} outcomes={outcomes} initialStoreId={store.id} />

      <style>{`
        .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-closure-start { display: flex; align-items: center; gap: 8px; background: #fee2e2; color: #ef4444; border: none; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-edit-toggle-premium { display: flex; align-items: center; gap: 8px; background: #f1f5f9; color: #475569; border: none; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-edit-toggle-premium.active { background: var(--primary-color); color: white; }
        .btn-soft-delete-premium { background: #f1f5f9; color: #64748b; border: none; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .btn-soft-delete-premium:hover { background: #fee2e2; color: #ef4444; }
        .btn-cancel-edit-v2 { background: #f1f5f9; color: #64748b; border: none; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .edit-input-premium { width: 100%; padding: 10px 14px; border: 2px solid var(--primary-light); border-radius: 12px; font-weight: 600; font-size: 0.95rem; margin-top: 4px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.05); }
        .edit-input-minimal { width: 100%; border: 1px solid var(--border-color); border-radius: 8px; padding: 4px 8px; font-size: 0.85rem; font-weight: 600; }
        
        .dialog-overlay-premium { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); z-index: 2500; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .closure-dialog-premium { width: 100%; max-width: 440px; background: white; padding: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; position: relative; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.2); }
        .dialog-header-v2 { text-align: center; }
        .icon-badge-danger { width: 80px; height: 80px; background: #fff1f2; color: #ef4444; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        .premium-reason-btn { padding: 1rem; background: #f8fafc; border: 2px solid #f1f5f9; border-radius: 16px; font-weight: 700; text-align: left; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 12px; color: #475569; }
        .premium-reason-btn.selected { background: #fdf2f2; border-color: #ef4444; color: #ef4444; }
        .btn-danger-premium { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 14px; border-radius: 16px; font-weight: 700; cursor: pointer; }
        .loader-small { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default StoreProfile;
