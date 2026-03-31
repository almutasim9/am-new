import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Clock, MessageSquare, AlertCircle,
  Calendar, Store, Send, Search, Star, Tag, DollarSign, Utensils, Coffee, Users, Wrench, RefreshCw, XCircle, Info, AlertTriangle, Zap, TrendingUp, ChevronRight
} from 'lucide-react';

const OUTCOME_ICONS = {
  'Highlights': Star,
  'Promotion': Tag,
  'Payment Inquiry': DollarSign,
  'Menu Revamp': Utensils,
  'Catch Up': Coffee,
  'Operating Hours': Clock,
  'Handover': Users,
  'POS issues': Wrench,
  'Item Update': RefreshCw,
  'Close Permanently': XCircle,
  'Store Info Update': Info,
  'Closing temporarily': AlertTriangle,
  'Mega deals': Zap,
  'Save 5K': TrendingUp
};

const QUICK_OUTCOME_NAMES = ['Highlights', 'Promotion', 'POS issues', 'Item Update'];
import { format } from 'date-fns';

// UUID fallback for older browsers
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

const QUICK_TEMPLATES = [
  { id: 'busy', label: 'No Answer / Busy', text: 'Merchant was busy or did not answer the call.' },
  { id: 'follow', label: 'Follow-up set', text: 'Scheduled a follow-up interaction.' },
  { id: 'resolved', label: 'Issue Resolved', text: 'Successfully resolved the pending issue.' },
  { id: 'menu', label: 'Menu Updated', text: 'Updated the restaurant menu and categories.' },
  { id: 'contract', label: 'Contract Task', text: 'Discussed or signed contract terms.' },
  { id: 'pos', label: 'POS Training', text: 'Provided training on the POS system.' }
];

const ActivityForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  stores, 
  outcomes, 
  initialStoreId = '',
  merchantHistory = [] 
}) => {
  const [formData, setFormData] = useState({
    store_id: initialStoreId,
    outcome_id: outcomes[0]?.id || '',
    notes: '',
    follow_up_date: '',
    is_resolved: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOutcomeDropdownOpen, setIsOutcomeDropdownOpen] = useState(false);

  const selectedStore = useMemo(() => 
    (stores || []).find(s => s?.id === formData.store_id), 
  [stores, formData.store_id]);

  const handleTemplateClick = (template) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes ? `${prev.notes}. ${template.text}` : template.text
    }));
  };

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    const activeStores = (stores || []).filter(s => s && s.is_active);
    if (!searchTerm) return activeStores;
    return activeStores.filter(s => 
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.id?.toString() || '').includes(searchTerm)
    );
  }, [stores, searchTerm]);

  const otherOutcomes = useMemo(() => {
    return (outcomes || []).filter(o => !QUICK_OUTCOME_NAMES.includes(o.name));
  }, [outcomes]);

  const quickOutcomes = useMemo(() => {
    return (outcomes || []).filter(o => QUICK_OUTCOME_NAMES.includes(o.name));
  }, [outcomes]);

  const selectedOutcome = useMemo(() => {
    return (outcomes || []).find(o => o.id === formData.outcome_id);
  }, [outcomes, formData.outcome_id]);

  const handleStoreSelect = (store) => {
    setFormData(prev => ({ ...prev, store_id: store.id }));
    setSearchTerm(store.name);
    setIsDropdownOpen(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: generateId(),
      created_at: new Date().toISOString(),
      outcome_id: parseInt(formData.outcome_id)
    });
    // Reset form
    setFormData({
      store_id: initialStoreId,
      outcome_id: outcomes[0]?.id || '',
      notes: '',
      follow_up_date: '',
      is_resolved: false
    });
    onClose();
  };

  const sheetVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    },
    exit: { y: '100%', opacity: 0 }
  };

  const modalVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="activity-form-overlay" onClick={onClose}>
        <motion.div 
          className="activity-form-container"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="form-header-premium">
            <div className="header-info">
              <div className="icon-badge">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3>Record Interaction</h3>
                <p>Log a new activity for transparency</p>
              </div>
            </div>
            <button className="close-btn-circle" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="form-content-scrollable">
            {/* Store Selection (Hidden if initialStoreId is provided) */}
            {!initialStoreId && (
              <div className="form-section">
                <label className="section-label">
                  <span><Store size={14} /> Target Restaurant / المطعم المستهدف</span>
                </label>
                <div className="searchable-store-container">
                  <div className="search-input-wrapper">
                    <Store className="input-icon-left" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search or select a restaurant..." 
                      className="premium-search-input"
                      value={searchTerm || (selectedStore?.name || '')}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                    {isDropdownOpen && (
                      <button 
                        type="button" 
                        className="clear-search-btn"
                        onClick={() => {
                          setSearchTerm('');
                          setFormData({ ...formData, store_id: '' });
                          setIsDropdownOpen(true);
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div 
                        className="store-results-dropdown"
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                      >
                        {filteredStores.length > 0 ? (
                          <div className="store-list-scrollable">
                            {filteredStores.map(s => (
                              <div 
                                key={s.id} 
                                className={`store-result-item ${formData.store_id === s.id ? 'selected' : ''}`}
                                onClick={() => handleStoreSelect(s)}
                              >
                                <div className="store-item-info">
                                  <span className="store-name">{s.name}</span>
                                  {s.area && <span className="store-area">{s.area}</span>}
                                </div>
                                {formData.store_id === s.id && <Check size={14} className="selected-check" />}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-stores-found">
                            No restaurants match your search
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Close dropdown on click outside logic (simple version) */}
                  {isDropdownOpen && (
                    <div 
                      className="dropdown-backdrop-transparent" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Outcome Selection - Modern Hybrid */}
            <div className="form-section">
              <label className="section-label">
                <span><AlertCircle size={14} /> Interaction Outcome / نتيجة التواصل</span>
              </label>
              
              <div className="modern-outcome-container">
                {/* 1. Quick Selection (Top Frequent) */}
                <div className="quick-picks-row">
                  {quickOutcomes.map(o => {
                    const Icon = OUTCOME_ICONS[o.name] || Tag;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className={`quick-pick-chip ${formData.outcome_id === o.id ? 'active' : ''}`}
                        onClick={() => {
                          setFormData({...formData, outcome_id: o.id});
                        }}
                      >
                        <Icon size={16} />
                        <span>{o.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Custom Premium Dropdown (Select) */}
                <div className="outcome-search-wrapper">
                  <div 
                    className={`premium-select-btn ${isOutcomeDropdownOpen ? 'open' : ''} ${selectedOutcome && !QUICK_OUTCOME_NAMES.includes(selectedOutcome.name) ? 'has-value' : ''}`}
                    onClick={() => setIsOutcomeDropdownOpen(!isOutcomeDropdownOpen)}
                  >
                    <div className="select-btn-content">
                      {selectedOutcome && !QUICK_OUTCOME_NAMES.includes(selectedOutcome.name) ? (
                        <>
                          {(() => {
                            const SelectedIcon = OUTCOME_ICONS[selectedOutcome.name] || Tag;
                            return <SelectedIcon size={16} />;
                          })()}
                          <span className="selected-label">{selectedOutcome.name}</span>
                        </>
                      ) : (
                        <span className="placeholder">Pick another result... اختر نتيجة أخرى</span>
                      )}
                    </div>
                    <ChevronRight size={18} className="select-arrow" />
                  </div>

                  <AnimatePresence>
                    {isOutcomeDropdownOpen && (
                      <motion.div 
                        className="outcome-results-popover"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <div className="popover-results-header">More Outcomes / خيارات إضافية</div>
                        <div className="popover-results-list">
                          {otherOutcomes.map(o => {
                            const Icon = OUTCOME_ICONS[o.name] || Tag;
                            return (
                              <div 
                                key={o.id}
                                className={`popover-result-item ${formData.outcome_id === o.id ? 'active' : ''}`}
                                onClick={() => {
                                  setFormData({...formData, outcome_id: o.id});
                                  setIsOutcomeDropdownOpen(false);
                                }}
                              >
                                <Icon size={16} />
                                <span>{o.name}</span>
                                {formData.outcome_id === o.id && <Check size={14} className="check-mark" />}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isOutcomeDropdownOpen && (
                    <div className="dropdown-backdrop-transparent" onClick={() => setIsOutcomeDropdownOpen(false)} />
                  )}
                </div>
              </div>
            </div>

            {/* Notes & Quick Templates */}
            <div className="form-section">
              <label className="section-label">
                <span><Clock size={14} /> Interaction Details / تفاصيل التواصل</span>
              </label>
              <div className="quick-templates-grid">
                {QUICK_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className="template-btn"
                    onClick={() => handleTemplateClick(t)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea 
                rows="4" 
                placeholder="What happened during this interaction? Any specific details or merchant feedback..."
                className="premium-textarea"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                required
              />
            </div>

            {/* Merchant History - Contextual Backdrop */}
            {formData.store_id && merchantHistory.length > 0 && (
              <div className="contextual-history-card">
                <div className="history-header">
                  <Clock size={12} /> RECENT LOGS FOR {selectedStore?.name.toUpperCase()}
                </div>
                <div className="history-items">
                  {merchantHistory.map(h => (
                    <div key={h.id} className="history-item-mini">
                      <span className="h-date">{format(new Date(h.created_at), 'MMM d')}:</span>
                      <span className="h-notes">{h.notes}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Section */}
            <div className="form-section">
              <label className="section-label"><Calendar size={14} /> Next Steps (Optional)</label>
              <div className="follow-up-group">
                <input 
                  type="date" 
                  className="premium-date-input"
                  value={formData.follow_up_date}
                  onChange={e => setFormData({...formData, follow_up_date: e.target.value})}
                />
                <div className="resolve-toggle-group">
                  <label>Mark as Resolved?</label>
                  <button
                    type="button"
                    className={`toggle-pill ${formData.is_resolved ? 'on' : 'off'}`}
                    onClick={() => setFormData({...formData, is_resolved: !formData.is_resolved})}
                  >
                    <div className="knob"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="form-actions-fixed">
              <button type="submit" className="btn-submit-activity">
                <Send size={18} /> Record Interaction / تسجيل النشاط
              </button>
            </div>
          </form>
        </motion.div>

        <style>{`
          .activity-form-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }

          .activity-form-container {
            background: #ffffff;
            width: 100%;
            max-width: 540px;
            max-height: 85vh;
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.3);
            border: 1px solid #e2e8f0;
            position: relative;
          }

          .form-header-premium {
            padding: 1.25rem 1.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #ffffff;
            border-bottom: 1px solid #f1f5f9;
            z-index: 10;
          }

          .header-info { display: flex; gap: 14px; align-items: center; }
          .icon-badge {
            width: 40px; height: 40px; border-radius: 10px;
            background: var(--primary-color);
            color: white;
            display: flex; align-items: center; justify-content: center;
          }
          .header-info h3 { font-size: 1.1rem; font-weight: 800; margin: 0; color: #1e293b; }
          .header-info p { font-size: 0.7rem; color: #64748b; margin: 0; }

          .close-btn-circle {
            width: 44px; height: 44px; border-radius: 10px;
            border: none; background: #f8fafc; color: #94a3b8;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s; cursor: pointer; flex-shrink: 0;
          }
          .close-btn-circle:hover { background: #fee2e2; color: #ef4444; }

          .form-content-scrollable {
            padding: 1.75rem;
            overflow-y: auto;
            flex: 1;
            padding-bottom: 100px;
            scrollbar-width: thin;
          }

          .form-section { margin-bottom: 1.75rem; }
          .section-label { 
            display: flex; align-items: center; gap: 8px;
            font-size: 0.7rem; font-weight: 800; color: #94a3b8;
            text-transform: uppercase; letter-spacing: 0.05em;
            margin-bottom: 0.85rem;
          }

          .premium-select, .premium-textarea, .premium-date-input {
            width: 100%;
            padding: 0.85rem 1rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            font-size: 0.95rem;
            background: #ffffff;
            color: #1e293b;
            transition: all 0.2s;
          }

          .premium-select:focus, .premium-textarea:focus, .premium-date-input:focus, .premium-search-input:focus {
            outline: none; border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }

          /* Searchable Dropdown Styles */
          .searchable-store-container {
            position: relative;
            width: 100%;
          }

          .search-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .premium-search-input {
            width: 100%;
            padding: 0.85rem 1rem 0.85rem 2.75rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            font-size: 0.95rem;
            background: #ffffff;
            color: #1e293b;
            transition: all 0.2s;
          }

          .input-icon-left {
            position: absolute;
            left: 1rem;
            color: #94a3b8;
          }

          .clear-search-btn {
            position: absolute;
            right: 0.75rem;
            width: 24px;
            height: 24px;
            border-radius: 6px;
            border: none;
            background: #f1f5f9;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 5;
          }

          .store-results-dropdown {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            right: 0;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-height: 280px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .store-list-scrollable {
            overflow-y: auto;
            max-height: 280px;
            scrollbar-width: thin;
          }

          .store-result-item {
            padding: 0.75rem 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.15s;
            border-bottom: 1px solid #f8fafc;
          }

          .store-result-item:last-child { border-bottom: none; }

          .store-result-item:hover {
            background: #f8fafc;
          }

          .store-result-item.selected {
            background: rgba(37, 99, 235, 0.05);
          }

          .store-item-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .store-name {
            font-size: 0.9rem;
            font-weight: 700;
            color: #1e293b;
          }

          .store-area {
            font-size: 0.7rem;
            font-weight: 500;
            color: #64748b;
          }

          .selected-check {
            color: var(--primary-color);
          }

          .no-stores-found {
            padding: 1.5rem;
            text-align: center;
            font-size: 0.85rem;
            color: #94a3b8;
            font-weight: 600;
          }

          .dropdown-backdrop-transparent {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 999;
          }

          .modern-outcome-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .quick-picks-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .quick-pick-chip {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            background: white;
            border: 1.5px solid #eef2f6;
            border-radius: 14px;
            color: #475569;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
            min-height: 48px;
          }

          .quick-pick-chip:hover {
            border-color: var(--primary-color);
            background: rgba(37, 99, 235, 0.02);
            transform: translateY(-1px);
          }

          .quick-pick-chip.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
          }

          .outcome-search-wrapper {
            position: relative;
            z-index: 100;
          }

          .outcome-input-field {
            position: relative;
            display: flex;
            align-items: center;
          }

          .search-icon-fixed {
            position: absolute;
            left: 16px;
            color: #94a3b8;
          }

          .premium-select-btn {
            width: 100%;
            padding: 14px 18px;
            background: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
          }

          .premium-select-btn:hover {
            border-color: var(--primary-color);
            background: white;
          }

          .premium-select-btn.open {
            border-color: var(--primary-color);
            background: white;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          }

          .premium-select-btn.has-value {
            background: #f1f5f9;
            border-color: #cbd5e1;
          }

          .select-btn-content {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }

          .select-btn-content .placeholder {
            color: #64748b;
            font-weight: 500;
          }

          .select-arrow {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: #94a3b8;
          }

          .premium-select-btn.open .select-arrow {
            transform: rotate(90deg);
            color: var(--primary-color);
          }

          .popover-result-item.active {
            background: #f1f5f9;
            color: var(--primary-color);
          }

          .check-mark {
            margin-left: auto;
            color: var(--primary-color);
          }

          .outcome-results-popover {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
            z-index: 1000;
          }

          .popover-results-header {
            padding: 12px 16px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.65rem;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .popover-results-list {
            max-height: 260px;
            overflow-y: auto;
          }

          .popover-result-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            cursor: pointer;
            transition: all 0.15s;
            font-size: 14px;
            font-weight: 600;
            color: #334155;
          }

          .popover-result-item:hover {
            background: #f1f5f9;
            color: var(--primary-color);
          }

          .popover-result-item svg {
            color: #94a3b8;
          }

          .popover-result-item:hover svg {
            color: var(--primary-color);
          }

          .no-popover-results {
            padding: 24px;
            text-align: center;
            color: #94a3b8;
            font-size: 14px;
          }

          .quick-templates-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
            margin-bottom: 1rem;
          }
          .template-btn {
            padding: 10px 8px; font-size: 0.75rem; font-weight: 700;
            background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;
            color: #475569; transition: all 0.2s; cursor: pointer;
            min-height: 44px; display: flex; align-items: center; justify-content: center;
            text-align: center; line-height: 1.3;
          }
          .template-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }

          .contextual-history-card {
            background: #f1f5f9;
            border-radius: 16px; padding: 1.25rem; margin-bottom: 1.75rem;
          }
          .history-header { font-size: 0.65rem; font-weight: 800; color: #475569; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
          .history-item-mini { font-size: 0.75rem; color: #64748b; margin-bottom: 6px; }

          .form-actions-fixed {
            position: absolute; bottom: 0; left: 0; right: 0;
            padding: 1.5rem;
            background: linear-gradient(to top, #ffffff 80%, rgba(255,255,255,0));
            z-index: 20;
          }
          .btn-submit-activity {
            width: 100%; padding: 1rem; border-radius: 12px;
            background: var(--primary-color); color: white;
            border: none; font-weight: 800; font-size: 1rem;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            cursor: pointer; transition: all 0.2s;
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
          }
          .btn-submit-activity:hover { filter: brightness(1.1); transform: translateY(-1px); }

          @media (max-width: 768px) {
            .activity-form-overlay { padding: 1rem; align-items: center; justify-content: center; }
            .activity-form-container {
              max-width: 100%; 
              border-radius: 20px;
              max-height: 90vh;
            }
            .quick-templates-grid { grid-template-columns: repeat(2, 1fr); }
            .form-content-scrollable { padding: 1.25rem; padding-bottom: 100px; }
            .form-header-premium { padding: 1rem 1.25rem; }
          }

          @media (max-width: 480px) {
            .quick-templates-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
            .follow-up-group { flex-direction: column; gap: 1rem; }
            .btn-submit-activity { font-size: 0.95rem; padding: 0.875rem; }
          }
        `}</style>
      </div>
    </AnimatePresence>
  );
};

export default ActivityForm;
