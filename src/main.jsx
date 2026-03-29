import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthGuard from './components/auth/AuthGuard.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register PWA service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    if (import.meta.env.DEV) console.log('App ready to work offline')
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
