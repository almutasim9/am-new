import React, { useState } from 'react';
import './StoreProfile.css';
import { 
  ArrowLeft, Pencil, Check, X, Phone, User, Database, Globe, MapPin, 
  ExternalLink, MessageCircle, TrendingUp, ShieldCheck, Clock, 
  Smartphone, Activity, Trash2, Calendar, Target, Hash, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const StoreProfile = ({ store, activities, outcomes, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...store });
  const [activeTab, setActiveTab] = useState('overview');

  const storeActivities = activities.filter(a => a.store_id === store.id);
  const resolvedCount = storeActivities.filter(a => a.is_resolved).length;
  const successRate = storeActivities.length ? Math.round((resolvedCount / storeActivities.length) * 100) : 0;

  // Schema Validation Check: Detect if v2.6 migration has been run
  const isSchemaOutdated = store.has_pos === undefined || store.has_sim === undefined;

  const handleSave = () => {
    // Sanitize data: only send editable fields to Supabase
    const { 
      id, name, category, owner_name, phone, zone, area, 
      address, map_link, cashier_phone, accounts_manager_phone, 
      restaurant_manager_phone, has_pos, has_sim, is_active 
    } = editForm;
    
    const sanitizedData = { 
      name, category, owner_name, phone, zone, area, 
      address, map_link, cashier_phone, accounts_manager_phone, 
      restaurant_manager_phone, has_pos, has_sim, is_active 
    };

    onUpdate(id, sanitizedData);
    setIsEditing(false);
  };

  const handleToggleHardware = (field) => {
    const newValue = !editForm[field];
    const updated = { ...editForm, [field]: newValue };
    setEditForm(updated);
    onUpdate(store.id, { [field]: newValue });
  };

  const HardwareControl = ({ label, field, icon: Icon }) => {
    const isActive = !!editForm[field];
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
        <div className="field-value">{value || 'Not provided'}</div>
      )}
    </div>
  );

  return (
    <div className="internal-page-container">
      {/* Schema Outdated Warning Banner */}
      <AnimatePresence>
        {isSchemaOutdated && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="glass-card"
            style={{ 
              background: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid #fee2e2', 
              padding: '1rem 1.5rem', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderRadius: '16px'
            }}
          >
            <AlertCircle size={24} color="#ef4444" />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ef4444' }}>Database Integration Pending</h4>
              <p style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                Advanced tracking features (POS, SIM, Team Contacts) require a database schema update. 
                Please execute the SQL script provided in your <strong>v2.6 System Report</strong>.
              </p>
            </div>
            <button 
              className="btn-secondary" 
              style={{ fontSize: '0.7rem', padding: '6px 12px', background: 'white' }}
              onClick={() => window.open('/schema.sql', '_blank')}
            >
              View SQL Script
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & Actions */}
      <div className="profile-header-v3">
        <div className="header-left">
          <button className="back-circle-btn" onClick={onClose}>
            <ArrowLeft size={20} />
          </button>
          <div className="header-titles">
            <h1 className="hero-name">{store.name}</h1>
            <div className="hero-meta">
              <span className="tag-id">ID: {store.id}</span>
              <span className="meta-sep"></span>
              <span className="tag-cat">{store.category}</span>
              <span className="meta-sep"></span>
              <div className={`status-pill ${store.is_active ? 'active' : ''}`}>
                <div className="dot"></div> {store.is_active ? 'Active Partner' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {store.phone && (
            <a 
              href={`https://wa.me/${store.phone.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-whatsapp-hero"
            >
              <MessageCircle size={18} /> WhatsApp Business
            </a>
          )}
          
          <button 
            className={`btn-edit-toggle ${isEditing ? 'saving' : ''}`}
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
          >
            {isEditing ? (
              <><Check size={18} /> Save Records</>
            ) : (
              <><Pencil size={18} /> Customize Profile</>
            )}
          </button>
          
          {isEditing && (
            <button className="btn-cancel-edit" onClick={() => { setIsEditing(false); setEditForm({...store}); }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="profile-grid">
        {/* Left Column: Management & Identity */}
        <div className="grid-col-left">
          
          {/* Quick Metrics */}
          <div className="metrics-row">
            <div className="metric-card glass-card">
              <div className="m-icon blue"><Activity size={20} /></div>
              <div className="m-data">
                <span className="m-val">{storeActivities.length}</span>
                <span className="m-lab">Total Interactions</span>
              </div>
            </div>
            <div className="metric-card glass-card">
              <div className="m-icon green"><Target size={20} /></div>
              <div className="m-data">
                <span className="m-val">{successRate}%</span>
                <span className="m-lab">Resolution Rate</span>
              </div>
            </div>
          </div>

          {/* Hardware Management */}
          <div className="section-card glass-card">
            <h3 className="section-card-title"><Smartphone size={16} /> Technical Infrastructure</h3>
            <div className="hardware-controls-grid">
              <HardwareControl label="Point of Sale (POS)" field="has_pos" icon={Database} />
              <HardwareControl label="SIM Integration" field="has_sim" icon={Globe} />
            </div>
          </div>

          {/* Core Information */}
          <div className="section-card glass-card">
            <h3 className="section-card-title"><Hash size={16} /> Registry Information</h3>
            <div className="info-fields-grid">
              <InfoField label="Primary Contact" icon={User} value={store.owner_name} field="owner_name" placeholder="Contact Name" />
              <InfoField label="Business Phone" icon={Phone} value={store.phone} field="phone" placeholder="Phone Number" />
              <InfoField label="Zone / Region" icon={MapPin} value={store.zone} field="zone" placeholder="Assign Zone" />
              <InfoField label="Area / Neighborhood" icon={TrendingUp} value={store.area} field="area" placeholder="Specific Area" />
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <InfoField label="Official Address" icon={MapPin} value={store.address} field="address" placeholder="Full Street Address" />
            </div>
            {store.map_link && !isEditing && (
              <a href={store.map_link} target="_blank" rel="noopener noreferrer" className="btn-map-hero">
                <ExternalLink size={14} /> Open in Google Maps
              </a>
            )}
            {isEditing && (
              <div style={{ marginTop: '1rem' }}>
                <InfoField label="Google Maps Link" icon={ExternalLink} value={store.map_link} field="map_link" placeholder="Paste URL here" />
              </div>
            )}
          </div>

          {/* Secondary Team */}
          <div className="section-card glass-card">
            <h3 className="section-card-title"><ShieldCheck size={16} /> Team & Secondary Contacts</h3>
            <div className="contacts-stack">
              <div className="sub-contact-row">
                <div className="s-icon"><Smartphone size={16} /></div>
                <div className="s-info">
                  <div className="s-label">Cashier Desk</div>
                  {isEditing ? (
                    <input type="text" className="edit-input-minimal" value={editForm.cashier_phone || ''} onChange={(e) => setEditForm({...editForm, cashier_phone: e.target.value})} />
                  ) : (
                    <div className="s-val">{store.cashier_phone || 'Unset'}</div>
                  )}
                </div>
                {!isEditing && store.cashier_phone && (
                  <div className="s-actions">
                    <a href={`tel:${store.cashier_phone}`}><Phone size={14} /></a>
                    <a href={`https://wa.me/${store.cashier_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /></a>
                  </div>
                )}
              </div>

              <div className="sub-contact-row">
                <div className="s-icon"><User size={16} /></div>
                <div className="s-info">
                  <div className="s-label">Floor Manager</div>
                  {isEditing ? (
                    <input type="text" className="edit-input-minimal" value={editForm.restaurant_manager_phone || ''} onChange={(e) => setEditForm({...editForm, restaurant_manager_phone: e.target.value})} />
                  ) : (
                    <div className="s-val">{store.restaurant_manager_phone || 'Unset'}</div>
                  )}
                </div>
                {!isEditing && store.restaurant_manager_phone && (
                  <div className="s-actions">
                    <a href={`tel:${store.restaurant_manager_phone}`}><Phone size={14} /></a>
                  </div>
                )}
              </div>

              <div className="sub-contact-row">
                <div className="s-icon"><Database size={16} /></div>
                <div className="s-info">
                  <div className="s-label">Accounting</div>
                  {isEditing ? (
                    <input type="text" className="edit-input-minimal" value={editForm.accounts_manager_phone || ''} onChange={(e) => setEditForm({...editForm, accounts_manager_phone: e.target.value})} />
                  ) : (
                    <div className="s-val">{store.accounts_manager_phone || 'Unset'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed + Call History tabs */}
        <div className="grid-col-right">
          <div className="section-card glass-card" style={{ height: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>

            {/* Tab Navigation */}
            <div className="profile-tab-nav" role="tablist" aria-label="Activity views">
              {[
                { key: 'overview', label: '📋 Full Feed' },
                { key: 'calls',    label: '📞 Open Tasks' }
              ].map(tab => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={`profile-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Full Activity Feed */}
            {activeTab === 'overview' && (
              <div className="activity-timeline-v3">
                {storeActivities.length === 0 ? (
                  <div className="empty-state-v3">
                    <Activity size={48} opacity={0.2} />
                    <p>No historical records found for this restaurant.</p>
                  </div>
                ) : (
                  storeActivities.map((act, index) => {
                    const outcome = outcomes.find(o => o.id === act.outcome_id);
                    return (
                      <div key={act.id} className="timeline-v3-item">
                        <div className="v3-marker">
                          <div className={`v3-dot ${act.is_resolved ? 'done' : 'pending'}`}>
                            {act.is_resolved ? <Check size={10} /> : <AlertCircle size={10} />}
                          </div>
                          {index !== storeActivities.length - 1 && <div className="v3-line"></div>}
                        </div>
                        <div className="v3-content">
                          <div className="v3-header">
                            <span className="v3-outcome">{outcome?.name || 'Manual Log'}</span>
                            <span className="v3-date">{format(new Date(act.created_at), 'MMM dd, yyyy • HH:mm')}</span>
                          </div>
                          <p className="v3-notes">{act.notes}</p>
                          <div className="v3-footer">
                            <span className="v3-user">Recorded by Administrator</span>
                            {act.follow_up_date && (
                              <span className="v3-followup">
                                <Calendar size={10} /> Next: {format(new Date(act.follow_up_date), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Open Call Tasks */}
            {activeTab === 'calls' && (() => {
              const openTasks = storeActivities.filter(a => !a.is_resolved);
              return (
                <div className="activity-timeline-v3">
                  {openTasks.length === 0 ? (
                    <div className="empty-state-v3">
                      <Check size={48} opacity={0.2} />
                      <p>No open tasks for this restaurant.</p>
                      <span style={{ fontSize: '0.8rem' }}>All interactions have been resolved.</span>
                    </div>
                  ) : (
                    openTasks.map((act, index) => {
                      const outcome = outcomes.find(o => o.id === act.outcome_id);
                      const isOverdue = act.follow_up_date && new Date(act.follow_up_date) < new Date();
                      return (
                        <div key={act.id} className="timeline-v3-item">
                          <div className="v3-marker">
                            <div className="v3-dot pending">
                              <AlertCircle size={10} />
                            </div>
                            {index !== openTasks.length - 1 && <div className="v3-line"></div>}
                          </div>
                          <div className="v3-content" style={{ borderLeft: isOverdue ? '3px solid var(--danger)' : undefined }}>
                            <div className="v3-header">
                              <span className="v3-outcome">{outcome?.name || 'Call'}</span>
                              <span className="v3-date">{format(new Date(act.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                            <p className="v3-notes">{act.notes}</p>
                            <div className="v3-footer">
                              <span className="v3-user" style={{ color: isOverdue ? 'var(--danger)' : undefined }}>
                                {isOverdue ? '⚠ Overdue' : 'Pending'}
                              </span>
                              {act.follow_up_date && (
                                <span className="v3-followup" style={{ color: isOverdue ? 'var(--danger)' : undefined }}>
                                  <Calendar size={10} /> Follow-up: {format(new Date(act.follow_up_date), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

    </div>
  );
};

export default StoreProfile;
