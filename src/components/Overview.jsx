import React, { useMemo } from 'react';
import {
  Target, Users, CheckCircle, Clock, ArrowRight, AlertCircle,
  Calendar, TrendingUp, Zap, PhoneCall, Activity, Star, Store
} from 'lucide-react';
import { motion } from 'framer-motion';
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
