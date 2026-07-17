export type AllocationContextId = 'official-target' | 'simulation' | 'analysis';

export type AllocationContext = {
  id: AllocationContextId;
  name: string;
  shortLabel: string;
  description: string;
  modifiesOfficialTarget: boolean;
  isReadOnly: boolean;
  route: string;
  ctaLabel: string;
  ariaLabel: string;
  title: string;
};

// Presentation-only definitions for the three allocation contexts. They do not
// introduce a second preset, targetWeight, route registry, or persistence model.
export const ALLOCATION_CONTEXTS: Readonly<Record<AllocationContextId, AllocationContext>> = {
  'official-target': {
    id: 'official-target',
    name: '正式目標配置',
    shortLabel: '正式設定',
    description: 'CLEC 433、442 或自訂配置都是正式目標比例；再平衡建議與相關決策會使用此設定。確認套用後，才會影響後續正式配置判定。',
    modifiesOfficialTarget: true,
    isReadOnly: false,
    route: '/assets',
    ctaLabel: '查看正式目標配置',
    ariaLabel: '查看正式目標配置',
    title: '查看正式目標配置'
  },
  simulation: {
    id: 'simulation',
    name: '配置模擬器',
    shortLabel: '暫時試算',
    description: '僅供試算與比較；模擬結果不會自動取代正式目標配置。本頁不提供套用正式配置的功能。',
    modifiesOfficialTarget: false,
    isReadOnly: false,
    route: '/assets',
    ctaLabel: '查看正式目標配置',
    ariaLabel: '前往資產頁查看正式目標配置',
    title: '前往資產頁查看正式目標配置'
  },
  analysis: {
    id: 'analysis',
    name: '配置分析',
    shortLabel: '唯讀分析',
    description: '分析目前持股與正式目標配置的差異，只提供解讀與比較；不會建立或修改配置方案。',
    modifiesOfficialTarget: false,
    isReadOnly: true,
    route: '/assets',
    ctaLabel: '查看正式目標配置',
    ariaLabel: '前往資產頁查看正式目標配置',
    title: '前往資產頁查看正式目標配置'
  }
};

export function getAllocationContext(id: AllocationContextId) {
  return ALLOCATION_CONTEXTS[id];
}
