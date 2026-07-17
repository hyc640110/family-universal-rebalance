import { Link } from 'react-router-dom';
import PageFrame from './PageFrame';
import ToolQuickNavigation from '../components/ToolQuickNavigation';
import type { ClecStrategyCenterResult, ClecStrategyDefinition } from '../lib/clecStrategy';
import type { ClecRuleOutput } from '../lib/clecStrategyRules';

const pct = (value: number | null) => value === null || !Number.isFinite(value) ? '不可計算' : `${value.toFixed(1)}%`;
const statusLabel = (status: ClecStrategyDefinition['specificationStatus']) => status === 'implemented' ? '已可可靠計算' : status === 'verified-partial' ? '僅部分核對' : '公式未核實';

export default function ClecStrategyCenterPage({ view, rule }: { view: ClecStrategyCenterResult; rule: ClecRuleOutput }) {
  const executable = view.strategies.filter(item => item.id === 'standard' || item.id === 'buy-only');
  const pending = view.strategies.filter(item => !['current-target-gap', 'standard', 'buy-only'].includes(item.id));
  return <PageFrame page="tools" title="CLEC 再平衡策略中心" description="查看目標配置來源、既有可計算方式與 CLEC 策略規格狀態；未核實公式不會試算或自動交易。">
    <section className="clec-center-grid">
      <article className="clec-card"><p className="eyebrow">目前配置來源</p><h2>{view.allocationSource.label}</h2><p className="note">CLEC 433／442 只設定正式 targetWeight，不是再平衡方法。類現金持股與銀行現金分開處理。</p><div className="clec-weights">{view.allocationSource.targetWeights.map(row => <p key={row.symbol}><span><b>{row.symbol}</b>｜{row.role === 'prototype' ? '原型資產' : row.role === 'leveraged' ? '槓桿資產' : row.role === 'cash-like' ? '類現金持股' : '未指派'}</span><strong>{pct(row.targetWeight)}</strong></p>)}</div><p><b>目標比例總和：</b>{pct(view.allocationSource.targetWeightTotal)}</p>{!view.allocationSource.rolesValid && <ul className="clec-list blocking">{view.allocationSource.blockingReasons.map(item => <li key={item}>{item}</li>)}</ul>}<Link className="clec-secondary-link" to="/assets">前往資產頁設定 CLEC 配置</Link></article>
      <article className="clec-card"><p className="eyebrow">目前可使用的再平衡方式</p><h2>{view.currentStrategy.rebalanceMode === 'standard' ? 'Standard' : 'Buy-only'}</h2><p className="note">目前目標缺口是唯一正式計算來源；策略中心不重複交易表。</p><dl className="clec-facts"><div><dt>資料品質 gate</dt><dd>{view.dataQuality.passed ? '已通過' : '未通過，停止金額型計算'}</dd></div><div><dt>再平衡門檻</dt><dd>{view.trigger.thresholdReached === null ? '不可計算' : view.trigger.thresholdReached ? '已達門檻' : '尚未達門檻'}（偏離 {pct(view.trigger.allocationDeviation)}／門檻 {pct(view.trigger.rebalanceThreshold)}）</dd></div></dl><Link className="clec-primary-link" to={view.availableCalculation.recommendationRoute}>前往再平衡建議中心</Link></article>
    </section>
    <section className="clec-section clec-card clec-rule-card" aria-labelledby="clec-rule-title">
      <header><p className="eyebrow">Strategy Rule Foundation</p><h2 id="clec-rule-title">策略規則判定</h2></header>
      <p className="note">僅供決策輔助，非自動交易，不代表市場預測。信心指標只反映資料與規則完整度，並非統計機率。</p>
      <dl className="clec-facts clec-rule-facts">
        <div><dt>Allocation Preset</dt><dd>{view.allocationSource.label}</dd></div><div><dt>rebalanceMode</dt><dd>{view.currentStrategy.rebalanceMode}</dd></div>
        <div><dt>decisionStatus</dt><dd>{statusText(rule.decisionStatus)}</dd></div><div><dt>recommendedAction</dt><dd>{actionText(rule.recommendedAction)}</dd></div>
        <div><dt>severity</dt><dd>{rule.severity}</dd></div><div><dt>資料／規則完整度</dt><dd>{rule.confidence === 'high' ? '高' : rule.confidence === 'medium' ? '中' : '低'}</dd></div>
        <div><dt>asOfDate</dt><dd>{rule.calculatedAt}</dd></div><div><dt>calculatedAt</dt><dd>{rule.calculatedAt}（Asia/Taipei）</dd></div>
        <div><dt>可用現金</dt><dd>{moneyOrUnavailable(rule.financialSummary.availableCash)}</dd></div><div><dt>計畫投入</dt><dd>{moneyOrUnavailable(rule.financialSummary.plannedContribution)}</dd></div>
        <div><dt>計畫提款</dt><dd>{moneyOrUnavailable(rule.financialSummary.plannedWithdrawal)}</dd></div><div><dt>現金儲備</dt><dd>{moneyOrUnavailable(rule.financialSummary.cashReserve)}</dd></div>
        <div><dt>負債</dt><dd>{moneyOrUnavailable(rule.financialSummary.debtBalance)}</dd></div><div><dt>槓桿曝險</dt><dd>{rule.financialSummary.leverageExposure === null ? '未提供' : rule.financialSummary.leverageExposure.toFixed(2)}</dd></div>
      </dl>
      <p className="clec-rule-summary">{rule.summary}</p>
      {rule.blockingIssues.length > 0 && <List title="blockingIssues" rows={rule.blockingIssues} empty="無。" />}
      {rule.warnings.length > 0 && <List title="風險／資料時效警示" rows={rule.warnings} empty="無。" />}
      <List title="reasonCodes 與判定理由" rows={rule.explanationItems.map(item => `${item.code}｜${item.title}：${item.detail}${item.assets.length ? `（${item.assets.join('、')}）` : ''}`)} empty="目前沒有額外規則理由。" />
      <p><b>affectedAssets：</b>{rule.affectedAssets.length ? rule.affectedAssets.join('、') : '無'}</p>
    </section>
    <section className="clec-section"><header><p className="eyebrow">既有引擎</p><h2>可可靠計算的方式</h2></header><div className="clec-strategy-grid">{executable.map(item => <StrategyCard key={item.id} item={item} />)}</div></section>
    <section className="clec-section"><header><p className="eyebrow">CLEC 規格狀態</p><h2>待公式完整核實的策略</h2></header><div className="clec-strategy-grid">{pending.map(item => <StrategyCard key={item.id} item={item} />)}</div></section>
    <section className="clec-section clec-card"><h2>資料品質</h2><p className="note">沿用既有 gate：總資產、目標比例總和、重複 symbol、未分類資產，以及報價有效性、日期與來源。不可用值不以 0 取代。</p>{view.dataQuality.blockingReasons.length ? <ul className="clec-list blocking">{view.dataQuality.blockingReasons.map(item => <li key={item}>{item}</li>)}</ul> : <p className="clec-good">目前未偵測到會阻擋金額型計算的資料問題。</p>}{view.dataQuality.warnings.length > 0 && <ul className="clec-list">{view.dataQuality.warnings.map(item => <li key={item}>{item}</li>)}</ul>}</section>
    <ToolQuickNavigation current="clec-strategy" />
  </PageFrame>;
}

