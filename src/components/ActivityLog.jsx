import React, { useState, useMemo } from 'react';
import { ClipboardList, Calendar, CheckCircle, Clock, FileDown, FilePlus, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const ActivityLog = ({ activities, stores, outcomes, onAddActivity, onResolveActivity, onBulkResolve }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('');
  const [newActivity, setNewActivity] = useState({
    store_id: '',
    outcome_id: outcomes[0]?.id || '',
    notes: '',
    follow_up_date: '',
    is_resolved: false
  });

  const QUICK_TEMPLATES = [
    'No Answer / Busy',
    'Follow-up scheduled',
    'Issue resolved',
    'Menu updated',
    'Contract discussed',
    'POS training given'
  ];

  const getStoreName = (id) => stores.find(s => s.id === id)?.name || 'Unknown Store';
  const getOutcomeName = (id) => outcomes.find(o => o.id === parseInt(id))?.name || 'Status';

  const isOverdue = (date, resolved) => {
    if (!date || resolved) return false;
    return new Date(date) < new Date(new Date().setHours(0,0,0,0));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const pendingIds = activities.filter(a => !a.is_resolved).map(a => a.id);
    setSelectedIds(selectedIds.length === pendingIds.length ? [] : pendingIds);
  };

  const handleBulkResolve = () => {
    onBulkResolve(selectedIds);
    setSelectedIds([]);
  };

  const handleExport = () => {
    const exportData = activities.map(act => ({
      'Date': format(new Date(act.created_at), 'yyyy-MM-dd HH:mm'),
      'Store': getStoreName(act.store_id),
      'Status': getOutcomeName(act.outcome_id),
      'Interaction Notes': act.notes,
      'Follow-up': act.follow_up_date || 'None',
      'Completion': act.is_resolved ? 'Completed' : 'Pending'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DailyActivities');
    XLSX.writeFile(wb, `DailyLog_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddActivity({
      ...newActivity,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      outcome_id: parseInt(newActivity.outcome_id)
    });
    setNewActivity({ store_id: '', outcome_id: outcomes[0]?.id || '', notes: '', follow_up_date: '', is_resolved: false });
    setIsModalOpen(false);
  };

  const filteredLog = useMemo(() =>
    activities.filter(act => {
      const storeName = getStoreName(act.store_id).toLowerCase();
      const notes = (act.notes || '').toLowerCase();
      const matchesSearch = storeName.includes(logSearchTerm.toLowerCase()) ||
                           notes.includes(logSearchTerm.toLowerCase());
      const matchesStatus = !logStatusFilter || act.outcome_id === parseInt(logStatusFilter);
      return matchesSearch && matchesStatus;
    }),
  [activities, stores, logSearchTerm, logStatusFilter]);

  const merchantHistory = useMemo(() =>
    activities
      .filter(a => a.store_id === newActivity.store_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3),
  [activities, newActivity.store_id]);

  return (
    <div className="section-container" style={{ position: 'relative' }}>
      <div className="section-header">
        <div>
          <h2 className="gradient-text">Daily Activity Log</h2>
          <p className="stat-label">Manage who you contacted and what was achieved</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileDown size={18} />
            Export Log
          </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <FilePlus size={18} style={{ marginRight: '8px' }} />
            New Activity
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="Search logs by store or notes..." 
          className="glass-card"
          style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: '14px' }}
          value={logSearchTerm}
          onChange={e => setLogSearchTerm(e.target.value)}
        />
        <select 
          className="glass-card" 
          style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: '14px' }}
          value={logStatusFilter}
          onChange={e => setLogStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {outcomes.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <div className="glass-card table-container" style={{ padding: filteredLog.length === 0 ? '0' : '' }}>
        {filteredLog.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === filteredLog.filter(a => !a.is_resolved).length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Time</th>
                <th>Store / Contact</th>
                <th>Activity Status</th>
                <th>Details</th>
                <th>Follow-up</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLog.map((act) => {
                const overdue = isOverdue(act.follow_up_date, act.is_resolved);
                return (
                <tr key={act.id} className={overdue ? 'pulse-red' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(act.id)} 
                      onChange={() => toggleSelect(act.id)}
                      disabled={act.is_resolved}
                    />
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)', width: '120px' }}>
                    <div title={format(new Date(act.created_at), 'yyyy-MM-dd HH:mm:ss')}>
                      {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                    </div>
                  </td>
                  <td style={{ width: '200px' }}>
                    <div style={{ fontWeight: 600 }}>{getStoreName(act.store_id)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{act.store_id}</div>
                  </td>
                  <td style={{ width: '180px' }}>
                    <span className="tag" style={{ background: '#f5f3ff', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>
                      {getOutcomeName(act.outcome_id)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {overdue && <span style={{ color: 'var(--danger)', fontWeight: 700, marginRight: '8px' }}>[OVERDUE!]</span>}
                      {act.notes || 'No details provided'}
                    </div>
                  </td>
                  <td style={{ width: '140px' }}>
                    {act.follow_up_date ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: overdue ? 'var(--danger)' : act.is_resolved ? 'var(--text-dim)' : 'var(--warning)', fontSize: '0.8rem', fontWeight: overdue ? 700 : 400 }}>
                        <Clock size={12} />
                        {format(new Date(act.follow_up_date), 'MMM d')}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>-</span>
                    )}
                  </td>
                  <td style={{ width: '120px' }}>
                    {act.is_resolved ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>
                        <CheckCircle size={16} /> Done
                      </div>
                    ) : (
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600 }}
                        onClick={() => onResolveActivity(act.id)}
                      >
                        Mark Done
                      </button>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '1.5rem', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
              <ClipboardList size={48} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No activity records</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
              {logSearchTerm || logStatusFilter 
                ? "No logs match your search criteria. Try a different term or clear filters." 
                : "Your daily log is currently empty. Start tracking your merchant interactions to see them here."}
            </p>
            {!logSearchTerm && !logStatusFilter && (
               <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                  <FilePlus size={18} style={{ marginRight: '8px' }} /> Record First Activity
               </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            style={{ 
              position: 'fixed', 
              bottom: '2rem', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              zIndex: 100,
              background: 'var(--primary-color)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            }}
          >
            <span style={{ fontWeight: 600 }}>{selectedIds.length} items selected</span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-primary" 
                style={{ background: 'white', color: 'var(--primary-color)', padding: '0.5rem 1.5rem' }}
                onClick={handleBulkResolve}
              >
                Mark as Done
              </button>
              <button 
                className="btn-secondary" 
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '0.5rem 1.5rem' }}
                onClick={() => setSelectedIds([])}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <motion.div 
            className="glass-card modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Record Day's Activity</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Restaurant / Contact</label>
                <select 
                  required 
                  value={newActivity.store_id} 
                  onChange={e => setNewActivity({...newActivity, store_id: e.target.value})}
                  style={{ width: '100%' }}
                >
                  <option value="">Choose a store...</option>
                  {stores.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Activity Outcome / Status</label>
                <select 
                  required 
                  value={newActivity.outcome_id} 
                  onChange={e => setNewActivity({...newActivity, outcome_id: e.target.value})}
                  style={{ width: '100%' }}
                >
                  {outcomes.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>What did you do?</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {QUICK_TEMPLATES.map(t => (
                    <button 
                      key={t} 
                      type="button" 
                      className="tag-btn"
                      onClick={() => setNewActivity({...newActivity, notes: newActivity.notes ? `${newActivity.notes}, ${t}` : t})}
                    >
                      +{t}
                    </button>
                  ))}
                </div>
                <textarea 
                  rows="3" 
                  placeholder="Record the details of your interaction..."
                  value={newActivity.notes} 
                  onChange={e => setNewActivity({...newActivity, notes: e.target.value})} 
                />
              </div>

              {newActivity.store_id && merchantHistory.length > 0 && (
                <div style={{ marginBottom: '1.5rem', background: 'var(--primary-light)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> RECENT HISTORY FOR THIS STORE:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {merchantHistory.map(h => (
                      <div key={h.id} style={{ fontSize: '0.7rem' }}>
                        <span style={{ fontWeight: 600 }}>{format(new Date(h.created_at), 'MMM d')}:</span> {h.notes || 'No details'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Follow-up Needed? (Optional)</label>
                <input 
                  type="date" 
                  value={newActivity.follow_up_date} 
                  onChange={e => setNewActivity({...newActivity, follow_up_date: e.target.value})} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flexGrow: 1 }}>Save Activity</button>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
