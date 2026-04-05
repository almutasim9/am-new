import React, { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, Settings, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, startOfWeek, endOfWeek, isWithinInterval, 
  isSameDay, startOfMonth, endOfMonth, eachDayOfInterval,
  isSunday, isMonday, isTuesday, isWednesday, isThursday
} from 'date-fns';
import { targetService } from '../services/api';

// PostgREST error code: no rows returned by .maybeSingle() when table missing
const POSTGREST_NOT_FOUND = 'PGRST116';

const TargetSection = ({ activities }) => {
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ weekly_goal: 50, include_weekend: false });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const currentMonthYear = format(new Date(), 'yyyy-MM');
  const now = new Date();

  useEffect(() => {
    fetchTarget();
  }, []);

  const fetchTarget = async () => {
    try {
      const data = await targetService.getForMonth(currentMonthYear);
      if (data) {
        setTarget(data);
        setEditForm({ weekly_goal: data.weekly_goal, include_weekend: data.include_weekend });
      } else {
        const defaultTarget = { month_year: currentMonthYear, weekly_goal: 50, include_weekend: false };
        setTarget(defaultTarget);
        setEditForm({ weekly_goal: 50, include_weekend: false });
      }
      setError(null);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching target:', error);
      if (error.code === POSTGREST_NOT_FOUND || error.message?.includes('targets')) {
        setError('setup_required');
      } else {
        setError('fetch_failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await targetService.save({
        month_year: currentMonthYear,
        weekly_goal: parseInt(editForm.weekly_goal),
        include_weekend: editForm.include_weekend
      });
      setTarget(saved);
      setIsEditing(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to save target:', error);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    if (!target) return null;

    const sun = startOfWeek(now, { weekStartsOn: 0 });
    const sat = endOfWeek(now, { weekStartsOn: 0 });

    const weekCalls = activities.filter(a => 
      isWithinInterval(new Date(a.created_at), { start: sun, end: sat })
    );

    const todayCalls = activities.filter(a => isSameDay(new Date(a.created_at), now)).length;

    // Define work days based on settings
    const isWorkDay = (date) => {
      if (target.include_weekend) return true;
      const day = date.getDay();
      return day >= 0 && day <= 4; // Sun (0) to Thu (4)
    };

    const weekDays = eachDayOfInterval({ start: sun, end: sat });
    const totalWorkDays = weekDays.filter(isWorkDay).length;
    const workDaysPassed = weekDays.filter(d => d <= now && isWorkDay(d)).length;

    const dailyTarget = totalWorkDays > 0 ? target.weekly_goal / totalWorkDays : 0;
    const expectedSoFar = dailyTarget * workDaysPassed;

    const weeklyProgress = target.weekly_goal > 0 ? (weekCalls.length / target.weekly_goal) * 100 : 0;
    const status = todayCalls >= dailyTarget ? 'exceeded' : 'on-track';
    const difference = todayCalls - dailyTarget;

    return {
      weekTotal: weekCalls.length,
      todayTotal: todayCalls,
      dailyTarget: Math.round(dailyTarget),
      difference: Math.round(difference),
      weeklyProgress: Math.min(100, Math.round(weeklyProgress)),
      totalWorkDays,
      workDaysPassed,
      status
    };
  }, [activities, target]);

  if (loading) return (
    <div className="glass-card" style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" color="var(--primary-color)" />
    </div>
  );

  if (error === 'setup_required') return (
    <div className="section-container">
      <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--danger)' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Setup Required / الإعداد مطلوب</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
          To load the Targets section, run the SQL migration script in your Supabase dashboard.
          <br />
          <span style={{ fontSize: '0.85em', opacity: 0.7 }}>
            لتحميل قسم التارغت، يرجى تشغيل أوامر الـ SQL في لوحة Supabase.
          </span>
        </p>
        <div style={{ background: '#020617', padding: '1rem', borderRadius: '12px', textAlign: 'left', overflowX: 'auto', marginBottom: '1.5rem' }}>
          <code style={{ color: '#818cf8', fontSize: '0.8rem' }}>
            CREATE TABLE targets ( id SERIAL PRIMARY KEY, month_year VARCHAR(7) NOT NULL UNIQUE... )
          </code>
        </div>
      </div>
    </div>
  );

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2 className="gradient-text">Performance Targets</h2>
          <p className="stat-label">Track your weekly goals and daily output</p>
        </div>
        <button 
          className="btn-secondary" 
          onClick={() => setIsEditing(!isEditing)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Settings size={16} />
          {isEditing ? 'Cancel' : 'Set Goals'}
        </button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-card"
            style={{ padding: '1.5rem', marginBottom: '1.5rem', overflow: 'hidden' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Weekly Target (Calls)</label>
                <input 
                  type="number" 
                  value={editForm.weekly_goal} 
                  onChange={(e) => setEditForm({...editForm, weekly_goal: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
                <input 
                  type="checkbox" 
                  id="include_weekend"
                  checked={editForm.include_weekend}
                  onChange={(e) => setEditForm({...editForm, include_weekend: e.target.checked})}
                  style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="include_weekend" style={{ marginBottom: 0 }}>Include Fri/Sat in Target</label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Target
                </button>
                {saveError && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                    Failed to save. Please try again.
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1.25rem' }}>
        {/* Weekly Progress Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="stat-label">Weekly Progress</div>
            <Target size={20} color="var(--primary-color)" />
          </div>
          <div className="stat-value" style={{ marginBottom: '0.5rem' }}>
            {stats.weekTotal} <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/ {target.weekly_goal}</span>
          </div>
          <div style={{ height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.weeklyProgress}%` }}
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))' }}
            />
          </div>
          <p className="stat-label" style={{ fontSize: '0.75rem' }}>{stats.weeklyProgress}% of your weekly goal reached</p>
        </div>

        {/* Daily Performance Card */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: `4px solid ${stats.status === 'exceeded' ? 'var(--success)' : 'var(--primary-color)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="stat-label">Daily Output ({target?.include_weekend ? 'Sun-Sat' : 'Sun-Thu'})</div>
            <TrendingUp size={20} color={stats.status === 'exceeded' ? 'var(--success)' : 'var(--primary-color)'} />
          </div>
          <div className="stat-value" style={{ marginBottom: '0.5rem' }}>
            {stats.todayTotal} <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/ {stats.dailyTarget} goal</span>
          </div>
          
          <AnimatePresence mode="wait">
            {stats.difference > 0 ? (
              <motion.div 
                key="exceeded"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}
              >
                <CheckCircle2 size={16} />
                +{stats.difference} calls above daily target!
              </motion.div>
            ) : (
              <motion.div 
                key="remaining"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.875rem' }}
              >
                <AlertCircle size={16} />
                {Math.abs(stats.difference)} more calls to hit daily target
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TargetSection;
