export type AllocationPreset = 'custom' | 'clec-442' | 'clec-433';
export type AllocationRole = 'prototype' | 'leveraged' | 'cash-like' | 'none';

export type AllocationPresetHolding = {
  symbol: string;
  name?: string;
  targetWeight?: number;
};

export type AllocationPresetPreviewInput = {
  preset: AllocationPreset;
  holdings: AllocationPresetHolding[];
  roleBySymbol: Record<string, AllocationRole>;
};

export type AllocationPresetPreview = {
  preset: AllocationPreset;
  canApply: boolean;
  blockingReasons: string[];
  warnings: string[];
  rows: Array<{ symbol: string; name: string; role: AllocationRole; currentWeight: number; nextWeight: number | null; difference: number | null; issue?: 'duplicate-role' }>;
  targetTotal: number | null;
  cashTargetPct: number | null;
};

const ROLE_ORDER: AllocationRole[] = ['prototype', 'leveraged', 'cash-like'];
const PRESET_WEIGHTS: Record<Exclude<AllocationPreset, 'custom'>, Record<Exclude<AllocationRole, 'none'>, number>> = {
  'clec-442': { prototype: 40, leveraged: 40, 'cash-like': 20 },
  'clec-433': { prototype: 40, leveraged: 30, 'cash-like': 30 }
};

const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const weight = (value: unknown) => finite(value) ? Math.max(0, Number(value)) : 0;
const key = (symbol: unknown) => String(symbol ?? '').trim().toUpperCase();

export const normalizeAllocationPreset = (value: unknown): AllocationPreset => value === 'clec-442' || value === 'clec-433' ? value : 'custom';
export const normalizeAllocationRole = (value: unknown): AllocationRole => value === 'prototype' || value === 'leveraged' || value === 'cash-like' ? value : 'none';

export function normalizeAllocationRoleBySymbol(value: unknown, holdings: readonly AllocationPresetHolding[]) {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const known = new Set(holdings.map(holding => key(holding.symbol)).filter(Boolean));
  return Object.fromEntries(Object.entries(input)
    .map(([symbol, role]) => [key(symbol), normalizeAllocationRole(role)] as const)
    .filter(([symbol, role]) => known.has(symbol) && role !== 'none')) as Record<string, AllocationRole>;
}

/** Produces a preview only. It never changes holdings, storage, or sync state. */
export function deriveAllocationPresetPreview(input: AllocationPresetPreviewInput): AllocationPresetPreview {
  const preset = normalizeAllocationPreset(input.preset);
  const holdings = input.holdings.map(holding => ({ ...holding, symbol: key(holding.symbol), name: holding.name || key(holding.symbol), targetWeight: weight(holding.targetWeight) }));
  const duplicateSymbols = holdings.map(holding => holding.symbol).filter((symbol, index, all) => !symbol || all.indexOf(symbol) !== index);
  const roleBySymbol = normalizeAllocationRoleBySymbol(input.roleBySymbol, holdings);
  const roles = Object.fromEntries(holdings.map(holding => [holding.symbol, normalizeAllocationRole(roleBySymbol[holding.symbol])])) as Record<string, AllocationRole>;
  const blockingReasons = duplicateSymbols.length ? [`持股代號重複或無效：${Array.from(new Set(duplicateSymbols)).join('、')}。`] : [];

  if (preset === 'custom') {
    const rows = holdings.map(holding => ({ symbol: holding.symbol, name: holding.name, role: roles[holding.symbol], currentWeight: holding.targetWeight, nextWeight: holding.targetWeight, difference: 0 }));
    return { preset, canApply: false, blockingReasons: ['自訂配置沿用目前目標比例，沒有可套用的 CLEC 變更。'], warnings: [], rows, targetTotal: rows.reduce((sum, row) => sum + row.nextWeight, 0), cashTargetPct: Math.max(0, 100 - rows.reduce((sum, row) => sum + row.nextWeight, 0)) };
  }

  if (!holdings.length) blockingReasons.push('尚無持股，無法指定 CLEC 角色。');
  const assigned = ROLE_ORDER.map(role => ({ role, symbols: holdings.filter(holding => roles[holding.symbol] === role).map(holding => holding.symbol) }));
  assigned.forEach(({ role, symbols }) => {
    if (symbols.length === 0) blockingReasons.push(`缺少「${roleLabel(role)}」角色。`);
    if (symbols.length > 1) blockingReasons.push(`「${roleLabel(role)}」在 V5.8.1 僅能指定一檔持股：${symbols.join('、')}。`);
  });
  const warnings = holdings.filter(holding => roles[holding.symbol] === 'none').map(holding => `${holding.symbol} 未指派 CLEC 角色；套用後目標比例將為 0%。`);
  const targets = PRESET_WEIGHTS[preset];
  const duplicateRoles = new Set(assigned.filter(item => item.symbols.length > 1).map(item => item.role));
  const isInvalid = blockingReasons.length > 0;
  const rows = holdings.map(holding => {
    const role = roles[holding.symbol];
    const nextWeight = isInvalid ? null : role === 'none' ? 0 : targets[role];
    return { symbol: holding.symbol, name: holding.name, role, currentWeight: holding.targetWeight, nextWeight, difference: nextWeight === null ? null : nextWeight - holding.targetWeight, issue: duplicateRoles.has(role) ? 'duplicate-role' as const : undefined };
  });
  if (!isInvalid) {
    const targetTotal = rows.reduce((sum, row) => sum + (row.nextWeight ?? 0), 0);
    if (targetTotal !== 100) return { preset, canApply: false, blockingReasons: [...blockingReasons, 'CLEC 角色目標比例未能合計為 100%，無法套用。'], warnings, rows: rows.map(row => ({ ...row, nextWeight: null, difference: null })), targetTotal: null, cashTargetPct: null };
    return { preset, canApply: true, blockingReasons, warnings, rows, targetTotal, cashTargetPct: Math.max(0, 100 - targetTotal) };
  }
  return { preset, canApply: false, blockingReasons, warnings, rows, targetTotal: null, cashTargetPct: null };
}

export const allocationPresetLabel = (preset: AllocationPreset) => preset === 'clec-442' ? 'CLEC 442' : preset === 'clec-433' ? 'CLEC 433' : '自訂配置';
export const roleLabel = (role: AllocationRole) => role === 'prototype' ? '原型資產' : role === 'leveraged' ? '槓桿資產' : role === 'cash-like' ? '類現金持股' : '未指派';
