export type MarketDataStatus = 'loading' | 'realtime' | 'delayed' | 'closed' | 'recent-effective' | 'unavailable' | 'failed';
export type MarketDataGroup = 'taiwan' | 'global' | 'treasury' | 'event';

export type MarketDataPoint = { id: string; group: MarketDataGroup; name: string; value: number | null; unit?: string; change: number | null; changePct: number | null; asOf: string | null; fetchedAt: string | null; source: string; sourceUrl?: string; status: MarketDataStatus; detail?: string };
export type MarketSnapshot = { fetchedAt: string | null; status: MarketDataStatus; items: MarketDataPoint[]; error?: string };

const GLOBAL_PLACEHOLDERS: MarketDataPoint[] = [['sp500', 'S&P 500'], ['nasdaq', 'NASDAQ Composite'], ['sox', '費城半導體指數'], ['nikkei', '日經 225']].map(([id, name]) => ({ id, name, group: 'global', value: null, change: null, changePct: null, asOf: null, fetchedAt: null, source: '尚未設定可驗證的資料來源', status: 'unavailable', detail: '本版不使用授權或時間語意未確認的指數資料。' }));
export const buildUnavailableMarketSnapshot = (message = '市場資料服務尚未設定。'): MarketSnapshot => ({ fetchedAt: null, status: 'unavailable', error: message, items: [
  { id: 'taiex', group: 'taiwan', name: '台灣加權指數', value: null, change: null, changePct: null, asOf: null, fetchedAt: null, source: '臺灣證券交易所公開資料', status: 'unavailable', detail: message },
  ...GLOBAL_PLACEHOLDERS,
  ...(['2y', '10y', '30y', '10y-2y'] as const).map(id => ({ id: `ust-${id}`, group: 'treasury' as const, name: id === '10y-2y' ? '10Y－2Y 利差' : `美國 ${id.toUpperCase()} 公債殖利率`, value: null, unit: '%', change: null, changePct: null, asOf: null, fetchedAt: null, source: '美國財政部 Daily Treasury Rates', status: 'unavailable' as const, detail: message })),
  { id: 'ndc-business-signal', group: 'event', name: '景氣對策信號', value: null, change: null, changePct: null, asOf: null, fetchedAt: null, source: '國發會／政府資料開放平臺', status: 'unavailable', detail: '官方事件資料 adapter 尚未設定。' },
] });
const statuses = new Set<MarketDataStatus>(['loading', 'realtime', 'delayed', 'closed', 'recent-effective', 'unavailable', 'failed']);
const groups = new Set<MarketDataGroup>(['taiwan', 'global', 'treasury', 'event']);
const finiteOrNull = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null;
const textOrNull = (value: unknown) => typeof value === 'string' && value.trim() ? value : null;
export function parseMarketSnapshot(raw: unknown): MarketSnapshot {
  const root = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}; const rawItems = Array.isArray(root.items) ? root.items : [];
  const items = rawItems.flatMap((rawItem): MarketDataPoint[] => { const item = rawItem && typeof rawItem === 'object' ? rawItem as Record<string, unknown> : {}; const id = textOrNull(item.id); const name = textOrNull(item.name); const group = item.group; if (!id || !name || typeof group !== 'string' || !groups.has(group as MarketDataGroup)) return []; return [{ id, name, group: group as MarketDataGroup, value: finiteOrNull(item.value), unit: textOrNull(item.unit) ?? undefined, change: finiteOrNull(item.change), changePct: finiteOrNull(item.changePct), asOf: textOrNull(item.asOf), fetchedAt: textOrNull(item.fetchedAt), source: textOrNull(item.source) ?? '來源未提供', sourceUrl: textOrNull(item.sourceUrl) ?? undefined, status: typeof item.status === 'string' && statuses.has(item.status as MarketDataStatus) ? item.status as MarketDataStatus : 'unavailable', detail: textOrNull(item.detail) ?? undefined }]; });
  return { fetchedAt: textOrNull(root.fetchedAt), status: typeof root.status === 'string' && statuses.has(root.status as MarketDataStatus) ? root.status as MarketDataStatus : 'unavailable', items: items.length ? items : buildUnavailableMarketSnapshot('資料格式不完整。').items, error: textOrNull(root.error) ?? undefined };
}
export async function fetchMarketSnapshot(endpoint: string, signal?: AbortSignal): Promise<MarketSnapshot> { if (!endpoint) return buildUnavailableMarketSnapshot(); try { const response = await fetch(`${endpoint.replace(/\/$/, '')}/market-summary`, { signal, headers: { accept: 'application/json' } }); if (!response.ok) return buildUnavailableMarketSnapshot(`市場資料服務暫時無法取得（HTTP ${response.status}）。`); return parseMarketSnapshot(await response.json()); } catch { return buildUnavailableMarketSnapshot('市場資料服務暫時無法連線。'); } }
export const statusLabel = (status: MarketDataStatus) => ({ loading: '載入中', realtime: '即時', delayed: '延遲', closed: '收盤', 'recent-effective': '最近有效', unavailable: '資料不足', failed: '取得失敗' })[status];
export const formatMarketTime = (value: string | null) => value ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'short', timeStyle: 'short', hour12: false }).format(new Date(value)) : '—';
export const marketTone = (value: number | null) => value === null || value === 0 ? 'hold' : value > 0 ? 'up' : 'down';
