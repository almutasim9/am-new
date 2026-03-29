/**
 * Service to handle browser notifications for reminders
 */

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showNotification = (title, body, icon = '/pwa-192x192.png') => {
  if (Notification.permission === 'granted') {
    const options = {
      body,
      icon,
      badge: '/pwa-192x192.png',
      dir: 'auto'
    };
    
    const notification = new Notification(title, options);
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};

export const getOverdueActivities = (activities, stores) => {
  const today = new Date().toISOString().split('T')[0];
  
  return activities
    .filter(a => !a.is_resolved && a.follow_up_date)
    .filter(a => a.follow_up_date <= today)
    .map(a => ({
      ...a,
      storeName: stores.find(s => s.id === a.store_id)?.name || 'Unknown Store'
    }));
};
