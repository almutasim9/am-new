import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, ChevronDown, ChevronUp, X, CheckCircle, Clock, AlertCircle, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const CATEGORIES = ['خصم على التوصيل', 'خصم على الطلب', 'كاشباك', 'عرض مجاني', 'عرض خاص', 'عام'];

const CATEGORY_COLORS = {
  'خصم على التوصيل': '#3b82f6',
  'خصم على الطلب':   '#8b5cf6',
  'كاشباك':          '#10b981',
  'عرض مجاني':       '#f59e0b',
  'عرض خاص':         '#ec4899',
  'عام':             '#6b7280',
};

const getCategoryColor = (cat) => CATEGORY_COLORS[cat] || '#6b7280';

const EMPTY_FORM = {
  title: '',
  description: '',
  how_to_activate: '',
  category: 'عام',
  start_date: '',
  end_date: '',
  is_active: true,
};

// ── Activation Steps ──────────────────────────────────────────────────────────
const ActivationSteps = ({ text }) => {
  if (!text) return <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.85rem' }}>لا توجد تعليمات</p>;
  const lines = text.split('\n').filter(l => l.trim());
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lines.map((line, i) => (
        <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{
            minWidth: '22px', height: '22px', borderRadius: '50%',
            background: 'var(--primary-color)', color: 'white',
            fontSize: '0.7rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: '1px',
          }}>{i + 1}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{line}</span>
        </li>
      ))}
    </ol>
  );
};

