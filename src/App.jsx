import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LayoutDashboard, Store, ClipboardList, CheckCircle2, PhoneOutgoing, Bell, Loader2, BarChart3, TrendingUp, CalendarCheck, Settings as SettingsIcon, AlertCircle, BellOff, Moon, Sun, Bookmark, X } from 'lucide-react';
import './App.css';
const Overview = React.lazy(() => import('./components/Overview'));
const StoreList = React.lazy(() => import('./components/StoreList'));
const ActivityLog = React.lazy(() => import('./components/ActivityLog'));
const Stats = React.lazy(() => import('./components/Stats'));
const TargetSection = React.lazy(() => import('./components/TargetSection'));
const Library = React.lazy(() => import('./components/Library'));
const Settings = React.lazy(() => import('./components/Settings'));
const RecycleBin = React.lazy(() => import('./components/RecycleBin'));
import InstallPrompt from './components/InstallPrompt';
import { storeService, activityService, settingsService, libraryService, offersService } from './services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, showNotification, getOverdueActivities } from './services/notificationService';
import { supabase } from './supabaseClient';

// New Modular Layout Components
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import GlobalSearch from './components/GlobalSearch';
const PerformanceDashboard = React.lazy(() => import('./components/PerformanceDashboard'));
const Offers = React.lazy(() => import('./components/Offers'));
const MenuExtractor = React.lazy(() => import('./components/MenuExtractor'));

import ActivityForm from './components/ActivityForm';

