import type { CashFlowProfile } from './cashFlow';

export type HouseholdLiquidityPlanField = 'externalContribution' | 'plannedWithdrawal';

export type HouseholdLiquidityPlanInputParseResult =
  | Readonly<{ kind: 'absent' }>
  | Readonly<{ kind: 'valid'; value: number }>
  | Readonly<{ kind: 'invalid'; message: string }>;

/** Parses the Cash Flow form's 萬元 display value into the persisted 元 contract. */
export function parseHouseholdLiquidityPlanWan(raw: string): HouseholdLiquidityPlanInputParseResult {
  const value = raw.trim();
  if (value === '') return { kind: 'absent' };
  if (value.startsWith('-')) return { kind: 'invalid', message: '金額不可小於 0' };
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return { kind: 'invalid', message: '請輸入有效金額' };
  const wan = Number(value);
  const yuan = Math.round(wan * 10_000);
  if (!Number.isFinite(wan) || !Number.isSafeInteger(yuan)) return { kind: 'invalid', message: '金額超出可處理範圍' };
  return { kind: 'valid', value: yuan };
}

/** Preserves every unrelated Cash Flow field and removes a cleared optional value. */
export function applyHouseholdLiquidityPlanInput(profile: CashFlowProfile, field: HouseholdLiquidityPlanField, value: number | undefined): CashFlowProfile {
  const { externalContribution: _externalContribution, plannedWithdrawal: _plannedWithdrawal, ...rest } = profile;
  return {
    ...rest,
    ...(field === 'externalContribution' ? (value === undefined ? {} : { externalContribution: value }) : (_externalContribution === undefined ? {} : { externalContribution: _externalContribution })),
    ...(field === 'plannedWithdrawal' ? (value === undefined ? {} : { plannedWithdrawal: value }) : (_plannedWithdrawal === undefined ? {} : { plannedWithdrawal: _plannedWithdrawal }))
  };
}

export function householdLiquidityPlanInputStatus(value: number | undefined): string {
  return value === undefined ? '未設定' : `已設定：${value.toLocaleString('zh-TW')} 元`;
}
