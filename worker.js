
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const raw = url.searchParams.get('symbol') || '00631L.TW';
    const symbol = raw.includes('.') ? raw : `${raw}.TW`;
    const yahoo = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
    const headers = {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'cache-control': 's-maxage=30'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    try {
      const res = await fetch(yahoo, { headers: { 'user-agent': '00631L-Pro-Web-App/6.1' }});
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;
      const price = Number(meta?.regularMarketPrice || 0);
      
      // 解析歷史收盤價，防呆昨收不準問題
      let previousClose = Number(meta?.previousClose || meta?.chartPreviousClose || price);
      const closeList = result?.indicators?.quote?.[0]?.close;
      if (Array.isArray(closeList)) {
        const validCloses = closeList.filter(p => typeof p === 'number' && p > 0);
        if (validCloses.length > 0) {
          const lastClose = validCloses[validCloses.length - 1];
          if (validCloses.length >= 2) {
            const isLastCloseCurrentPrice = Math.abs(lastClose - price) < 0.001;
            if (isLastCloseCurrentPrice) {
              previousClose = validCloses[validCloses.length - 2];
            } else {
              previousClose = lastClose;
            }
          } else {
            previousClose = lastClose;
          }
        }
      }

      return new Response(JSON.stringify({ symbol, price, previousClose, volume: Number(meta?.regularMarketVolume || 0), source:'Yahoo Finance via Cloudflare Worker', raw:data }), { headers });
    } catch (error) {
      return new Response(JSON.stringify({ symbol, error:String(error), source:'Worker error' }), { status: 502, headers });
    }
  }
};
