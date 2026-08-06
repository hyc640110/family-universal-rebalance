import { Eye, EyeOff } from 'lucide-react';

/**
 * 全站收合／展開按鈕圖示改為眼睛圖案（唯讀盤點後使用者拍板範圍）。
 *
 * Pure presentational icon swap — replaces the ▲/▼ glyph position only;
 * the existing 收合／展開 text labels are kept as-is by each caller.
 * Reuses the exact same lucide-react icons/size as
 * AmountVisibilityToggle.tsx (Eye = open/visible, EyeOff = closed/hidden)
 * so the two features share one consistent icon language, without adding
 * any new dependency.
 *
 * Scope (2026-08-06 使用者拍板): only applied to SectionCard (App.tsx, 19
 * call sites via this one shared component) and 3 independently-defined
 * toggles (HouseholdLiquidityDiagnosticList.tsx, RiskCenterPage.tsx 風險說明,
 * InvestmentActionCenterPage.tsx). Deliberately NOT applied to: native
 * <details>/<summary> disclosure widgets (10 locations — replacing the
 * native marker is an accessibility-affecting change, out of scope), or the
 * 5 other local toggles whose semantics aren't really show/hide (an
 * edit-mode toggle, a mutually-exclusive accordion, and three "load more
 * rows" paginators) — see the read-only survey for the full reasoning.
 */
export default function CollapseEyeIcon({ open }: { open: boolean }) {
  return open ? <Eye size={20} aria-hidden="true" /> : <EyeOff size={20} aria-hidden="true" />;
}
