import React from 'react';
import { APP_BUILD_TIME, APP_NAME, APP_VERSION, STORAGE_KEY } from './constants/appInfo';

type ErrorBoundaryState = { error: Error | null; componentStack: string };

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to textarea copy for Safari or restricted clipboard contexts.
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.opacity = '0.01';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  document.execCommand('copy');
  textarea.remove();
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error) {
    return { error, componentStack: '' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, componentStack: info.componentStack || '' });
  }

  buildErrorInfo() {
    const rawLocalData = (() => {
      try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
    })();
    return [
      'family-universal-rebalance error info',
      `Version: ${APP_VERSION}`,
      `BuildTime: ${APP_BUILD_TIME}`,
      `URL: ${location.href}`,
      `UserAgent: ${navigator.userAgent}`,
      `StorageKey: ${STORAGE_KEY}`,
      `Error: ${this.state.error?.message || 'unknown'}`,
      `Stack: ${this.state.error?.stack || ''}`,
      `ComponentStack: ${this.state.componentStack || ''}`,
      `LocalDataLength: ${rawLocalData.length}`
    ].join('\n');
  }

  copyErrorInfo = async () => {
    try {
      await copyText(this.buildErrorInfo());
      alert('已複製錯誤資訊');
    } catch {
      alert('複製失敗，請手動截圖或回報');
    }
  };

  exportLocalBackup = () => {
    const rawLocalData = (() => {
      try { return localStorage.getItem(STORAGE_KEY) || '{}'; } catch { return '{}'; }
    })();
    downloadText(`family-universal-rebalance-error-backup-${Date.now()}.json`, rawLocalData);
  };

  clearLocalData = () => {
    if (!window.confirm('這會清除本機 localStorage 資料，但不會刪除雲端資料。是否繼續？')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="error-page">
        <section className="card error-card">
          <p className="eyebrow">{APP_VERSION}</p>
          <h1>{APP_NAME}</h1>
          <h2>系統發生錯誤</h2>
          <p className="warning-message">請先不要重設資料。可嘗試重新整理頁面，或複製錯誤資訊回報。</p>
          <div className="status-grid">
            <p><span>Build time</span><strong>{APP_BUILD_TIME}</strong></p>
            <p><span>錯誤訊息</span><strong>{this.state.error.message}</strong></p>
          </div>
          <details className="debug-details">
            <summary>錯誤細節</summary>
            <pre>{this.buildErrorInfo()}</pre>
          </details>
          <div className="actions">
            <button onClick={() => location.reload()}>重新整理頁面</button>
            <button onClick={this.copyErrorInfo}>複製錯誤資訊</button>
            <button onClick={this.exportLocalBackup}>匯出本機資料備份</button>
            <button className="danger" onClick={this.clearLocalData}>清除本機資料並重啟</button>
          </div>
        </section>
      </main>
    );
  }
}