function App() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('mp_active_tab') || 'dashboard');
  const [stores, setStores] = useState([]);
  const [activities, setActivities] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [zones, setZones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [closureReasons, setClosureReasons] = useState([]);
  const [links, setLinks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [overdueCount, setOverdueCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('mp_theme') || 'light');
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [quickLogStore, setQuickLogStore] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [libraryError, setLibraryError] = useState(false);
  const [offers, setOffers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('mp_sidebar_collapsed') === 'true');
  const lastNotifiedRef = useRef(new Set());

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const stats = {
    totalStores: stores.filter(s => s.is_active && !s.deleted_at).length,
    inactiveStores: stores.filter(s => !s.is_active && !s.deleted_at).length,
    totalActivities: activities.length,
    pendingTasks: activities.filter(a => !a.is_resolved).length,
    completedTasks: activities.filter(a => a.is_resolved).length
  };

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const [s, a, o, z, c, cr] = await Promise.all([
        storeService.getAll(),
        activityService.getAll(),
        settingsService.getOutcomes(),
        settingsService.getZones(),
        settingsService.getCategories(),
        settingsService.getClosureReasons()
      ]);
      setStores(s || []);
      setActivities(a || []);
      setOutcomes(o || []);
      setZones(z || []);
      setCategories(c || []);
      setClosureReasons(cr || []);

      try {
        const l = await libraryService.getAll();
        setLinks(l || []);
      } catch {
        setLinks([]);
        setLibraryError(true);
      }
      try {
        const o = await offersService.getAll();
        setOffers(o || []);
      } catch {
        setOffers([]);
      }
    } catch {
      notify('error', 'Failed to synchronize core data');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const addStore = useCallback(async (store) => { 
    if (stores.some(s => s.id === store.id)) {
      notify('error', `Store ID "${store.id}" is already used. Please use a unique ID.`);
      return;
    }
    try { 
      const newStore = await storeService.create(store); 
      setStores(prev => [newStore, ...prev]);
      notify('success', 'Store added successfully'); 
    } 
    catch(e) { notify('error', `Failed to add store: ${e.message || 'Unknown error'}`); }
  }, [stores, notify]);

  const updateStore = useCallback(async (id, updates) => { 
    try { 
      const updated = await storeService.update(id, updates); 
      setStores(prev => prev.map(s => s.id === id ? updated : s));
      notify('success', 'Information updated'); 
    } 
    catch(e) { notify('error', `Update failed: ${e.message || 'Unknown error'}`); }
  }, [notify]);

  const bulkAddStores = useCallback(async (list) => {
    try {
      await storeService.bulkCreate(list);
      fetchInitialData();
      notify('success', `Imported ${list.length} stores`);
    }
    catch { notify('error', 'Import failed'); }
  }, [notify, fetchInitialData]);

  const bulkUpdateStores = useCallback(async (ids, updates) => {
    try {
      await storeService.bulkUpdate(ids, updates);
      setStores(prev => prev.map(s => ids.includes(s.id) ? { ...s, ...updates } : s));
      notify('success', `Updated ${ids.length} stores`);
    } catch { notify('error', 'Bulk update failed'); }
  }, [notify]);

const toggleStoreStatus = useCallback(async (id) => {
    const store = stores.find(s => s.id === id);
    if (!store) return;
    try { 
      const updated = await storeService.update(id, { is_active: !store.is_active }); 
      setStores(prev => prev.map(s => s.id === id ? updated : s));
    }
    catch(e) { notify('error', `Status toggle failed: ${e.message || 'Unknown error'}`); }
  }, [stores, notify]);

  const addActivity = useCallback(async (activity) => {
    try { 
      const newActivity = await activityService.create(activity); 
      setActivities(prev => [newActivity, ...prev]);
      notify('success', 'Activity logged'); 
    }
    catch { notify('error', 'Failed to log activity'); }
  }, [notify]);

  const resolveActivity = useCallback(async (id) => { 
    try { 
      const updated = await activityService.resolve(id); 
      setActivities(prev => prev.map(a => a.id === id ? updated : a));
      notify('success', 'Task marked as done'); 
    }
    catch { notify('error', 'Action failed'); }
  }, [notify]);

  const bulkResolveActivities = useCallback(async (ids) => {
    try { 
      await activityService.bulkResolve(ids); 
      setActivities(prev => prev.map(a => ids.includes(a.id) ? { ...a, is_resolved: true } : a));
      notify('success', `${ids.length} tasks completed`); 
    }
    catch { notify('error', 'Bulk action failed'); }
  }, [notify]);

  const addLibraryLink = useCallback(async (name, url, description) => {
    try { 
      const newLink = await libraryService.create(name, url, description); 
      setLinks(prev => [newLink, ...prev]);
      notify('success', 'Link added to library!'); 
    }
    catch { notify('error', 'Error adding link'); }
  }, [notify]);

  const updateLibraryLink = useCallback(async (id, updates) => {
    try { 
      const updated = await libraryService.update(id, updates); 
      setLinks(prev => prev.map(l => l.id === id ? updated : l));
      notify('success', 'Link updated successfully!'); 
    }
    catch { notify('error', 'Failed to update link'); }
  }, [notify]);

  const deleteLibraryLink = useCallback(async (id) => {
    try { 
      await libraryService.delete(id); 
      setLinks(prev => prev.filter(l => l.id !== id));
      notify('success', 'Link removed from library'); 
    }
    catch { notify('error', 'Error removing link'); }
  }, [notify]);

  const addOffer = useCallback(async (offer) => {
    try {
      const newOffer = await offersService.create(offer);
      setOffers(prev => [newOffer, ...prev]);
      notify('success', 'تم إضافة العرض');
    } catch { notify('error', 'فشل إضافة العرض'); }
  }, [notify]);

  const updateOffer = useCallback(async (id, updates) => {
    try {
      const updated = await offersService.update(id, updates);
      setOffers(prev => prev.map(o => o.id === id ? updated : o));
      notify('success', 'تم تحديث العرض');
    } catch { notify('error', 'فشل التحديث'); }
  }, [notify]);

  const deleteOffer = useCallback(async (id) => {
    try {
      await offersService.delete(id);
      setOffers(prev => prev.filter(o => o.id !== id));
      notify('success', 'تم حذف العرض');
    } catch { notify('error', 'فشل الحذف'); }
  }, [notify]);

  const addOutcome = useCallback(async (name) => { 
    try { 
      const newOutcome = await settingsService.createOutcome(name); 
      setOutcomes(prev => [...prev, newOutcome]);
      notify('success', 'Outcome added'); 
    }
    catch { notify('error', 'Failed to add outcome'); }
  }, [notify]);

  const deleteOutcome = useCallback(async (id) => { 
    try { 
      await settingsService.deleteOutcome(id); 
      setOutcomes(prev => prev.filter(o => o.id !== id));
      notify('success', 'Outcome removed'); 
    }
    catch { notify('error', 'Delete failed'); }
  }, [notify]);

  const addZone = useCallback(async (name) => { 
    try { 
      const newZone = await settingsService.createZone(name); 
      setZones(prev => [...prev, newZone]);
      notify('success', 'Zone added'); 
    }
    catch { notify('error', 'Failed to add zone'); }
  }, [notify]);

  const deleteZone = useCallback(async (id) => { 
    try { 
      await settingsService.deleteZone(id); 
      setZones(prev => prev.filter(z => z.id !== id));
      notify('success', 'Zone removed'); 
    }
    catch { notify('error', 'Delete failed'); }
  }, [notify]);

  const addCategory = useCallback(async (name) => { 
    try { 
      const newCat = await settingsService.createCategory(name); 
      setCategories(prev => [...prev, newCat]);
      notify('success', 'Category added'); 
    }
    catch { notify('error', 'Failed to add category'); }
  }, [notify]);

  const deleteCategory = useCallback(async (id) => { 
    try { 
      await settingsService.deleteCategory(id); 
      setCategories(prev => prev.filter(c => c.id !== id));
      notify('success', 'Category removed'); 
    }
    catch { notify('error', 'Delete failed'); }
  }, [notify]);

  const softDeleteStore = useCallback(async (id) => {
    try { 
      await storeService.softDelete(id); 
      setStores(prev => prev.map(s => s.id === id ? { ...s, deleted_at: new Date().toISOString() } : s));
      notify('success', 'Store moved to Recycle Bin'); 
    } catch { notify('error', 'Could not delete store'); }
  }, [notify]);

  const restoreStore = useCallback(async (id) => {
    try { 
      await storeService.restore(id); 
      setStores(prev => prev.map(s => s.id === id ? { ...s, deleted_at: null } : s));
      notify('success', 'Store restored successfully!'); 
    } catch { notify('error', 'Restore failed'); }
  }, [notify]);

  const permanentDeleteStore = useCallback(async (id) => {
    try { 
      await storeService.delete(id); 
      setStores(prev => prev.filter(s => s.id !== id));
      notify('success', 'Store permanently removed'); 
    } catch { notify('error', 'Delete failed'); }
  }, [notify]);

  const addClosureReason = useCallback(async (name) => {
    try { 
      const newReason = await settingsService.createClosureReason(name); 
      setClosureReasons(prev => [...prev, newReason]);
      notify('success', 'Reason added'); 
    }
    catch { notify('error', 'Failed to add reason'); }
  }, [notify]);

  const deleteClosureReason = useCallback(async (id) => {
    try { 
      await settingsService.deleteClosureReason(id); 
      setClosureReasons(prev => prev.filter(cr => cr.id !== id));
      notify('success', 'Reason removed'); 
    }
    catch { notify('error', 'Delete failed'); }
  }, [notify]);



  useEffect(() => {

    localStorage.setItem('mp_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('mp_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Get current logged-in user
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  const handleRealtime = useCallback((payload, setter) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'INSERT') setter(prev => prev.some(item => item.id === newRecord.id) ? prev : [newRecord, ...prev]);
    if (eventType === 'UPDATE') setter(prev => prev.map(item => item.id === newRecord.id ? newRecord : item));
    if (eventType === 'DELETE') setter(prev => prev.filter(item => item.id !== oldRecord.id));
  }, []);

  const handleSelectStore = useCallback((id) => {
    setSelectedStoreId(id);
    const url = new URL(window.location);
    if (id) {
      url.searchParams.set('store', id);
    } else {
      url.searchParams.delete('store');
    }
    // Update URL without reloading the page, adding a history entry
    window.history.pushState({}, '', url);
  }, []);

  useEffect(() => {
    // Initial sync from URL search params
    const params = new URLSearchParams(window.location.search);
    const storeId = params.get('store');
    if (storeId) {
      setSelectedStoreId(storeId);
      // Ensure we are on the 'stores' tab if a store is in the URL
      setActiveTab('stores');
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const storeId = params.get('store');
      setSelectedStoreId(storeId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    fetchInitialData();
    requestNotificationPermission();

    const storeSub = supabase.channel('stores').on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, (p) => handleRealtime(p, setStores)).subscribe();
    const callSub = supabase.channel('calls').on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, (p) => handleRealtime(p, setActivities)).subscribe();
    const outcomeSub = supabase.channel('outcomes').on('postgres_changes', { event: '*', schema: 'public', table: 'call_outcomes' }, (p) => handleRealtime(p, setOutcomes)).subscribe();
    const zoneSub = supabase.channel('zones').on('postgres_changes', { event: '*', schema: 'public', table: 'zones' }, (p) => handleRealtime(p, setZones)).subscribe();
    const categorySub = supabase.channel('categories').on('postgres_changes', { event: '*', schema: 'public', table: 'store_categories' }, (p) => handleRealtime(p, setCategories)).subscribe();
    const librarySub = supabase.channel('library-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'library_links' }, (p) => handleRealtime(p, setLinks)).subscribe();

    // Listen for custom activity logging events from deeply nested components
    const handleCustomAddActivity = (e) => {
      if (e.detail) addActivity(e.detail);
    };
    window.addEventListener('add-activity', handleCustomAddActivity);

    return () => {
      supabase.removeChannel(storeSub);
      supabase.removeChannel(callSub);
      supabase.removeChannel(zoneSub);
      supabase.removeChannel(categorySub);
      supabase.removeChannel(outcomeSub);
      supabase.removeChannel(librarySub);
      window.removeEventListener('add-activity', handleCustomAddActivity);
    };
  }, [addActivity, fetchInitialData, handleRealtime]);


  useEffect(() => {
    if (activities.length > 0 && stores.length > 0) {
      const overdue = getOverdueActivities(activities, stores);
      setOverdueCount(overdue.length);

      if (notifPermission === 'granted') {
        overdue.forEach(task => {
          if (!lastNotifiedRef.current.has(task.id)) {
            showNotification(
              `Reminder: ${task.storeName}`,
              `Follow-up due: ${(task.notes || '').substring(0, 50)}...`
            );
            lastNotifiedRef.current.add(task.id);
          }
        });
      }
    }
  }, [activities, stores, notifPermission]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable;

      // Ctrl+K / Cmd+K → open global search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }
      // Escape → close search
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        return;
      }
      if (isTyping) return;
      // N → open new activity modal (dispatches to ActivityLog listener)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setActiveTab('activities');
        setTimeout(() => window.dispatchEvent(new CustomEvent('open-new-activity')), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickLogMerchantHistory = useMemo(
    () => activities.filter(a => a.store_id === quickLogStore?.id).slice(0, 3),
    [activities, quickLogStore]
  );

  const renderContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={48} className="animate-spin" color="var(--primary-color)" />
      </div>
    );

    switch(activeTab) {
      case 'dashboard': return <Overview stats={stats} activities={activities} stores={stores} onNavigate={setActiveTab} />;
      case 'stores': return (
        <StoreList 
          stores={stores.filter(s => !s.deleted_at)} 
          activities={activities}
          outcomes={outcomes}
          categories={categories}
          zones={zones}
          selectedStoreId={selectedStoreId}
          onSelectStore={handleSelectStore}
          onQuickLog={setQuickLogStore}
          onAddStore={addStore}
          onUpdateStore={updateStore}
          onToggleStatus={toggleStoreStatus}
          onDeleteStore={softDeleteStore}
          onBulkAdd={bulkAddStores}
          onBulkUpdate={bulkUpdateStores}
          onNotify={notify}
          onAddActivity={addActivity}
          closureReasons={closureReasons}
        />
      );
      case 'activities': return <ActivityLog activities={activities} stores={stores} outcomes={outcomes} onAddActivity={addActivity} onResolveActivity={resolveActivity} onBulkResolve={bulkResolveActivities} />;
      case 'stats': return <Stats calls={activities} outcomes={outcomes} stores={stores} />;
      case 'performance': return <PerformanceDashboard stores={stores} onFetchInitialData={fetchInitialData} notify={notify} onAddStore={addStore} />;
      case 'target': return <TargetSection activities={activities} />;
      case 'library': return <Library links={links} libraryError={libraryError} onAddLink={addLibraryLink} onUpdateLink={updateLibraryLink} onDeleteLink={deleteLibraryLink} />;
      case 'offers': return <Offers offers={offers} onAddOffer={addOffer} onUpdateOffer={updateOffer} onDeleteOffer={deleteOffer} />;
      case 'menu-extractor': return <MenuExtractor />;
      case 'recycle': return (
        <RecycleBin 
          deletedStores={stores.filter(s => !!s.deleted_at)}
          onRestoreStore={restoreStore}
          onPermanentDeleteStore={permanentDeleteStore}
        />
      );
      case 'settings': return (
        <Settings 
          outcomes={outcomes} 
          zones={zones} 
          categories={categories}
          closureReasons={closureReasons}
          deletedStores={stores.filter(s => !!s.deleted_at)}
          initialTab="config"
          onAddOutcome={addOutcome}
          onDeleteOutcome={deleteOutcome}
          onAddZone={addZone}
          onDeleteZone={deleteZone}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          onAddClosureReason={addClosureReason}
          onDeleteClosureReason={deleteClosureReason}
          onRestoreStore={restoreStore}
          onPermanentDeleteStore={permanentDeleteStore}
          notifPermission={notifPermission}
          onRequestPermission={requestPermission}
        />
      );
      default: return <Overview stats={stats} activities={activities} stores={stores} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }}
        stats={stats}
        theme={theme}
        setTheme={setTheme}
        onSelectStore={handleSelectStore}
        user={currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => {
          const next = !prev;
          localStorage.setItem('mp_sidebar_collapsed', String(next));
          return next;
        })}
      />

      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      <main className="main-content">
        <TopBar 
          overdueCount={overdueCount} 
          notifPermission={notifPermission} 
          onHandleRequestPermission={requestPermission} 
          setActiveTab={setActiveTab}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />

        <div className="tab-content">
          <React.Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
              <Loader2 size={48} className="animate-spin" color="var(--primary-color)" />
            </div>
          }>
            {renderContent()}
          </React.Suspense>
        </div>
        
        {/* Toast System */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`toast toast-${toast.type}`}
            >
              <AlertCircle size={18} />
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          stores={stores}
          activities={activities}
          outcomes={outcomes}
          onSelectStore={(id) => { handleSelectStore(id); setActiveTab('stores'); }}
        />

        <AnimatePresence>
        <ActivityForm 
          isOpen={!!quickLogStore}
          stores={[quickLogStore]} 
          outcomes={outcomes} 
          onSubmit={async (data) => {
            await addActivity(data);
            setQuickLogStore(null);
          }}
          onClose={() => setQuickLogStore(null)}
          merchantHistory={quickLogMerchantHistory}
        />
        </AnimatePresence>

        <InstallPrompt />
      </main>
    </div>
  );
}

export default App;
