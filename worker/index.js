const VERSION = '00631L-Pro-Web-App Worker v6.16.1 trusted-previous-close-preview-contract';
const DEFAULT_SYMBOL = '00631L.TW';
const TAIWAN_SYMBOL_RE = /^[0-9A-Z]{4,8}\.(TW|TWO)$/;
const TWSE_TIMEOUT_MS = 4_000;
const taipeiParts = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date).reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
export const taipeiQuoteStamp = (value) => {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('invalid market time');
  const parts = taipeiParts(value);
  return { quoteDate: `${parts.year}-${parts.month}-${parts.day}`, quoteTime: `${parts.hour}:${parts.minute}:${parts.second}` };
};

function corsHeaders(request) {
  const origin = request.headers.get('origin') || '*';
  return {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, HEAD, OPTIONS',
    'access-control-allow-headers': 'content-type, accept, origin, referer, user-agent',
    'access-control-max-age': '86400',
    'access-control-allow-private-network': 'true',
    'cross-origin-resource-policy': 'cross-origin',
    'vary': 'Origin',
    'cache-control': 'no-store'
  };
}

function normalizeSymbol(raw) {
  const value = String(raw || DEFAULT_SYMBOL).trim().toUpperCase();
  const [code, market = 'TW'] = value.split('.');
  const symbol = `${code}.${market}`;
  if (!TAIWAN_SYMBOL_RE.test(symbol)) throw new Error(`unsupported symbol: ${symbol}`);
  return symbol;
}

export function parseYahoo(symbol, data) {
  const result = data?.chart?.result?.[0];
  const meta = result?.meta || {};
  const q = result?.indicators?.quote?.[0] || {};
  const closes = Array.isArray(q.close) ? q.close.filter(v => typeof v === 'number') : [];
  const latestPrice = Number(meta.regularMarketPrice ?? closes.at(-1));
  if (!Number.isFinite(latestPrice) || latestPrice <= 0) throw new Error(`empty quote fields: ${symbol}`);
  const marketTimeSeconds = Number(meta.regularMarketTime);
  if (!Number.isFinite(marketTimeSeconds) || marketTimeSeconds <= 0) throw new Error(`missing market time: ${symbol}`);
  const marketTime = new Date(marketTimeSeconds * 1000);
  const { quoteDate, quoteTime } = taipeiQuoteStamp(marketTime);
  return {
    ok: true,
    symbol,
    code: symbol.replace('.TW', ''),
    price: latestPrice,
    latestPrice,
    ...unavailablePreviousClose('twse_official_previous_close_pending'),
    change: null,
    changePct: null,
    changePercent: null,
    quoteDate,
    quoteTime,
    volume: Number(meta.regularMarketVolume || 0),
    marketTime: marketTime.toISOString(),
    source: 'Yahoo Finance via Cloudflare Worker',
    workerVersion: VERSION,
    updatedAt: new Date().toISOString()
  };
}

const unavailablePreviousClose = (reason) => ({
  previousClose: null,
  previousCloseDate: null,
  previousCloseSource: 'unavailable',
  previousCloseTrusted: false,
  previousCloseReason: reason,
});

const validPrice = value => Number.isFinite(Number(value)) && Number(value) > 0;
const validIsoDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(`${value}T00:00:00Z`).getTime());
const normalizedCode = symbol => String(symbol || '').trim().toUpperCase().replace(/\.(TW|TWO)$/, '');

const parseTwseDate = (value) => {
  const match = String(value || '').trim().match(/^(\d{2,3})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]) + 1911;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return validIsoDate(iso) ? iso : null;
};

const numericTwsePrice = (value) => {
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  return validPrice(normalized) ? Number(normalized) : null;
};

export function selectTwsePreviousClose(symbol, quoteDate, payloads) {
  if (!validIsoDate(quoteDate) || !Array.isArray(payloads)) return unavailablePreviousClose('twse_official_previous_close_unavailable');
  const code = normalizedCode(symbol);
  const candidates = [];
  for (const payload of payloads) {
    if (!payload || payload.stat !== 'OK' || !String(payload.title || '').toUpperCase().includes(code)) continue;
    const dateIndex = Array.isArray(payload.fields) ? payload.fields.indexOf('日期') : -1;
    const closeIndex = Array.isArray(payload.fields) ? payload.fields.indexOf('收盤價') : -1;
    if (dateIndex < 0 || closeIndex < 0 || !Array.isArray(payload.data)) continue;
    for (const row of payload.data) {
      if (!Array.isArray(row)) continue;
      const date = parseTwseDate(row[dateIndex]);
      const price = numericTwsePrice(row[closeIndex]);
      if (date && date < quoteDate && price !== null) candidates.push({ date, price });
    }
  }
  candidates.sort((a, b) => b.date.localeCompare(a.date));
  const latest = candidates[0];
  return latest
    ? { previousClose: latest.price, previousCloseDate: latest.date, previousCloseSource: 'twse_official_previous_close', previousCloseTrusted: true, previousCloseReason: null }
    : unavailablePreviousClose('twse_official_previous_close_unavailable');
}