function StrategyCard({ item }: { item: ClecStrategyDefinition }) {
  return <article className={`clec-card clec-strategy-card ${item.executable ? 'is-executable' : 'is-pending'}`}><header><h3>{item.name}</h3><span>{statusLabel(item.specificationStatus)}</span></header><p>{item.summary}</p><p><b>可執行：</b>{item.executable ? '是，使用既有引擎' : '否'}</p><List title="已核對內容" rows={item.verifiedRules} empty="目前沒有足以視為正式公式的已核對規則。" /><List title="尚缺公式／規則" rows={item.missingRules} empty="無。" /><List title="所需資料" rows={item.requiredInputs} empty="無。" /><List title="限制說明" rows={item.limitations} empty="無。" /></article>;
}
function List({ title, rows, empty }: { title: string; rows: string[]; empty: string }) { return <div><h4>{title}</h4>{rows.length ? <ul className="clec-list">{rows.map(row => <li key={row}>{row}</li>)}</ul> : <p className="note">{empty}</p>}</div>; }
const statusText = (value: ClecRuleOutput['decisionStatus']) => ({ blocked: '資料不足／停止判定', no_action: '維持監測', monitor: '監測', rebalance_consider: '可考慮調整', rebalance_required: '需優先檢視' })[value];
const actionText = (value: ClecRuleOutput['recommendedAction']) => ({ hold: '維持持有', contribute: '保留投入規劃', buy_underweight: '可優先補低配', sell_overweight: '可檢視高配資產', rebalance_with_cash: '可用現金補低配', full_rebalance: '檢視完整配置差距', resolve_data_issue: '先修正資料' })[value];
const moneyOrUnavailable = (value: number | null) => value === null ? '未提供' : new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(value);
