import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutDashboard, Store, ClipboardList, CheckCircle2, PhoneOutgoing, Bell, Loader2, BarChart3, TrendingUp, CalendarCheck, Settings as SettingsIcon, AlertCircle, BellOff, Moon, Sun, Bookmark, X } from 'lucide-react';
import './App.css';
import Overview from './components/Overview';
import StoreList from './components/StoreList';
import ActivityLog from './components/ActivityLog';
import Stats from './components/Stats';
import TargetSection from './components/TargetSection';
import Library from './components/Library';
import Settings from './components/Settings';
import RecycleBin from './components/RecycleBin';
import InstallPrompt from './components/InstallPrompt';
import { storeService, activityService, settingsService, libraryService } from './services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, showNotification, getOverdueActivities } from './services/notificationService';
import { supabase } from './supabaseClient';

// New Modular Layout Components
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import GlobalSearch from './components/GlobalSearch';

import ActivityForm from './components/ActivityForm';

function App() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('mp_active_tab') || 'dashboard');
  const [stores, setStores] = useState([]);
  const [activities, setActivities] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [zones, setZones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [closureReasons, setClosureReasons] = useState([]);
  const [deletedStores, setDeletedStores] = useState([]);
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const lastNotifiedRef = useRef(new Set());

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000); // Increased to 5 seconds for better readability
  }, []);

  const stats = {
    totalStores: stores.filter(s => s.is_active && !s.deleted_at).length,
    totalActivities: activities.length,
    pendingTasks: activities.filter(a => !a.is_resolved).length,
    completedTasks: activities.filter(a => a.is_resolved).length
  };

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
  }, []);


  const addStore = useCallback(async (store) => { 
    if (stores.some(s => s.id === store.id)) {
      notify('error', `Store ID "${store.id}" is already used. Please use a unique ID.`);
      return;
    }
    try { await storeService.create(store); notify('success', 'Store added successfully'); } 
    catch(e) { notify('error', `Failed to add store: ${e.message || 'Unknown error'}`); }
  }, [stores, notify]);

  const updateStore = useCallback(async (id, updates) => { 
    try { await storeService.update(id, updates); notify('success', 'Information updated'); } 
    catch(e) { notify('error', `Update failed: ${e.message || 'Unknown error'}`); }
  }, [notify]);

  const bulkAddStores = useCallback(async (list) => { 
    try { await storeService.bulkCreate(list); notify('success', `Imported ${list.length} stores`); } 
    catch(e) { notify('error', 'Import failed'); }
  }, [notify]);

  const deleteStore = useCallback(async (id) => {
    try { await storeService.delete(id); notify('success', 'Store removed'); }
    catch(e) { notify('error', 'Delete failed'); }
  }, [notify]);

  const toggleStoreStatus = useCallback(async (id) => {
    const store = stores.find(s => s.id === id);
    try { await storeService.update(id, { is_active: !store.is_active }); }
    catch(e) { notify('error', `Status toggle failed: ${e.message || 'Unknown error'}`); }
  }, [stores, notify]);

  const addActivity = useCallback(async (activity) => {
    try { await activityService.create(activity); notify('success', 'Activity logged'); }
    catch(e) { notify('error', 'Failed to log activity'); }
  }, [notify]);

  const resolveActivity = useCallback(async (id) => { 
    try { await activityService.resolve(id); notify('success', 'Task marked as done'); }
    catch(e) { notify('error', 'Action failed'); }
  }, [notify]);

  const bulkResolveActivities = useCallback(async (ids) => {
    try { await activityService.bulkResolve(ids); notify('success', `${ids.length} tasks completed`); }
    catch(e) { notify('error', 'Bulk action failed'); }
  }, [notify]);

  const addLibraryLink = useCallback(async (name, url, description) => {
    try { await libraryService.create(name, url, description); notify('success', 'Link added to library!'); }
    catch(e) { notify('error', 'Error adding link'); }
  }, [notify]);

  const updateLibraryLink = useCallback(async (id, updates) => {
    try { await libraryService.update(id, updates); notify('success', 'Link updated successfully!'); }
    catch(e) { notify('error', 'Failed to update link'); }
  }, [notify]);

  const deleteLibraryLink = useCallback(async (id) => {
    try { await libraryService.delete(id); notify('success', 'Link removed from library'); }
    catch(e) { notify('error', 'Error removing link'); }
  }, [notify]);

  const addOutcome = useCallback(async (name) => { 
    try { await settingsService.createOutcome(name); notify('success', 'Outcome added'); }
    catch(e) { notify('error', 'Failed to add outcome'); }
  }, [notify]);

  const deleteOutcome = useCallback(async (id) => { 
    try { await settingsService.deleteOutcome(id); notify('success', 'Outcome removed'); }
    catch(e) { notify('error', 'Delete failed'); }
  }, [notify]);

  const addZone = useCallback(async (name) => { 
    try { await settingsService.createZone(name); notify('success', 'Zone added'); }
    catch(e) { notify('error', 'Failed to add zone'); }
  }, [notify]);

  const deleteZone = useCallback(async (id) => { 
    try { await settingsService.deleteZone(id); notify('success', 'Zone removed'); }
    catch(e) { notify('error', 'Delete failed'); }
  }, [notify]);

  const addCategory = useCallback(async (name) => { 
    try { await settingsService.createCategory(name); notify('success', 'Category added'); }
    catch(e) { notify('error', 'Failed to add category'); }
  }, [notify]);

  const deleteCategory = useCallback(async (id) => { 
    try { await settingsService.deleteCategory(id); notify('success', 'Category removed'); }
    catch(e) { notify('error', 'Delete failed'); }
  }, [notify]);

  const softDeleteStore = useCallback(async (id) => {
    try { 
      await storeService.softDelete(id); 
      notify('success', 'Store moved to Recycle Bin'); 
    } catch(e) { notify('error', 'Could not delete store'); }
  }, [notify]);

  const restoreStore = useCallback(async (id) => {
    try { 
      await storeService.restore(id); 
      notify('success', 'Store restored successfully!'); 
    } catch(e) { notify('error', 'Restore failed'); }
  }, [notify]);

  const permanentDeleteStore = useCallback(async (id) => {
    try { 
      await storeService.delete(id); 
      notify('success', 'Store permanently removed'); 
    } catch(e) { notify('error', 'Delete failed'); }
  }, [notify]);

  const addClosureReason = useCallback(async (name) => {
    try { await settingsService.createClosureReason(name); notify('success', 'Reason added'); }
    catch(e) { notify('error', 'Failed to add reason'); }
  }, [notify]);

  const deleteClosureReason = useCallback(async (id) => {
    try { await settingsService.deleteClosureReason(id); notify('success', 'Reason removed'); }
    catch(e) { notify('error', 'Delete failed'); }
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
    if (eventType === 'INSERT') setter(prev => [newRecord, ...prev]);
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
  }, [addActivity]);


  useEffect(() => {
    if (activities.length > 0 && stores.length > 0) {
      const overdue = getOverdueActivities(activities, stores);
      setOverdueCount(overdue.length);

      if (notifPermission === 'granted') {
        overdue.forEach(task => {
          if (!lastNotifiedRef.current.has(task.id)) {
            showNotification(
              `Reminder: ${task.storeName}`,
              `Follow-up due: ${task.notes.substring(0, 50)}...`
            );
            lastNotifiedRef.current.add(task.id);
          }
        });
      }
    }
  }, [activities, stores, notifPermission]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [s, a, o, z, c, cr, ds] = await Promise.all([
        storeService.getAll(),
        activityService.getAll(),
        settingsService.getOutcomes(),
        settingsService.getZones(),
        settingsService.getCategories(),
        settingsService.getClosureReasons(),
        storeService.getDeleted()
      ]);
      setStores(s || []);
      setActivities(a || []);
      setOutcomes(o || []);
      setZones(z || []);
      setCategories(c || []);
      setClosureReasons(cr || []);
      setDeletedStores(ds || []);


      // Non-blocking Library Fetch (may fail if table not migrate yet)
      try {
        const l = await libraryService.getAll();
        setLinks(l || []);
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Library data could not be loaded - table may not exist yet.');
        setLinks([]);
        setLibraryError(true);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Core sync error:', error);
      notify('error', 'Failed to synchronize core data');
    } finally {
      setLoading(false);
    }
  }, [notify]);


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
          onNotify={notify}
          onAddActivity={addActivity}
          closureReasons={closureReasons}
        />
      );
      case 'activities': return <ActivityLog activities={activities} stores={stores} outcomes={outcomes} onAddActivity={addActivity} onResolveActivity={resolveActivity} onBulkResolve={bulkResolveActivities} />;
      case 'stats': return <Stats calls={activities} outcomes={outcomes} stores={stores} />;
      case 'target': return <TargetSection activities={activities} />;
      case 'library': return <Library links={links} libraryError={libraryError} onAddLink={addLibraryLink} onUpdateLink={updateLibraryLink} onDeleteLink={deleteLibraryLink} />;
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
          {renderContent()}
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
          merchantHistory={activities.filter(a => a.store_id === quickLogStore?.id).slice(0, 3)}
        />
        </AnimatePresence>

        <InstallPrompt />
      </main>
    </div>
  );
}

export default App;