export function selectVerifiedPreviousClose(quoteDate, yahooMeta, official) {
  const yahooPrice = Number(yahooMeta?.regularMarketPreviousClose);
  const yahooDate = typeof yahooMeta?.regularMarketPreviousCloseDate === 'string' ? yahooMeta.regularMarketPreviousCloseDate : null;
  const yahooCanMatchOfficial = validIsoDate(quoteDate) && validIsoDate(yahooDate)
    && yahooDate < quoteDate
    && validPrice(yahooPrice)
    && official?.previousCloseTrusted === true
    && official.previousCloseDate === yahooDate
    && Number.isFinite(Number(official.previousClose))
    && Math.abs(yahooPrice - Number(official.previousClose)) < 0.000001;
  if (yahooCanMatchOfficial) return { previousClose: yahooPrice, previousCloseDate: yahooDate, previousCloseSource: 'yahoo_regular_market_previous_close', previousCloseTrusted: true, previousCloseReason: null };
  return official?.previousCloseTrusted === true ? official : unavailablePreviousClose('twse_official_previous_close_unavailable');
}

const twseMonthStarts = (quoteDate) => {
  const date = new Date(`${quoteDate}T00:00:00Z`);
  const current = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}01`;
  date.setUTCMonth(date.getUTCMonth() - 1, 1);
  const previous = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}01`;
  return [current, previous];
};

const twseUrl = (symbol, monthStart) => `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${monthStart}&stockNo=${encodeURIComponent(normalizedCode(symbol))}`;

async function fetchJsonWithTimeout(url, fetchImpl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TWSE_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, { headers: { accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`TWSE status ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTwseMonth(symbol, monthStart, fetchImpl) {
  const url = twseUrl(symbol, monthStart);
  const cache = typeof caches === 'undefined' ? null : caches.default;
  const key = new Request(url);
  const cached = cache ? await cache.match(key) : null;
  if (cached) return cached.json();
  const payload = await fetchJsonWithTimeout(url, fetchImpl);
  if (cache) {
    const response = new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=21600' } });
    await cache.put(key, response);
  }
  return payload;
}

export async function resolveTwsePreviousClose(symbol, quoteDate, fetchImpl = fetch) {
  if (!/\.TW$/.test(symbol) || !validIsoDate(quoteDate)) return unavailablePreviousClose('twse_official_previous_close_unavailable');
  try {
    const payloads = await Promise.all(twseMonthStarts(quoteDate).map(monthStart => fetchTwseMonth(symbol, monthStart, fetchImpl)));
    return selectTwsePreviousClose(symbol, quoteDate, payloads);
  } catch {
    return unavailablePreviousClose('twse_official_previous_close_unavailable');
  }
}
export const upstreamStatus = error => Number.isInteger(error?.status) && error.status >= 400 && error.status < 600 ? error.status : 500;

async function quote(symbol, refresh = false) {
  const yahooUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  yahooUrl.searchParams.set('range', '5d');
  yahooUrl.searchParams.set('interval', '1d');
  if (refresh) yahooUrl.searchParams.set('_refresh', String(Date.now()));
  const res = await fetch(yahooUrl, {
    headers: {
      'user-agent': VERSION,
      'accept': 'application/json'
    }
  });
  if (!res.ok) { const error = new Error(`Yahoo status ${res.status}`); error.status = res.status; throw error; }
  const data = await res.json();
  const parsed = parseYahoo(symbol, data);
  const previous = await resolveTwsePreviousClose(symbol, parsed.quoteDate);
  const verifiedPrevious = selectVerifiedPreviousClose(parsed.quoteDate, data?.chart?.result?.[0]?.meta, previous);
  const change = verifiedPrevious.previousCloseTrusted ? parsed.price - verifiedPrevious.previousClose : null;
  const changePercent = change === null ? null : change / verifiedPrevious.previousClose * 100;
  return { ...parsed, ...verifiedPrevious, change, changePct: changePercent, changePercent };
}

export default {
  async fetch(request) {
    const headers = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const url = new URL(request.url);
    try {
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ ok: true, version: VERSION, origin: request.headers.get('origin') || null }), { headers });
      }
      const symbol = normalizeSymbol(url.searchParams.get('symbol'));
      return new Response(JSON.stringify(await quote(symbol, url.searchParams.get('refresh') === '1')), { headers });
    } catch (error) {
      return new Response(JSON.stringify({ ok: false, error: String(error?.message || error), version: VERSION }), { status: upstreamStatus(error), headers });
    }
  }
};
