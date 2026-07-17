import type { ClecRuleOutput } from './clecStrategyRules';

export const CLEC_STRATEGY_CENTER_ROUTE = '/tools/clec-strategy';
export const CLEC_RULE_SUMMARY_MAX_REASONS = 3;
export const CLEC_RULE_SUMMARY_MAX_WARNINGS = 3;

type SummaryTone = 'neutral' | 'attention' | 'blocked';

export type ClecRuleSummaryPresentation = {
  statusLabel: string;
  statusTone: SummaryTone;
  actionLabel: string | null;
  summary: string;
  reasons: ClecRuleOutput['explanationItems'];
  warnings: string[];
  affectedAssets: string[];
  route: typeof CLEC_STRATEGY_CENTER_ROUTE;
};

export const clecRuleActionLabel = (value: ClecRuleOutput['recommendedAction']) => ({
  hold: '維持持有', contribute: '保留投入規劃', buy_underweight: '可優先補低配', sell_overweight: '可檢視高配資產',
  rebalance_with_cash: '可用現金補低配', full_rebalance: '檢視完整配置差距', resolve_data_issue: '先修正資料'
})[value];

export const clecRuleDecisionStatusLabel = (value: ClecRuleOutput['decisionStatus']) => ({
  blocked: '資料不足／停止判定', no_action: '維持監測', monitor: '監測', rebalance_consider: '可考慮調整', rebalance_required: '需優先檢視'
})[value];

/** Pure presentation only: it consumes the already-derived V6.2 rule output. */
export function presentClecRuleSummary(rule: ClecRuleOutput | null | undefined): ClecRuleSummaryPresentation {
  if (!rule) return { statusLabel: '資料不足', statusTone: 'blocked', actionLabel: null, summary: '目前沒有可用的 CLEC 策略規則資料。', reasons: [], warnings: [], affectedAssets: [], route: CLEC_STRATEGY_CENTER_ROUTE };
  const blocked = rule.decisionStatus === 'blocked';
  const noAction = rule.decisionStatus === 'no_action';
  return {
    statusLabel: blocked ? '資料阻擋' : noAction ? '目前無需動作' : rule.severity === 'info' ? '可檢視' : '需注意',
    statusTone: blocked ? 'blocked' : noAction ? 'neutral' : 'attention', actionLabel: blocked ? null : clecRuleActionLabel(rule.recommendedAction), summary: rule.summary,
    reasons: rule.explanationItems.slice(0, CLEC_RULE_SUMMARY_MAX_REASONS), warnings: rule.warnings.slice(0, CLEC_RULE_SUMMARY_MAX_WARNINGS), affectedAssets: [...rule.affectedAssets], route: CLEC_STRATEGY_CENTER_ROUTE
  };
}
