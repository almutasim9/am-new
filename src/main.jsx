import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthGuard from './components/auth/AuthGuard.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Non-blocking PWA update banner — replaces confirm() which freezes the UI
function showUpdateBanner(onAccept) {
  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';

  const box = document.createElement('div');
  box.style.cssText = `
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:#1e293b; color:white; padding:12px 20px; border-radius:14px;
    display:flex; align-items:center; gap:14px; z-index:99999;
    box-shadow:0 10px 30px rgba(0,0,0,0.3); font-family:inherit; font-size:14px;
    animation: pwaSlideUp 0.3s ease;
  `;

  const label = document.createElement('span');
  label.textContent = '🔄 New update available';

  const yesBtn = document.createElement('button');
  yesBtn.textContent = 'Update Now';
  yesBtn.style.cssText = `
    background:#4f46e5; color:white; border:none; padding:7px 16px;
    border-radius:8px; cursor:pointer; font-weight:700; font-size:13px;
  `;
  yesBtn.onclick = () => { banner.remove(); onAccept(); };

  const noBtn = document.createElement('button');
  noBtn.textContent = 'Later';
  noBtn.style.cssText = `
    background:rgba(255,255,255,0.1); color:white; border:none; padding:7px 12px;
    border-radius:8px; cursor:pointer; font-size:13px;
  `;
  noBtn.onclick = () => banner.remove();

  box.append(label, yesBtn, noBtn);

  const styleEl = document.createElement('style');
  styleEl.textContent = '@keyframes pwaSlideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';

  banner.append(styleEl, box);
  document.body.appendChild(banner);
}

const updateSW = registerSW({
  onNeedRefresh() {
    showUpdateBanner(() => updateSW(true));
  },
  onOfflineReady() {
    if (import.meta.env.DEV) console.log('App ready to work offline');
  },
})

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#ef4444', background: '#fff1f1', minHeight: '100vh' }}>
          <h2 style={{ marginBottom: '1rem' }}>Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthGuard>
      <App />
    </AuthGuard>
  </ErrorBoundary>,
)
