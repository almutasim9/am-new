import React, { useMemo, useState } from 'react';
import {
  Target, Users, CheckCircle, Clock, ArrowRight, AlertCircle,
  Calendar, TrendingUp, Zap, PhoneCall, Activity, Star, Store,
  BellOff, Printer, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isWithinInterval, startOfDay, endOfDay, eachDayOfInterval,
  differenceInDays, format
} from 'date-fns';
import { getOverdueActivities } from '../services/notificationService';

// ── helpers ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'مساء الخير';
  return 'مساء النور';
};

const formatDate = () =>
  new Date().toLocaleDateString('ar-SA', {
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
const Overview = ({ stats, activities = [], stores = [], onNavigate }) => {
  const overdueActivities = getOverdueActivities(activities, stores);
  const [ghostExpanded, setGhostExpanded] = useState(false);

  const completionRate = useMemo(() =>
    stats.totalActivities > 0
      ? Math.round((stats.completedTasks / stats.totalActivities) * 100)
      : 0,
    [stats]
  );

  const recentActivities = useMemo(() =>
    [...activities]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(a => ({
        ...a,
        storeName: stores.find(s => s.id === a.store_id)?.name || 'Unknown'
      })),
    [activities, stores]
  );

  const quickActions = [
    { label: 'إضافة نشاط',      icon: PhoneCall,  tab: 'activities', color: 'var(--primary-color)' },
    { label: 'عرض المتاجر',     icon: Users,       tab: 'stores',     color: 'var(--accent-color)'  },
    { label: 'تقارير الأداء',   icon: TrendingUp,  tab: 'stats',      color: '#10b981'              },
    { label: 'الهدف الأسبوعي',  icon: Target,      tab: 'target',     color: '#f59e0b'              },
  ];

  // ── Monthly self-report ───────────────────────────────────────────────────
  const monthlyReport = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthActivities = activities.filter(a => {
      try {
        return isWithinInterval(new Date(a.created_at), { start: startOfDay(monthStart), end: endOfDay(monthEnd) });
      } catch { return false; }
    });

    const uniqueStores = new Set(monthActivities.map(a => a.store_id)).size;
    const resolved = monthActivities.filter(a => a.is_resolved).length;
    const completionPct = monthActivities.length > 0 ? Math.round((resolved / monthActivities.length) * 100) : 0;

    // Work days passed this month (Sun–Thu)
    const allDays = eachDayOfInterval({ start: monthStart, end: now });
    const workDaysPassed = allDays.filter(d => { const day = d.getDay(); return day >= 0 && day <= 4; }).length;
    const avgPerDay = workDaysPassed > 0 ? (monthActivities.length / workDaysPassed).toFixed(1) : '0';

    // Top outcome
    const outcomeCounts = monthActivities.reduce((acc, a) => {
      acc[a.outcome_id] = (acc[a.outcome_id] || 0) + 1;
      return acc;
    }, {});
    const topOutcomeId = Object.entries(outcomeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Contact type breakdown
    const byType = {
      call:     monthActivities.filter(a => !a.contact_type || a.contact_type === 'call').length,
      visit:    monthActivities.filter(a => a.contact_type === 'visit').length,
      whatsapp: monthActivities.filter(a => a.contact_type === 'whatsapp').length,
      online:   monthActivities.filter(a => a.contact_type === 'online').length,
    };

    return { total: monthActivities.length, uniqueStores, resolved, completionPct, avgPerDay, topOutcomeId, byType, workDaysPassed };
  }, [activities]);

  // ── Ghost stores: active stores with no contact in 7+ days ─────────────────
  const ghostStores = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    return stores
      .filter(s => !s.deleted_at && s.is_active)
      .filter(store => {
        const last = activities
          .filter(a => a.store_id === store.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        if (!last) return true;
        return new Date(last.created_at) < cutoff;
      })
      .map(store => {
        const last = activities
          .filter(a => a.store_id === store.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const daysSince = last ? differenceInDays(new Date(), new Date(last.created_at)) : null;
        return { ...store, daysSince };
      })
      .sort((a, b) => {
        if (a.daysSince === null) return -1;
        if (b.daysSince === null) return 1;
        return b.daysSince - a.daysSince;
      });
  }, [stores, activities]);

  // ── Weekly PDF Report ───────────────────────────────────────────────────────
  const handlePrintWeeklyReport = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd   = endOfWeek(now,   { weekStartsOn: 0 });

    const weekActs = activities.filter(a => {
      try {
        return isWithinInterval(new Date(a.created_at), {
          start: startOfDay(weekStart), end: endOfDay(weekEnd)
        });
      } catch { return false; }
    });

    const weekStores   = new Set(weekActs.map(a => a.store_id)).size;
    const weekResolved = weekActs.filter(a => a.is_resolved).length;
    const weekPct      = weekActs.length > 0 ? Math.round((weekResolved / weekActs.length) * 100) : 0;
    const byType = {
      call:     weekActs.filter(a => !a.contact_type || a.contact_type === 'call').length,
      visit:    weekActs.filter(a => a.contact_type === 'visit').length,
      whatsapp: weekActs.filter(a => a.contact_type === 'whatsapp').length,
      online:   weekActs.filter(a => a.contact_type === 'online').length,
    };

    const storeCounts = {};
    weekActs.forEach(a => { storeCounts[a.store_id] = (storeCounts[a.store_id] || 0) + 1; });
    const topStores = Object.entries(storeCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, count]) => ({ name: stores.find(s => s.id === id)?.name || id, count }));

    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
    <title>التقرير الأسبوعي</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:40px;direction:rtl;background:#fff}
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
      <h1>📊 التقرير الأسبوعي</h1>
      <p>${format(weekStart,'yyyy/MM/dd')} — ${format(weekEnd,'yyyy/MM/dd')}</p>
    </div>
    <h2>ملخص الأسبوع</h2>
    <div class="grid4">
      <div class="box"><div class="val">${weekActs.length}</div><div class="lbl">إجمالي الأنشطة</div></div>
      <div class="box"><div class="val">${weekStores}</div><div class="lbl">متاجر مغطاة</div></div>
      <div class="box"><div class="val">${weekResolved}</div><div class="lbl">مهام مكتملة</div></div>
      <div class="box"><div class="val">${weekPct}%</div><div class="lbl">نسبة الإنجاز</div></div>
    </div>
    <h2>نوع التواصل</h2>
    <div class="grid2">
      <div class="type-box"><div class="emoji">📞</div><div><div class="cnt">${byType.call}</div><div class="nm">مكالمة</div></div></div>
      <div class="type-box"><div class="emoji">🚗</div><div><div class="cnt">${byType.visit}</div><div class="nm">زيارة</div></div></div>
      <div class="type-box"><div class="emoji">💬</div><div><div class="cnt">${byType.whatsapp}</div><div class="nm">واتساب</div></div></div>
      <div class="type-box"><div class="emoji">🌐</div><div><div class="cnt">${byType.online}</div><div class="nm">أونلاين</div></div></div>
    </div>
    ${topStores.length > 0 ? `<h2>أكثر المتاجر نشاطاً</h2>${topStores.map(s=>`
      <div class="store-row"><div class="nm">${s.name}</div><div class="badge">${s.count} نشاط</div></div>`).join('')}` : ''}
    <div class="footer">Registry — ${new Date().toLocaleString('ar-SA')}</div>
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
              { key: 'N', label: 'نشاط جديد' },
              { key: 'Ctrl+K', label: 'بحث' },
              { key: 'Esc', label: 'إغلاق' },
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
            {overdueActivities.length} مهام متأخرة تحتاج متابعة
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
                {ghostStores.length} متجر بدون تواصل منذ +7 أيام
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
                    {store.daysSince === null ? 'لم يتم التواصل أبداً' : `${store.daysSince} يوم`}
                  </span>
                </div>
              ))}
              {ghostStores.length > 10 && (
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#b45309', fontWeight: 600, padding: '4px' }}>
                  + {ghostStores.length - 10} متجر آخر
                </div>
              )}
              <button
                className="btn-secondary"
                style={{ marginTop: '4px', width: '100%', justifyContent: 'center', borderColor: 'rgba(245,158,11,0.4)', color: '#b45309' }}
                onClick={() => onNavigate?.('stores')}
              >
                عرض جميع المتاجر <ArrowRight size={14} />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Stat Cards ── */}
      <div className="stats-grid">
        <StatCard
          icon={Users}
          label="المتاجر النشطة"
          value={stats.totalStores}
          color="var(--primary-color)"
          delay={0.05}
        />
        <StatCard
          icon={Store}
          label="المتاجر الغير نشطة"
          value={stats.inactiveStores}
          color="var(--text-dim)"
          delay={0.07}
        />
        <StatCard
          icon={Activity}
          label="إجمالي الأنشطة"
          value={stats.totalActivities}
          color="var(--accent-color)"
          delay={0.1}
        />
        <StatCard
          icon={Clock}
          label="متابعات معلّقة"
          value={stats.pendingTasks}
          color="#f59e0b"
          delay={0.15}
        />
        <StatCard
          icon={CheckCircle}
          label="مهام مكتملة"
          value={stats.completedTasks}
          color="var(--success)"
          pct={completionRate}
          delay={0.2}
        />
      </div>

      {/* ── Quick Actions ── */}
      <motion.div {...fadeUp(0.25)}>
        <p className="stat-label" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
          <Zap size={14} style={{ display: 'inline', marginLeft: '4px' }} />
          إجراءات سريعة
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
                {overdueActivities.length > 0 ? 'تذكيرات اليوم' : 'آخر الأنشطة'}
              </h3>
            </div>
            {overdueActivities.length > 0 && (
              <span className="badge badge-danger">{overdueActivities.length} عاجل</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {overdueActivities.length === 0 ? (
              recentActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  <Star size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.875rem' }}>لا توجد أنشطة بعد</p>
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
                      لا توجد مهام متأخرة — عمل ممتاز!
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
              عرض جميع الأنشطة <ArrowRight size={15} />
            </motion.button>
          )}
        </motion.div>

        {/* Insights panel */}
        <motion.div className="glass-card" style={{ padding: '1.75rem' }} {...fadeUp(0.35)}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--primary-color)" />
            إحصائيات سريعة
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Completion rate */}
            <div style={{
              padding: '1rem', background: 'var(--surface-hover)',
              borderRadius: '12px', border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  نسبة الإنجاز
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
                  متأخرة
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
                  معلّقة
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
                  منجزة
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ x: 5 }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
              onClick={() => onNavigate?.('stats')}
            >
              التقرير الكامل <ArrowRight size={15} />
            </motion.button>
          </div>
        </motion.div>

      {/* ── Monthly AM Self-Report ── */}
      {monthlyReport.total > 0 && (
        <motion.div className="glass-card" style={{ padding: '1.75rem', marginTop: '1.5rem' }} {...fadeUp(0.4)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary-color)" />
              تقريرك الشهري — {new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
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
              title="طباعة / تصدير التقرير الأسبوعي"
            >
              <Printer size={14} /> طباعة أسبوعي
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'إجمالي النشاطات', value: monthlyReport.total, color: 'var(--primary-color)' },
              { label: 'متاجر تم تغطيتها', value: monthlyReport.uniqueStores, color: 'var(--accent-color)' },
              { label: 'نسبة الإنجاز', value: `${monthlyReport.completionPct}%`, color: 'var(--success)' },
              { label: 'معدل يومي', value: monthlyReport.avgPerDay, color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{ padding: '1rem', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', fontWeight: 600 }}>{item.label}</div>
              </div>
            ))}
          </div>
          {(monthlyReport.byType.call > 0 || monthlyReport.byType.visit > 0 || monthlyReport.byType.whatsapp > 0 || monthlyReport.byType.online > 0) && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '1rem' }}>
              {[
                { label: `📞 ${monthlyReport.byType.call} مكالمة`, show: monthlyReport.byType.call > 0 },
                { label: `🚗 ${monthlyReport.byType.visit} زيارة`, show: monthlyReport.byType.visit > 0 },
                { label: `💬 ${monthlyReport.byType.whatsapp} واتساب`, show: monthlyReport.byType.whatsapp > 0 },
                { label: `🌐 ${monthlyReport.byType.online} أونلاين`, show: monthlyReport.byType.online > 0 },
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
