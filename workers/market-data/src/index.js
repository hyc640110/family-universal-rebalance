const VERSION = 'market-data-worker-v5.4.1';
const TWSE_URL = 'https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX';
const TREASURY_URL = 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value_month=';
const SOURCE_TWSE = '臺灣證券交易所 OpenAPI';
const SOURCE_TREASURY = '美國財政部 Daily Treasury Rates';
const unavailable = (id, group, name, source, detail) => ({ id, group, name, value: null, change: null, changePct: null, asOf: null, fetchedAt: null, source, status: 'unavailable', detail });
const safeNumber = value => { const number = Number(String(value ?? '').trim().replace(/[,%\s]/g, '')); return Number.isFinite(number) ? number : null; };
const taiwanDate = raw => { const value = String(raw ?? '').trim(); if (!/^\d{7}$/.test(value)) return null; return `${Number(value.slice(0, 3)) + 1911}-${value.slice(3, 5)}-${value.slice(5, 7)}T08:00:00+08:00`; };
const directionText = raw => String(raw ?? '').replace(/<[^>]*>/g, '').replace(/&(nbsp|#160);/gi, '').replace(/&#(?:x0*2b|0*43);|&plus;/gi, '+').replace(/&#(?:x0*2d|0*45);|&minus;/gi, '-').trim();
const twseDirection = raw => {
  const value = directionText(raw);
  if (['+', '＋', '▲', '△', '漲', '上漲'].includes(value)) return 1;
  if (['-', '－', '−', '▼', '▽', '跌', '下跌'].includes(value)) return -1;
  if (['0', '平', '平盤'].includes(value)) return 0;
  return null;
};
export function parseTwseSignedChange(directionRaw, changeRaw, changePctRaw) {
  const direction = twseDirection(directionRaw);
  const change = safeNumber(changeRaw);
  const changePct = safeNumber(changePctRaw);
  if (direction === null || change === null || changePct === null) return null;
  if (direction === 0) return change === 0 && changePct === 0 ? { change: 0, changePct: 0 } : null;
  if (change === 0 || changePct === 0) return null;
  return { change: direction * Math.abs(change), changePct: direction * Math.abs(changePct) };
}
export function healthEnvironment(env) {
  return env?.ENVIRONMENT === 'preview' || env?.ENVIRONMENT === 'production'
    ? env.ENVIRONMENT
    : 'unconfigured';
}
export function parseTwseIndex(rows, fetchedAt) { const target = Array.isArray(rows) ? rows.find(row => String(row?.['指數'] ?? '').includes('發行量加權股價指數')) : null; if (!target) return unavailable('taiex', 'taiwan', '台灣加權指數', SOURCE_TWSE, '官方資料未提供加權指數。'); const signedChange = parseTwseSignedChange(target['漲跌'], target['漲跌點數'], target['漲跌百分比']); return { id: 'taiex', group: 'taiwan', name: '台灣加權指數', value: safeNumber(target['收盤指數']), change: signedChange?.change ?? null, changePct: signedChange?.changePct ?? null, asOf: taiwanDate(target['日期']), fetchedAt, source: SOURCE_TWSE, sourceUrl: TWSE_URL, status: 'closed', detail: signedChange ? '交易所已發布之收盤資料，非即時行情。' : '交易所已發布之收盤資料；漲跌方向或變動數值格式無法驗證，不顯示變動。' }; }
const tag = (entry, name) => new RegExp(`<d:${name}[^>]*>([^<]+)</d:${name}>`).exec(entry)?.[1] ?? null;
export function parseTreasuryLatest(xml, fetchedAt) { const entries = String(xml ?? '').match(/<entry>[\s\S]*?<\/entry>/g) ?? []; const latest = entries.map(entry => ({ entry, date: tag(entry, 'NEW_DATE') })).filter(item => item.date).sort((a, b) => b.date.localeCompare(a.date))[0]; if (!latest) return ['2Y', '10Y', '30Y', '10Y－2Y'].map(label => unavailable(`ust-${label.toLowerCase()}`, 'treasury', `美國 ${label} 公債殖利率`, SOURCE_TREASURY, '官方資料格式不完整。')); const asOf = `${latest.date.slice(0, 10)}T00:00:00-04:00`; const two = safeNumber(tag(latest.entry, 'BC_2YEAR')); const ten = safeNumber(tag(latest.entry, 'BC_10YEAR')); const thirty = safeNumber(tag(latest.entry, 'BC_30YEAR')); const point = (id, name, value, detail = '每日官方殖利率曲線資料，非即時行情。') => ({ id, group: 'treasury', name, value, unit: '%', change: null, changePct: null, asOf, fetchedAt, source: SOURCE_TREASURY, sourceUrl: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?page=0&type=daily_treasury_yield_curve', status: 'recent-effective', detail }); const spread = ten !== null && two !== null ? Number((ten - two).toFixed(4)) : null; return [point('ust-2y', '美國 2Y 公債殖利率', two), point('ust-10y', '美國 10Y 公債殖利率', ten), point('ust-30y', '美國 30Y 公債殖利率', thirty), point('ust-10y-2y', '10Y－2Y 利差', spread, '以同一官方日資料計算之利差，非即時行情。')]; }
const globalItems = () => [['sp500', 'S&P 500'], ['nasdaq', 'NASDAQ Composite'], ['sox', '費城半導體指數'], ['nikkei', '日經 225']].map(([id, name]) => unavailable(id, 'global', name, '尚未設定可驗證的資料來源', '本版不使用授權或時間語意未確認的指數資料。'));
const eventItems = () => [unavailable('ndc-business-signal', 'event', '景氣對策信號', '國發會／政府資料開放平臺', '官方事件資料 adapter 尚未設定；不以硬編碼數值替代。')];
const headers = request => ({ 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': request.headers.get('origin') || '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': 'content-type, accept', 'vary': 'Origin', 'cache-control': 'public, max-age=300, s-maxage=900' });
async function marketSummary() { const fetchedAt = new Date().toISOString(); const month = fetchedAt.slice(0, 7).replace('-', ''); const [twseResult, treasuryResult] = await Promise.allSettled([fetch(TWSE_URL, { headers: { accept: 'application/json' } }).then(async response => { if (!response.ok) throw new Error(`TWSE HTTP ${response.status}`); return parseTwseIndex(await response.json(), fetchedAt); }), fetch(`${TREASURY_URL}${month}`, { headers: { accept: 'application/xml' } }).then(async response => { if (!response.ok) throw new Error(`Treasury HTTP ${response.status}`); return parseTreasuryLatest(await response.text(), fetchedAt); })]); const items = [twseResult.status === 'fulfilled' ? twseResult.value : unavailable('taiex', 'taiwan', '台灣加權指數', SOURCE_TWSE, '官方資料暫時無法取得。'), ...globalItems(), ...(treasuryResult.status === 'fulfilled' ? treasuryResult.value : parseTreasuryLatest('', fetchedAt)), ...eventItems()]; const failed = [twseResult, treasuryResult].filter(item => item.status === 'rejected').length; return { version: VERSION, fetchedAt, status: failed === 2 ? 'failed' : failed ? 'delayed' : 'recent-effective', items, error: failed ? '部分官方來源暫時無法取得；未以舊值或估算值替代。' : undefined }; }
export default { async fetch(request, env) { const responseHeaders = headers(request); if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: responseHeaders }); const url = new URL(request.url); if (url.pathname === '/health') return Response.json({ ok: true, version: VERSION, environment: healthEnvironment(env) }, { headers: responseHeaders }); if (url.pathname !== '/market-summary') return Response.json({ ok: false, error: 'not found' }, { status: 404, headers: responseHeaders }); try { return Response.json(await marketSummary(), { headers: responseHeaders }); } catch { return Response.json({ fetchedAt: new Date().toISOString(), status: 'failed', items: [...globalItems(), ...eventItems()], error: '市場資料服務暫時無法取得。' }, { status: 502, headers: responseHeaders }); } } };
