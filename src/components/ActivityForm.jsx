import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Clock, MessageSquare, AlertCircle,
  Calendar, Store, Send
} from 'lucide-react';
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

  const selectedStore = useMemo(() => 
    (stores || []).find(s => s?.id === formData.store_id), 
  [stores, formData.store_id]);

  const handleTemplateClick = (template) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes ? `${prev.notes}. ${template.text}` : template.text
    }));
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
          variants={window.innerWidth <= 768 ? sheetVariants : modalVariants}
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
                <select 
                  required 
                  value={formData.store_id} 
                  onChange={e => setFormData({...formData, store_id: e.target.value})}
                  className="premium-select"
                >
                  <option value="">Select a restaurant...</option>
                  {stores.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Outcome Selection - Touch Oriented */}
            <div className="form-section">
              <label className="section-label">
                <span><AlertCircle size={14} /> Interaction Outcome / نتيجة التواصل</span>
              </label>
              <div className="outcome-ribbon">
                {outcomes.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    className={`outcome-chip ${formData.outcome_id === o.id ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, outcome_id: o.id})}
                    aria-pressed={formData.outcome_id === o.id}
                    aria-label={o.name}
                  >
                    {formData.outcome_id === o.id && <Check size={14} />}
                    {o.name}
                  </button>
                ))}
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
            background: rgba(15, 23, 42, 0.7); /* Solid dark overlay, no blur */
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .activity-form-container {
            background: #ffffff; /* Solid white background */
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

          .premium-select:focus, .premium-textarea:focus, .premium-date-input:focus {
            outline: none; border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }

          .outcome-ribbon {
            display: flex; gap: 8px; overflow-x: auto;
            padding-bottom: 8px; scrollbar-width: none;
          }

          .outcome-chip {
            white-space: nowrap; padding: 12px 16px;
            border-radius: 12px; border: 1px solid #e2e8f0;
            background: #f8fafc; font-size: 0.85rem; font-weight: 700;
            color: #64748b; transition: all 0.2s;
            cursor: pointer; min-height: 44px;
            display: inline-flex; align-items: center; gap: 6px;
          }
          .outcome-chip.active {
            background: var(--primary-color); color: white;
            border-color: var(--primary-color);
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
            .activity-form-overlay { padding: 0; align-items: flex-end; }
            .activity-form-container {
              max-width: 100%; border-radius: 20px 20px 0 0;
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
