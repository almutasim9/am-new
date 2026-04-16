import { useState } from 'react';
import { createPortal } from 'react-dom';
import './StoreProfile.css';
import {
  ArrowLeft, Pencil, Check, X, Phone, User, Database, Globe, MapPin,
  ExternalLink, TrendingUp, ShieldCheck,
  Smartphone, Activity, Trash2, Target, Hash, AlertCircle,
  Power, ShieldOff, Info, Copy, Bookmark, MessageCircle, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import ActivityForm from './ActivityForm';
import StoreEditModal from './StoreEditModal';


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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activePerfTab, setActivePerfTab] = useState('monthly');
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);

  const getStats = () => {
    if (!store.performance_data || !store.performance_data[activePerfTab] || Object.keys(store.performance_data[activePerfTab]).length === 0) {
      if (activePerfTab === 'monthly') return store;
      return null;
    }
    return store.performance_data[activePerfTab];
  };

  const st = getStats();

  const [showClosureDialog, setShowClosureDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClosureReasonId, setSelectedClosureReasonId] = useState('');
  const [isProcessingClosure, setIsProcessingClosure] = useState(false);

  if (!store) return null;

  const storeActivities = activities.filter(a => a.store_id === store.id);
  const resolvedCount = storeActivities.filter(a => a.is_resolved).length;
  const pendingCount = storeActivities.filter(a => !a.is_resolved).length;
  const successRate = storeActivities.length ? Math.round((resolvedCount / storeActivities.length) * 100) : 0;

  const isSchemaOutdated = store.has_pos == null || store.has_sim == null;

  const toWhatsApp = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
  };

  const handleToggleHardware = (field) => {
    onUpdate(store.id, { [field]: !store[field] });
  };

  const handleConfirmStoreClosure = async () => {
    if (!selectedClosureReasonId) return;

    setIsProcessingClosure(true);
    try {
      const reasonObj = closureReasons.find(r => r.id === selectedClosureReasonId);
      await onUpdate(store.id, { is_active: false });
      await onAddActivity({
        store_id: store.id,
        outcome_id: (
          outcomes.find(o => o.name.toLowerCase() === 'closed') ||
          outcomes.find(o => o.name.toLowerCase() === 'closure') ||
          outcomes.find(o => o.name.toLowerCase().startsWith('clos')) ||
          outcomes[0]
        )?.id,
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
    const isActive = !!store[field];
    return (
      <div
        className={`hardware-card ${isActive ? 'active' : ''} ${isSchemaOutdated ? 'disabled' : ''}`}
        onClick={() => !isSchemaOutdated && handleToggleHardware(field)}
        style={{ cursor: isSchemaOutdated ? 'not-allowed' : 'pointer', opacity: isSchemaOutdated ? 0.6 : 1 }}
      >
        <div className="hw-icon-box">
          <Icon size={22} />
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

  const InfoField = ({ label, icon: Icon, value, field }) => (
    <div className="info-field-group">
      <div className="field-header">
        <Icon size={13} />
        <span>{label}</span>
      </div>
      <div className="field-value-row">
        <div className="field-value">{value || <span className="field-empty">Not provided</span>}</div>
        {value && (label.includes('Phone') || field.includes('phone')) && (
          <button
            className="copy-btn-subtle"
            onClick={() => {
              navigator.clipboard.writeText(value);
              onNotify?.('success', `${label} copied!`);
            }}
            title="Copy"
          >
            <Copy size={11} />
          </button>
        )}
      </div>
    </div>
  );

  const ContactRow = ({ label, icon: Icon, value }) => {
    const waLink = toWhatsApp(value);
    return (
      <div className="contact-card">
        <div className="contact-icon-wrap">
          <Icon size={16} />
        </div>
        <div className="contact-body">
          <span className="contact-label">{label}</span>
          <span className="contact-value">{value || <span className="field-empty">Unset</span>}</span>
        </div>
        {value && (
          <div className="contact-actions">
            <button
              className="action-icon-btn copy"
              onClick={() => { navigator.clipboard.writeText(value); onNotify?.('success', `${label} copied`); }}
              title="Copy"
            >
              <Copy size={13} />
            </button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="action-icon-btn whatsapp" title="Open in WhatsApp">
                <MessageCircle size={13} />
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  const initials = store.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="internal-page-container">
      {/* Header */}
      <div className="sp-header">
        <div className="sp-header-left">
          <button className="back-circle-btn" onClick={onClose} title="Back">
            <ArrowLeft size={18} />
          </button>
          <div className={`sp-avatar ${!store.is_active ? 'inactive' : ''}`}>{initials}</div>
          <div className="sp-title-block">
            <div className="sp-name">
              {store.name}
              <button className="copy-btn-subtle" onClick={() => { navigator.clipboard.writeText(store.name); onNotify?.('success', 'Copied'); }} title="Copy name">
                <Copy size={12} />
              </button>
            </div>
            <div className="sp-meta">
              <span className="sp-badge id">#{store.id}</span>
              {store.category && <span className="sp-badge cat">{store.category}</span>}
              {store.zone && <span className="sp-badge zone">{store.zone}</span>}
              <span className={`sp-badge status ${store.is_active ? 'active' : 'inactive'}`}>
                <span className="status-dot"></span>
                {store.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="sp-header-right">
          {/* Quick phone action */}
          {store.phone && (
            <div className="sp-phone-chip">
              <Phone size={13} />
              <span>{store.phone}</span>
              <div className="chip-divider" />
              {toWhatsApp(store.phone) && (
                <a href={toWhatsApp(store.phone)} target="_blank" rel="noopener noreferrer" className="chip-wa" title="WhatsApp">
                  <MessageCircle size={14} />
                </a>
              )}
              <button className="chip-copy" onClick={() => { navigator.clipboard.writeText(store.phone); onNotify?.('success', 'Phone copied'); }} title="Copy">
                <Copy size={13} />
              </button>
            </div>
          )}

          <div className="sp-actions">
            <button className="sp-btn log-activity" onClick={() => setIsActivityFormOpen(true)}>
              <Plus size={14} /> Log Activity
            </button>
            {store.is_active ? (
              <button className="sp-btn close-store" onClick={() => setShowClosureDialog(true)}>
                <Power size={14} /> Close
              </button>
            ) : (
              <button className="sp-btn reactivate" onClick={() => onUpdate(store.id, { is_active: true })}>
                <Check size={14} /> Re-activate
              </button>
            )}
            <button className="sp-btn edit" onClick={() => setIsEditOpen(true)}>
              <Pencil size={14} /> Edit
            </button>
            <button className="sp-btn icon-only danger" onClick={() => setShowDeleteDialog(true)} title="Move to Recycle Bin">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs — portals with AnimatePresence INSIDE the portal */}
      {createPortal(
        <AnimatePresence>
          {showClosureDialog && (
            <motion.div key="closure-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dialog-overlay-premium">
              <motion.div initial={{ scale: 0.93, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.93, y: 20, opacity: 0 }} className="closure-dialog-premium glass-card">
                <button className="dialog-close-btn" onClick={() => setShowClosureDialog(false)}><X size={18} /></button>
                <div className="dialog-header-v2">
                  <div className="icon-badge-danger"><ShieldOff size={26} /></div>
                  <h2>Confirm Closure</h2>
                  <h3>تأكيد إغلاق المتجر</h3>
                  <p>Please select a reason for closing this partner account.</p>
                </div>
                <div className="reason-selector-premium">
                  {closureReasons.length > 0 ? (
                    closureReasons.map(reason => (
                      <button key={reason.id} className={`premium-reason-btn ${selectedClosureReasonId === reason.id ? 'selected' : ''}`} onClick={() => setSelectedClosureReasonId(reason.id)}>
                        <div className="reason-dot"></div>
                        <span className="reason-text">{reason.name}</span>
                        {selectedClosureReasonId === reason.id && <Check size={14} className="reason-check" />}
                      </button>
                    ))
                  ) : (
                    <div className="empty-reasons-state">
                      <Info size={22} />
                      <p>No closure reasons found.</p>
                      <span className="hint">Add reasons in Settings › Configuration</span>
                    </div>
                  )}
                </div>
                <div className="dialog-footer-v2">
                  <button className="btn-secondary-v2" onClick={() => setShowClosureDialog(false)}>Cancel / إلغاء</button>
                  <button className="btn-danger-premium" disabled={!selectedClosureReasonId || isProcessingClosure} onClick={handleConfirmStoreClosure}>
                    {isProcessingClosure ? <div className="loader-small"></div> : <>Confirm Closure</>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {showDeleteDialog && (
            <motion.div key="delete-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dialog-overlay-premium">
              <motion.div initial={{ scale: 0.93, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.93, y: 20, opacity: 0 }} className="closure-dialog-premium glass-card">
                <button className="dialog-close-btn" onClick={() => setShowDeleteDialog(false)}><X size={18} /></button>
                <div className="dialog-header-v2">
                  <div className="icon-badge-danger" style={{ background: '#fef2f2', color: '#ef4444' }}><Trash2 size={26} /></div>
                  <h2>Move to Recycle Bin</h2>
                  <h3>نقل إلى سلة المهملات</h3>
                  <p>Are you sure? This store will be hidden from reports and the main list.</p>
                </div>
                <div className="dialog-footer-v2">
                  <button className="btn-secondary-v2" onClick={() => setShowDeleteDialog(false)}>Cancel / إلغاء</button>
                  <button className="btn-danger-premium" onClick={handleConfirmDelete}>Archive Now / أرشفة الآن</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="profile-grid">
        {/* ── Left Column ── */}
        <div className="grid-col-left">
          {/* Metrics */}
          <div className="metrics-row">
            <div className="metric-card glass-card">
              <div className="m-icon blue"><Activity size={19} /></div>
              <div className="m-data">
                <span className="m-val">{storeActivities.length}</span>
                <span className="m-lab">Total Interactions</span>
              </div>
            </div>
            <div className="metric-card glass-card">
              <div className="m-icon amber"><AlertCircle size={19} /></div>
              <div className="m-data">
                <span className="m-val">{pendingCount}</span>
                <span className="m-lab">Pending Tasks</span>
              </div>
            </div>
            <div className="metric-card glass-card">
              <div className="m-icon green"><Target size={19} /></div>
              <div className="m-data">
                <span className="m-val">{successRate}%</span>
                <span className="m-lab">Resolution Rate</span>
              </div>
            </div>
          </div>

          {/* Sales & Performance */}
          {(store.gmv !== undefined && store.gmv !== null) && (
            <div className="section-card glass-card">
              <div className="section-card-header">
                <h3 className="section-card-title"><TrendingUp size={14} /> Sales & Performance</h3>
                <div className="perf-tab-row">
                  {['monthly', 'commercial', 'yesterday'].map(tab => (
                    <button key={tab} className={`perf-tab-btn ${activePerfTab === tab ? 'active' : ''}`} onClick={() => setActivePerfTab(tab)}>
                      {tab === 'monthly' ? 'شهري' : tab === 'commercial' ? 'تجاري' : 'البارحة'}
                    </button>
                  ))}
                </div>
              </div>
              {!st ? (
                <div className="no-data-state">لا توجد بيانات لهذه الفترة</div>
              ) : (
                <>
                  <div className="sales-grid">
                    <div className="sales-big-card green-accent">
                      <span className="sales-big-label">إجمالي المبيعات (GMV)</span>
                      <span className="sales-big-val green">{Number(st.gmv || 0).toLocaleString()} <small>IQD</small></span>
                    </div>
                    <div className="sales-big-card blue-accent">
                      <span className="sales-big-label">الطلبات (Orders)</span>
                      <span className="sales-big-val blue">{Number(st.orders || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="sales-mini-grid">
                    {[
                      ['Avg. Cart', `${Number(st.avg_cart||0).toLocaleString()} IQD`],
                      ['Items Total', Number(st.items_total||0).toLocaleString()],
                      ['MV %', `${Number(st.mv_percent||0)}%`],
                      ['MVH %', `${Number(st.mvh_percent||0)}%`],
                      ['Highlights', `${Number(st.highlights||0).toLocaleString()} IQD`],
                      ['HL %', `${Number(st.hl_percent||0)}%`],
                      ['Discount', `${Number(st.discount_amount||0).toLocaleString()} IQD`],
                      ['Ratings', `${st.ratings || '-'} ★`],
                      ['Delivery', `${Number(st.delivery||0).toLocaleString()} IQD`],
                      ['Toters+ %', `${Number(st.toters_plus_percent||0)}%`],
                    ].map(([label, val]) => (
                      <div key={label} className="sales-mini-item">
                        <span className="sales-mini-label">{label}</span>
                        <span className="sales-mini-val">{val}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Technical */}
          <div className="section-card glass-card">
            <h3 className="section-card-title"><Smartphone size={14} /> Technical Infrastructure</h3>
            <div className="hardware-controls-grid">
              <HardwareControl label="Point of Sale (POS)" field="has_pos" icon={Database} />
              <HardwareControl label="SIM Integration" field="has_sim" icon={Globe} />
            </div>
          </div>

          {/* Registry */}
          <div className="section-card glass-card">
            <h3 className="section-card-title"><Hash size={14} /> Registry Information</h3>
            <div className="info-fields-grid">
              <InfoField label="Primary Contact" icon={User} value={store.owner_name} field="owner_name" placeholder="Contact Name" />
              <InfoField label="Business Phone" icon={Phone} value={store.phone} field="phone" placeholder="Phone Number" />
              <InfoField label="Brand ID / رقم البراند" icon={Bookmark} value={store.brand_id} field="brand_id" placeholder="Brand Code" />
              <InfoField label="Zone / Region" icon={MapPin} value={store.zone} field="zone" placeholder="Assign Zone" />
              <InfoField label="Area / Neighborhood" icon={TrendingUp} value={store.area} field="area" placeholder="Specific Area" />
            </div>
            <div className="info-divider" />
            <div className="info-fields-grid" style={{ gridTemplateColumns: '1fr' }}>
              <InfoField label="Official Address" icon={MapPin} value={store.address} field="address" placeholder="Full Address" />
            </div>
            {store.map_link && (
              <div style={{ marginTop: '0.875rem' }}>
                <a href={store.map_link} target="_blank" rel="noopener noreferrer" className="btn-map-hero">
                  <ExternalLink size={13} /> View on Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Contacts */}
          <div className="section-card glass-card">
            <h3 className="section-card-title"><ShieldCheck size={14} /> Team Contacts / سجل التواصل</h3>
            <div className="contacts-stack">
              <ContactRow label="Cashier (كاشير)" icon={Smartphone} value={store.cashier_phone} field="cashier_phone" />
              <ContactRow label="Floor Manager (مدير صالة)" icon={User} value={store.restaurant_manager_phone} field="restaurant_manager_phone" />
              <ContactRow label="Accounting (حسابات)" icon={Database} value={store.accounts_manager_phone} field="accounts_manager_phone" />
            </div>
          </div>
        </div>

        {/* ── Right Column (Activity Feed) ── */}
        <div className="grid-col-right">
          <div className="section-card glass-card activity-column">
            <div className="activity-col-header">
              <div className="profile-tab-nav">
                <button className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📋 Full Feed</button>
                <button className={`profile-tab-btn ${activeTab === 'calls' ? 'active' : ''}`} onClick={() => setActiveTab('calls')}>📞 Tasks</button>
              </div>
              <button className="log-activity-col-btn" onClick={() => setIsActivityFormOpen(true)}>
                <Plus size={14} /> Log
              </button>
            </div>

            <div className="activity-timeline-v3">
              {storeActivities.length === 0 ? (
                <div className="empty-state-v3">
                  <Activity size={40} opacity={0.15} />
                  <p>No activity recorded yet</p>
                  <button className="empty-log-btn" onClick={() => setIsActivityFormOpen(true)}>
                    <Plus size={14} /> Log First Activity
                  </button>
                </div>
              ) : (
                storeActivities.map((act, idx) => (
                  <div key={act.id} className="timeline-v3-item">
                    <div className="v3-marker">
                      <div className={`v3-dot ${act.is_resolved ? 'done' : 'pending'}`}>
                        {act.is_resolved ? <Check size={9} /> : <AlertCircle size={9} />}
                      </div>
                      {idx !== storeActivities.length - 1 && <div className="v3-line"></div>}
                    </div>
                    <div className="v3-content">
                      <div className="v3-header">
                        <span className="v3-outcome">{outcomes.find(o => o.id === act.outcome_id)?.name || 'Activity'}</span>
                        <span className="v3-date">{format(new Date(act.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                      {act.notes && <p className="v3-notes">{act.notes}</p>}
                      {act.follow_up_date && (
                        <div className="v3-followup-chip">
                          <Target size={10} /> Follow-up: {format(new Date(act.follow_up_date), 'MMM dd')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ActivityForm
        isOpen={isActivityFormOpen}
        onClose={() => setIsActivityFormOpen(false)}
        onSubmit={onAddActivity}
        stores={[store]}
        outcomes={outcomes}
        initialStoreId={store.id}
      />

      <StoreEditModal
        isOpen={isEditOpen}
        store={store}
        onClose={() => setIsEditOpen(false)}
        onSave={onUpdate}
      />
    </div>
  );
};

export default StoreProfile;
