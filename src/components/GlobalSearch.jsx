import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Store, ClipboardList, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalSearch = ({ isOpen, onClose, stores, activities, outcomes = [], onSelectStore }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState({ stores: [], activities: [] });
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  // Debounce query by 250ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(false);
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults({ stores: [], activities: [] });
      return;
    }

    const q = debouncedQuery.toLowerCase();
    const filteredStores = stores.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.owner_name?.toLowerCase().includes(q)
    ).slice(0, 5);

    const filteredActivities = activities.filter(a =>
      (a.notes || '').toLowerCase().includes(q) ||
      a.id.toString().includes(q)
    ).slice(0, 5);

    setResults({ stores: filteredStores, activities: filteredActivities });
  }, [debouncedQuery, stores, activities]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
      <motion.div 
        className="glass-card" 
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ 
          width: '90%', 
          maxWidth: '600px', 
          padding: '0', 
          overflow: 'hidden',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
        }}
      >
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Search size={22} color="var(--primary-color)" />
          <input
            ref={inputRef}
            type="text"
            role="searchbox"
            aria-label="Search for restaurants, activities, or owners"
            placeholder="Search for restaurants, activities, or owners..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flexGrow: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '1.125rem',
              outline: 'none',
              padding: '0.5rem 0',
              color: 'var(--text-primary)'
            }}
          />
          <button onClick={onClose} aria-label="Close search" style={{ background: 'var(--surface-hover)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--text-dim)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ maxHeight: '450px', overflowY: 'auto', padding: '1rem' }}>
          {!query && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              <p style={{ fontSize: '0.875rem' }}>Start typing to search across the registry...</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Store size={14} /> Restaurants</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ClipboardList size={14} /> Activities</span>
              </div>
            </div>
          )}

          {query && results.stores.length === 0 && results.activities.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              <p>No results found for "{query}"</p>
            </div>
          )}

          {results.stores.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>Restaurants</h4>
              {results.stores.map(store => (
                <div 
                  key={store.id} 
                  className="table-row-hover"
                  onClick={() => { onSelectStore(store.id); onClose(); }}
                  style={{ 
                    padding: '0.875rem', 
                    borderRadius: '12px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '10px', color: 'var(--primary-color)' }}>
                      <Store size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{store.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {store.id} • {store.owner_name}</div>
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--text-dim)" />
                </div>
              ))}
            </div>
          )}

          {results.activities.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>Activities & Logs</h4>
              {results.activities.map(act => (
                <div 
                  key={act.id} 
                  className="table-row-hover"
                  style={{ 
                    padding: '0.875rem', 
                    borderRadius: '12px', 
                    cursor: 'default', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{ background: 'var(--surface-hover)', padding: '8px', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                    <ClipboardList size={18} />
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{act.notes.substring(0, 60)}{act.notes.length > 60 ? '...' : ''}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{new Date(act.created_at).toLocaleDateString()} • {outcomes.find(o => o.id === act.outcome_id)?.name || 'Activity'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '0.75rem 1.25rem', background: 'var(--surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            <span style={{ background: 'var(--card-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>ESC</span> to close
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            <span style={{ background: 'var(--card-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>↵</span> to select
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GlobalSearch;
