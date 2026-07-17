const VERSION = '00631L-Pro-Web-App Worker v6.5.1 manual-refresh-contract';
const DEFAULT_SYMBOL = '00631L.TW';
const TAIWAN_SYMBOL_RE = /^[0-9A-Z]{4,8}\.(TW|TWO)$/;
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
  const previousClose = Number(meta.previousClose || meta.chartPreviousClose || latestPrice);
  if (!Number.isFinite(latestPrice) || !Number.isFinite(previousClose) || previousClose <= 0) throw new Error(`empty quote fields: ${symbol}`);
  const change = typeof meta.regularMarketChange === 'number' ? meta.regularMarketChange : latestPrice - previousClose;
  const changePercent = typeof meta.regularMarketChangePercent === 'number' ? meta.regularMarketChangePercent : change / previousClose * 100;
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
    previousClose,
    change,
    changePct: changePercent,
    changePercent,
    quoteDate,
    quoteTime,
    volume: Number(meta.regularMarketVolume || 0),
    marketTime: marketTime.toISOString(),
    source: 'Yahoo Finance via Cloudflare Worker',
    workerVersion: VERSION,
    updatedAt: new Date().toISOString()
  };
}

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
  if (!res.ok) throw new Error(`Yahoo status ${res.status}`);
  return parseYahoo(symbol, await res.json());
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
      return new Response(JSON.stringify({ ok: false, error: String(error?.message || error), version: VERSION }), { status: 500, headers });
    }
  }
};
