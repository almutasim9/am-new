import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { Upload, Database, CheckCircle, AlertCircle, BarChart3, TrendingUp, RefreshCw, ShoppingCart, DollarSign, Star, Search } from 'lucide-react';
import { storeService } from '../services/api';

const PerformanceDashboard = ({ stores = [], onFetchInitialData, notify }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportStats, setReportStats] = useState(null);
  const [unmatchedStores, setUnmatchedStores] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('monthly');
  const [perfSearch, setPerfSearch] = useState('');
  const [compareIds, setCompareIds] = useState([]);
  const [compareMode, setCompareMode] = useState(false);

  const getStats = (store) => {
    // defaults back to root fields if performance_data is not ready
    if (!store.performance_data || !store.performance_data[activeTab] || Object.keys(store.performance_data[activeTab]).length === 0) {
      if (activeTab === 'monthly') return store;
      return {}; 
    }
    return store.performance_data[activeTab];
  };

  const getActiveTabLabel = () => {
    if (activeTab === 'monthly') return 'الشهر الجاري';
    if (activeTab === 'commercial') return 'تجاري (19-18)';
    if (activeTab === 'yesterday') return 'البارحة';
    return '';
  };

  // Filter stores that have performance data on the currently active tab
  const performingStores = stores.filter(s => {
    const st = getStats(s);
    return st.gmv !== undefined && st.gmv !== null && Number(st.gmv) > 0;
  }).sort((a, b) => Number(getStats(b).gmv) - Number(getStats(a).gmv));

  const filteredPerfStores = perfSearch
    ? performingStores.filter(s => s.name.toLowerCase().includes(perfSearch.toLowerCase()) || String(s.id).includes(perfSearch))
    : performingStores;

  const toggleCompare = (id) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  };

  const totalGMV = stores.reduce((acc, s) => acc + Number(getStats(s).gmv || 0), 0);
  const totalOrders = stores.reduce((acc, s) => acc + Number(getStats(s).orders || 0), 0);
  const totalDiscount = stores.reduce((acc, s) => acc + Number(getStats(s).discount_amount || 0), 0);
  
  const avgRating = performingStores.length > 0 
    ? (performingStores.reduce((acc, curr) => acc + Number(getStats(curr).ratings || 0), 0) / performingStores.length).toFixed(1) 
    : 0;
  
  const discountRatio = totalGMV > 0 ? ((totalDiscount / totalGMV) * 100).toFixed(1) : 0;

  const formatPercent = (val) => {
    if (!val) return '0%';
    // If it's already large (like 20), don't multiply by 100. Assume > 1 means it's already %
    const num = Number(val);
    if (num > 1) return num.toFixed(1) + '%';
    return (num * 100).toFixed(1) + '%';
  };

  const formatCurrency = (val) => {
    if (!val) return '0';
    return Number(val).toLocaleString();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const updatesMap = {};
      
      // Initialize ALL stores to an empty state to wipe previous data completely
      // This ensures any stores not in the new file are cleared, matching the user request to "delete the previous file"
      stores.forEach(s => {
        updatesMap[s.id] = {
          id: s.id,
          performance_data: { monthly: {}, commercial: {}, yesterday: {} },
          // Reset root level metrics as well
          orders: null, gmv: null, ratings: null, avg_cart: null, 
          discount_amount: null, delivery: null, items_total: null, 
          total_mv: null, total_mvh: null, mv_percent: null, 
          mvh_percent: null, highlights: null, hl_percent: null, 
          new_hl_percent: null, store_credits_use: null, 
          discount_percent: null, toters_plus_percent: null, 
          orders_percent: null,
          is_active: false,
          last_sync_date: new Date().toISOString()
        };
      });

      let anyMatched = 0;
      const unmatchedMap = {}; // key: storeIdRaw or storeNameRaw → { id, name }

      const sheetTypes = [
        { key: 'monthly', searchFor: 'Monthly Calendar', label: 'شهري' },
        { key: 'commercial', searchFor: 'Commercial Calendar', label: 'تجاري' },
        { key: 'yesterday', searchFor: 'Yesterday', label: 'البارحة' }
      ];
      
      let sheetsFound = [];

      for (const st of sheetTypes) {
        const actualName = workbook.SheetNames.find(n => n.toLowerCase().includes(st.searchFor.toLowerCase()));
        if (!actualName) continue;
        
        sheetsFound.push(st.label);

        const worksheet = workbook.Sheets[actualName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (json.length < 5) continue;

        let headerRowIdx = -1;
        for (let i = 0; i < 10; i++) {
          if (json[i] && typeof json[i] === 'object' && Object.values(json[i]).some(val => typeof val === 'string' && val.includes('Store Name'))) {
             headerRowIdx = i;
             break;
          }
        }
        if (headerRowIdx === -1) {
          // Alternative approach: search array elements if not object
          for (let i = 0; i < 10; i++) {
            if (json[i] && Array.isArray(json[i]) && json[i].includes('Store Name')) {
              headerRowIdx = i;
              break;
            }
          }
        }
        if (headerRowIdx === -1) continue;

        const headers = json[headerRowIdx];
        const idIdx = headers.findIndex(h => h === 'Store ID' || h === 'ID');
        const nameIdx = headers.findIndex(h => h === 'Store Name');
        const ordersIdx = headers.findIndex(h => h === 'Orders');
        const gmvIdx = headers.findIndex(h => h === 'GMV');
        const ratingsIdx = headers.findIndex(h => h === 'Ratings');
        const avgCartIdx = headers.findIndex(h => h === 'Avg. Cart');
        const discountIdx = headers.findIndex(h => h === 'Discount');
        const deliveryIdx = headers.findIndex(h => h === 'Delivery');
        const itemsTotalIdx = headers.findIndex(h => h === 'Items Total');
        const totalMvIdx = headers.findIndex(h => h === 'Total MV');
        const totalMvhIdx = headers.findIndex(h => h === 'Total MVH');
        const mvPercentIdx = headers.findIndex(h => h === 'MV %');
        const mvhPercentIdx = headers.findIndex(h => h === 'MVH %');
        const highlightsIdx = headers.findIndex(h => h === 'Highlights' || h === 'Highlight');
        const hlPercentIdx = headers.findIndex(h => h === 'HL %');
        const newHlPercentIdx = headers.findIndex(h => h === 'New HL %' || h === 'New HL%');
        const storeCreditsIdx = headers.findIndex(h => h === 'Store Credits Use' || h === 'Store Credits Used');
        const discountPercentIdx = headers.findIndex(h => h === 'Discount %');
        const totersPlusPercentIdx = headers.findIndex(h => h === 'Toters+ %' || h === 'Toters+ Stores %');
        const ordersPercentIdx = headers.findIndex(h => h === 'Orders %');

        for (let i = headerRowIdx + 1; i < json.length; i++) {
          const row = json[i];
          if (!row || !row[nameIdx]) continue;
          
          let storeIdRaw = idIdx > -1 ? String(row[idIdx] || '').trim() : null;
          let storeNameRaw = String(row[nameIdx]).trim();
          if (storeNameRaw.toLowerCase() === 'grand total' || !storeNameRaw) continue;

          let dbStore = null;
          
          // 1. Try mapping precisely by Store ID first (Most accurate)
          if (storeIdRaw) {
             dbStore = stores.find(s => String(s.id).trim().toLowerCase() === storeIdRaw.toLowerCase());
          }
          
          // 2. Fallback to mapping by Store Name 
          if (!dbStore) {
            dbStore = stores.find(s => 
              s.name.toLowerCase().trim() === storeNameRaw.toLowerCase() || 
              s.name.includes(storeNameRaw) || 
              storeNameRaw.includes(s.name)
            );
          }

          if (!dbStore) {
            const key = storeIdRaw || storeNameRaw;
            if (!unmatchedMap[key]) {
              unmatchedMap[key] = { id: storeIdRaw || '—', name: storeNameRaw };
            }
          }

          if (dbStore) {
            anyMatched++;

            const metricsObj = {
              orders: parseFloat(row[ordersIdx]) || 0,
              gmv: parseFloat(row[gmvIdx]) || 0,
              ratings: parseFloat(row[ratingsIdx]) || 0,
              avg_cart: parseFloat(String(row[avgCartIdx]).replace(/,/g, '')) || 0,
              discount_amount: parseFloat(String(row[discountIdx]).replace(/,/g, '')) || 0,
              delivery: parseFloat(String(row[deliveryIdx]).replace(/,/g, '')) || 0,
              items_total: itemsTotalIdx > -1 ? (parseFloat(String(row[itemsTotalIdx]).replace(/,/g, '')) || 0) : 0,
              total_mv: totalMvIdx > -1 ? (parseFloat(String(row[totalMvIdx]).replace(/,/g, '')) || 0) : 0,
              total_mvh: totalMvhIdx > -1 ? (parseFloat(String(row[totalMvhIdx]).replace(/,/g, '')) || 0) : 0,
              mv_percent: mvPercentIdx > -1 ? (parseFloat(String(row[mvPercentIdx]).replace(/%/g, '')) || 0) : 0,
              mvh_percent: mvhPercentIdx > -1 ? (parseFloat(String(row[mvhPercentIdx]).replace(/%/g, '')) || 0) : 0,
              highlights: highlightsIdx > -1 ? (parseFloat(String(row[highlightsIdx]).replace(/,/g, '')) || 0) : 0,
              hl_percent: hlPercentIdx > -1 ? (parseFloat(String(row[hlPercentIdx]).replace(/%/g, '')) || 0) : 0,
              new_hl_percent: newHlPercentIdx > -1 ? (parseFloat(String(row[newHlPercentIdx]).replace(/%/g, '')) || 0) : 0,
              store_credits_use: storeCreditsIdx > -1 ? (parseFloat(String(row[storeCreditsIdx]).replace(/,/g, '')) || 0) : 0,
              discount_percent: discountPercentIdx > -1 ? (parseFloat(String(row[discountPercentIdx]).replace(/%/g, '')) || 0) : 0,
              toters_plus_percent: totersPlusPercentIdx > -1 ? (parseFloat(String(row[totersPlusPercentIdx]).replace(/%/g, '')) || 0) : 0,
              orders_percent: ordersPercentIdx > -1 ? (parseFloat(String(row[ordersPercentIdx]).replace(/%/g, '')) || 0) : 0
            };

            updatesMap[dbStore.id].performance_data[st.key] = metricsObj;
            updatesMap[dbStore.id].is_active = true;

            // Optional: fallback monthly values to the root level variables so old UI doesn't crash prior to complete architectural migration
            if (st.key === 'monthly') {
               Object.assign(updatesMap[dbStore.id], metricsObj);
            }
          }
        }
      }

      setUnmatchedStores(Object.values(unmatchedMap));

      // Filter out stores that didn't receive ANY updates (i.e. they are just empty states)
      // Actually, if we want to wipe them, we SHOULD upload them!
      // But we only want to wipe them if it's a real upload
      const updatesToUpload = Object.values(updatesMap);
      
      // Matched stat calculation (how many unique stores actually got real data)
      const actuallyMatchedCount = updatesToUpload.filter(u => 
        Object.keys(u.performance_data).some(period => Object.keys(u.performance_data[period]).length > 0)
      ).length;
      // Filter out stores that are already softly deleted from the mathematical calculation
      const liveStoresCount = stores.filter(s => !s.deleted_at).length;
      setReportStats({ matched: actuallyMatchedCount, notFound: liveStoresCount - actuallyMatchedCount }); 

      if (anyMatched > 0) {
        await storeService.bulkUpdateMetrics(updatesToUpload);
        notify('success', `تم تحديث ومسح البيانات القديمة لجميع المتاجر. المتاجر المطابقة: ${actuallyMatchedCount} من الشيتات (${sheetsFound.join('، ')})`);
        if (onFetchInitialData) {
          await onFetchInitialData();
        }
      } else {
        notify('error', 'لم يتم مطابقة أي شيتات أو متاجر بطريقة صحيحة.');
      }

    } catch (err) {
      console.error(err);
      notify('error', err.message || 'حدث خطأ أثناء معالجة الملف');
    } finally {
      setIsProcessing(false);
      event.target.value = null; // reset input
    }
  };

  return (
    <div className="section-container">
      <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={28} color="var(--primary-color)" /> لوحة الأداء والمبيعات
          </h2>
          <p className="stat-label">تتبع مبيعات المتاجر، GMV، والطلبات بناءً على تقرير AM</p>
        </div>
        
        {/* Upload Horizontal Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Tabs for Data view */}
          <div style={{ display: 'flex', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '4px', gap: '4px' }}>
            {['monthly', 'commercial', 'yesterday'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === tab ? 'var(--primary-light)' : 'transparent',
                  color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'monthly' ? 'شهري' : tab === 'commercial' ? 'تجاري' : 'البارحة'}
              </button>
            ))}
          </div>

          {reportStats && (
            <div style={{ display: 'flex', gap: '1rem', background: 'var(--surface-color)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>متجر نشط: {reportStats.matched}</span>
              <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>متجر غير نشط: {reportStats.notFound}</span>
            </div>
          )}
          
          <label className="btn-primary" style={{ padding: '12px 24px', cursor: 'pointer', opacity: isProcessing ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', fontWeight: 700 }}>
            {isProcessing ? (
              <><RefreshCw className="animate-spin" size={18} /> جاري المعالجة...</>
            ) : (
              <><Upload size={18} /> رفع تقرير AM (.xlsx)</>
            )}
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileUpload} 
              style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
              disabled={isProcessing}
            />
          </label>
        </div>
      </div>

      {/* Unmatched Stores Panel */}
      {unmatchedStores.length > 0 && (
        <div className="glass-card" style={{
          marginBottom: '1.5rem',
          padding: '1.25rem 1.5rem',
          borderLeft: '4px solid var(--warning, #f59e0b)',
          background: 'rgba(245,158,11,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={18} color="#f59e0b" />
                {unmatchedStores.length} متجر في الملف غير موجود في قاعدة البيانات
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                انسخ الـ ID وأضف المتجر من صفحة المتاجر
              </div>
            </div>
            <button
              onClick={() => setUnmatchedStores([])}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '4px' }}
              title="إغلاق"
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
            {unmatchedStores.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 12px',
                background: 'var(--surface-color)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem'
              }}>
                <span style={{ fontWeight: 600, flex: 1 }}>{s.name}</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-dim)', fontSize: '0.8rem', background: 'var(--surface-hover)', padding: '2px 8px', borderRadius: '6px' }}>
                  {s.id}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(s.id);
                    setCopiedId(s.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  style={{
                    padding: '4px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    background: copiedId === s.id ? 'var(--success)' : 'var(--primary-light)',
                    color: copiedId === s.id ? 'white' : 'var(--primary-color)',
                    fontWeight: 600, fontSize: '0.75rem', transition: 'all 0.2s'
                  }}
                >
                  {copiedId === s.id ? '✓ تم النسخ' : 'نسخ ID'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Global Stats Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
            <p className="stat-label" style={{ marginBottom: '0.5rem' }}>إجمالي GMV (IQD)</p>
            <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{totalGMV.toLocaleString()} IQD</h4>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary-color)' }}>
            <p className="stat-label" style={{ marginBottom: '0.5rem' }}><ShoppingCart size={16} style={{ display: 'inline' }} /> إجمالي الطلبات</p>
            <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-color)' }}>{totalOrders.toLocaleString()}</h4>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
            <p className="stat-label" style={{ marginBottom: '0.5rem' }}><TrendingUp size={16} style={{ display: 'inline' }} /> نسبة الخصم (Discount %)</p>
            <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>{discountRatio}%</h4>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
            <p className="stat-label" style={{ marginBottom: '0.5rem' }}><Star size={16} style={{ display: 'inline' }} /> متوسط التقييمات</p>
            <h4 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{avgRating}</h4>
          </div>
        </div>

          {/* Table of performance */}
          <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <BarChart3 size={20} color="var(--primary-color)" /> أفضل المتاجر أداءً
                {filteredPerfStores.length !== performingStores.length && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>({filteredPerfStores.length} من {performingStores.length})</span>
                )}
              </h3>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="بحث عن متجر..."
                  value={perfSearch}
                  onChange={e => setPerfSearch(e.target.value)}
                  style={{
                    padding: '8px 32px 8px 12px', borderRadius: '10px', border: '1px solid var(--border-color)',
                    background: 'var(--surface-color)', fontSize: '0.85rem', color: 'var(--text-primary)',
                    width: '200px', outline: 'none'
                  }}
                />
              </div>
              {/* Compare toggle */}
              <button
                onClick={() => { setCompareMode(m => !m); setCompareIds([]); }}
                style={{
                  padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-color)',
                  background: compareMode ? 'var(--primary-color)' : 'var(--surface-color)',
                  color: compareMode ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <BarChart3 size={15} /> {compareMode ? 'إلغاء المقارنة' : 'مقارنة'}
              </button>
            </div>

            {/* Compare Panel */}
            {compareMode && compareIds.length === 2 && (() => {
              const storeA = stores.find(s => s.id === compareIds[0]);
              const storeB = stores.find(s => s.id === compareIds[1]);
              if (!storeA || !storeB) return null;
              const stA = getStats(storeA);
              const stB = getStats(storeB);
              const metrics = [
                { label: 'GMV (IQD)', a: Number(stA.gmv || 0), b: Number(stB.gmv || 0), fmt: v => v.toLocaleString() },
                { label: 'الطلبات', a: Number(stA.orders || 0), b: Number(stB.orders || 0), fmt: v => v.toLocaleString() },
                { label: 'متوسط السلة', a: Number(stA.avg_cart || 0), b: Number(stB.avg_cart || 0), fmt: v => v.toLocaleString() },
                { label: 'التقييم', a: Number(stA.ratings || 0), b: Number(stB.ratings || 0), fmt: v => v.toFixed(1) },
                { label: 'MV %', a: Number(stA.mv_percent || 0), b: Number(stB.mv_percent || 0), fmt: v => formatPercent(v) },
                { label: 'HL %', a: Number(stA.hl_percent || 0), b: Number(stB.hl_percent || 0), fmt: v => formatPercent(v) },
                { label: 'Discount', a: Number(stA.discount_amount || 0), b: Number(stB.discount_amount || 0), fmt: v => v.toLocaleString(), lowerIsBetter: true },
              ];
              return (
                <div style={{ marginBottom: '1.5rem', background: 'var(--surface-hover)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--primary-color)', color: 'white', padding: '12px 16px', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>
                    <span style={{ textAlign: 'right' }}>{storeA.name}</span>
                    <span>مقارنة</span>
                    <span style={{ textAlign: 'left' }}>{storeB.name}</span>
                  </div>
                  {metrics.map(m => {
                    const aWins = m.lowerIsBetter ? m.a < m.b : m.a > m.b;
                    const bWins = m.lowerIsBetter ? m.b < m.a : m.b > m.a;
                    return (
                      <div key={m.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', textAlign: 'center', alignItems: 'center' }}>
                        <span style={{ fontWeight: aWins ? 800 : 400, color: aWins ? 'var(--success)' : 'var(--text-secondary)', textAlign: 'right' }}>{m.fmt(m.a)}</span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600 }}>{m.label}</span>
                        <span style={{ fontWeight: bWins ? 800 : 400, color: bWins ? 'var(--success)' : 'var(--text-secondary)', textAlign: 'left' }}>{m.fmt(m.b)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {compareMode && compareIds.length < 2 && (
              <div style={{ padding: '10px 14px', background: 'var(--primary-light)', borderRadius: '10px', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                اختر {compareIds.length === 0 ? 'متجرين' : 'متجر واحد آخر'} من الجدول للمقارنة
              </div>
            )}

            {performingStores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-dim)' }}>
                لا توجد بيانات مبيعات. قم برفع التقرير لعرض المتاجر.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'right' }}>
                  <thead style={{ whiteSpace: 'nowrap' }}>
                    <tr style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {compareMode && <th style={{ padding: '8px 8px' }}></th>}
                      <th style={{ padding: '8px 16px', position: 'sticky', right: 0, background: 'var(--surface-color, #fff)', zIndex: 1 }}>المتجر</th>
                      <th style={{ padding: '8px 16px', borderRight: '1px solid var(--border-color)' }}>الطلبات</th>
                      <th style={{ padding: '8px 16px' }}>GMV</th>
                      <th style={{ padding: '8px 16px' }}>متوسط السلة</th>
                      <th style={{ padding: '8px 16px', borderRight: '1px solid var(--border-color)' }}>MV %</th>
                      <th style={{ padding: '8px 16px' }}>MVH %</th>
                      <th style={{ padding: '8px 16px', borderRight: '1px solid var(--border-color)' }}>Highlights</th>
                      <th style={{ padding: '8px 16px' }}>HL %</th>
                      <th style={{ padding: '8px 16px' }}>New HL %</th>
                      <th style={{ padding: '8px 16px', borderRight: '1px solid var(--border-color)' }}>Discount</th>
                      <th style={{ padding: '8px 16px' }}>التقييم</th>
                      <th style={{ padding: '8px 16px', borderRight: '1px solid var(--border-color)' }}>Toters+ %</th>
                      <th style={{ padding: '8px 16px' }}>Orders %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPerfStores.map((s, idx) => {
                      const st = getStats(s);
                      const isSelected = compareIds.includes(s.id);
                      return (
                      <tr key={s.id}
                          onClick={compareMode ? () => toggleCompare(s.id) : undefined}
                          style={{
                            background: isSelected ? 'var(--primary-light)' : 'var(--surface-hover)',
                            whiteSpace: 'nowrap', transition: 'all 0.2s',
                            cursor: compareMode ? 'pointer' : 'default',
                            outline: isSelected ? '2px solid var(--primary-color)' : 'none',
                            borderRadius: '8px'
                          }}
                          onMouseEnter={(e) => { if (!compareMode) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={(e) => { if (!compareMode) e.currentTarget.style.transform = 'none'; }}>

                        {compareMode && (
                          <td style={{ padding: '14px 8px' }}>
                            <input type="checkbox" readOnly checked={isSelected}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)', cursor: 'pointer' }} />
                          </td>
                        )}
                        <td style={{ padding: '14px 16px', fontWeight: 700, position: 'sticky', right: 0, background: isSelected ? 'var(--primary-light)' : 'var(--surface-hover)', zIndex: 1, borderRadius: '0 8px 8px 0', borderLeft: '2px solid var(--primary-light)' }}>
                          {s.name}
                        </td>
                        
                        <td style={{ padding: '14px 16px', borderRight: '1px solid var(--border-color)' }}>
                          <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
                            {st.orders?.toLocaleString() || 0}
                          </span>
                        </td>
                        
                        <td style={{ padding: '14px 16px', color: 'var(--success)', fontWeight: 800 }}>
                          {formatCurrency(st.gmv)} <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 400 }}>IQD</span>
                        </td>
                        
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {formatCurrency(st.avg_cart)}
                        </td>
                        
                        <td style={{ padding: '14px 16px', borderRight: '1px solid var(--border-color)' }}>
                          <span style={{ color: Number(st.mv_percent) > 0.1 ? '#16a34a' : 'var(--text-dim)', fontWeight: 600 }}>{formatPercent(st.mv_percent)}</span>
                        </td>
                        
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                          {formatPercent(st.mvh_percent)}
                        </td>
                        
                        <td style={{ padding: '14px 16px', borderRight: '1px solid var(--border-color)' }}>
                          {formatCurrency(st.highlights)}
                        </td>
                        
                        <td style={{ padding: '14px 16px', color: '#c026d3', fontWeight: 600 }}>
                          {formatPercent(st.hl_percent)}
                        </td>
                        
                        <td style={{ padding: '14px 16px', color: '#c026d3', fontWeight: 600 }}>
                          {formatPercent(st.new_hl_percent)}
                        </td>
                        
                        <td style={{ padding: '14px 16px', borderRight: '1px solid var(--border-color)', color: '#ef4444', fontWeight: 600 }}>
                          {formatCurrency(st.discount_amount)}
                        </td>
                        
                        <td style={{ padding: '14px 16px', color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {st.ratings || '-'} <Star size={14} fill={st.ratings >= 4 ? '#f59e0b' : 'none'} />
                        </td>
                        
                        <td style={{ padding: '14px 16px', borderRight: '1px solid var(--border-color)', fontWeight: 600 }}>
                          <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                            {formatPercent(st.toters_plus_percent)}
                          </span>
                        </td>
                        
                        <td style={{ padding: '14px 16px', fontWeight: 600, borderRadius: '8px 0 0 8px' }}>
                          {formatPercent(st.orders_percent)}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
        </div>

      </div>

    </div>
  );
};

export default PerformanceDashboard;
