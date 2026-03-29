import React, { useState, useRef, useMemo } from 'react';
import { Plus, Search, MapPin, Phone, User, Activity, FileDown, FileUp, Loader2, Pencil, X, Layers, Globe, Compass, ExternalLink, Trash2, Info, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import StoreProfile from './StoreProfile';

const StoreList = ({ stores, activities, outcomes, categories, zones, selectedStoreId, onSelectStore, onAddStore, onUpdateStore, onToggleStatus, onDeleteStore, onBulkAdd, onNotify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  
  const [newStore, setNewStore] = useState({ id: '', name: '', category: '', owner_name: '', phone: '', zone: '', area: '', address: '', map_link: '' });
  const [editingStore, setEditingStore] = useState(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredStores = useMemo(() =>
    stores.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                           s.id.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = !filterCategory || s.category === filterCategory;
      const matchesZone = !filterZone || s.zone === filterZone;
      return matchesSearch && matchesCategory && matchesZone;
    }),
  [stores, debouncedSearch, filterCategory, filterZone]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const existingIds = new Set(stores.map(s => s.id));
        const duplicates = [];
        const toAdd = [];

        data.forEach(item => {
          const id = String(item.ID || item.id || '');
          const name = String(item.Name || item.name || '');
          if (!id || !name) return;

          const storeObj = {
            id,
            name,
            category: String(item.Category || item.category || ''),
            owner_name: String(item.Owner || item.owner_name || ''),
            phone: String(item.Phone || item.phone || ''),
            zone: String(item.Zone || item.zone || ''),
            area: String(item.Area || item.area || ''),
            address: String(item.Address || item.address || ''),
            map_link: String(item['Map Link'] || item.map_link || ''),
            is_active: true
          };

          if (existingIds.has(id)) {
            duplicates.push(`${id} (${name})`);
          } else {
            toAdd.push(storeObj);
          }
        });

        if (toAdd.length > 0) {
          await onBulkAdd(toAdd);
          const skipped = duplicates.length > 0 ? ` (${duplicates.length} duplicates skipped)` : '';
          onNotify?.('success', `Imported ${toAdd.length} new stores${skipped}`);
        } else if (duplicates.length > 0) {
          onNotify?.('error', `No new stores added — all ${duplicates.length} already exist.`);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Import failed:', err);
        onNotify?.('error', 'Failed to parse the Excel file. Please check the format.');
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        ID: 'REST-001',
        Name: 'The Burger Joint',
        Category: 'Burgers',
        Owner: 'John Doe',
        Phone: '+9647800000000',
        Zone: 'Baghdad',
        Area: 'Mansour',
        Address: 'Mansour Main St',
        'Map Link': 'https://maps.google.com/...'
      },
      {
        ID: 'REST-002',
        Name: 'Pizza Palace',
        Category: 'Pizza',
        Owner: 'Jane Smith',
        Phone: '+9647700000000',
        Zone: 'Baghdad',
        Area: 'Karrada',
        Address: 'Al-Hurriya St',
        'Map Link': 'https://maps.google.com/...'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StoresTemplate");
    XLSX.writeFile(wb, "Restaurant_Upload_Template.xlsx");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Duplicate check now handled in App.jsx via onAddStore
    onAddStore(newStore);
    setNewStore({ id: '', name: '', category: '', owner_name: '', phone: '', zone: '', area: '', address: '', map_link: '' });
    setIsModalOpen(false);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    onUpdateStore(editingStore.id, editingStore);
    setIsEditModalOpen(false);
    setEditingStore(null);
  };

  const openEditModal = (store) => {
    setEditingStore(store);
    setIsEditModalOpen(true);
  };

  return (
    <div className="section-container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <AnimatePresence mode="wait">
        {!selectedStoreId ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="section-header" style={{ marginBottom: '2rem' }}>
              <div>
                <h2 className="gradient-text">Restaurant Directory</h2>
                <p className="stat-label">Manage your partner stores and details</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-secondary" onClick={handleDownloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileDown size={18} /> Template
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
                <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={isImporting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isImporting ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />} Import
                </button>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                  <Plus size={18} style={{ marginRight: '8px' }} /> Add Store
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Search size={20} color="var(--text-dim)" />
                <input 
                  type="text" 
                  placeholder="Search stores by ID or name..." 
                  style={{ border: 'none', boxShadow: 'none', width: '100%', fontSize: '1rem', padding: '0.5rem 0', background: 'transparent', outline: 'none', color: 'var(--text-primary)' }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select 
                className="glass-card" 
                style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: '14px', minWidth: '160px', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>

              <select 
                className="glass-card" 
                style={{ padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: '14px', minWidth: '160px', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
                value={filterZone}
                onChange={e => setFilterZone(e.target.value)}
              >
                <option value="">All Zones</option>
                {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
              </select>
            </div>

            <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
              {filteredStores.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--surface-hover)' }}>
                      <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>ID</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Store & Category</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Owner Info</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '0.875rem' }}>
                    {filteredStores.map((store) => (
                      <tr key={store.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                        <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'monospace' }}>#{store.id}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{store.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Layers size={10} /> {store.category}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 600 }}>{store.owner_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{store.phone}</div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`badge ${store.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {store.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn-secondary" style={{ padding: '8px' }} aria-label={`Edit ${store.name}`} onClick={() => openEditModal(store)}>
                              <Pencil size={18} />
                            </button>
                            <button className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} aria-label={`Open dashboard for ${store.name}`} onClick={() => onSelectStore(store.id)}>
                              <Info size={16} /> Open Dashboard
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', padding: '1.5rem', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
                    <Store size={48} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No restaurants found</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
                    {debouncedSearch || filterCategory || filterZone 
                      ? "Try adjusting your filters to find what you're looking for." 
                      : "Start building your registry by adding your first partner restaurant."}
                  </p>
                  {!debouncedSearch && !filterCategory && !filterZone && (
                     <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Add Your First Store
                     </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="profile" 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {stores.find(s => s.id === selectedStoreId) ? (
              <StoreProfile 
                store={stores.find(s => s.id === selectedStoreId)} 
                activities={activities} 
                outcomes={outcomes} 
                onClose={() => onSelectStore(null)}
                onUpdate={onUpdateStore}
              />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Loader2 size={32} className="animate-spin" />
                <p>Loading profile...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <motion.div className="glass-card modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Add New Restaurant</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label>Store ID</label><input required placeholder="REST-101" value={newStore.id} onChange={e => setNewStore({...newStore, id: e.target.value})} /></div>
                <div className="form-group"><label>Store Name</label><input required placeholder="Name" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select required value={newStore.category} onChange={e => setNewStore({...newStore, category: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Owner Name</label><input required placeholder="Owner" value={newStore.owner_name} onChange={e => setNewStore({...newStore, owner_name: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label>Phone Number</label><input required placeholder="+964..." value={newStore.phone} onChange={e => setNewStore({...newStore, phone: e.target.value})} /></div>
                <div className="form-group">
                  <label>Zone</label>
                  <select required value={newStore.zone} onChange={e => setNewStore({...newStore, zone: e.target.value})}>
                    <option value="">Select Zone</option>
                    {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Physical Address</label><textarea rows="1" placeholder="Address" value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flexGrow: 1 }}>Register Restaurant</button>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isEditModalOpen && editingStore && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <motion.div className="glass-card modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Edit: {editingStore.name}</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label>Store ID (Read-only)</label><input disabled value={editingStore.id} /></div>
                <div className="form-group"><label>Store Name</label><input required value={editingStore.name} onChange={e => setEditingStore({...editingStore, name: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select value={editingStore.category} onChange={e => setEditingStore({...editingStore, category: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Owner Name</label><input value={editingStore.owner_name} onChange={e => setEditingStore({...editingStore, owner_name: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Physical Address</label><textarea rows="1" value={editingStore.address} onChange={e => setEditingStore({...editingStore, address: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flexGrow: 1 }}>Update Details</button>
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StoreList;
