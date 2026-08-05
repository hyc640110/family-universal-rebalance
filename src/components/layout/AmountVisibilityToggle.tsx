import { Eye, EyeOff } from 'lucide-react';

/**
 * 介面小改進 1/5：全站隱藏金額的唯一開關進入點。
 * Fixed-position floating button, same corner on desktop and mobile (per user decision —
 * no existing every-page element could host this without squeezing existing layout).
 * Rendered once in AppLayout so it appears on every route without per-page wiring.
 */
export default function AmountVisibilityToggle({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  return <button
    type="button"
    className={`amount-visibility-toggle${hidden ? ' active' : ''}`}
    aria-pressed={hidden}
    aria-label={hidden ? '顯示金額' : '隱藏金額'}
    title={hidden ? '顯示金額' : '隱藏金額'}
    onClick={onToggle}
  >
    {hidden ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
  </button>;
}
