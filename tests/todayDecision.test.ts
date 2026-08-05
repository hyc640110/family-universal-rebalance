import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deriveTodayDecision, type TodayDecisionInput } from '../src/lib/todayDecision';

// UR-TODO-009 sub-PR 5: verifies the fixed 013 §11.2/§24.2 priority order using the real pure function.

const BASE: TodayDecisionInput = {
  dataCompleteness: 'complete',
  safetyCashShortfall: 0,
  investableCash: 100_000,
  thresholdReached: false,
  triggeredDipAlertCount: 0,
  defensiveReminderStatus: 'ok',
  totalBuyAmount: 0
};

const run = (overrides: Partial<TodayDecisionInput> = {}) => deriveTodayDecision({ ...BASE, ...overrides });

test('is deterministic and does not mutate its input', () => {
  const input: TodayDecisionInput = { ...BASE, safetyCashShortfall: 10_000 };
  const before = structuredClone(input);
  const first = deriveTodayDecision(input);
  const second = deriveTodayDecision(input);
  assert.deepEqual(first, second);
  assert.deepEqual(input, before);
});

test('第 1 層資料不足會覆蓋所有後續投資訊號，且不產生精確投資建議', () => {
  const result = run({
    dataCompleteness: 'insufficient',
    safetyCashShortfall: 50_000,
    investableCash: 100_000,
    thresholdReached: true,
    triggeredDipAlertCount: 1,
    defensiveReminderStatus: 'under',
    totalBuyAmount: 50_000
  });

  assert.equal(result.conclusion, '目前缺少必要生活費或負債資料，無法安全計算可投資現金。');
});

test('partial 資料與核心流動性金額缺失都停在第 1 層', () => {
  for (const overrides of [
    { dataCompleteness: 'partial' as const },
    { safetyCashShortfall: null },
    { investableCash: null }
  ]) {
    const result = run({ ...overrides, thresholdReached: true, triggeredDipAlertCount: 1 });
    assert.equal(result.conclusion, '目前缺少必要生活費或負債資料，無法安全計算可投資現金。');
    assert.equal(result.dataInsufficient, true);
  }
});

test('第 2 層安全存量缺口會覆蓋可投資現金、配置偏離與逢低訊號', () => {
  const result = run({
    safetyCashShortfall: 1,
    investableCash: 100_000,
    thresholdReached: true,
    triggeredDipAlertCount: 1,
    defensiveReminderStatus: 'under',
    totalBuyAmount: 50_000
  });

  assert.equal(result.conclusion, '現金安全存量不足');
  assert.equal(result.lowCashSafety, true);
});

test('investableCash 為 0 時，即使配置偏離與逢低訊號同時成立，仍只回傳第 3 層', () => {
  const result = run({
    investableCash: 0,
    thresholdReached: true,
    triggeredDipAlertCount: 1,
    defensiveReminderStatus: 'under',
    totalBuyAmount: 50_000
  });

  assert.equal(result.conclusion, '目前沒有可投資現金，建議先保留現金。');
});

test('investableCash 大於 0 且配置偏離與逢低訊號同時成立時，只回傳第 4 層', () => {
  const result = run({ investableCash: 1, thresholdReached: true, triggeredDipAlertCount: 1 });

  assert.equal(result.conclusion, '已達再平衡門檻');
});

test('只有前 5 層皆不成立時才進入第 6 層的既有機會訊號或維持持有', () => {
  assert.equal(run({ defensiveReminderStatus: 'under' }).conclusion, '防守資產不足');
  assert.equal(run({ totalBuyAmount: 1 }).conclusion, '建議分批加碼');
  assert.equal(run().conclusion, '維持持有，暫不需要操作');
});

test('首頁將六層結果作為唯一投資主決策，並將同步 dirty 降為次要提醒', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../src/pages/DashboardDecisionPage.tsx', import.meta.url), 'utf8');
  const summary = readFileSync(new URL('../src/components/InvestmentIntelligenceSummary.tsx', import.meta.url), 'utf8');
  const workflow = readFileSync(new URL('../src/components/DailyDecisionWorkflow.tsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(app, /todayConclusion: todayDecision\.conclusion/);
  assert.match(app, /syncReminder: syncBaselineDiagnostics\.dirty \? syncStatusText : null/);
  assert.match(page, /todayConclusion: string; syncReminder: string \| null/);
  assert.match(summary, /todayConclusion=\{todayConclusion\} syncReminder=\{syncReminder\}/);
  assert.match(workflow, /<p className="eyebrow">今日建議結論<\/p><h3[^>]*>\{displayEmbeddedAmounts\(todayConclusion, hidden\)\}<\/h3>/);
  assert.match(workflow, /syncReminder && <p className="daily-decision-sync-reminder"><strong>資料同步提醒<\/strong>\{displayEmbeddedAmounts\(syncReminder, hidden\)\}<\/p>/);
  assert.doesNotMatch(workflow, /<h3[^>]*>\{workflow\.conclusion\.title\}<\/h3>/);
  assert.match(css, /\.daily-decision-sync-reminder\{[^}]*font-size:12px/);
  assert.match(css, /@media \(max-width:700px\)\{[\s\S]*?\.daily-decision-workflow-status/);
});
