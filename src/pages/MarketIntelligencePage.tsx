import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import PageFrame from './PageFrame';
import { marketTone, statusLabel, type MarketDataPoint, type MarketSnapshot } from '../lib/marketData';
import { VISIBLE_MARKET_SECTIONS, visibleMarketSnapshot } from '../lib/marketSections';
import { marketDateAge, safeMarketTime } from '../lib/marketRefreshExperience';

const value = (item: MarketDataPoint) => item.value === null ? '—' : `${item.value.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${item.unit ?? ''}`;
const change = (item: MarketDataPoint) => item.change === null ? '變化資料不足' : `${item.change > 0 ? '+' : ''}${item.change.toLocaleString('zh-TW', { maximumFractionDigits: 2 })}${item.changePct === null ? '' : `（${item.changePct > 0 ? '+' : ''}${item.changePct.toFixed(2)}%）`}`;

type Props = { snapshot: MarketSnapshot; isRefreshing: boolean; refreshMessage?: string; lastAttemptAt: number | null; onRefresh: () => void };

export default function MarketIntelligencePage({ snapshot, isRefreshing, refreshMessage, lastAttemptAt, onRefresh }: Props) {
  const visibleSnapshot = visibleMarketSnapshot(snapshot);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const updateClock = () => { if (document.visibilityState === 'visible') setNow(Date.now()); };
    const timer = setInterval(updateClock, 60_000);
    document.addEventListener('visibilitychange', updateClock);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', updateClock); };
  }, []);
  return <PageFrame page="market" title="市場情報中心" description="以官方、可追溯資料快速掌握市場狀態；不提供投資建議。">
    <section className="market-hero">
      <div>
        <p className="eyebrow">官方每日資料</p>
        <h2>每日資料，非即時行情</h2>
        <p>台股採官方收盤資料，美債採每日殖利率；休市或來源尚未發布新資料時，數值可能不變。</p>
        <p className="market-time-note">進入市場頁或回到可見分頁時檢查更新；停留期間約每 15 分鐘自動查詢，離開或隱藏分頁時暫停。也可隨時按「重新取得」。</p>
        <dl className="market-refresh-times">
          <div><dt>最後查詢時間</dt><dd>{lastAttemptAt === null ? '尚未查詢' : safeMarketTime(new Date(lastAttemptAt).toISOString())}</dd></div>
          <div><dt>最近服務確認時間</dt><dd>{safeMarketTime(visibleSnapshot.fetchedAt)}</dd></div>
        </dl>
        <p className="market-time-note">以上時間以台北時間顯示。查詢時間不代表成功；服務確認時間並非市場成交時間，各項資料日期請看下方卡片。</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={isRefreshing}><RefreshCw size={16} className={isRefreshing ? 'is-spinning' : ''} aria-hidden="true" />{isRefreshing ? '更新中…' : '重新取得'}</button>
    </section>
    <p className="market-refresh-feedback" role="status">{isRefreshing ? '正在查詢官方資料服務…' : refreshMessage || '尚未取得查詢結果。'}</p>
    {visibleSnapshot.error && <p className="market-alert">{visibleSnapshot.error}</p>}
    {VISIBLE_MARKET_SECTIONS.map(group => <section className="market-section" key={group.key} aria-labelledby={`market-${group.key}`}>
      <header><div><p className="eyebrow">{group.eyebrow}</p><h2 id={`market-${group.key}`}>{group.title}</h2><p>{group.description}</p></div></header>
      <div className="market-card-grid">{visibleSnapshot.items.filter(item => item.group === group.key).map(item => {
        const age = marketDateAge(item.asOf, now);
        return <article className="market-data-card" key={item.id}>
          <div className="market-card-heading"><small>{item.name}</small><b className={`market-status ${item.status}`}>{statusLabel(item.status)}</b></div>
          <strong className={marketTone(item.change)}>{value(item)}</strong><span className={marketTone(item.change)}>{change(item)}</span>
          <dl><div><dt>市場資料時間</dt><dd>{safeMarketTime(item.asOf)}</dd></div><div><dt>來源</dt><dd>{item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.source}</a> : item.source}</dd></div></dl>
          <p className={age.attention ? 'market-age-warning' : 'market-age'}>{age.text}{age.attention && item.asOf && age.text !== '資料時間待確認' ? '；請留意來源是否已發布新資料。' : ''}</p>
          {item.detail && <p>{item.detail}</p>}
        </article>;
      })}</div>
    </section>)}
    <p className="market-disclaimer">市場資料僅供資訊整理，非即時交易報價、投資建議或報酬保證。</p>
  </PageFrame>;
}
