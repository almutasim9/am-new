import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Search, MapPin, Phone, User, Activity, FileDown, FileUp, 
  Loader2, X, Layers, Globe, Compass, ExternalLink, Trash2, 
  Info, Store, Copy, ChevronRight, MessageCircle, Smartphone,
  LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import StoreProfile from './StoreProfile';

const StoreList = ({ 
  stores, 
  activities, 
  outcomes, 
  categories, 
  zones, 
  selectedStoreId, 
  onSelectStore, 
  onAddStore, 
  onUpdateStore, 
  onToggleStatus, 
  onDeleteStore, 
  onBulkAdd, 
  onNotify, 
  onAddActivity, 
  closureReasons,
  onQuickLog
}) => {
  const PAGE_SIZE = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const fileInputRef = useRef(null);
  
  const [newStore, setNewStore] = useState({ 
    id: '', name: '', category: '', owner_name: '', 
    phone: '', zone: '', area: '', address: '', map_link: '', 
    brand_id: '' 
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredStores = useMemo(() =>
    stores.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.phone?.includes(debouncedSearch);
      const matchesCategory = !filterCategory || s.category === filterCategory;
      const matchesZone = !filterZone || s.zone === filterZone;
      const matchesStatus = filterStatus === 'all' ? true : (filterStatus === 'active' ? s.is_active !== false : s.is_active === false);
      return matchesSearch && matchesCategory && matchesZone && matchesStatus;
    }),
  [stores, debouncedSearch, filterCategory, filterZone, filterStatus]);

  const totalPages = Math.ceil(filteredStores.length / PAGE_SIZE);
  const pagedStores = filteredStores.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearchChange = (val) => { setSearchTerm(val); setCurrentPage(1); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length > 0) {
          const toProcess = data.map(item => {
            const id = String(item.ID || item.id || '');
            const name = String(item.Name || item.name || '');
            if (!id || !name) return null;

            return {
              id, name,
              category: String(item.Category || item.category || ''),
              owner_name: String(item.Owner || item.owner_name || ''),
              phone: String(item.Phone || item.phone || ''),
              zone: String(item.Zone || item.zone || ''),
              area: String(item.Area || item.area || ''),
              address: String(item.Address || item.address || ''),
              map_link: String(item['Map Link'] || item.map_link || ''),
              brand_id: String(item['Brand ID'] || item.Brand_ID || item.brand_id || ''),
              is_active: true
            };
          }).filter(Boolean);

          if (toProcess.length > 0) {
            await onBulkAdd(toProcess);
            onNotify?.('success', `Synchronized ${toProcess.length} stores (Updated & Added)`);
          }
        }
      } catch (err) {
        onNotify?.('error', 'Failed to parse the Excel file.');
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        ID: 'ST-1001', Name: 'Sample Restaurant', Category: 'Restaurant',
        Brand_ID: 'BRAND-A', Owner: 'John Smith', Phone: '+9647500000000', 
        Zone: 'Mosul', Area: 'Al-Zuhour', Address: 'Main Street - Near University', 
        'Map Link': 'https://maps.google.com/...'
      },
      {
        ID: 'ST-1002', Name: 'Daily Goods Market', Category: 'Groceries',
        Brand_ID: 'BRAND-B', Owner: 'Ahmad Khalil', Phone: '+9647700000000', 
        Zone: 'Baghdad', Area: 'Mansour', Address: '14 Ramadan St', 
        'Map Link': 'https://maps.google.com/...'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StoresTemplate");
    
    // v2.0 - Indestructible Download Logic
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const uri = 'data:application/octet-stream;base64,' + wbout; // Generic MIME to force download name
    const a = document.createElement('a');
    a.style.position = 'fixed';
    a.style.top = '-100px';
    a.style.left = '-100px';
    a.style.visibility = 'hidden';
    a.href = uri;
    a.download = 'Restaurant_Upload_Template.xlsx';
    a.target = '_blank'; // Fallback for some browsers
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  };

  const handleExportFieldList = () => {
    const activeStores = stores.filter(s => !s.deleted_at && s.is_active !== false);
    const exportData = activeStores.map((s, i) => ({
      '#': i + 1,
      'Store ID': s.id,
      'Store Name': s.name,
      'Owner': s.owner_name || '',
      'Phone': s.phone || '',
      'Cashier Phone': s.cashier_phone || '',
      'Manager Phone': s.restaurant_manager_phone || '',
      'Zone': s.zone || '',
      'Area': s.area || '',
      'Category': s.category || '',
      'Address': s.address || '',
      'Map Link': s.map_link || '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 4 }, { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 16 },
      { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 36 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Field List');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const a = document.createElement('a');
    a.href = 'data:application/octet-stream;base64,' + wbout;
    a.download = `field-list-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddStore(newStore);
    setNewStore({ id: '', name: '', category: '', owner_name: '', phone: '', zone: '', area: '', address: '', map_link: '', brand_id: '' });
    setIsModalOpen(false);
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
            style={{ width: '100%' }}
          >
            <div className="directory-header">
              <div className="title-group">
                <h2 className="gradient-text">Restaurant Registry</h2>
                <p className="stat-label">Manage active accounts and operational snapshots</p>
              </div>
              
              <div className="header-actions">
                <button className="btn-secondary sm" onClick={handleExportFieldList} title="تصدير قائمة الاتصال الميداني">
                  <FileDown size={14} /> <span className="desktop-only text-sm">Field List</span>
                </button>
                <button className="btn-secondary sm" onClick={handleDownloadTemplate}>
                  <FileDown size={14} /> <span className="desktop-only text-sm">Template</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
                <button className="btn-secondary sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                  {isImporting ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />} <span className="desktop-only text-sm">Import</span>
                </button>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                  <Plus size={16} /> <span className="desktop-only text-sm">Add Store</span>
                </button>
              </div>
            </div>

            <div className="filters-grid-v2">
              <div className="search-wrapper-v3">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="ID, name, or phone..." 
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              
              <div className="filter-group-v2">
                <div className="filter-pill-v2">
                  <Activity size={14} />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
                <div className="filter-pill-v2">
                  <Globe size={14} />
                  <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
                    <option value="">All Zones</option>
                    {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                  </select>
                </div>
                <div className="filter-pill-v2">
                  <Layers size={14} />
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <button className="btn-icon-v2" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                  {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
                </button>
              </div>
            </div>

            <div className="content-area">
              {filteredStores.length > 0 ? (
                <>
                  <div className="desktop-only glass-card-table" style={{ overflowX: 'auto' }}>
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th style={{ width: '120px' }}>Store ID</th>
                          <th>Store Name</th>
                          <th>Category</th>
                          <th>Manager Info</th>
                          <th style={{ textAlign: 'center', width: '220px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedStores.map((store) => (
                          <tr key={store.id} className="premium-row">
                            <td className="id-cell">
                              <div className="id-content">
                                <div className={`status-dot-v3 ${store.is_active ? 'active' : 'inactive'}`} title={store.is_active ? 'Active' : 'Closed'}></div>
                                <span>#{store.id}</span>
                                <button className="copy-btn-subtle" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(store.id); }} title="Copy ID">
                                  <Copy size={12} />
                                </button>
                              </div>
                            </td>
                            <td className="name-cell" onClick={() => onSelectStore(store.id)}>
                              <div className="name-content">
                                <span className="main-name">{store.name}</span>
                                <button className="copy-btn-subtle" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(store.name); }} title="Copy Name">
                                  <Copy size={12} />
                                </button>
                              </div>
                            </td>
                            <td className="category-cell">
                              <span className="category-tag">
                                <Layers size={12} />
                                {store.category}
                              </span>
                            </td>
                            <td className="manager-cell">
                              <div className="manager-info-v2">
                                <span className="manager-name">{store.owner_name || 'No Manager Name'}</span>
                                <div className="manager-phone-row">
                                  <Smartphone size={10} style={{ opacity: 0.6 }} />
                                  <span className="manager-phone-sub">{store.phone}</span>
                                  <button 
                                    className="copy-btn-subtle" 
                                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(store.phone); onNotify?.('success', 'Phone copied'); }}
                                    title="Copy Phone"
                                  >
                                    <Copy size={10} />
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="actions-cell">
                              <div className="action-group-h">
                                <button 
                                  className="action-btn-v3 profile" 
                                  onClick={() => onSelectStore(store.id)}
                                  title="View Profile"
                                >
                                  <User size={16} />
                                </button>
                                {store.phone?.replace(/\D/g, '') ? (
                                  <a
                                    href={`https://wa.me/${store.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-btn-v3 whatsapp"
                                    title="WhatsApp Contact"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MessageCircle size={16} />
                                  </a>
                                ) : null}
                                <button 
                                  className="action-btn-v3 log" 
                                  onClick={(e) => { e.stopPropagation(); onQuickLog(store); }}
                                  title="Register Log"
                                >
                                  <Activity size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mobile-only cards-list">
                    {filteredStores.map((store) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={store.id} 
                        className="glass-card mobile-store-card"
                        onClick={() => onSelectStore(store.id)}
                      >
                        <div className="card-header">
                          <span className="card-id">#{store.id}</span>
                          <span className={`badge ${store.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {store.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="card-body">
                          <h3 className="card-title">{store.name}</h3>
                          <div className="card-meta">
                            <span className="category-tag"><Layers size={12} /> {store.category}</span>
                            <span className="manager-phone"><Smartphone size={12} /> {store.phone}</span>
                          </div>
                        </div>
                        <div className="card-footer">
                           <span className="view-profile-hint">View Partner Profile</span>
                           <span className="open-arrow"><ExternalLink size={16} /></span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '1.25rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                      <button className="btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '6px 14px', opacity: currentPage === 1 ? 0.4 : 1 }}>←</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setCurrentPage(p)} style={{ padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', background: p === currentPage ? 'var(--primary-color)' : 'var(--surface-hover)', color: p === currentPage ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>{p}</button>
                      ))}
                      <button className="btn-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '6px 14px', opacity: currentPage === totalPages ? 0.4 : 1 }}>→</button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '8px' }}>{filteredStores.length} total</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon"><Store size={48} /></div>
                  <h3>No restaurants found</h3>
                  <p>Try adjusting your search or filters.</p>
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
            style={{ width: '100%' }}
          >
            <StoreProfile 
              store={stores.find(s => s.id === selectedStoreId)} 
              activities={activities} 
              outcomes={outcomes} 
              closureReasons={closureReasons}
              onClose={() => onSelectStore(null)}
              onUpdate={onUpdateStore}
              onDeleteStore={onDeleteStore}
              onAddActivity={onAddActivity}
              onNotify={onNotify}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div 
            className="glass-card modal-content visible-modal" 
            onClick={e => e.stopPropagation()}
            style={{ 
              padding: '2.5rem', 
              background: 'white', 
              zIndex: 3001, 
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              width: '90%',
              maxWidth: '550px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Add New Restaurant</h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="close-modal-btn"
                style={{ width: '40px', height: '40px', background: 'var(--surface-hover)' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="responsive-modal-form">
              <div className="form-row-grid tri-col">
                <div className="form-group"><label>Store ID</label><input required placeholder="REST-101" value={newStore.id} onChange={e => setNewStore({...newStore, id: e.target.value})} /></div>
                <div className="form-group"><label>Store Name</label><input required placeholder="Name" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} /></div>
                <div className="form-group"><label>Brand ID</label><input placeholder="BRAND-01" value={newStore.brand_id} onChange={e => setNewStore({...newStore, brand_id: e.target.value})} /></div>
              </div>
              <div className="form-row-grid bi-col">
                <div className="form-group">
                  <label>Category</label>
                  <select required value={newStore.category} onChange={e => setNewStore({...newStore, category: e.target.value})}>
                    <option value="">Select Category</option>
                    {(categories || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Owner Name</label><input required placeholder="Owner" value={newStore.owner_name} onChange={e => setNewStore({...newStore, owner_name: e.target.value})} /></div>
              </div>
              <div className="form-row-grid bi-col">
                <div className="form-group"><label>Phone Number</label><input required placeholder="+964..." value={newStore.phone} onChange={e => setNewStore({...newStore, phone: e.target.value})} /></div>
                <div className="form-group">
                  <label>Zone</label>
                  <select required value={newStore.zone} onChange={e => setNewStore({...newStore, zone: e.target.value})}>
                    <option value="">Select Zone</option>
                    {(zones || []).map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Physical Address</label><textarea rows="1" placeholder="Address" value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flexGrow: 1, height: '52px', fontSize: '1rem', fontWeight: 600 }}>Register Restaurant</button>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ height: '52px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .directory-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header-actions { display: flex; gap: 0.75rem; }
        .filters-grid-v2 { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .search-wrapper-v3 { flex: 1; min-width: 300px; position: relative; }
        .search-wrapper-v3 .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-dim); }
        .search-wrapper-v3 input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 14px; border: 1px solid var(--border-color); background: var(--surface-color); font-weight: 600; outline: none; transition: 0.2s; }
        .search-wrapper-v3 input:focus { border-color: var(--primary-color); background: white; box-shadow: var(--shadow-sm); }
        
        .filter-group-v2 { display: flex; gap: 0.75rem; }
        .filter-pill-v2 { display: flex; align-items: center; gap: 8px; background: var(--surface-color); border: 1px solid var(--border-color); padding: 2px 12px; border-radius: 12px; }
        .filter-pill-v2 select { border: none; background: transparent; font-weight: 700; color: var(--text-primary); outline: none; padding: 10px 0; }
        .btn-icon-v2 { background: var(--surface-color); border: 1px solid var(--border-color); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-primary); transition: 0.2s; }
        .btn-icon-v2:hover { background: white; border-color: var(--primary-color); color: var(--primary-color); }

        .manager-info-v2 { display: flex; flex-direction: column; gap: 2px; }
        .manager-name { font-weight: 800; color: var(--text-primary); font-size: 0.95rem; }
        .manager-phone-row { display: flex; align-items: center; gap: 6px; color: var(--text-dim); }
        .manager-phone-sub { font-size: 0.8rem; font-weight: 600; }

        .action-group-h { display: flex; gap: 8px; justify-content: center; }
        .action-btn-v3 { width: 38px; height: 38px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); background: var(--surface-hover); color: var(--text-dim); text-decoration: none; }
        
        .action-btn-v3.profile:hover { background: var(--primary-light); color: var(--primary-color); transform: translateY(-2px); }
        .action-btn-v3.whatsapp:hover { background: #dcfce7; color: #16a34a; transform: translateY(-2px); }
        .action-btn-v3.log:hover { background: #ede9fe; color: #7c3aed; transform: translateY(-2px); }
        .action-btn-v3:active { transform: scale(0.9); }

        .desktop-only { display: flex; }
        .mobile-only { display: none; }

        @media (max-width: 768px) {
          .directory-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .header-actions { width: 100%; justify-content: space-between; }
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .search-wrapper-v3 { min-width: 100%; }
          .modal-content { padding: 1.5rem !important; }
          .form-row-grid.tri-col, .form-row-grid.bi-col { grid-template-columns: 1fr !important; gap: 0 !important; }
        }

        .form-row-grid { display: grid; gap: 1rem; }
        .form-row-grid.tri-col { grid-template-columns: repeat(3, 1fr); }
        .form-row-grid.bi-col { grid-template-columns: repeat(2, 1fr); }

        .close-modal-btn {
          background: var(--surface-hover);
          color: var(--text-dim);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .close-modal-btn:hover {
          background: var(--danger);
          color: white;
          transform: rotate(90deg);
        }
      `}</style>
    </div>
  );
};

export default StoreList;
