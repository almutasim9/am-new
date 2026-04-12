import { useState, useMemo, useEffect } from 'react';
import { ClipboardList, Calendar, CheckCircle, Clock, FileDown, FilePlus, X, Download } from 'lucide-react';
import { format, formatDistanceToNow, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import ActivityForm from './ActivityForm';


const ActivityLog = ({ activities, stores, outcomes, onAddActivity, onResolveActivity, onBulkResolve }) => {
  const PAGE_SIZE = 20;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
    const pendingIds = filteredLog.filter(a => !a.is_resolved).map(a => a.id);
    setSelectedIds(selectedIds.length === pendingIds.length ? [] : pendingIds);
  };

  const handleBulkResolve = () => {
    onBulkResolve(selectedIds);
    setSelectedIds([]);
  };

  // Quick preset helpers
  const applyPreset = (preset) => {
    const now = new Date();
    const fmt = (d) => format(d, 'yyyy-MM-dd');
    const presets = {
      today:      { from: fmt(now),                          to: fmt(now) },
      week:       { from: fmt(startOfWeek(now, { weekStartsOn: 0 })), to: fmt(endOfWeek(now, { weekStartsOn: 0 })) },
      month:      { from: fmt(startOfMonth(now)),            to: fmt(endOfMonth(now)) },
      lastMonth:  { from: fmt(startOfMonth(subMonths(now, 1))), to: fmt(endOfMonth(subMonths(now, 1))) },
      all:        { from: '', to: '' },
    };
    const p = presets[preset];
    setExportFrom(p.from);
    setExportTo(p.to);
  };

  // Count how many activities match the current export range
  const exportPreviewCount = useMemo(() => {
    if (!exportFrom && !exportTo) return activities.length;
    return activities.filter(act => {
      const d = new Date(act.created_at);
      const from = exportFrom ? startOfDay(new Date(exportFrom)) : null;
      const to   = exportTo   ? endOfDay(new Date(exportTo))     : null;
      if (from && to) return isWithinInterval(d, { start: from, end: to });
      if (from) return d >= from;
      if (to)   return d <= to;
      return true;
    }).length;
  }, [activities, exportFrom, exportTo]);

  const handleExport = () => {
    const filtered = (!exportFrom && !exportTo)
      ? activities
      : activities.filter(act => {
          const d = new Date(act.created_at);
          const from = exportFrom ? startOfDay(new Date(exportFrom)) : null;
          const to   = exportTo   ? endOfDay(new Date(exportTo))     : null;
          if (from && to) return isWithinInterval(d, { start: from, end: to });
          if (from) return d >= from;
          if (to)   return d <= to;
          return true;
        });

    const exportData = filtered.map(act => ({
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

    const rangeLabel = exportFrom || exportTo
      ? `_${exportFrom || 'start'}_to_${exportTo || 'end'}`
      : '_All';
    const fileName = `DailyLog${rangeLabel}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const uri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = uri;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsExportOpen(false);
  };

  const filteredLog = useMemo(() => {
    const result = activities.filter(act => {
      const storeName = getStoreName(act.store_id).toLowerCase();
      const notes = (act.notes || '').toLowerCase();
      const matchesSearch = storeName.includes(logSearchTerm.toLowerCase()) ||
                            notes.includes(logSearchTerm.toLowerCase());
      const matchesStatus = !logStatusFilter || act.outcome_id === parseInt(logStatusFilter);
      return matchesSearch && matchesStatus;
    });
    return result;
  }, [activities, stores, logSearchTerm, logStatusFilter]);

  const totalPages = Math.ceil(filteredLog.length / PAGE_SIZE);
  const pagedLog = filteredLog.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Keyboard shortcut: N → open new activity modal
  useEffect(() => {
    const handler = () => setIsModalOpen(true);
    window.addEventListener('open-new-activity', handler);
    return () => window.removeEventListener('open-new-activity', handler);
  }, []);

  // Reset to page 1 when filters change
  const handleSearchChange = (val) => { setLogSearchTerm(val); setCurrentPage(1); };
  const handleStatusChange = (val) => { setLogStatusFilter(val); setCurrentPage(1); };

  return (
    <div className="section-container al-wrap" style={{ position: 'relative' }}>
      <div className="activity-header">
        <div>
          <h2 className="gradient-text">Daily Activity Log</h2>
          <p className="stat-label">Manage who you contacted and what was achieved</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setIsExportOpen(true)}>
            <FileDown size={14} /> <span className="desktop-only text-sm">Export</span>
          </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <FilePlus size={16} /> <span className="desktop-only text-sm">New Activity</span>
          </button>
        </div>
      </div>


      <div className="filters-grid">
        <input
          type="text"
          placeholder="Search logs..."
          className="glass-card"
          value={logSearchTerm}
          onChange={e => handleSearchChange(e.target.value)}
        />
        <select
          className="glass-card"
          value={logStatusFilter}
          onChange={e => handleStatusChange(e.target.value)}
        >
          <option value="">All Statuses</option>
          {outcomes.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>


      <div className="content-area">
        {filteredLog.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only glass-card table-container" style={{ padding: '0' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredLog.filter(a => !a.is_resolved).length}
                        onChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th>Time</th>
                    <th>Store / Contact</th>
                    <th>Type</th>
                    <th>Activity Status</th>
                    <th>Details</th>
                    <th>Follow-up</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLog.map((act) => {
                    const overdue = isOverdue(act.follow_up_date, act.is_resolved);
                    return (
                    <tr key={act.id} className={overdue ? 'pulse-red' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(act.id)}
                          onChange={() => toggleSelect(act.id)}
                          disabled={act.is_resolved}
                          aria-label={`Select activity for ${getStoreName(act.store_id)}`}
                        />
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)', width: '120px' }}>
                        <div>{formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}</div>
                      </td>
                      <td style={{ width: '200px' }}>
                        <div style={{ fontWeight: 600 }}>{getStoreName(act.store_id)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{act.store_id}</div>
                      </td>
                      <td style={{ width: '80px' }}>
                        <span title={act.contact_type || 'call'} style={{ fontSize: '1.1rem' }}>
                          {act.contact_type === 'visit' ? '🚗' : act.contact_type === 'whatsapp' ? '💬' : act.contact_type === 'online' ? '🌐' : '📞'}
                        </span>
                      </td>
                      <td style={{ width: '180px' }}>
                        <span className="tag" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}>
                          {getOutcomeName(act.outcome_id)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {overdue && <span style={{ color: 'var(--danger)', fontWeight: 700, marginRight: '8px' }}>[OVERDUE!]</span>}
                          {act.notes || '—'}
                        </div>
                      </td>
                      <td style={{ width: '140px' }}>
                        {act.follow_up_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: overdue ? 'var(--danger)' : 'var(--warning)', fontSize: '0.8rem' }}>
                            <Clock size={12} /> {format(new Date(act.follow_up_date), 'MMM d')}
                          </div>
                        )}
                      </td>
                      <td style={{ width: '120px' }}>
                        {act.is_resolved ? (
                          <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Done
                          </div>
                        ) : (
                          <button className="btn-secondary" onClick={() => onResolveActivity(act.id)}>Mark Done</button>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-only logs-list">
              {pagedLog.map((act) => {
                const overdue = isOverdue(act.follow_up_date, act.is_resolved);
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={act.id} 
                    className={`glass-card log-card ${overdue ? 'pulse-red' : ''}`}
                  >
                    <div className="card-top">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(act.id)} 
                        onChange={() => toggleSelect(act.id)}
                        disabled={act.is_resolved}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <span className="time-badge">{formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}</span>
                      <span className={`badge ${act.is_resolved ? 'badge-success' : (overdue ? 'badge-danger' : 'badge-warning')}`}>
                        {act.is_resolved ? 'Done' : (overdue ? 'Overdue' : 'Pending')}
                      </span>
                    </div>
                    <div className="card-main">
                      <h3 className="store-name">{getStoreName(act.store_id)}</h3>
                      <div className="outcome-tag">{getOutcomeName(act.outcome_id)}</div>
                      <p className="log-notes">
                        {overdue && <span className="overdue-text">⚠️ OVERDUE: </span>}
                        {act.notes}
                      </p>
                    </div>
                    <div className="card-bottom">
                      {act.follow_up_date && (
                        <div className="follow-up">
                          <Calendar size={14} /> {format(new Date(act.follow_up_date), 'MMM d, yyyy')}
                        </div>
                      )}
                      {!act.is_resolved && (
                        <button className="btn-primary" onClick={() => onResolveActivity(act.id)}>Mark Complete</button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '1.25rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{ padding: '6px 14px', opacity: currentPage === 1 ? 0.4 : 1 }}
                >←</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
                      background: p === currentPage ? 'var(--primary-color)' : 'var(--surface-hover)',
                      color: p === currentPage ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)', cursor: 'pointer'
                    }}
                  >{p}</button>
                ))}
                <button
                  className="btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ padding: '6px 14px', opacity: currentPage === totalPages ? 0.4 : 1 }}
                >→</button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '8px' }}>
                  {filteredLog.length} total
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><ClipboardList size={48} /></div>
            <h3>No logs found</h3>
            <p>Try searching for a different keyword.</p>
          </div>
        )}
      </div>


      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="bulk-actions-bar"
          >
            <span className="selected-count">{selectedIds.length} items</span>
            <div className="action-buttons">
              <button className="btn-primary light" onClick={handleBulkResolve}>Resolve All</button>
              <button className="btn-secondary dark" onClick={() => setSelectedIds([])}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Export Date Range Modal ── */}
      <AnimatePresence>
        {isExportOpen && (
          <div className="modal-overlay" onClick={() => setIsExportOpen(false)}>
            <motion.div
              className="glass-card export-modal"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
            >
              {/* Header */}
              <div className="export-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '10px' }}>
                    <FileDown size={18} color="var(--primary-color)" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>تصدير السجلات</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>حدد المدة الزمنية للتصدير</p>
                  </div>
                </div>
                <button className="export-close-btn" onClick={() => setIsExportOpen(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="export-presets">
                {[
                  { key: 'today',     label: 'اليوم' },
                  { key: 'week',      label: 'هذا الأسبوع' },
                  { key: 'month',     label: 'هذا الشهر' },
                  { key: 'lastMonth', label: 'الشهر الماضي' },
                  { key: 'all',       label: 'الكل' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className="preset-chip"
                    onClick={() => applyPreset(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Date Inputs */}
              <div className="export-date-row">
                <div className="export-date-group">
                  <label>من تاريخ</label>
                  <input
                    type="date"
                    value={exportFrom}
                    onChange={e => setExportFrom(e.target.value)}
                  />
                </div>
                <div className="export-date-sep">—</div>
                <div className="export-date-group">
                  <label>إلى تاريخ</label>
                  <input
                    type="date"
                    value={exportTo}
                    onChange={e => setExportTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview count */}
              <div className="export-preview">
                <span className="export-count">{exportPreviewCount}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {exportPreviewCount === 1 ? 'نشاط سيتم تصديره' : 'نشاط سيتم تصديرهم'}
                </span>
                {(exportFrom || exportTo) && (
                  <button
                    className="clear-range-btn"
                    onClick={() => { setExportFrom(''); setExportTo(''); }}
                  >
                    مسح المدة
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="export-actions">
                <button
                  className="btn-primary"
                  onClick={handleExport}
                  disabled={exportPreviewCount === 0}
                  style={{ flex: 2, justifyContent: 'center', gap: '8px', opacity: exportPreviewCount === 0 ? 0.5 : 1 }}
                >
                  <Download size={16} />
                  تصدير Excel
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setIsExportOpen(false)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ActivityForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          onAddActivity(data);
          setIsModalOpen(false);
        }}
        stores={stores}
        outcomes={outcomes}
        merchantHistory={[]}
      />

      <style>{`
        /* ── Export Modal ── */
        .export-modal {
          width: 90%; max-width: 480px;
          padding: 1.75rem;
          border-radius: 24px;
          background: var(--surface-color);
          border: 1px solid var(--border-color);
        }
        .export-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.5rem;
        }
        .export-close-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--surface-hover); color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border-color); cursor: pointer; transition: 0.2s;
          flex-shrink: 0;
        }
        .export-close-btn:hover { background: #fee2e2; color: var(--danger); }

        .export-presets {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-bottom: 1.5rem;
        }
        .preset-chip {
          padding: 8px 16px; border-radius: 50px;
          background: var(--surface-hover);
          border: 1px solid var(--border-color);
          font-size: 0.8rem; font-weight: 600;
          color: var(--text-secondary); cursor: pointer;
          transition: all 0.2s; min-height: 36px;
        }
        .preset-chip:hover {
          background: var(--primary-light);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .export-date-row {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 1.25rem;
        }
        .export-date-group {
          flex: 1; display: flex; flex-direction: column; gap: 6px;
        }
        .export-date-group label {
          font-size: 0.75rem; font-weight: 700;
          color: var(--text-secondary); letter-spacing: 0.03em;
        }
        .export-date-group input[type="date"] {
          width: 100%; padding: 0.7rem 0.875rem;
          border-radius: 12px; font-size: 0.875rem;
          border: 1px solid var(--border-color);
          background: var(--surface-hover);
          color: var(--text-primary);
        }
        .export-date-group input[type="date"]:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
          outline: none;
        }
        .export-date-sep {
          color: var(--text-dim); font-weight: 700; margin-top: 22px;
          flex-shrink: 0;
        }

        .export-preview {
          display: flex; align-items: center; gap: 10px;
          padding: 0.875rem 1rem;
          background: var(--primary-light);
          border: 1px solid rgba(79,70,229,0.15);
          border-radius: 12px;
          margin-bottom: 1.25rem;
        }
        .export-count {
          font-size: 1.4rem; font-weight: 800;
          color: var(--primary-color); line-height: 1;
        }
        .clear-range-btn {
          margin-left: auto; font-size: 0.75rem; font-weight: 600;
          color: var(--text-dim); background: none; border: none;
          cursor: pointer; text-decoration: underline; padding: 4px;
          min-height: unset;
        }
        .clear-range-btn:hover { color: var(--danger); }

        .export-actions {
          display: flex; gap: 10px;
        }

        @media (max-width: 480px) {
          .export-modal { padding: 1.25rem; }
          .export-date-row { flex-direction: column; gap: 1rem; }
          .export-date-sep { display: none; }
          .export-actions { flex-direction: column-reverse; }
          .export-actions .btn-primary,
          .export-actions .btn-secondary { flex: unset; width: 100%; }
        }

        /* ── Activity Log ── */
        .activity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header-actions { display: flex; gap: 0.75rem; }
        .filters-grid { display: grid; grid-template-columns: 1fr 200px; gap: 1rem; margin-bottom: 1.5rem; }
        
        .al-wrap .desktop-only { display: flex !important; }
        .al-wrap .mobile-only { display: none !important; }

        .logs-list { display: flex; flex-direction: column; gap: 1rem; }
        .log-card { padding: 1.25rem; border: 1px solid var(--border-color); position: relative; }
        .card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; }
        .time-badge { font-size: 0.75rem; color: var(--text-dim); flex: 1; }
        .card-main .store-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
        .outcome-tag { display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; background: var(--primary-light); color: var(--primary-color); font-weight: 600; margin-bottom: 12px; }
        .log-notes { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4; }
        .overdue-text { color: var(--danger); font-weight: 800; }
        .card-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
        .follow-up { font-size: 0.8rem; color: var(--warning); display: flex; align-items: center; gap: 4px; font-weight: 600; }

        .bulk-actions-bar { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); z-index: 1000; background: var(--primary-color); color: white; padding: 0.75rem 1.5rem; border-radius: 100px; display: flex; align-items: center; gap: 1.5rem; box-shadow: var(--shadow-lg); }
        .btn-primary.light { background: white; color: var(--primary-color); padding: 8px 16px; border-radius: 50px; font-weight: 700; font-size: 0.85rem; }
        .btn-secondary.dark { background: rgba(255,255,255,0.15); color: white; border: none; padding: 8px 16px; border-radius: 50px; font-size: 0.85rem; }

        @media (max-width: 768px) {
          .activity-header { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
          .header-actions { width: 100%; justify-content: flex-end; }
          .filters-grid { grid-template-columns: 1fr; gap: 0.75rem; }
          .al-wrap .desktop-only { display: none !important; }
          .al-wrap .mobile-only { display: flex !important; }
          .bulk-actions-bar { width: 90%; justify-content: space-between; padding: 0.75rem 1rem; bottom: 1rem; }
          .bulk-actions-bar .selected-count { font-size: 0.8rem; }
          .action-buttons { display: flex; gap: 8px; }
          .log-card { padding: 1rem; }
          .card-main .store-name { font-size: 1rem; }
        }

        @media (max-width: 480px) {
          .card-bottom { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
          .card-bottom .btn-primary { width: 100%; justify-content: center; }
          .bulk-actions-bar { bottom: 0.75rem; left: 0.75rem; right: 0.75rem; transform: none; width: auto; border-radius: 16px; }
        }
      `}</style>
    </div>
  );
};


export default ActivityLog;
