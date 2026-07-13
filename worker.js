
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const rawSymbol = url.searchParams.get('symbol') || '00631L';
    const cleanSymbol = rawSymbol.replace(/\..*$/, '').toUpperCase(); // 00631L.TW -> 00631L
    const twseUrl = `https://www.twse.com.tw/exchangeReport/STOCK_DAY_AVG?response=json&stockNo=${encodeURIComponent(cleanSymbol)}`;
    const headers = {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'cache-control': 's-maxage=30'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    try {
      const res = await fetch(twseUrl, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }});
      const data = await res.json();
      if (data.stat !== 'OK' || !Array.isArray(data.data)) {
        throw new Error(`TWSE API 狀態錯誤：${data.stat || '未知'}`);
      }
      const rows = data.data.filter(row => Array.isArray(row) && row[0] !== '月平均收盤價');
      if (rows.length < 2) {
        throw new Error('TWSE API 回傳資料筆數不足（少於 2 天）。');
      }
      const latestRow = rows[rows.length - 1];
      const prevRow = rows[rows.length - 2];
      const latestPrice = Number(latestRow[1]);
      const previousClose = Number(prevRow[1]);
      const change = latestPrice - previousClose;
      const changePct = previousClose ? (change / previousClose) * 100 : 0;
      const match = String(latestRow[0]).match(/^(\d{2,3})\/(\d{1,2})\/(\d{1,2})$/); if (!match) throw new Error('TWSE quote date format invalid');
      const quoteDate = `${Number(match[1]) + 1911}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      return new Response(JSON.stringify({ symbol: rawSymbol, price: latestPrice, latestPrice, previousClose, change, changePct, changePercent: changePct, quoteDate, quoteTime: '13:30:00', volume: 0, source: 'Taiwan Stock Exchange (TWSE) Official API' }), { headers });
    } catch (error) {
      return new Response(JSON.stringify({ symbol: rawSymbol, error: String(error), source: 'Worker error' }), { status: 502, headers });
    }
  }
};
