import React, { useMemo, useState } from 'react';
import {
  Target, Users, CheckCircle, Clock, ArrowRight, AlertCircle,
  Calendar, TrendingUp, Zap, PhoneCall, Activity, Star, Store,
  BellOff, Printer, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  startOfDay, endOfDay, eachDayOfInterval,
  differenceInDays, format
} from 'date-fns';
import { getOverdueActivities } from '../services/notificationService';
import { getCommercialCycle } from '../utils/commercialCycle';

// ── helpers ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay }
});

// ── sub-components ────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, pct, delay }) => (
  <motion.div
    className="glass-card"
    style={{
      padding: '1rem 1.25rem',
      borderLeft: `3px solid ${color}`,
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', gap: '1rem'
    }}
    {...fadeUp(delay)}
    whileHover={{ y: -3, boxShadow: '0 12px 24px -6px rgba(0,0,0,0.1)' }}
  >
    <div style={{
      background: color + '15', padding: '10px', borderRadius: '12px',
      display: 'flex', flexShrink: 0
    }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 500, marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
      {pct !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <div style={{ flex: 1, height: 3, background: 'var(--border-color)', borderRadius: 9999 }}>
            <motion.div
              style={{ height: '100%', background: color, borderRadius: 9999 }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: delay + 0.3, ease: 'easeOut' }}
            />
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600, flexShrink: 0 }}>
            {pct}%
          </span>
        </div>
      )}
    </div>
  </motion.div>
);

