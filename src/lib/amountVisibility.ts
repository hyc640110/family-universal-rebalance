/**
 * 介面小改進 1/5：全站隱藏金額。
 *
 * Fixed-character masking, deliberately not CSS blur — the user's stated reason is that a
 * blurred value can still be partially recovered from a screenshot or video recording after
 * compression, while replacing every digit with a placeholder character never renders the
 * real digits in the first place. Only digit characters are replaced; currency unit text
 * (元／萬元／NT$／USD 等)、逗號、小數點、正負號與空白全部保留，讓遮蔽後的字串長度與排版
 * 幾乎與原字串一致，避免版面跳動。
 *
 * This module intentionally has no React/state dependency — callers own the "hidden" boolean
 * (component-local or threaded down as a prop from App.tsx) and decide when to apply masking.
 * Nothing here persists to localStorage/Firebase/JSON Backup, matching the product decision
 * that visibility state is never remembered across reloads.
 */

export const AMOUNT_MASK_CHAR = '●';

/** Replaces every ASCII digit with AMOUNT_MASK_CHAR. Pure, no side effects. */
export function maskAmountText(text: string): string {
  return text.replace(/[0-9]/g, AMOUNT_MASK_CHAR);
}

/** Convenience wrapper: returns the original text when not hidden, masked text when hidden. */
export function displayAmount(text: string, hidden: boolean): string {
  return hidden ? maskAmountText(text) : text;
}

/**
 * Matches a signed, comma-grouped, optionally-decimal number immediately followed by a TWD
 * currency unit ('元' or '萬元'). Used only for narrative sentences that mix a currency amount
 * with other non-currency digits (percentages, month counts, item counts) — e.g. a computed
 * "reason" string like "目前現金可支應 6.5 個月必要支出。安全存量仍有缺口 50,000 元。" — where
 * blindly masking every digit in the whole string would incorrectly also hide "6.5" (a month
 * count), violating the product rule that only actual currency values are masked.
 */
const EMBEDDED_TWD_AMOUNT = /[+-]?[\d,]+(?:\.\d+)?\s*(?:萬元|元)/g;

/** Masks only the digits inside currency-suffixed substrings ('...元'/'...萬元'); leaves every other digit (percentages, counts, dates) untouched. Pure, no side effects. */
export function maskEmbeddedAmountsText(text: string): string {
  return text.replace(EMBEDDED_TWD_AMOUNT, match => match.replace(/[0-9]/g, AMOUNT_MASK_CHAR));
}

/** Convenience wrapper for maskEmbeddedAmountsText, mirroring displayAmount(). */
export function displayEmbeddedAmounts(text: string, hidden: boolean): string {
  return hidden ? maskEmbeddedAmountsText(text) : text;
}
