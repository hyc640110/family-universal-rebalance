import { useEffect, useState } from 'react';
import { disconnectGoogleOAuth, getGoogleOAuthStatus, isGmailOAuthEnabled, startGoogleOAuth, type GmailOAuthState } from '../lib/gmailOAuth';

export default function GmailOAuthSettings({ value, onChange }: { value: GmailOAuthState; onChange: (value: GmailOAuthState) => void }) {
  const [message, setMessage] = useState('');
  const enabled = isGmailOAuthEnabled();
  useEffect(() => { if (!enabled) return; getGoogleOAuthStatus().then(onChange).catch(() => onChange({ status: 'error', grantedScopes: [], lastErrorCode: 'broker_unavailable' })); }, [enabled, onChange]);
  const disconnect = async () => { try { await disconnectGoogleOAuth(); onChange({ status: 'disconnected', grantedScopes: [] }); setMessage('已中斷 Gmail 安全連線。'); } catch { setMessage('無法中斷連線，請稍後再試。'); } };
  return <section className="card" aria-labelledby="gmail-security-title">
    <h2 id="gmail-security-title">Gmail 安全連線</h2>
    <p className="note">僅透過 Google 官方 OAuth 請求 Gmail 唯讀權限。此裝置、Firebase 與 JSON 備份都不會保存 OAuth Token、授權碼、密碼或郵件內容。</p>
    {!enabled ? <p className="note">此 Preview 尚未啟用 Gmail 連線。部署前需由管理者設定 OAuth Broker URL、Google OAuth Client 與 Worker secrets。</p> : <>
      <p><b>連線狀態：</b>{value.status === 'connected' ? '已連線' : value.status === 'connecting' ? '連線中' : value.status === 'expired' ? '已過期' : value.status === 'error' ? '連線異常' : '未連線'}</p>
      <div className="actions">{value.status === 'connected' ? <button type="button" className="danger" onClick={disconnect}>中斷連線</button> : <button type="button" onClick={() => { try { startGoogleOAuth(); } catch (error) { setMessage(error instanceof Error ? error.message : '無法開始連線'); } }}>使用 Google 安全連線</button>}</div>
    </>}
    {message && <p className="note">{message}</p>}
  </section>;
}