// ── main ──────────────────────────────────────────────────────────────────────
const Overview = ({ stats, cycleStats, activities = [], stores = [], onNavigate }) => {
  const overdueActivities = getOverdueActivities(activities, stores);
  const [ghostExpanded, setGhostExpanded] = useState(false);

  const completionRate = useMemo(() =>
    cycleStats.total > 0
      ? Math.round((cycleStats.completed / cycleStats.total) * 100)
      : 0,
    [cycleStats]
  );

  // Build once; reused by recent-activities render and ghost-store detection.
  const storeById = useMemo(() => {
    const m = new Map();
    for (const s of stores) m.set(s.id, s);
    return m;
  }, [stores]);

  // Most-recent activity timestamp per store, in one pass over activities.
  // Replaces the O(stores × activities) nested filter in ghostStores.
  const latestActivityByStore = useMemo(() => {
    const m = new Map();
    for (const a of activities) {
      const t = new Date(a.created_at).getTime();
      const prev = m.get(a.store_id);
      if (prev === undefined || t > prev) m.set(a.store_id, t);
    }
    return m;
  }, [activities]);

  const recentActivities = useMemo(() =>
    [...activities]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(a => ({
        ...a,
        storeName: storeById.get(a.store_id)?.name || 'Unknown'
      })),
    [activities, storeById]
  );

  const quickActions = [
    { label: 'Add Activity',     icon: PhoneCall,  tab: 'activities', color: 'var(--primary-color)' },
    { label: 'View Stores',      icon: Users,       tab: 'stores',     color: 'var(--accent-color)'  },
    { label: 'Performance Stats',icon: TrendingUp,  tab: 'stats',      color: '#10b981'              },
    { label: 'Weekly Goal',      icon: Target,      tab: 'target',     color: '#f59e0b'              },
  ];

  // ── Commercial Cycle Report ───────────────────────────────────────────────
  const cycleReport = useMemo(() => {
    const { start, end } = getCommercialCycle(new Date());
    const startMs = start.getTime();
    const endMs = end.getTime();

    let total = 0;
    let resolved = 0;
    const uniqueStoresSet = new Set();
    const outcomeCounts = {};
    const byType = { call: 0, visit: 0, whatsapp: 0, online: 0 };

    for (const a of activities) {
      const t = new Date(a.created_at).getTime();
      if (Number.isNaN(t) || t < startMs || t > endMs) continue;
      total++;
      if (a.is_resolved) resolved++;
      uniqueStoresSet.add(a.store_id);
      outcomeCounts[a.outcome_id] = (outcomeCounts[a.outcome_id] || 0) + 1;
      const type = a.contact_type || 'call';
      if (byType[type] !== undefined) byType[type]++;
    }

    const completionPct = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Work days passed this cycle (Sun–Thu)
    const allDays = eachDayOfInterval({ start, end: new Date() < end ? new Date() : end });
    const workDaysPassed = allDays.filter(d => { const day = d.getDay(); return day >= 0 && day <= 4; }).length;
    const avgPerDay = workDaysPassed > 0 ? (total / workDaysPassed).toFixed(1) : '0';

    let topOutcomeId;
    let topCount = -1;
    for (const [id, count] of Object.entries(outcomeCounts)) {
      if (count > topCount) { topCount = count; topOutcomeId = id; }
    }

    return { total, uniqueStores: uniqueStoresSet.size, resolved, completionPct, avgPerDay, topOutcomeId, byType, workDaysPassed };
  }, [activities]);

  // ── Ghost stores: active stores with no contact in 7+ days ─────────────────
  const ghostStores = useMemo(() => {
    const now = new Date();
    const cutoffMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const result = [];

    for (const s of stores) {
      if (s.deleted_at || !s.is_active) continue;
      const lastMs = latestActivityByStore.get(s.id);
      if (lastMs !== undefined && lastMs >= cutoffMs) continue;
      const daysSince = lastMs !== undefined ? differenceInDays(now, new Date(lastMs)) : null;
      result.push({ ...s, daysSince });
    }

    return result.sort((a, b) => {
      if (a.daysSince === null) return -1;
      if (b.daysSince === null) return 1;
      return b.daysSince - a.daysSince;
    });
  }, [stores, latestActivityByStore]);

  // ── Weekly PDF Report ───────────────────────────────────────────────────────
  const handlePrintWeeklyReport = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd   = endOfWeek(now,   { weekStartsOn: 0 });

    const startMs = startOfDay(weekStart).getTime();
    const endMs = endOfDay(weekEnd).getTime();

    let weekTotal = 0;
    let weekResolved = 0;
    const uniqueStores = new Set();
    const byType = { call: 0, visit: 0, whatsapp: 0, online: 0 };
    const storeCounts = {};

    for (const a of activities) {
      const t = new Date(a.created_at).getTime();
      if (Number.isNaN(t) || t < startMs || t > endMs) continue;
      weekTotal++;
      if (a.is_resolved) weekResolved++;
      uniqueStores.add(a.store_id);
      storeCounts[a.store_id] = (storeCounts[a.store_id] || 0) + 1;
      const type = a.contact_type || 'call';
      if (byType[type] !== undefined) byType[type]++;
    }

    const weekStores = uniqueStores.size;
    const weekPct = weekTotal > 0 ? Math.round((weekResolved / weekTotal) * 100) : 0;
    const topStores = Object.entries(storeCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, count]) => ({ name: storeById.get(id)?.name || id, count }));

    const html = `<!DOCTYPE html><html dir="ltr" lang="en"><head><meta charset="UTF-8">
    <title>Weekly Report</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:40px;direction:ltr;background:#fff}
      .header{text-align:center;margin-bottom:36px;padding-bottom:20px;border-bottom:2px solid #e2e8f0}
      .header h1{font-size:22px;color:#4f46e5;margin-bottom:6px}
      .header p{color:#64748b;font-size:13px}
      h2{font-size:15px;font-weight:700;margin:24px 0 12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;color:#1e293b}
      .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:8px}
      .box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;text-align:center}
      .box .val{font-size:28px;font-weight:800;color:#4f46e5}
      .box .lbl{font-size:11px;color:#64748b;margin-top:4px;font-weight:500}
      .grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
      .type-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;display:flex;align-items:center;gap:10px}
      .type-box .emoji{font-size:20px}
      .type-box .cnt{font-size:18px;font-weight:700}
      .type-box .nm{font-size:11px;color:#64748b}
      .store-row{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px}
      .store-row .nm{font-weight:600;font-size:13px}
      .badge{background:#4f46e5;color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700}
      .footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:36px;padding-top:16px;border-top:1px solid #e2e8f0}
      @media print{body{padding:20px}}
    </style></head><body>
    <div class="header">
      <h1>📊 Weekly Report</h1>
      <p>${format(weekStart,'yyyy/MM/dd')} — ${format(weekEnd,'yyyy/MM/dd')}</p>
    </div>
    <h2>Weekly Summary</h2>
    <div class="grid4">
      <div class="box"><div class="val">${weekTotal}</div><div class="lbl">Total Activities</div></div>
      <div class="box"><div class="val">${weekStores}</div><div class="lbl">Covered Stores</div></div>
      <div class="box"><div class="val">${weekResolved}</div><div class="lbl">Completed Tasks</div></div>
      <div class="box"><div class="val">${weekPct}%</div><div class="lbl">Completion Rate</div></div>
    </div>
    <h2>Contact Type</h2>
    <div class="grid2">
      <div class="type-box"><div class="emoji">📞</div><div><div class="cnt">${byType.call}</div><div class="nm">Call</div></div></div>
      <div class="type-box"><div class="emoji">🚗</div><div><div class="cnt">${byType.visit}</div><div class="nm">Visit</div></div></div>
      <div class="type-box"><div class="emoji">💬</div><div><div class="cnt">${byType.whatsapp}</div><div class="nm">WhatsApp</div></div></div>
      <div class="type-box"><div class="emoji">🌐</div><div><div class="cnt">${byType.online}</div><div class="nm">Online</div></div></div>
    </div>
    ${topStores.length > 0 ? `<h2>Most Active Stores</h2>${topStores.map(s=>`
      <div class="store-row"><div class="nm">${s.name}</div><div class="badge">${s.count} Activities</div></div>`).join('')}` : ''}
    <div class="footer">Registry — ${new Date().toLocaleString()}</div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=860,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="section-container">

      {/* ── Greeting ── */}
      <motion.div {...fadeUp(0)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h2 className="gradient-text" style={{ fontSize: 'clamp(1.3rem, 5vw, 1.75rem)', marginBottom: '4px' }}>
            {getGreeting()} 👋
          </h2>
          <p className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            {formatDate()}
          </p>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'N', label: 'New Activity' },
              { key: 'Ctrl+K', label: 'Search' },
              { key: 'Esc', label: 'Close' },
            ].map(sc => (
              <span key={sc.key} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                <kbd style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '1px 5px', fontFamily: 'monospace', fontSize: '0.65rem' }}>{sc.key}</kbd>
                {sc.label}
              </span>
            ))}
          </div>
        </div>
        {overdueActivities.length > 0 && (
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
              padding: '10px 16px', borderRadius: '14px', color: 'var(--danger)',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer'
            }}
            onClick={() => onNavigate?.('activities')}
          >
            <AlertCircle size={16} />
            {overdueActivities.length} overdue tasks need follow-up
          </motion.div>
        )}
      </motion.div>

      {/* ── Ghost Stores Alert ── */}
      {ghostStores.length > 0 && (
        <motion.div
          {...fadeUp(0.08)}
          style={{
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setGhostExpanded(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BellOff size={17} color="#f59e0b" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#b45309' }}>
                {ghostStores.length} stores without contact for +7 days
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: '#f59e0b', color: 'white',
                fontSize: '0.65rem', fontWeight: 800,
                padding: '2px 8px', borderRadius: '999px'
              }}>{ghostStores.length}</span>
              {ghostExpanded ? <ChevronUp size={16} color="#f59e0b" /> : <ChevronDown size={16} color="#f59e0b" />}
            </div>
          </button>

          {ghostExpanded && (
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ghostStores.slice(0, 10).map(store => (
                <div
                  key={store.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'rgba(255,255,255,0.6)',
                    borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)',
                    cursor: 'pointer',
                  }}
                  onClick={() => onNavigate?.('stores')}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{store.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{store.id}</div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    color: store.daysSince === null ? '#dc2626' : store.daysSince >= 14 ? '#dc2626' : '#b45309',
                    background: store.daysSince === null || store.daysSince >= 14 ? 'rgba(220,38,38,0.08)' : 'rgba(245,158,11,0.1)',
                    padding: '3px 10px', borderRadius: '999px',
                  }}>
                    {store.daysSince === null ? 'Never contacted' : `${store.daysSince} days`}
                  </span>
                </div>
              ))}
              {ghostStores.length > 10 && (
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#b45309', fontWeight: 600, padding: '4px' }}>
                  + {ghostStores.length - 10} more stores
                </div>
              )}
              <button
                className="btn-secondary"
                style={{ marginTop: '4px', width: '100%', justifyContent: 'center', borderColor: 'rgba(245,158,11,0.4)', color: '#b45309' }}
                onClick={() => onNavigate?.('stores')}
              >
                View all stores <ArrowRight size={14} />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Stat Cards ── */}
      <div className="stats-grid">
        <StatCard
          icon={Users}
          label="Active Stores"
          value={stats.totalStores}
          color="var(--primary-color)"
          delay={0.05}
        />
        <StatCard
          icon={Store}
          label="Inactive Stores"
          value={stats.inactiveStores}
          color="var(--text-dim)"
          delay={0.07}
        />
        <StatCard
          icon={Activity}
          label="Activities (Cycle)"
          value={cycleStats.total}
          color="var(--accent-color)"
          delay={0.1}
        />
        <StatCard
          icon={Clock}
          label="Pending (Cycle)"
          value={cycleStats.pending}
          color="#f59e0b"
          delay={0.15}
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved (Cycle)"
          value={cycleStats.completed}
          color="var(--success)"
          pct={completionRate}
          delay={0.2}
        />
      </div>

      {/* ── Quick Actions ── */}
      <motion.div {...fadeUp(0.25)}>
        <p className="stat-label" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
          <Zap size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Quick Actions
        </p>
        <div className="quick-actions-grid">
          {quickActions.map(({ label, icon: Icon, tab, color }) => (

            <motion.button
              key={tab}
              whileHover={{ y: -3, boxShadow: '0 12px 24px -6px rgba(0,0,0,0.12)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate?.(tab)}
              className="glass-card"
              style={{
                padding: '1rem', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '8px', cursor: 'pointer',
                border: '1px solid var(--border-color)', textAlign: 'center'
              }}
            >
              <div style={{
                background: color + '18', padding: '10px', borderRadius: '12px'
              }}>
                <Icon size={20} color={color} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Bottom Row ── */}
      <div className="bottom-row-grid">


        {/* Overdue / Recent feed */}
        <motion.div className="glass-card" style={{ padding: '1.75rem' }} {...fadeUp(0.3)}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} color="var(--danger)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                {overdueActivities.length > 0 ? "Today's Reminders" : "Recent Activities"}
              </h3>
            </div>
            {overdueActivities.length > 0 && (
              <span className="badge badge-danger">{overdueActivities.length} Urgent</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {overdueActivities.length === 0 ? (
              recentActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  <Star size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.875rem' }}>No activities yet</p>
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '0.75rem', background: 'rgba(16,185,129,0.06)',
                    borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)',
                    marginBottom: '0.5rem'
                  }}>
                    <CheckCircle size={16} color="var(--success)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                      No overdue tasks — great work!
                    </span>
                  </div>
                  {recentActivities.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', padding: '0.75rem 1rem',
                        background: 'var(--surface-hover)', borderRadius: '10px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.storeName}</div>
                        <p style={{
                          fontSize: '0.75rem', color: 'var(--text-dim)',
                          marginTop: '2px', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px'
                        }}>
                          {a.notes || '—'}
                        </p>
                      </div>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: a.is_resolved ? 'var(--success)' : '#f59e0b'
                      }} />
                    </motion.div>
                  ))}
                </>
              )
            ) : (
              overdueActivities.slice(0, 4).map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                  style={{
                    padding: '0.875rem 1rem', borderRadius: '12px',
                    borderLeft: '3px solid var(--danger)',
                    background: 'rgba(239,68,68,0.04)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderLeftWidth: '3px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{activity.storeName}</div>
                      <p style={{
                        fontSize: '0.775rem', color: 'var(--text-secondary)',
                        marginTop: '3px', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {activity.notes}
                      </p>
                    </div>
                    <span className="badge badge-danger" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                      {activity.follow_up_date}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {(overdueActivities.length > 0 || recentActivities.length > 0) && (
            <motion.button
              whileHover={{ x: 4 }}
              className="btn-secondary"
              style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
              onClick={() => onNavigate?.('activities')}
            >
              View all activities <ArrowRight size={15} />
            </motion.button>
          )}
        </motion.div>

        {/* Insights panel */}
        <motion.div className="glass-card" style={{ padding: '1.75rem' }} {...fadeUp(0.35)}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--primary-color)" />
            Quick Insights
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Completion rate */}
            <div style={{
              padding: '1rem', background: 'var(--surface-hover)',
              borderRadius: '12px', border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Completion Rate
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)' }}>
                  {completionRate}%
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 9999 }}>
                <motion.div
                  style={{ height: '100%', background: 'var(--success)', borderRadius: 9999 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Pending ratio */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{
                flex: 1, padding: '0.875rem', background: 'rgba(239,68,68,0.06)',
                borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
                  {overdueActivities.length}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500, marginTop: '2px' }}>
                  Overdue
                </div>
              </div>
              <div style={{
                flex: 1, padding: '0.875rem', background: 'rgba(245,158,11,0.06)',
                borderRadius: '12px', border: '1px solid rgba(245,158,11,0.15)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                  {stats.pendingTasks}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500, marginTop: '2px' }}>
                  Pending
                </div>
              </div>
              <div style={{
                flex: 1, padding: '0.875rem', background: 'rgba(16,185,129,0.06)',
                borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                  {stats.completedTasks}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500, marginTop: '2px' }}>
                  Resolved
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ x: 5 }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
              onClick={() => onNavigate?.('stats')}
            >
              Full Report <ArrowRight size={15} />
            </motion.button>
          </div>
        </motion.div>

      {/* ── Commercial Cycle Report ── */}
      {cycleReport.total > 0 && (
        <motion.div className="glass-card" style={{ padding: '1.75rem', marginTop: '1.5rem' }} {...fadeUp(0.4)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary-color)" />
              Cycle Performance — {getCommercialCycle(new Date()).cycleMonth}
            </h3>
            <button
              onClick={handlePrintWeeklyReport}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--border-color)',
                background: 'var(--surface-hover)', color: 'var(--text-secondary)',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              title="Print / Export Weekly Report"
            >
              <Printer size={14} /> Print Weekly
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Cycle Activities', value: cycleReport.total, color: 'var(--primary-color)' },
              { label: 'Stores Covered', value: cycleReport.uniqueStores, color: 'var(--accent-color)' },
              { label: 'Cycle Completion', value: `${cycleReport.completionPct}%`, color: 'var(--success)' },
              { label: 'Daily Average', value: cycleReport.avgPerDay, color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', fontWeight: 600 }}>{item.label}</div>
              </div>
            ))}
          </div>
          {(cycleReport.byType.call > 0 || cycleReport.byType.visit > 0 || cycleReport.byType.whatsapp > 0 || cycleReport.byType.online > 0) && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '1rem' }}>
              {[
                { label: `📞 ${cycleReport.byType.call} Call`, show: cycleReport.byType.call > 0 },
                { label: `🚗 ${cycleReport.byType.visit} Visit`, show: cycleReport.byType.visit > 0 },
                { label: `💬 ${cycleReport.byType.whatsapp} WhatsApp`, show: cycleReport.byType.whatsapp > 0 },
                { label: `🌐 ${cycleReport.byType.online} Online`, show: cycleReport.byType.online > 0 },
              ].filter(t => t.show).map(t => (
                <span key={t.label} style={{ padding: '4px 12px', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {t.label}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      </div>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        .quick-actions-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 0.75rem; 
        }
        .bottom-row-grid { 
          display: grid; 
          grid-template-columns: 1.5fr 1fr; 
          gap: 1.5rem; 
        }

        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
          .quick-actions-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .bottom-row-grid { grid-template-columns: 1fr; gap: 1rem; }
        }

        @media (max-width: 820px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
          .quick-actions-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
        }

        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
          .quick-actions-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
          .bottom-row-grid { grid-template-columns: 1fr; gap: 1rem; }
        }

        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; gap: 0.5rem; }
          .quick-actions-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
        }
      `}</style>
    </div>
  );
};


export default Overview;
