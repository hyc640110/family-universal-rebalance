import type { ReactNode } from 'react';

/**
 * 介面小改進 2/5：目前值與目標值並排顯示。
 *
 * Pure presentational component — it never formats or masks values itself.
 * Callers pass already-formatted strings (via their own local money()/pct()
 * closures, which already apply amount-visibility masking when active), so
 * this component stays compatible with AmountVisibilityContext without
 * needing to know about it.
 *
 * Scope note (2026-08-06 讀者確認): only applied to locations that already
 * had both a computed current value and target value available, where the
 * existing layout showed them on separate rows/cards
 * (`App.tsx` 的 AllocationAnalysis、WealthGoalPage 摘要卡片)。CLEC 策略卡片
 * 缺少「目前比例」計算資料，屬另一個獨立的資料／計算層問題，本次不處理。
 */
export default function TargetValuePair({
  currentLabel = '目前',
  currentValue,
  targetLabel = '目標',
  targetValue,
  currentTone
}: {
  currentLabel?: string;
  currentValue: ReactNode;
  targetLabel?: string;
  targetValue: ReactNode;
  currentTone?: string;
}) {
  return <div className="target-value-pair">
    <div className="target-value-pair-item">
      <small>{currentLabel}</small>
      <strong className={currentTone}>{currentValue}</strong>
    </div>
    <span className="target-value-pair-arrow" aria-hidden="true">→</span>
    <div className="target-value-pair-item">
      <small>{targetLabel}</small>
      <strong>{targetValue}</strong>
    </div>
  </div>;
}
