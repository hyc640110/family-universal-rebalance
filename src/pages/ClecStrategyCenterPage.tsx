import { Link } from 'react-router-dom';
import PageFrame from './PageFrame';
import ToolQuickNavigation from '../components/ToolQuickNavigation';
import type { ClecStrategyCenterResult, ClecStrategyDefinition } from '../lib/clecStrategy';

const pct = (value: number | null) => value === null || !Number.isFinite(value) ? '不可計算' : `${value.toFixed(1)}%`;
const statusLabel = (status: ClecStrategyDefinition['specificationStatus']) => status === 'implemented' ? '已可可靠計算' : status === 'verified-partial' ? '僅部分核對' : '公式未核實';

export default function ClecStrategyCenterPage({ view }: { view: ClecStrategyCenterResult }) {
  const executable = view.strategies.filter(item => item.id === 'standard' || item.id === 'buy-only');
  const pending = view.strategies.filter(item => !['current-target-gap', 'standard', 'buy-only'].includes(item.id));
  return <PageFrame page="tools" title="CLEC 再平衡策略中心" description="查看目標配置來源、既有可計算方式與 CLEC 策略規格狀態；未核實公式不會試算或自動交易。">
    <section className="clec-center-grid">
      <article className="clec-card"><p className="eyebrow">目前配置來源</p><h2>{view.allocationSource.label}</h2><p className="note">CLEC 433／442 只設定正式 targetWeight，不是再平衡方法。類現金持股與銀行現金分開處理。</p><div className="clec-weights">{view.allocationSource.targetWeights.map(row => <p key={row.symbol}><span><b>{row.symbol}</b>｜{row.role === 'prototype' ? '原型資產' : row.role === 'leveraged' ? '槓桿資產' : row.role === 'cash-like' ? '類現金持股' : '未指派'}</span><strong>{pct(row.targetWeight)}</strong></p>)}</div><p><b>目標比例總和：</b>{pct(view.allocationSource.targetWeightTotal)}</p>{!view.allocationSource.rolesValid && <ul className="clec-list blocking">{view.allocationSource.blockingReasons.map(item => <li key={item}>{item}</li>)}</ul>}<Link className="clec-secondary-link" to="/assets">前往資產頁設定 CLEC 配置</Link></article>
      <article className="clec-card"><p className="eyebrow">目前可使用的再平衡方式</p><h2>{view.currentStrategy.rebalanceMode === 'standard' ? 'Standard' : 'Buy-only'}</h2><p className="note">目前目標缺口是唯一正式計算來源；策略中心不重複交易表。</p><dl className="clec-facts"><div><dt>資料品質 gate</dt><dd>{view.dataQuality.passed ? '已通過' : '未通過，停止金額型計算'}</dd></div><div><dt>再平衡門檻</dt><dd>{view.trigger.thresholdReached === null ? '不可計算' : view.trigger.thresholdReached ? '已達門檻' : '尚未達門檻'}（偏離 {pct(view.trigger.allocationDeviation)}／門檻 {pct(view.trigger.rebalanceThreshold)}）</dd></div></dl><Link className="clec-primary-link" to={view.availableCalculation.recommendationRoute}>前往再平衡建議中心</Link></article>
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
