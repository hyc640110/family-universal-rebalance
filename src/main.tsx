import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { message: string }> {
  state = { message: '' };

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  render() {
    if (this.state.message) {
      return (
        <main style={{ padding: 24, color: '#e5edf7', background: '#08111f', minHeight: '100vh' }}>
          <h1>萬用資產再平衡儀表板</h1>
          <p>資料載入時發生問題，系統已避免空白頁。請重新整理或到同步設定重新下載資料。</p>
          <p style={{ color: '#fca5a5', wordBreak: 'break-all' }}>{this.state.message}</p>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => registrations.forEach(registration => registration.unregister())).catch(() => undefined);
  });
}
