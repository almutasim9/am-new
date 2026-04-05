import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { 
  subHours, subDays, subMonths, isAfter, isSameDay, 
  startOfDay, endOfDay, startOfWeek, endOfWeek, 
  isWithinInterval, format 
} from 'date-fns';
import { Calendar, Clock, Filter, ChevronDown, RefreshCw, Layers } from 'lucide-react';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

const Stats = ({ calls, outcomes, stores }) => {
  const now = new Date();
  
  // Set default: Sunday to Saturday (Standard Week)
  const defaultStart = startOfWeek(now, { weekStartsOn: 0 });
  const defaultEnd = endOfWeek(now, { weekStartsOn: 0 });

  const [filterForm, setFilterForm] = React.useState({
    startDate: format(defaultStart, 'yyyy-MM-dd'),
    endDate: format(defaultEnd, 'yyyy-MM-dd'),
    period: 'week',
    orderType: 'all'
  });

  const [activeFilters, setActiveFilters] = React.useState({ ...filterForm });

  const handleUpdateFilters = () => {
    setActiveFilters({ ...filterForm });
  };

  // Filter calls based on time selection
  const filteredCalls = React.useMemo(() => {
    return calls.filter(c => {
      const callDate = new Date(c.created_at);
      try {
        return isWithinInterval(callDate, { 
          start: startOfDay(new Date(activeFilters.startDate)), 
          end: endOfDay(new Date(activeFilters.endDate)) 
        });
      } catch (e) {
        return true; // Fallback if invalid date
      }
    });
  }, [calls, activeFilters]);

  const outcomeData = React.useMemo(() =>
    outcomes.map(outcome => ({
      name: outcome.name,
      value: filteredCalls.filter(c => c.outcome_id === outcome.id).length
    })).filter(d => d.value > 0),
  [filteredCalls, outcomes]);

  const statusData = React.useMemo(() => [
    { name: 'Completed', value: filteredCalls.filter(c => c.is_resolved).length },
    { name: 'Pending',   value: filteredCalls.filter(c => !c.is_resolved).length },
  ], [filteredCalls]);

  const zoneData = React.useMemo(() => {
    const zones = [...new Set(stores.map(s => s.zone).filter(Boolean))];
    return zones.map(zone => ({ name: zone, value: stores.filter(s => s.zone === zone).length }));
  }, [stores]);

  const categoryData = React.useMemo(() => {
    const categories = [...new Set(stores.map(s => s.category).filter(Boolean))];
    return categories.map(cat => ({ name: cat, value: stores.filter(s => s.category === cat).length }));
  }, [stores]);

  const contactTypeData = React.useMemo(() => {
    const types = [
      { value: 'call',     label: '📞 مكالمة',  color: '#4f46e5' },
      { value: 'visit',    label: '🚗 زيارة',   color: '#10b981' },
      { value: 'whatsapp', label: '💬 واتساب',  color: '#22c55e' },
      { value: 'online',   label: '🌐 أونلاين', color: '#0ea5e9' },
    ];
    const hasAny = filteredCalls.some(c => c.contact_type);
    if (!hasAny) return [];
    return types.map(t => ({
      name: t.label,
      value: filteredCalls.filter(c => (c.contact_type || 'call') === t.value).length,
      color: t.color
    })).filter(d => d.value > 0);
  }, [filteredCalls]);

  return (
    <div className="section-container">
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h2 className="gradient-text">Professional Analytics</h2>
          <p className="stat-label">Measure your daily work progress and market distribution</p>
        </div>
      </div>

      {/* Advanced Filter Architecture v2.9 */}
      <div className="filter-system-v29">
        <div className="filter-group-v29">
          <label className="filter-label"><Calendar size={12} /> Date Range</label>
          <div className="filter-range-inputs">
            <input 
              type="date" 
              value={filterForm.startDate} 
              onChange={(e) => setFilterForm({ ...filterForm, startDate: e.target.value })}
            />
            <span className="range-sep">-</span>
            <input 
              type="date" 
              value={filterForm.endDate} 
              onChange={(e) => setFilterForm({ ...filterForm, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="filter-group-v29" style={{ opacity: 0.5 }}>
          <label className="filter-label"><Layers size={12} /> Order Type <span style={{ fontSize: '0.55rem', background: 'var(--surface-hover)', padding: '2px 5px', borderRadius: '4px', marginLeft: '4px' }}>COMING SOON</span></label>
          <div className="custom-select-v29">
            <select disabled value="all">
              <option value="all">All Transactions</option>
            </select>
            <ChevronDown size={14} className="select-arrow" />
          </div>
        </div>

        <div className="filter-group-v29">
          <label className="filter-label"><Clock size={12} /> Period</label>
          <div className="custom-select-v29">
            <select 
              value={filterForm.period} 
              onChange={(e) => setFilterForm({ ...filterForm, period: e.target.value })}
            >
              <option value="day">daily</option>
              <option value="week">weekly</option>
              <option value="month">monthly</option>
            </select>
            <ChevronDown size={14} className="select-arrow" />
          </div>
        </div>

        <div className="filter-actions-v29">
           <button className="btn-apply-filters" onClick={handleUpdateFilters}>
             <RefreshCw size={16} /> Update Dashboard
           </button>
           <div className="record-counter">
             <span>{filteredCalls.length}</span> records for this range
           </div>
        </div>
      </div>

      <style>{`
        .filter-system-v29 {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
        }
        @media (max-width: 768px) {
          .filter-system-v29 { grid-template-columns: 1fr 1fr; }
          .filter-range-inputs { flex-direction: column; gap: 4px; }
          .filter-actions-v29 { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; }
        }
        .filter-system-v29 {
          gap: 1.5rem;
          background: var(--card-bg);
          padding: 1.5rem;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          margin-bottom: 2.5rem;
          box-shadow: var(--shadow);
          align-items: flex-end;
        }
        .filter-group-v29 { display: flex; flex-direction: column; gap: 8px; }
        .filter-label { font-size: 0.75rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
        .filter-range-inputs { 
          display: flex; align-items: center; gap: 8px; 
          background: var(--background-color); border: 1px solid var(--border-color);
          padding: 8px 12px; border-radius: 12px;
        }
        .filter-range-inputs input { border: none; background: transparent; color: var(--text-primary); font-weight: 700; font-size: 0.875rem; outline: none; }
        .range-sep { color: var(--text-dim); font-weight: 900; }
        .custom-select-v29 { position: relative; background: var(--background-color); border: 1px solid var(--border-color); border-radius: 12px; }
        .custom-select-v29 select { 
          width: 100%; border: none; background: transparent; padding: 10px 14px; 
          font-weight: 700; color: var(--text-primary); font-size: 0.875rem; 
          appearance: none; cursor: pointer; padding-right: 36px;
        }
        .select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-dim); }
        .filter-actions-v29 { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .btn-apply-filters { 
          background: var(--primary-color); color: white; border: none; 
          padding: 10px 24px; border-radius: 12px; font-weight: 700; 
          cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s;
        }
        .btn-apply-filters:hover { background: var(--primary-hover); transform: translateY(-2px); }
        .btn-apply-filters:active { transform: translateY(0); }
        .record-counter { font-size: 0.65rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; }
        .record-counter span { color: var(--primary-color); }
      `}</style>

      {filteredCalls.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)', marginBottom: '1.5rem', border: '2px dashed var(--border-color)' }}>
          <Layers size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>No records for this date range</p>
          <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Try adjusting the filters above</p>
        </div>
      )}

      <style>{`
        .stats-chart-card { padding: 1.5rem; }
        .stats-chart-inner { height: 300px; }
        @media (max-width: 768px) {
          .stats-chart-inner { height: 240px; }
          .stats-chart-card { padding: 1rem; }
        }
        @media (max-width: 480px) {
          .stats-chart-inner { height: 200px; }
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: '1.5rem' }}>
        <motion.div
          className="glass-card stats-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Status Distribution</h3>
          <div className="stats-chart-inner">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="glass-card stats-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Work Progression</h3>
          <div className="stats-chart-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--surface-hover)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                <Bar dataKey="value" fill="var(--primary-color)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="glass-card stats-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Zone Distribution</h3>
          <div className="stats-chart-inner">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={zoneData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {zoneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="glass-card stats-chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Category Analysis</h3>
          <div className="stats-chart-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{fill: 'var(--surface-hover)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                <Bar dataKey="value" fill="var(--success)" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {contactTypeData.length > 0 && (
          <motion.div
            className="glass-card stats-chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>نوع التواصل / Contact Type</h3>
            <div className="stats-chart-inner">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={contactTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {contactTypeData.map((entry, index) => (
                      <Cell key={`ct-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Stats;
