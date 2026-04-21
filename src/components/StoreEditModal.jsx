import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Save, User, Phone, MapPin, Bookmark, TrendingUp,
  ExternalLink, Database, Globe, Hash, Smartphone, ShieldCheck
} from 'lucide-react';

const Field = ({ label, icon: Icon, name, value, onChange, placeholder, fullWidth, type = 'text' }) => (
  <div className={`sem-field ${fullWidth ? 'full' : ''}`}>
    <label className="sem-label">
      <Icon size={12} /> {label}
    </label>
    <input
      type={type}
      className="sem-input"
      name={name}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={onChange}
    />
  </div>
);

const Toggle = ({ label, icon: Icon, checked, onChange }) => (
  <button type="button" className={`sem-toggle ${checked ? 'on' : ''}`} onClick={onChange}>
    <div className="sem-toggle-icon"><Icon size={18} /></div>
    <div className="sem-toggle-body">
      <span className="sem-toggle-label">{label}</span>
      <span className="sem-toggle-state">{checked ? 'ENABLED' : 'DISABLED'}</span>
    </div>
    <div className={`sem-toggle-switch ${checked ? 'on' : ''}`}><div className="sem-toggle-knob" /></div>
  </button>
);

const StoreEditModal = ({ isOpen, store, onClose, onSave }) => {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && store) setForm({ ...store });
  }, [isOpen, store]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggle = (field) => setForm(f => ({ ...f, [field]: !f[field] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        name, category, owner_name, phone, zone, area,
        address, map_link, cashier_phone, accounts_manager_phone,
        restaurant_manager_phone, has_pos, has_sim, brand_id
      } = form;
      await onSave(store.id, {
        name, category, owner_name, phone, zone, area,
        address, map_link, cashier_phone, accounts_manager_phone,
        restaurant_manager_phone, has_pos, has_sim, brand_id
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sem-overlay"
          className="sem-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="sem-modal glass-card"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sem-header">
              <div>
                <h2>Edit Store Info</h2>
                <p>Edit store information · <span className="sem-store-id">#{store?.id}</span></p>
              </div>
              <button className="sem-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div className="sem-body">
              <section>
                <h4><Hash size={13} /> Basic Info</h4>
                <div className="sem-grid">
                  <Field label="Store Name" icon={User} name="name" value={form.name} onChange={handleChange} placeholder="e.g. Burger King" fullWidth />
                  <Field label="Primary Contact" icon={User} name="owner_name" value={form.owner_name} onChange={handleChange} placeholder="Owner name" />
                  <Field label="Business Phone" icon={Phone} name="phone" value={form.phone} onChange={handleChange} placeholder="07XX..." />
                  <Field label="Category" icon={Bookmark} name="category" value={form.category} onChange={handleChange} placeholder="e.g. Restaurants" />
                  <Field label="Brand ID" icon={Bookmark} name="brand_id" value={form.brand_id} onChange={handleChange} placeholder="Brand code" />
                </div>
              </section>

              <section>
                <h4><MapPin size={13} /> Location</h4>
                <div className="sem-grid">
                  <Field label="Zone / Region" icon={MapPin} name="zone" value={form.zone} onChange={handleChange} placeholder="Assign zone" />
                  <Field label="Area / Neighborhood" icon={TrendingUp} name="area" value={form.area} onChange={handleChange} placeholder="Specific area" />
                  <Field label="Official Address" icon={MapPin} name="address" value={form.address} onChange={handleChange} placeholder="Full address" fullWidth />
                  <Field label="Google Maps Link" icon={ExternalLink} name="map_link" value={form.map_link} onChange={handleChange} placeholder="https://maps.google.com/..." fullWidth />
                </div>
              </section>

              <section>
                <h4><ShieldCheck size={13} /> Team Contacts</h4>
                <div className="sem-grid">
                  <Field label="Cashier" icon={Smartphone} name="cashier_phone" value={form.cashier_phone} onChange={handleChange} placeholder="Cashier phone" />
                  <Field label="Floor Manager" icon={User} name="restaurant_manager_phone" value={form.restaurant_manager_phone} onChange={handleChange} placeholder="Manager phone" />
                  <Field label="Accounting" icon={Database} name="accounts_manager_phone" value={form.accounts_manager_phone} onChange={handleChange} placeholder="Accounting phone" />
                </div>
              </section>

              <section>
                <h4><Smartphone size={13} /> Hardware</h4>
                <div className="sem-toggles">
                  <Toggle label="Point of Sale (POS)" icon={Database} checked={!!form.has_pos} onChange={() => toggle('has_pos')} />
                  <Toggle label="SIM Integration" icon={Globe} checked={!!form.has_sim} onChange={() => toggle('has_sim')} />
                </div>
              </section>
            </div>

            <div className="sem-footer">
              <button className="sem-btn cancel" onClick={onClose} disabled={saving}>
                <X size={14} /> Cancel
              </button>
              <button className="sem-btn save" onClick={handleSave} disabled={saving}>
                {saving ? <div className="sem-spinner" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default StoreEditModal;
