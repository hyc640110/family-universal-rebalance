const VERSION = '00631L-Pro-Web-App Worker v6.3 CORS';
const ALLOWED = ['00631L.TW', '00865B.TW'];

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
  const value = String(raw || '00631L').trim().toUpperCase();
  const symbol = value.includes('.') ? value : `${value}.TW`;
  if (!ALLOWED.includes(symbol)) throw new Error(`unsupported symbol: ${symbol}`);
  return symbol;
}

function parseYahoo(symbol, data) {
  const result = data?.chart?.result?.[0];
  const meta = result?.meta || {};
  const q = result?.indicators?.quote?.[0] || {};
  const closes = Array.isArray(q.close) ? q.close.filter(v => typeof v === 'number') : [];
  const price = Number(meta.regularMarketPrice ?? closes.at(-1));
  const previousClose = Number(meta.previousClose || meta.chartPreviousClose || price);
  if (!Number.isFinite(price)) throw new Error(`empty price: ${symbol}`);
  return {
    ok: true,
    symbol,
    code: symbol.replace('.TW', ''),
    price,
    previousClose,
    change: price - previousClose,
    changePct: previousClose ? (price - previousClose) / previousClose * 100 : 0,
    volume: Number(meta.regularMarketVolume || 0),
    marketTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    source: 'Yahoo Finance via Cloudflare Worker',
    workerVersion: VERSION,
    updatedAt: new Date().toISOString()
  };
}

async function quote(symbol) {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
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
      return new Response(JSON.stringify(await quote(symbol)), { headers });
    } catch (error) {
      return new Response(JSON.stringify({ ok: false, error: String(error?.message || error), version: VERSION }), { status: 500, headers });
    }
  }
};
