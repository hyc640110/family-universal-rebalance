import type { CashFlowProfile } from './cashFlow';
import type { HouseholdLiquidityInputDiagnostic, HouseholdLiquidityInputDiagnosticCode } from './householdLiquidityInputDiagnostics';

export type HouseholdLiquidityDiagnosticPresentationItem = Readonly<{
  key: string;
  message: string;
  action: Readonly<{ label: string; to: '/tools/cash-flow' }>;
}>;

export type HouseholdLiquidityDiagnosticPresentation = Readonly<{
  items: readonly HouseholdLiquidityDiagnosticPresentationItem[];
}>;

const priority: Record<HouseholdLiquidityInputDiagnosticCode, number> = {
  CASH_FLOW_PROFILE_MISSING: 1,
  LOAN_SOURCE_UNAVAILABLE: 2,
  DEBT_PAYMENT_LINK_ORPHANED: 3,
  DEBT_PAYMENT_LINK_REQUIRED: 4,
  CASH_FLOW_ROLE_UNASSIGNED: 5,
  CASH_FLOW_ROLE_AMBIGUOUS: 6,
  EXTERNAL_CONTRIBUTION_UNSET: 7,
  PLANNED_WITHDRAWAL_UNSET: 8,
};

const action = { label: '前往收支與現金流中心', to: '/tools/cash-flow' } as const;

const expenseName = (profile: CashFlowProfile | null | undefined, sourceId: string | undefined) => {
  const id = sourceId?.startsWith('cash-flow:') ? sourceId.slice('cash-flow:'.length) : undefined;
  const name = id ? profile?.fixedExpenses.find(item => item.id === id)?.name.trim() : '';
  return name || '未命名固定支出';
};

const messageFor = (diagnostic: HouseholdLiquidityInputDiagnostic, profile: CashFlowProfile | null | undefined) => {
  const name = expenseName(profile, diagnostic.sourceId);
  switch (diagnostic.code) {
    case 'CASH_FLOW_PROFILE_MISSING': return '現金流設定尚未建立。請先設定每月收支與固定支出。';
    case 'CASH_FLOW_ROLE_UNASSIGNED': return `固定支出「${name}」尚未指定家庭流動性用途。`;
    case 'CASH_FLOW_ROLE_AMBIGUOUS': return `固定支出「${name}」用途仍待確認。`;
    case 'DEBT_PAYMENT_LINK_REQUIRED': return `固定支出「${name}」已標記為借款還款，但尚未連結借款。`;
    case 'LOAN_SOURCE_UNAVAILABLE': return '借款資料來源目前無法取得，無法確認借款還款連結。';
    case 'DEBT_PAYMENT_LINK_ORPHANED': return `固定支出「${name}」原連結借款已不存在，請重新選擇。`;
    case 'EXTERNAL_CONTRIBUTION_UNSET': return '尚未明確設定本期額外投入資金。';
    case 'PLANNED_WITHDRAWAL_UNSET': return '尚未明確設定本期預計提領資金。';
  }
};

export function presentHouseholdLiquidityDiagnostics({
  diagnostics,
  cashFlowProfile,
}: Readonly<{
  diagnostics: readonly HouseholdLiquidityInputDiagnostic[];
  cashFlowProfile: CashFlowProfile | null | undefined;
}>): HouseholdLiquidityDiagnosticPresentation {
  const unique = new Map<string, HouseholdLiquidityInputDiagnostic>();
  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.code}:${diagnostic.sourceId ?? ''}`;
    if (!unique.has(key)) unique.set(key, diagnostic);
  }
  return {
    items: [...unique.values()]
      .sort((left, right) => priority[left.code] - priority[right.code] || (left.sourceId ?? '').localeCompare(right.sourceId ?? ''))
      .map(diagnostic => ({
        key: `${diagnostic.code}:${diagnostic.sourceId ?? ''}`,
        message: messageFor(diagnostic, cashFlowProfile),
        action,
      })),
  };
}
