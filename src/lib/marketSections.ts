import type { MarketDataGroup, MarketSnapshot } from './marketData';

export type MarketSectionDefinition = { key: MarketDataGroup; title: string; description: string; eyebrow: string; enabled: boolean };

// Keep unavailable providers in the response contract, but do not surface their placeholder UI until a verified provider exists.
export const MARKET_SECTION_REGISTRY: Record<MarketDataGroup, MarketSectionDefinition> = {
  taiwan: { key: 'taiwan', title: '台股主要指標', description: '僅呈現臺灣證券交易所已發布的收盤資料。', eyebrow: '官方收盤', enabled: true },
  global: { key: 'global', title: '全球主要指數', description: '尚未接入可驗證資料來源。', eyebrow: 'Foundation', enabled: false },
  treasury: { key: 'treasury', title: '美國公債殖利率', description: '美國財政部每日官方殖利率曲線資料。', eyebrow: '每日官方資料', enabled: true },
  event: { key: 'event', title: '重要經濟事件', description: '尚未接入可驗證資料來源。', eyebrow: 'Foundation', enabled: false },
};

export const VISIBLE_MARKET_SECTIONS = (Object.values(MARKET_SECTION_REGISTRY) as MarketSectionDefinition[]).filter(section => section.enabled);
export const isMarketSectionEnabled = (group: MarketDataGroup) => MARKET_SECTION_REGISTRY[group].enabled;
export const visibleMarketSnapshot = (snapshot: MarketSnapshot): MarketSnapshot => ({ ...snapshot, items: snapshot.items.filter(item => isMarketSectionEnabled(item.group)) });
