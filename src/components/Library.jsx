import React, { useState, useMemo } from 'react';
import { ExternalLink, Trash2, Plus, Bookmark, Link as LinkIcon, Search, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Library = ({ links, libraryError, onAddLink, onUpdateLink, onDeleteLink }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLink, setNewLink] = useState({ name: '', url: '', description: '' });

  const filteredLinks = useMemo(() =>
    links.filter(link =>
      link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
  [links, searchTerm]);

  const openModal = (link = null) => {
    if (link) {
      setIsEditing(true);
      setEditId(link.id);
      setNewLink({ name: link.name, url: link.url, description: link.description || '' });
    } else {
      setIsEditing(false);
      setEditId(null);
      setNewLink({ name: '', url: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let url = newLink.url;
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    if (isEditing) {
      onUpdateLink(editId, { name: newLink.name, url, description: newLink.description });
    } else {
      onAddLink(newLink.name, url, newLink.description);
    }
    
    setNewLink({ name: '', url: '', description: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="gradient-text">المكتبة (The Library)</h2>
          <p className="stat-label">أهم الروابط الي تستخدمها يومياً بشكل سريع</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          <Plus size={18} style={{ marginRight: '8px' }} />
          إضافة رابط جديد
        </button>
      </div>

      {libraryError && (
        <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            The Library table has not been created yet. Run the SQL migration in your Supabase dashboard to enable this feature.
          </p>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '500px', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="البحث في الروابط..."
            className="glass-card"
            style={{ padding: '0.875rem 1rem 0.875rem 2.5rem', width: '100%', border: '1px solid var(--border-color)', borderRadius: '14px', minHeight: '44px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1.25rem' }}>
        {filteredLinks.map((link) => (
          <motion.div 
            key={link.id} 
            className="glass-card" 
            style={{ 
              padding: '1.75rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem', 
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '24px',
              overflow: 'hidden'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
          >
            {/* Top Bar with Icons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))', 
                padding: '12px', 
                borderRadius: '16px', 
                color: 'white',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}>
                <Bookmark size={24} />
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => openModal(link)}
                  style={{ 
                    color: 'var(--text-secondary)', 
                    padding: '8px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.05)',
                    cursor: 'pointer', 
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-color)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => onDeleteLink(link.id)}
                  style={{ 
                    color: 'var(--danger)', 
                    padding: '8px',
                    borderRadius: '10px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    background: 'rgba(239, 68, 68, 0.05)',
                    cursor: 'pointer', 
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--danger)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                    e.currentTarget.style.color = 'var(--danger)';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                {link.name}
              </h3>
              {link.description ? (
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '12px', 
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: '2',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {link.description}
                </p>
              ) : (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '12px' }}>
                  لا توجد تفاصيل...
                </p>
              )}
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: 'var(--text-dim)', 
                fontSize: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                padding: '6px 10px',
                borderRadius: '8px',
                width: 'fit-content'
              }}>
                <LinkIcon size={12} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                  {link.url.replace(/^https?:\/\//, '')}
                </span>
              </div>
            </div>

            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                textDecoration: 'none', 
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.875rem'
              }}
            >
              <ExternalLink size={18} />
              فتح الرابط السريع
            </a>
          </motion.div>
        ))}

        {filteredLinks.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', color: 'var(--text-dim)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <LinkIcon size={80} style={{ marginBottom: '1.5rem' }} />
            </motion.div>
            {searchTerm ? (
              <p style={{ fontSize: '1.1rem' }}>No results for "{searchTerm}" — try a different keyword.</p>
            ) : (
              <>
                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Your library is empty. Add your first link!</p>
                <button className="btn-primary" onClick={() => openModal()}>
                  <Plus size={18} style={{ marginRight: '8px' }} /> إضافة رابط جديد
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .library-modal-overlay { align-items: flex-end !important; padding: 0 !important; }
          .library-modal-box { border-radius: 20px 20px 0 0 !important; max-width: 100% !important; width: 100% !important; padding: 1.75rem !important; max-height: 90vh; overflow-y: auto; }
          .library-search-wrap { max-width: 100% !important; }
        }
      `}</style>

      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay library-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <motion.div
              className="glass-card modal-content library-modal-box"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{ padding: '2.5rem', maxWidth: '600px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ margin: 0 }}>
                  {isEditing ? 'تعديل بيانات الرابط' : 'إضافة رابط جديد للمكتبة'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>اسم الرابط (بشكل واضح)</label>
                  <input 
                    type="text" 
                    placeholder="مثال: Google Sheets - Dashboard" 
                    required 
                    value={newLink.name} 
                    onChange={e => setNewLink({...newLink, name: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>عنوان الرابط (URL)</label>
                  <input 
                    type="text" 
                    placeholder="https://example.com" 
                    required 
                    value={newLink.url} 
                    onChange={e => setNewLink({...newLink, url: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>التفاصيل والملاحظات (اختياري)</label>
                  <textarea 
                    placeholder="اكتب هنا أي ملاحظات إضافية بخصوص هذا الرابط..." 
                    rows={4}
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      borderRadius: '16px', 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-primary)',
                      lineHeight: '1.5',
                      resize: 'none'
                    }}
                    value={newLink.description} 
                    onChange={e => setNewLink({...newLink, description: e.target.value})} 
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1rem' }}>
                    {isEditing ? 'حفظ التعديلات' : 'تأكيد الإضافة'}
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

export default Library;
