import { useEffect, useState } from 'react';
import { disconnectGoogleOAuth, getGoogleOAuthStatus, isGmailOAuthEnabled, startGoogleOAuth, type GmailOAuthState } from '../lib/gmailOAuth';

const statusPresentation = (enabled: boolean, status: GmailOAuthState['status']) => {
  if (!enabled) return { label: '尚未啟用', tone: 'disabled' };
  if (status === 'connected') return { label: '已連線', tone: 'connected' };
  if (status === 'connecting') return { label: '連線中', tone: 'connecting' };
  if (status === 'expired') return { label: '已過期', tone: 'expired' };
  if (status === 'error') return { label: '錯誤', tone: 'error' };
  return { label: '尚未啟用', tone: 'disabled' };
};

export default function GmailOAuthSettings({ value, onChange }: { value: GmailOAuthState; onChange: (value: GmailOAuthState) => void }) {
  const [message, setMessage] = useState('');
  const enabled = isGmailOAuthEnabled();
  const status = statusPresentation(enabled, value.status);
  useEffect(() => { if (!enabled) return; getGoogleOAuthStatus().then(onChange).catch(() => onChange({ status: 'error', grantedScopes: [], lastErrorCode: 'broker_unavailable' })); }, [enabled, onChange]);
  const disconnect = async () => { try { await disconnectGoogleOAuth(); onChange({ status: 'disconnected', grantedScopes: [] }); setMessage('已中斷 Gmail 安全連線。'); } catch { setMessage('無法中斷連線，請稍後再試。'); } };
  return <section className="card gmail-oauth-card" aria-labelledby="gmail-security-title">
    <h2 id="gmail-security-title">Gmail 安全連線</h2>
    <div className="gmail-oauth-status" aria-label={`Gmail 連線狀態：${status.label}`}><span className={`gmail-oauth-status-dot ${status.tone}`} aria-hidden="true">●</span><span>Gmail 連線狀態</span><strong className={`gmail-oauth-badge ${status.tone}`}>{status.label}</strong></div>
    <div className="gmail-oauth-connect">{value.status === 'connected' && enabled ? <button type="button" className="danger" onClick={disconnect}>中斷連線</button> : <button type="button" disabled={!enabled} title={!enabled ? '尚未部署 OAuth Worker，功能暫時停用。' : undefined} onClick={() => { try { startGoogleOAuth(); } catch (error) { setMessage(error instanceof Error ? error.message : '無法開始連線'); } }}>連線 Gmail</button>}{!enabled && <small>尚未設定</small>}</div>
    <section className="gmail-oauth-progress" aria-labelledby="gmail-progress-title"><h3 id="gmail-progress-title">目前部署進度</h3><ul>{['Google OAuth Client', 'Cloudflare Worker', 'OAuth Broker', 'Production Session Store', 'Gmail API 啟用'].map(item => <li key={item}><span aria-hidden="true">□</span>{item}</li>)}</ul></section>
    <section className="gmail-oauth-safety" aria-labelledby="gmail-safety-title"><h3 id="gmail-safety-title">安全說明</h3><ul><li>使用 Google 官方 OAuth</li><li>不需要輸入 Google 密碼</li><li>僅申請 Gmail 唯讀權限</li><li>不會寄送郵件</li><li>不會刪除郵件</li><li>不會修改 Gmail 標籤</li><li>Token 不保存於：<ul><li>localStorage</li><li>Firebase</li><li>JSON Backup</li></ul></li><li>可隨時取消 Google 授權</li></ul></section>
    <section className="gmail-oauth-limits" aria-labelledby="gmail-limits-title"><h3 id="gmail-limits-title">目前限制</h3><p>此 Preview 尚未部署：</p><ul><li>OAuth Broker</li><li>Cloudflare Worker</li><li>Google OAuth Client</li></ul><p>因此目前：</p><ul><li>無法登入 Gmail</li><li>不會讀取 Gmail</li><li>不會解析任何郵件</li></ul></section>
    <footer className="gmail-oauth-version"><strong>Gmail Security Foundation</strong><span>版本：V4.4</span><span>狀態：安全基礎已完成，尚未部署</span><small>尚待 Google OAuth Client 正式設定、Cloudflare Worker 部署、production session store binding、OAuth redirect URI 與 Worker secrets。</small></footer>
    {message && <p className="note">{message}</p>}
  </section>;
}
