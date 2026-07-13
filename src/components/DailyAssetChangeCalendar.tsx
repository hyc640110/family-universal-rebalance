import { useMemo, useState } from 'react';
import { buildCalendarMonth, latestSnapshotMonth, shiftMonth, type DailyAssetChange, type DailyAssetChangeMode } from '../lib/dailyAssetChangeCalendar';
import type { NetWorthSnapshot } from '../lib/netWorthHistory';

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const modeLabel = (mode: DailyAssetChangeMode) => mode === 'netWorth' ? '淨資產' : '投資資產';
const money = (value: number | null, signed = false) => {
  if (value === null || !Number.isFinite(value)) return '—';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${Math.round(value).toLocaleString('zh-TW')} 元`;
};
const compactMoney = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  if (absolute >= 10_000) return `${sign}${(absolute / 10_000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })}萬`;
  if (absolute >= 1_000) return `${sign}${(absolute / 1_000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })}k`;
  return `${sign}${Math.round(absolute).toLocaleString('zh-TW')}`;
};
const percent = (value: number | null) => value === null || !Number.isFinite(value) ? '—' : `${value > 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
const tone = (change: DailyAssetChange | null) => !change || change.change === null ? 'neutral' : change.change > 0 ? 'positive' : change.change < 0 ? 'negative' : 'neutral';

export default function DailyAssetChangeCalendar({ history }: { history: NetWorthSnapshot[] }) {
  const [mode, setMode] = useState<DailyAssetChangeMode>('netWorth');
  const [month, setMonth] = useState(() => latestSnapshotMonth(history));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendar = useMemo(() => buildCalendarMonth(history, mode, month), [history, mode, month]);
  const selected = selectedDate ? calendar.days.find(day => day.date === selectedDate)?.change || null : null;
  const changeMonth = (amount: number) => { setMonth(current => shiftMonth(current, amount)); setSelectedDate(null); };
  const changeMode = (next: DailyAssetChangeMode) => { setMode(next); setSelectedDate(null); };

  return <article className="performance-card daily-change-calendar-card" aria-labelledby="daily-change-calendar-title">
    <div className="performance-heading"><div><p className="eyebrow">V5.3 每日快照</p><h2 id="daily-change-calendar-title">每日資產變動日曆</h2></div><span>依相鄰有效快照比較；不補日期、不插值。</span></div>
    <div className="daily-calendar-toolbar">
      <div className="daily-calendar-month-controls">
        <button type="button" aria-label="上一個月" onClick={() => changeMonth(-1)}>‹</button>
        <strong aria-live="polite">{calendar.year} 年 {calendar.monthIndex + 1} 月</strong>
        <button type="button" aria-label="下一個月" onClick={() => changeMonth(1)}>›</button>
      </div>
      <div className="daily-calendar-mode" role="group" aria-label="資產變動模式">
        <button type="button" className={mode === 'netWorth' ? 'active' : ''} aria-pressed={mode === 'netWorth'} onClick={() => changeMode('netWorth')}>淨資產變動</button>
        <button type="button" className={mode === 'investmentValue' ? 'active' : ''} aria-pressed={mode === 'investmentValue'} onClick={() => changeMode('investmentValue')}>投資資產變動</button>
      </div>
    </div>
    <div className="daily-calendar" aria-label={`${calendar.year} 年 ${calendar.monthIndex + 1} 月${modeLabel(mode)}變動日曆`}>
      <div className="daily-calendar-weekdays">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
      <div className="daily-calendar-grid">
        {Array.from({ length: calendar.leadingBlankCount }, (_, index) => <span className="daily-calendar-blank" aria-hidden="true" key={`blank-${index}`} />)}
        {calendar.days.map(day => <button
          type="button"
          key={day.date}
          className={`daily-calendar-day ${tone(day.change)}${selectedDate === day.date ? ' selected' : ''}`}
          disabled={!day.change}
          aria-label={day.change ? `${day.date}，${percent(day.change.changeRate)}，${compactMoney(day.change.change)}` : `${day.date}，當日無快照`}
          onClick={() => day.change && setSelectedDate(day.date)}
        >
          <span className="daily-calendar-date">{day.day}</span>
          {day.change && <><strong>{percent(day.change.changeRate)}</strong><small>{compactMoney(day.change.change)}</small></>}
        </button>)}
      </div>
    </div>
    {selected && <CalendarDetail change={selected} mode={mode} />}
    <p className="daily-calendar-disclaimer">此為每日資產快照變動，可能包含入金、提領、現金或負債變化，不等同純投資損益。</p>
  </article>;
}

function CalendarDetail({ change, mode }: { change: DailyAssetChange; mode: DailyAssetChangeMode }) {
  return <section className="daily-calendar-detail" aria-label={`${change.date} 資產變動明細`}>
    <div className="daily-calendar-detail-heading"><div><small>選取日期</small><h3>{change.date}</h3></div><span>{modeLabel(mode)}</span></div>
    <div className="daily-calendar-detail-grid">
      <p><span>模式</span><strong>{modeLabel(mode)}</strong></p>
      <p><span>當日值</span><strong>{money(change.value)}</strong></p>
      <p><span>前一筆快照日期</span><strong>{change.previousDate || '—'}</strong></p>
      <p><span>前一筆值</span><strong>{money(change.previousValue)}</strong></p>
      <p><span>變動金額</span><strong className={tone(change)}>{money(change.change, true)}</strong></p>
      <p><span>變動百分比</span><strong className={tone(change)}>{percent(change.changeRate)}</strong></p>
      <p><span>比較基準</span><strong>{change.hasComparison ? '有前一筆有效快照' : '無比較基準'}</strong></p>
    </div>
  </section>;
}
