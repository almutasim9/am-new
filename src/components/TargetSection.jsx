import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Target, TrendingUp, AlertCircle, Settings, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isWithinInterval, eachDayOfInterval } from 'date-fns';

import { targetService } from '../services/api';
import { getCommercialCycle } from '../utils/commercialCycle';

// PostgREST error code: no rows returned by .maybeSingle() when table missing
const POSTGREST_NOT_FOUND = 'PGRST116';

const TargetSection = ({ activities, stores = [], storeOffers = [] }) => {
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    monthly_goal: 200,
    include_weekend: false,
    highlights_target_pct: 0,
    discount_ratio_target_pct: 0,
    offers_target_pct: 0
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const { start: cycleStart, end: cycleEnd, cycleMonth: currentMonthYear } = useMemo(
    () => getCommercialCycle(new Date()),
    []
  );

  const fetchTarget = useCallback(async () => {
    try {
      const data = await targetService.getForMonth(currentMonthYear);
      if (data) {
        setTarget(data);
        setEditForm({
          monthly_goal: data.monthly_goal,
          include_weekend: data.include_weekend,
          highlights_target_pct: Number(data.highlights_target_pct || 0),
          discount_ratio_target_pct: Number(data.discount_ratio_target_pct || 0),
          offers_target_pct: Number(data.offers_target_pct || 0)
        });
      } else {
        const defaultTarget = {
          month_year: currentMonthYear,
          monthly_goal: 200,
          include_weekend: false,
          highlights_target_pct: 0,
          discount_ratio_target_pct: 0,
          offers_target_pct: 0
        };
        setTarget(defaultTarget);
        setEditForm({
          monthly_goal: 200,
          include_weekend: false,
          highlights_target_pct: 0,
          discount_ratio_target_pct: 0,
          offers_target_pct: 0
        });
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
  }, [currentMonthYear]);

  useEffect(() => {
    fetchTarget();
  }, [fetchTarget]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await targetService.save({
        month_year: currentMonthYear,
        monthly_goal: parseInt(editForm.monthly_goal),
        include_weekend: editForm.include_weekend,
        highlights_target_pct: Number(editForm.highlights_target_pct) || 0,
        discount_ratio_target_pct: Number(editForm.discount_ratio_target_pct) || 0,
        offers_target_pct: Number(editForm.offers_target_pct) || 0
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

    const monthCalls = activities.filter(a =>
      isWithinInterval(new Date(a.created_at), { start: cycleStart, end: cycleEnd })
    );

    const isWorkDay = (date) => {
      if (target.include_weekend) return true;
      const day = date.getDay();
      return day >= 0 && day <= 4; // Sun (0) to Thu (4)
    };

    const cycleDays = eachDayOfInterval({ start: cycleStart, end: cycleEnd });
    const monthWorkDays = cycleDays.filter(isWorkDay).length;

    const monthlyGoal = Number(target.monthly_goal || 0);
    const monthlyProgress = monthlyGoal > 0 ? (monthCalls.length / monthlyGoal) * 100 : 0;

    // Commercial-sheet-based goal stats
    const commercialStores = stores.filter(s => {
      const gmv = Number(s.performance_data?.commercial?.gmv || 0);
      return gmv > 0;
    });
    const activeCount = commercialStores.length;

    const storesWithHighlights = commercialStores.filter(s =>
      Number(s.performance_data?.commercial?.highlights || 0) > 0
    ).length;

    const totalGmv = commercialStores.reduce((acc, s) => acc + Number(s.performance_data?.commercial?.gmv || 0), 0);
    const totalMv  = commercialStores.reduce((acc, s) => acc + Number(s.performance_data?.commercial?.total_mv || 0), 0);

    const highlightsTargetPct = Number(target.highlights_target_pct || 0);
    const discountRatioTargetPct = Number(target.discount_ratio_target_pct || 0);

    const highlightsTargetCount = Math.round((highlightsTargetPct / 100) * activeCount);

    const currentHighlightsPct = activeCount > 0 ? (storesWithHighlights / activeCount) * 100 : 0;
    const currentDiscountRatioPct = totalGmv > 0 ? (totalMv / totalGmv) * 100 : 0;

    // Offers Target calculation
    const overallActiveStores = stores.filter(s => s.is_active && !s.deleted_at).length;
    const storeOfferCounts = {};
    storeOffers.forEach(so => {
      storeOfferCounts[so.store_id] = (storeOfferCounts[so.store_id] || 0) + 1;
    });
    const storesWithOffers = Object.values(storeOfferCounts).filter(count => count >= 1).length;
    
    const offersTargetPct = Number(target.offers_target_pct || 0);
    const offersTargetCount = Math.round((offersTargetPct / 100) * overallActiveStores);
    const currentOffersPct = overallActiveStores > 0 ? (storesWithOffers / overallActiveStores) * 100 : 0;

    return {
      monthTotal: monthCalls.length,
      monthlyGoal: Math.round(monthlyGoal),
      monthlyProgress: Math.min(100, Math.round(monthlyProgress)),
      monthWorkDays,
      activeCount,
      storesWithHighlights,
      highlightsTargetPct,
      highlightsTargetCount,
      currentHighlightsPct,
      discountRatioTargetPct,
      currentDiscountRatioPct,
      overallActiveStores,
      storesWithOffers,
      offersTargetPct,
      offersTargetCount,
      currentOffersPct
    };
  }, [activities, target, stores, cycleStart, cycleEnd, storeOffers]);

  if (loading) return (
    <div className="glass-card" style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" color="var(--primary-color)" />
    </div>
  );

  if (error === 'setup_required') return (
    <div className="section-container">
      <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--danger)' }}>
        <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Setup Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
          To load the Targets section, please run the SQL migration script in your Supabase dashboard. This will create the necessary tables and functions.
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
          <p className="stat-label">Track your monthly goal and commercial coverage</p>
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
                <label>Monthly Target (Calls)</label>
                <input
                  type="number"
                  value={editForm.monthly_goal}
                  onChange={(e) => setEditForm({...editForm, monthly_goal: e.target.value})}
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
              <div className="form-group">
                <label>Highlights Coverage Target % (Commercial)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editForm.highlights_target_pct}
                  onChange={(e) => setEditForm({...editForm, highlights_target_pct: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Discount Ratio Target % (MV/GMV)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editForm.discount_ratio_target_pct}
                  onChange={(e) => setEditForm({...editForm, discount_ratio_target_pct: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Active Offers Target % (1+ Offer)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editForm.offers_target_pct}
                  onChange={(e) => setEditForm({...editForm, offers_target_pct: e.target.value})}
                />
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
        {/* Monthly Progress Card */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="stat-label">
              Monthly Progress ({stats.monthWorkDays} work days)
              <br />
              <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                {format(cycleStart, 'MMM d')} → {format(cycleEnd, 'MMM d')}
              </span>
            </div>
            <Target size={20} color="#10b981" />
          </div>
          <div className="stat-value" style={{ marginBottom: '0.5rem' }}>
            {stats.monthTotal} <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/ {stats.monthlyGoal} goal</span>
          </div>
          <div style={{ height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.monthlyProgress}%` }}
              style={{ height: '100%', background: stats.monthTotal >= stats.monthlyGoal ? 'var(--success)' : '#10b981' }}
            />
          </div>
          <p className="stat-label" style={{ fontSize: '0.75rem' }}>
            {stats.monthlyProgress}% of monthly goal · {Math.max(0, stats.monthlyGoal - stats.monthTotal)} remaining
          </p>
        </div>

        {/* Highlights Coverage Card (Commercial) */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="stat-label">Highlights Coverage (Commercial)</div>
            <Target size={20} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ marginBottom: '0.5rem' }}>
            {stats.storesWithHighlights}
            <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}> / {stats.highlightsTargetCount} goal</span>
          </div>
          <div style={{ height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, stats.highlightsTargetCount > 0 ? (stats.storesWithHighlights / stats.highlightsTargetCount) * 100 : 0)}%` }}
              style={{ height: '100%', background: stats.storesWithHighlights >= stats.highlightsTargetCount ? 'var(--success)' : '#f59e0b' }}
            />
          </div>
          <p className="stat-label" style={{ fontSize: '0.75rem' }}>
            Current {stats.currentHighlightsPct.toFixed(1)}% — Target {stats.highlightsTargetPct}% of {stats.activeCount} active stores
          </p>
        </div>

        {/* Discount Ratio Card (MV/GMV) */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="stat-label">Discount Ratio (MV / GMV)</div>
            <TrendingUp size={20} color="#ef4444" />
          </div>
          <div className="stat-value" style={{ marginBottom: '0.5rem' }}>
            {stats.currentDiscountRatioPct.toFixed(1)}%
            <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}> / {stats.discountRatioTargetPct}% goal</span>
          </div>
          <div style={{ height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, stats.discountRatioTargetPct > 0 ? (stats.currentDiscountRatioPct / stats.discountRatioTargetPct) * 100 : 0)}%` }}
              style={{ height: '100%', background: stats.currentDiscountRatioPct >= stats.discountRatioTargetPct ? 'var(--success)' : '#ef4444' }}
            />
          </div>
          <p className="stat-label" style={{ fontSize: '0.75rem' }}>
            {stats.currentDiscountRatioPct >= stats.discountRatioTargetPct
              ? 'Target Achieved ✓'
              : `${(stats.discountRatioTargetPct - stats.currentDiscountRatioPct).toFixed(1)}% remaining to reach target`}
          </p>
        </div>

        {/* Offers Target Card */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="stat-label">Active Offers Target (1+ Offer)</div>
            <Target size={20} color="#8b5cf6" />
          </div>
          <div className="stat-value" style={{ marginBottom: '0.5rem' }}>
            {stats.storesWithOffers}
            <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}> / {stats.offersTargetCount} goal</span>
          </div>
          <div style={{ height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, stats.offersTargetCount > 0 ? (stats.storesWithOffers / stats.offersTargetCount) * 100 : 0)}%` }}
              style={{ height: '100%', background: stats.storesWithOffers >= stats.offersTargetCount ? 'var(--success)' : '#8b5cf6' }}
            />
          </div>
          <p className="stat-label" style={{ fontSize: '0.75rem' }}>
            Current {stats.currentOffersPct.toFixed(1)}% — Target {stats.offersTargetPct}% of {stats.overallActiveStores} total stores
          </p>
        </div>
      </div>
    </div>
  );
};

export default TargetSection;