// ── Offer Card ────────────────────────────────────────────────────────────────
const OfferCard = ({ offer, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const color = getCategoryColor(offer.category);

  const isExpired = offer.end_date && new Date(offer.end_date) < new Date();
  const statusLabel = !offer.is_active || isExpired ? 'منتهي' : 'نشط';
  const statusColor = !offer.is_active || isExpired ? 'var(--text-dim)' : 'var(--success)';
  const statusBg    = !offer.is_active || isExpired ? 'var(--surface-hover)' : 'rgba(16,185,129,0.1)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass-card"
      style={{
        padding: 0, overflow: 'hidden',
        borderTop: `3px solid ${color}`,
        display: 'flex', flexDirection: 'column',
        opacity: (!offer.is_active || isExpired) ? 0.7 : 1,
      }}
    >
      {/* Card Header */}
      <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
              {offer.title}
            </h3>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                padding: '2px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                background: color + '18', color, border: `1px solid ${color}40`,
              }}>
                <Tag size={10} style={{ display: 'inline', marginLeft: '3px', verticalAlign: 'middle' }} />
                {offer.category || 'عام'}
              </span>
              <span style={{
                padding: '2px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                background: statusBg, color: statusColor,
              }}>
                {statusLabel === 'نشط' ? <CheckCircle size={10} style={{ display: 'inline', marginLeft: '3px', verticalAlign: 'middle' }} /> : <Clock size={10} style={{ display: 'inline', marginLeft: '3px', verticalAlign: 'middle' }} />}
                {statusLabel}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => onEdit(offer)}
              style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--surface-hover)', color: 'var(--text-dim)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            ><Edit2 size={14} /></button>
            <button
              onClick={() => onDelete(offer.id)}
              style={{ padding: '6px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: 'var(--danger)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = 'var(--danger)'; }}
            ><Trash2 size={14} /></button>
          </div>
        </div>

        {offer.description && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '10px' }}>
            {offer.description}
          </p>
        )}

        {(offer.start_date || offer.end_date) && (
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            {offer.start_date && <span>📅 من: {format(new Date(offer.start_date), 'yyyy/MM/dd')}</span>}
            {offer.end_date   && <span>⏳ حتى: {format(new Date(offer.end_date), 'yyyy/MM/dd')}</span>}
          </div>
        )}
      </div>

      {/* Activation toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 1.25rem', background: color + '0d', border: 'none',
          borderTop: `1px solid ${color}25`, cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = color + '1a'}
        onMouseLeave={e => e.currentTarget.style.background = color + '0d'}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>
          🔑 طريقة التفعيل
        </span>
        {expanded ? <ChevronUp size={15} color={color} /> : <ChevronDown size={15} color={color} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '1rem 1.25rem 1.25rem', borderTop: `1px solid ${color}15` }}>
              <ActivationSteps text={offer.how_to_activate} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Offers = ({ offers, onAddOffer, onUpdateOffer, onDeleteOffer }) => {
  const [searchTerm,    setSearchTerm]    = useState('');
  const [filterCat,     setFilterCat]     = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [isEditing,     setIsEditing]     = useState(false);
  const [editId,        setEditId]        = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);

  const filtered = useMemo(() => {
    return offers.filter(o => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        o.title.toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q) ||
        (o.how_to_activate || '').toLowerCase().includes(q);

      const isExpired = o.end_date && new Date(o.end_date) < new Date();
      const active = o.is_active && !isExpired;
      const matchStatus = !filterStatus ||
        (filterStatus === 'active'   &&  active) ||
        (filterStatus === 'inactive' && !active);

      const matchCat = !filterCat || o.category === filterCat;

      return matchSearch && matchStatus && matchCat;
    });
  }, [offers, searchTerm, filterCat, filterStatus]);

  const openModal = (offer = null) => {
    if (offer) {
      setIsEditing(true);
      setEditId(offer.id);
      setForm({
        title:           offer.title || '',
        description:     offer.description || '',
        how_to_activate: offer.how_to_activate || '',
        category:        offer.category || 'عام',
        start_date:      offer.start_date || '',
        end_date:        offer.end_date || '',
        is_active:       offer.is_active ?? true,
      });
    } else {
      setIsEditing(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      start_date: form.start_date || null,
      end_date:   form.end_date   || null,
    };
    if (isEditing) {
      onUpdateOffer(editId, payload);
    } else {
      onAddOffer(payload);
    }
    setIsModalOpen(false);
  };

  const activeCount   = offers.filter(o => o.is_active && !(o.end_date && new Date(o.end_date) < new Date())).length;
  const expiredCount  = offers.length - activeCount;

  return (
    <div className="section-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="gradient-text">دليل العروض</h2>
          <p className="stat-label">جميع العروض المتاحة مع طريقة التفعيل لكل عرض</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: '999px' }}>
              ✅ {activeCount} نشط
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', background: 'var(--surface-hover)', padding: '3px 10px', borderRadius: '999px' }}>
              ⏳ {expiredCount} منتهي
            </span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          <Plus size={17} /> إضافة عرض جديد
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="بحث في العروض..."
            className="glass-card"
            style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'right' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="glass-card"
          style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', flex: '0 1 160px' }}
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          <option value="">كل الفئات</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="glass-card"
          style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', flex: '0 1 140px' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط فقط</option>
          <option value="inactive">منتهي فقط</option>
        </select>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%), 1fr))', gap: '1.25rem' }}>
        <AnimatePresence>
          {filtered.map(offer => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onEdit={openModal}
              onDelete={onDeleteOffer}
            />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-dim)' }}>
            <Gift size={56} style={{ marginBottom: '1rem', opacity: 0.2 }} />
            {searchTerm || filterCat || filterStatus ? (
              <p style={{ fontSize: '1rem' }}>لا توجد نتائج — جرب فلتر مختلف</p>
            ) : (
              <>
                <p style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>لا توجد عروض بعد — أضف أول عرض</p>
                <button className="btn-primary" onClick={() => openModal()}>
                  <Plus size={17} /> إضافة عرض
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsModalOpen(false)}
            style={{ alignItems: 'center', padding: '1rem' }}
          >
            <motion.div
              className="glass-card"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              style={{ padding: '2rem', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.2rem' }}>
                  {isEditing ? 'تعديل العرض' : 'إضافة عرض جديد'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Title */}
                <div className="form-group">
                  <label>اسم العرض *</label>
                  <input
                    type="text" required
                    placeholder="مثال: خصم 20% على التوصيل لمدة أسبوع"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>

                {/* Category + Status row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>الفئة</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>الحالة</label>
                    <select
                      value={form.is_active ? 'active' : 'inactive'}
                      onChange={e => setForm(p => ({ ...p, is_active: e.target.value === 'active' }))}
                    >
                      <option value="active">✅ نشط</option>
                      <option value="inactive">⏳ منتهي</option>
                    </select>
                  </div>
                </div>

                {/* Dates row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>تاريخ البداية (اختياري)</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>تاريخ الانتهاء (اختياري)</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>وصف مختصر</label>
                  <textarea
                    placeholder="اكتب وصفاً مختصراً عن العرض..."
                    rows={2}
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'vertical', lineHeight: 1.5 }}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                {/* How to activate */}
                <div className="form-group">
                  <label>🔑 طريقة التفعيل (كل خطوة في سطر)</label>
                  <textarea
                    placeholder={`مثال:\nاتصل بالمتجر وأخبره بالعرض\nأدخل الكود PROMO20 عند الطلب\nتأكد من أن الطلب أكثر من 10,000 دينار`}
                    rows={5}
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
                    value={form.how_to_activate}
                    onChange={e => setForm(p => ({ ...p, how_to_activate: e.target.value }))}
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    كل سطر سيظهر كخطوة منفصلة مرقّمة
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.9rem', justifyContent: 'center' }}>
                    {isEditing ? 'حفظ التعديلات' : 'إضافة العرض'}
                  </button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Offers;
