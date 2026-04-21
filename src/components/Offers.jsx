import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, X, CheckCircle, Clock, AlertCircle, Gift, Store, Users, BarChart3, Check, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY_FORM = { title: '', description: '' };

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, color, subLabel }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card"
    style={{
      padding: '1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      borderBottom: `3px solid ${color}`,
    }}
  >
    <div style={{
      width: '44px', height: '44px', borderRadius: '12px',
      background: color + '14', color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={21} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', marginTop: '2px' }}>{label}</div>
      {subLabel && <div style={{ fontSize: '0.68rem', fontWeight: 600, color, marginTop: '2px' }}>{subLabel}</div>}
    </div>
  </motion.div>
);

// ── Assign Offers to Store Modal ──────────────────────────────────────────────
const AssignOffersModal = ({ stores, offers, storeOffers, onSave, onClose, initialStore }) => {
  const [step, setStep] = useState(initialStore ? 2 : 1);
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState(initialStore || null);
  const [selectedOfferIds, setSelectedOfferIds] = useState(() => {
    if (initialStore) {
      const existing = storeOffers
        .filter(so => so.store_id === initialStore.id)
        .map(so => so.offer_id);
      return new Set(existing);
    }
    return new Set();
  });

  const filteredStores = useMemo(() => {
    const q = search.toLowerCase();
    return stores.filter(s =>
      s.is_active && !s.deleted_at &&
      (!q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    );
  }, [stores, search]);

  const handleSelectStore = (store) => {
    setSelectedStore(store);
    // Pre-select already assigned offers for this store
    const existing = storeOffers
      .filter(so => so.store_id === store.id)
      .map(so => so.offer_id);
    setSelectedOfferIds(new Set(existing));
    setStep(2);
  };

  const toggleOffer = (id) => {
    setSelectedOfferIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const activeOffers = useMemo(() =>
    offers.filter(o => o.is_active !== false),
  [offers]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', padding: '1rem' }}>
      <motion.div
        className="glass-card"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        style={{ padding: 0, width: '100%', maxWidth: '550px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '3px solid var(--primary-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.1rem' }}>
              {step === 1 ? 'Select Store' : `Offers: ${selectedStore?.name}`}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {step === 1 ? 'Search and select the desired store' : 'Select offers to add'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {step === 2 && (
              <button
                onClick={() => { setStep(1); setSelectedStore(null); setSearch(''); }}
                style={{
                  padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                  border: '1px solid var(--border-color)', background: 'var(--surface-hover)',
                  cursor: 'pointer', color: 'var(--text-dim)',
                }}
              >← Back</button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {step === 1 ? (
          <>
            {/* Search */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%', padding: '0.65rem 2rem 0.65rem 0.75rem', borderRadius: '10px',
                    border: '1px solid var(--border-color)', background: 'var(--surface-hover)',
                    textAlign: 'left', fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            {/* Store list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1.5rem 1rem' }}>
              {filteredStores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
                  <Store size={36} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.9rem' }}>No results found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredStores.map(s => {
                    const assignedCount = storeOffers.filter(so => so.store_id === s.id).length;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStore(s)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '0.75rem 0.875rem', borderRadius: '10px',
                          cursor: 'pointer', transition: 'all 0.15s',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: 'var(--primary-light)', color: 'var(--primary-color)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: '0.75rem', flexShrink: 0,
                        }}>
                          {s.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{s.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>#{s.id} • {s.zone || 'No Zone'}</div>
                        </div>
                        {assignedCount > 0 && (
                          <span style={{
                            padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800,
                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                          }}>
                            {assignedCount} offers
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Offers list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
              {activeOffers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
                  <Gift size={36} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.9rem' }}>No offers found — add an offer first</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeOffers.map(o => {
                    const isSelected = selectedOfferIds.has(o.id);
                    return (
                      <div
                        key={o.id}
                        onClick={() => toggleOffer(o.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '0.75rem 0.875rem', borderRadius: '10px',
                          cursor: 'pointer', transition: 'all 0.15s',
                          background: isSelected ? 'rgba(79,70,229,0.06)' : 'transparent',
                          border: `1px solid ${isSelected ? 'rgba(79,70,229,0.3)' : 'transparent'}`,
                        }}
                      >
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '6px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          background: isSelected ? 'var(--primary-color)' : 'transparent',
                          transition: 'all 0.15s', flexShrink: 0,
                        }}>
                          {isSelected && <Check size={13} color="white" strokeWidth={3} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{o.title}</div>
                          {o.description && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, marginTop: '2px', lineHeight: 1.4 }}>
                              {o.description.length > 80 ? o.description.slice(0, 80) + '…' : o.description}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)',
              display: 'flex', gap: '10px',
            }}>
              <button
                className="btn-primary"
                style={{ flex: 2, padding: '0.8rem', justifyContent: 'center' }}
                onClick={() => onSave(selectedStore.id, [...selectedOfferIds])}
                disabled={activeOffers.length === 0}
              >
                Save ({selectedOfferIds.size} offers)
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// ── Store Offer Row (in the store list) ───────────────────────────────────────
const StoreOfferRow = ({ store, assignedOffers, onEdit, onRemoveOffer }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass-card"
      style={{ padding: 0, overflow: 'hidden' }}
    >
      {/* Main row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '1rem 1.25rem', cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(v => !v)}
      >
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'var(--primary-light)', color: 'var(--primary-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '0.8rem', flexShrink: 0,
        }}>
          {store.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{store.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            #{store.id} • {store.zone || ''} • {store.category || ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{
            padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800,
            background: 'rgba(79,70,229,0.08)', color: 'var(--primary-color)',
          }}>
            {assignedOffers.length} offers
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(store); }}
            style={{
              padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'var(--surface-hover)', color: 'var(--text-dim)', cursor: 'pointer',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            title="Edit Offers"
          >
            <Pencil size={14} />
          </button>
          {isExpanded ? <ChevronUp size={16} color="var(--text-dim)" /> : <ChevronDown size={16} color="var(--text-dim)" />}
        </div>
      </div>

      {/* Expanded offer list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 1.25rem 1rem', display: 'flex', gap: '6px', flexWrap: 'wrap',
              borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem',
            }}>
              {assignedOffers.map(off => (
                <div
                  key={off.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 10px', borderRadius: '8px',
                    background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)',
                    fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-color)',
                  }}
                >
                  <Gift size={12} />
                  <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{off.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveOffer(store.id, off.id); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--danger)', padding: '0', display: 'flex', alignItems: 'center',
                      opacity: 0.5, transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                    title="Remove Offer"
                  >
                    <X size={13} strokeWidth={3} />
                  </button>
                </div>
              ))}
              {assignedOffers.length === 0 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>No linked offers</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


// ── Offer Stores Modal ────────────────────────────────────────────────────────
const OfferStoresModal = ({ offer, storeOffers, stores, onClose }) => {
  const assignedStores = useMemo(() => {
    const storeIds = new Set(storeOffers.filter(so => so.offer_id === offer.id).map(so => so.store_id));
    return stores.filter(s => storeIds.has(s.id));
  }, [offer, storeOffers, stores]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', padding: '1rem' }}>
      <motion.div
        className="glass-card"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        style={{ padding: 0, width: '100%', maxWidth: '450px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '3px solid var(--primary-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.1rem' }}> Linked Stores </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}> {offer.title} </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {assignedStores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)' }}>
              <p>No stores currently linked to this offer.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {assignedStores.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem', borderRadius: '8px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem' }}>
                     {s.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{s.name}</div>
                     <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>#{s.id}</div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Offers = ({ offers, stores = [], storeOffers = [], onAddOffer, onUpdateOffer, onDeleteOffer, onAssignOffer, onBulkAssign, onUnassignOffer }) => {
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [editStore, setEditStore] = useState(null); // store object to edit offers for
  const [form, setForm] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchStoreList, setSearchStoreList] = useState('');
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [viewStoresOffer, setViewStoresOffer] = useState(null);

  // ── Derived data ──────────────────────────────────────────────────────────
  const offerById = useMemo(() => {
    const m = new Map();
    for (const o of offers) m.set(o.id, o);
    return m;
  }, [offers]);

  const activeStores = useMemo(() =>
    stores.filter(s => s.is_active && !s.deleted_at),
  [stores]);

  // Stores that have at least one offer
  const storesWithOffersList = useMemo(() => {
    const storeIdSet = new Set(storeOffers.map(so => so.store_id));
    return activeStores.filter(s => storeIdSet.has(s.id));
  }, [storeOffers, activeStores]);

  const storesWithoutOffersCount = useMemo(() =>
    activeStores.length - storesWithOffersList.length,
  [activeStores, storesWithOffersList]);

  const getAssignedOffers = (storeId) => {
    const offerIds = storeOffers.filter(so => so.store_id === storeId).map(so => so.offer_id);
    return offerIds.map(id => offerById.get(id)).filter(Boolean);
  };

  // filtered store list
  const filteredStoresList = useMemo(() => {
    const q = searchStoreList.toLowerCase();
    if (!q) return storesWithOffersList;
    return storesWithOffersList.filter(s =>
      s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [storesWithOffersList, searchStoreList]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openAddOffer = (offer = null) => {
    if (offer) {
      setIsEditing(true);
      setEditId(offer.id);
      setForm({ title: offer.title || '', description: offer.description || '' });
    } else {
      setIsEditing(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    }
    setIsAddOfferOpen(true);
  };

  const handleSubmitOffer = (e) => {
    e.preventDefault();
    if (isEditing) {
      onUpdateOffer(editId, form);
    } else {
      onAddOffer({ ...form, is_active: true });
    }
    setIsAddOfferOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleAssignSave = (storeId, offerIds) => {
    const currentAssigned = storeOffers.filter(so => so.store_id === storeId).map(so => so.offer_id);
    const toRemove = currentAssigned.filter(id => !offerIds.includes(id));
    const toAdd = offerIds.filter(id => !currentAssigned.includes(id));

    // Remove unselected offers
    for (const oid of toRemove) {
      if (onUnassignOffer) onUnassignOffer(storeId, oid);
    }
    // Add newly selected offers
    for (const oid of toAdd) {
      if (onAssignOffer) {
        onAssignOffer(storeId, oid);
      } else {
        onBulkAssign([storeId], oid);
      }
    }

    setIsAssignOpen(false);
    setEditStore(null);
  };

  const handleEditStore = (store) => {
    setEditStore(store);
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="gradient-text">Offers Directory</h2>
          <p className="stat-label">Manage offers and link them to stores</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => openAddOffer()}>
            <Plus size={16} /> Add New Offer
          </button>
          <button className="btn-primary" onClick={() => setIsAssignOpen(true)}>
            <Gift size={16} /> Assign Offer to Store
          </button>
        </div>
      </div>

      {/* ── KPI Indicators ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem',
      }}>
        <KpiCard
          icon={Gift}
          label="Total Offers"
          value={offers.length}
          color="#8b5cf6"
        />
        <KpiCard
          icon={CheckCircle}
          label="Stores with Offers"
          value={storesWithOffersList.length}
          color="#3b82f6"
          subLabel={`from ${activeStores.length} active stores`}
        />
        <KpiCard
          icon={AlertCircle}
          label="Stores without Offers"
          value={storesWithoutOffersCount}
          color={storesWithoutOffersCount > 0 ? '#ef4444' : '#10b981'}
          subLabel={storesWithoutOffersCount === 0 ? 'All stores covered ✅' : 'Needs Activation'}
        />
      </div>

      {/* ── Available Offers Section ───────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAllOffers ? '1rem' : 0 }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={15} /> Currently Available Offers ({offers.length})
          </h4>
          <button
            onClick={() => setShowAllOffers(v => !v)}
            style={{
              padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
              border: '1px solid var(--border-color)', background: 'var(--surface-hover)',
              cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            {showAllOffers ? 'Hide' : 'Show All'}
            {showAllOffers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <AnimatePresence>
          {showAllOffers && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              {offers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  <p>No offers found — add your first offer</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {offers.map(o => {
                    const storeCount = storeOffers.filter(so => so.offer_id === o.id).length;
                    return (
                      <div
                        key={o.id}
                        onClick={() => setViewStoresOffer(o)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '0.65rem 0.875rem', borderRadius: '10px',
                          background: 'var(--surface-hover)', border: '1px solid transparent',
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                      >
                        <Gift size={14} color="var(--primary-color)" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{o.title}</div>
                          {o.description && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, marginTop: '2px' }}>
                              {o.description.length > 100 ? o.description.slice(0, 100) + '…' : o.description}
                            </div>
                          )}
                        </div>
                        <span style={{
                          padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800,
                          background: storeCount > 0 ? 'rgba(59,130,246,0.1)' : 'var(--surface-hover)',
                          color: storeCount > 0 ? '#3b82f6' : 'var(--text-dim)',
                        }}>
                          {storeCount} stores
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); openAddOffer(o); }}
                            style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer' }}
                            title="Edit"
                          ><Edit2 size={13} /></button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteOffer(o.id); }}
                            style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}
                            title="Delete"
                          ><Trash2 size={13} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stores with Offers List ────────────────────────────────────────── */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Stores Linked to Offers ({storesWithOffersList.length})
          </h3>
        </div>

        {storesWithOffersList.length > 0 && (
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search linked stores..."
              className="glass-card"
              style={{ width: '100%', padding: '0.7rem 2.2rem 0.7rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'left', fontSize: '0.85rem' }}
              value={searchStoreList}
              onChange={e => setSearchStoreList(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {filteredStoresList.map(store => (
              <StoreOfferRow
                key={store.id}
                store={store}
                assignedOffers={getAssignedOffers(store.id)}
                onEdit={handleEditStore}
                onRemoveOffer={onUnassignOffer}
              />
            ))}
          </AnimatePresence>

          {storesWithOffersList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-dim)' }}>
              <Store size={48} style={{ marginBottom: '1rem', opacity: 0.15 }} />
              <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>No stores linked to offers found</p>
              <button className="btn-primary" onClick={() => setIsAssignOpen(true)}>
                <Gift size={16} /> Assign Offer to Store
              </button>
            </div>
          )}

          {filteredStoresList.length === 0 && storesWithOffersList.length > 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
              <p>No search results</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add/Edit Offer Modal (simplified) ──────────────────────────────── */}
      <AnimatePresence>
        {isAddOfferOpen && (
          <div className="modal-overlay" onClick={() => setIsAddOfferOpen(false)} style={{ alignItems: 'center', padding: '1rem' }}>
            <motion.div
              className="glass-card"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              style={{ padding: '2rem', width: '100%', maxWidth: '480px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.15rem' }}>
                  {isEditing ? 'Edit Offer' : 'Add New Offer'}
                </h2>
                <button onClick={() => setIsAddOfferOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmitOffer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Offer Title *</label>
                  <input
                    type="text" required autoFocus
                    placeholder="e.g., Take, Multi Juice, 20% Discount..."
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Offer Description</label>
                  <textarea
                    placeholder="Short description of the offer..."
                    rows={3}
                    style={{
                      width: '100%', padding: '0.875rem', borderRadius: '12px',
                      background: 'var(--surface-hover)', border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)', resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit',
                    }}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.9rem', justifyContent: 'center' }}>
                    {isEditing ? 'Save Changes' : 'Add Offer'}
                  </button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddOfferOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Assign Offers to Store Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {(isAssignOpen || editStore) && (
          <AssignOffersModal
            stores={editStore ? [editStore] : activeStores}
            offers={offers}
            storeOffers={storeOffers}
            onSave={handleAssignSave}
            onClose={() => { setIsAssignOpen(false); setEditStore(null); }}
            initialStore={editStore}
          />
        )}
      </AnimatePresence>

      {/* ── View Stores per Offer Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {viewStoresOffer && (
          <OfferStoresModal
            offer={viewStoresOffer}
            stores={activeStores}
            storeOffers={storeOffers}
            onClose={() => setViewStoresOffer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Offers;
