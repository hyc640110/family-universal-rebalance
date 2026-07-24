# 013_Household_Liquidity_Model_Spec_v3.0

# Household Liquidity, Safety Reserve & Investable Cash Architecture Specification

**中文名稱：家庭流動性、安全存量與可投資現金整合架構規格書**

- 文件版本：v3.0
- 文件狀態：正式架構規格
- 適用專案：Universal Rebalance
- 適用 Repository：`hyc640110/family-universal-rebalance`
- 規格提出日期：2026-07-23
- 規格層級：高風險跨模組核心財務架構
- 詳細規格 SSOT：本文件
- 未完成工作 SSOT：`008_Universal_Rebalance_Todo_Backlog_v1.1.md`
- 最新正式基線：以最新 `003_Universal_Rebalance_Current_Status` 為準

> 本文件定義 Universal Rebalance 的 Household Liquidity Model（家庭流動性模型），
> 作為安全存量、可投資現金、實際可執行預算、外部資金需求與投資行動資格判斷的唯一詳細規格來源。
>
> 若聊天紀錄、舊版 `013`、零散待辦、模組內既有文案或尚未更新的設計與本文件衝突，
> 在尚未經 Repository 實證推翻前，以本文件為設計依據；實際程式現況仍須以最新 main、
> 已合併 PR 與 Production 驗證結果為準。

---

# 目錄

1. 文件治理與使用方式
2. 問題背景與現況缺口
3. 目標、非目標與不可變原則
4. 領域語言與名詞定義
5. 金額、資料來源與來源分類
6. 核心輸入契約
7. 核心輸出契約
8. 核心公式與推導規則
9. Data Completeness、Confidence 與 Blocking Reasons
10. 防守資產、現金與可投資資金語意
11. 決策狀態模型
12. 理論建議與可執行建議分離
13. Standard 與 Buy-only 執行規則
14. 逢低加碼與機會訊號 Gate
15. 外部資金與提款語意
16. Data Provenance 與防重複計算
17. 建議 TypeScript Domain Contract
18. Adapter、Selector 與 Service 邊界
19. 跨模組整合規格
20. Dashboard／首頁規格
21. Analytics／分析頁規格
22. Risk Center 規格
23. Rebalance／交易建議規格
24. AI Decision 與 Daily Decision Workflow 規格
25. Investment Action Center／Opportunities 規格
26. Allocation Simulator 規格
27. CLEC 規格
28. UI 呈現與文案規格
29. Schema、Migration 與同步相容性
30. 開發分期與 Sprint 邊界
31. 測試策略與測試案例矩陣
32. 驗收標準與完成定義
33. Rollback、失敗模式與風險控制
34. 未決策事項與唯讀盤點清單
35. AI 開發與交接規則
36. 架構決策摘要

---

# 1. 文件治理與使用方式

## 1.1 文件定位

本文件是以下主題的唯一詳細規格來源：

- 家庭流動性
- 生活與負債安全存量
- 受保護安全現金
- 可投資現金
- 實際可執行預算
- 外部資金需求
- 買入資格
- 理論建議與可執行建議分離
- 防守資產與防守型持股語意
- Risk、Rebalance、AI、CLEC、Simulator 等模組的共用資金限制

本文件不是：

- Master Roadmap 的替代品
- Current Status 的替代品
- Todo Backlog 的替代品
- Repository 實際程式碼盤點結果
- 已完成實作的證明

## 1.2 文件優先關係

發生衝突時，依下列順序判斷：

1. 最新 main、已合併 PR、Production 驗證結果
2. 最新 Current Status
3. 本文件的詳細架構規格
4. Master Roadmap 的階段與依賴
5. Todo Backlog 的工作狀態與驗收條件
6. Development Guide、Coding Standards 與 Release Checklist
7. 舊版 `013 v1.0`、`013 v2.0`
8. 聊天紀錄與零散筆記

若 Repository 與本文件不一致：

- 不得直接修改
- 先提出差異
- 判斷是文件過期、程式偏離，或現況尚未實作
- 由後續 Sprint 決定修正程式或更新文件

## 1.3 所有 AI 的使用規則

ChatGPT、Claude、Codex、Gemini、Cursor 等 AI 在處理下列工作前，必須閱讀本文件：

- Household Liquidity Core Model
- Cash Flow 與 Loan linkage
- Rebalance
- Buy-only
- Risk
- AI Decision
- Investment Action Center
- CLEC
- Allocation Simulator
- 防守配置狀態
- 安全現金與可投資現金 UI

不得只讀 Todo 標題後自行推導公式。

---

# 2. 問題背景與現況缺口

## 2.1 現有核心問題

目前系統中的 `liquidCash` 或相近現金概念，可能同時被不同模組解讀為：

- 資產負債表上的流動現金
- 資產配置中的防守資產
- 借款還款安全存量
- 生活費緊急預備金
- 使用者本次可投入預算
- Buy-only 可買入上限
- Standard 再平衡可使用現金
- CLEC 的 `availableCash`
- CLEC 的 `cashReserve`
- Simulator 的新增資金
- 投資機會卡片的立即可用資金

同一個數字承擔多種語意，會造成跨模組結論不一致。

## 2.2 已確認的高風險缺口

1. Buy-only 可能直接採用 `min(buyOnlyBudget, liquidCash)`。
2. Standard 模式可能未先扣除受保護安全現金。
3. Risk 的現金安全可能只考慮借款月付，未完整納入必要生活費。
4. Cash Flow Center 的生活費／緊急預備金未完全接入投資決策。
5. CashFlowProfile 缺失時，缺少共用的投資買入阻擋 Gate。
6. derived account unavailable 可能被靜默轉為 `0`，形成假精確計算。
7. CLEC 可能讓同一現金同時擔任 `availableCash` 與 `cashReserve`。
8. Allocation Simulator 可能未區分外部新增資金、現有可投資現金、受保護安全現金與提款。
9. Dip Alert 本質是觀察訊號，但 UI 可能被解讀為立即買入。
10. 防守總資產與防守型持股語意可能混用。
11. 理論配置缺口可能直接被轉成買單，而未經資金資格判斷。
12. 不同頁面可能各自重算安全存量或可用預算。

## 2.3 若不處理的風險

- 系統建議動用生活費或還款資金買入。
- 不同頁面顯示不同的可投資金額。
- 防守資產比例看似不足，實際只是防守資產內部組成不同。
- 現金換成防守 ETF 被錯誤視為提高防守總比例。
- 使用者看到跌幅機會時，以為系統已確認資金可投入。
- 資料缺漏被當作 `0`，產生不安全的可執行建議。
- Simulator 與正式交易建議使用不同資金語意。
- AI Decision 自行推導資金狀態，繞過核心模型。

---

# 3. 目標、非目標與不可變原則

## 3.1 主要目標

建立單一、可測試、可追溯、跨模組共用的 Household Liquidity Model，統一提供：

- 總流動現金
- 每月必要生活費
- 每月負債還款
- 每月必要支出
- 六個月最低安全存量
- 十二個月建議安全存量
- 受保護安全現金
- 安全現金缺口
- 可投資現金
- 使用者要求預算
- 實際可執行預算
- 外部資金需求
- 資料完整性
- 資料可信度
- 阻擋原因
- 決策狀態

## 3.2 非目標

第一階段不得順便重寫：

- 市值
- 成本
- 未實現損益
- 今日損益
- 歷史績效
- CAGR
- IRR
- 最大回撤
- 股息統計
- 報價更新
- 目標配置比例
- 理論配置偏離
- 整個 AppState
- 全站 UI
- Firebase 同步模式

## 3.3 不可變架構原則

1. 受保護安全現金屬於防守資產，但不屬於可投資資金。
2. 所有買入行動必須先通過生活與負債安全存量檢查。
3. 不得產生侵蝕受保護安全現金的可執行買單。
4. 所有模組共用同一 Household Liquidity Model，不得各頁自行重算。
5. 逢低訊號不等於可立即買入。
6. 安全存量不足時，補足現金優先於加碼或再平衡買入。
7. 現金轉成防守型持股，不增加防守資產總比例。
8. 資料不足時不得用 `0` 偽裝可計算。
9. `confidence` 代表資料與規則完整度，不代表投資成功機率。
10. 理論配置缺口與可執行交易必須分離。
11. 所有可執行買入總額不得超過 `executableBudget`。
12. Preview 與 Production、localStorage、Firebase、JSON Backup 相容性不得被破壞。

---

# 4. 領域語言與名詞定義

## 4.1 Total Liquid Cash

**總流動現金**

使用者目前可動用且符合流動性條件的現金總額。

可能來源：

- 現金帳戶
- 活存
- 可立即動用之數位帳戶
- 明確標記為流動現金的帳戶餘額
- 尚未投入的投資現金

不得自動包含：

- 定期存款且提前解約成本高
- 保單價值
- 不可動用之信託
- 尚未撥款的貸款額度
- 尚未實現的資產出售金額
- 信用卡額度

## 4.2 Monthly Essential Living Expenses

**每月必要生活費**

維持基本生活所需的必要支出，不包含可延後、可取消或投資性支出。

## 4.3 Monthly Debt Repayment

**每月負債還款**

所有需要由家庭流動性承擔的必要債務月付總額。

可能包含：

- 信貸
- 房貸
- 車貸
- 股票質押利息或最低還款
- 其他固定債務

不得重複計入已經包含在生活費彙總中的同一筆付款。

## 4.4 Monthly Essential Outflow

**每月必要支出**

```text
monthlyEssentialOutflow
= monthlyEssentialLivingExpenses
+ monthlyDebtRepayment
```

## 4.5 Minimum Safety Reserve

**六個月最低安全存量**

```text
minimumSafetyReserve
= monthlyEssentialOutflow × 6
```

它是預設硬性買入保護基準。

## 4.6 Recommended Safety Reserve

**十二個月建議安全存量**

```text
recommendedSafetyReserve
= monthlyEssentialOutflow × 12
```

預設作為穩健提示值，不一定直接成為硬性阻擋值；是否採 12 個月作為保護基準，需由使用者設定或後續產品決策明確指定。

## 4.7 Protected Safety Cash

**受保護安全現金**

為了生活與債務安全而不可投入的現金。

預設：

```text
protectedSafetyCash
= min(totalLiquidCash, selectedSafetyReserveTarget)
```

其中 `selectedSafetyReserveTarget` 預設為六個月最低安全存量。

## 4.8 Safety Reserve Shortfall

**安全存量缺口**

```text
safetyReserveShortfall
= max(0, selectedSafetyReserveTarget - totalLiquidCash)
```

## 4.9 Investable Cash

**可投資現金**

```text
investableCash
= max(0, totalLiquidCash - selectedSafetyReserveTarget)
```

僅此金額可用於 Buy-only、Standard 現金買入、Dip Buying 等買入行動。

## 4.10 Requested Investment Budget

**使用者要求預算**

使用者在本次策略、再平衡、加碼或模擬中指定希望投入的金額。

它不是可執行金額，只是上限要求。

## 4.11 Executable Budget

**本次實際可執行預算**

```text
executableBudget
= min(requestedInvestmentBudget, investableCash)
```

若使用者未設定預算，應由呼叫端明確選擇：

- `0`
- 不限於使用者預算但受 `investableCash` 限制
- 視為資料不完整

不得由核心模型隱性猜測。

## 4.12 External Funding Required

**外部資金需求**

理論買入需求超過現有可投資現金時，所需外部新增資金。

```text
externalFundingRequired
= max(0, theoreticalBuyAmount - executableBudget)
```

## 4.13 Defensive Holdings

**防守型持股**

由使用者分類或系統規則明確標記為防守角色的投資資產，例如 00865B，但不得永久硬編碼某一標的必定為防守。

## 4.14 Total Defensive Assets

**防守總資產**

```text
totalDefensiveAssets
= totalLiquidCash + defensiveHoldingsMarketValue
```

注意：

- 這是配置統計概念。
- 它不代表全部都可投入。
- 受保護安全現金仍包含在防守總資產中。

## 4.15 Theoretical Recommendation

**理論建議**

只依目標配置、偏離或策略規則計算的建議，不保證有資金可以執行。

## 4.16 Executable Recommendation

**可執行建議**

已經過安全存量、可投資現金、模式限制、資料完整性與其他 Gate 後，能實際形成買賣指令的建議。

---

# 5. 金額、資料來源與來源分類

## 5.1 Money 表示原則

所有核心金額需：

- 以 number 或專案既有安全金額型別表示
- 明確定義單位為新台幣元，除非多幣別功能另有規格
- 不接受 `NaN`
- 不接受 `Infinity`
- 不接受隱性字串轉數字
- 不將 `null` 或 `undefined` 靜默轉成 `0`
- 負值需依欄位語意明確處理

## 5.2 來源三分類

所有輸入必須標記為：

### Stock

某一時間點的餘額：

- 現金帳戶餘額
- 帳戶資產
- 負債剩餘本金

### Flow

一段期間的收入或支出：

- 每月生活費
- 每月債務還款
- 每月固定支出

### Plan

尚未發生的使用者計畫：

- 本次投資預算
- 外部新增資金
- 預計提款
- 未來加碼金額

Stock、Flow、Plan 不得直接相加，除非公式明確允許。

## 5.3 資料來源紀錄

每一筆核心輸入應可追溯至：

- sourceType
- sourceId
- sourceField
- updatedAt
- status
- 是否 derived
- 是否 estimated
- 是否由使用者手動輸入

---

# 6. 核心輸入契約

建議核心輸入概念：

```ts
interface HouseholdLiquidityInput {
  totalLiquidCash: MoneyValue;
  monthlyEssentialLivingExpenses: MoneyValue;
  monthlyDebtRepayment: MoneyValue;
  requestedInvestmentBudget: MoneyValue;
  safetyReserveMonths: 6 | 12;
  externalContribution?: MoneyValue;
  plannedWithdrawal?: MoneyValue;
  sources: LiquiditySourceReference[];
}
```

## 6.1 必要輸入

核心可計算最低需求：

- 總流動現金
- 每月必要生活費
- 每月負債還款
- 安全存量月份設定

`requestedInvestmentBudget` 是否必要，取決於呼叫情境：

- 一般狀態卡：可不需要
- Buy-only：需要
- Rebalance 可執行建議：需要或由策略層提供理論需求
- Simulator：必須明確提供資金來源

## 6.2 Nullable Money

建議採明確型別：

```ts
type MoneyValue =
  | { status: "known"; amount: number }
  | { status: "unavailable"; reason: string }
  | { status: "not_applicable" };
```

不得使用：

```ts
number | null
```

後由各模組自行猜測 `null` 意義。

## 6.3 外部資金

`externalContribution` 只能在使用者明確指定時存在。

不得將以下內容自動視為外部資金：

- 未撥款貸款額度
- 預期收入
- 預期賣出收入
- 信用卡可用額度
- 尚未入帳股息

## 6.4 預計提款

`plannedWithdrawal` 表示本次或近期已知會降低流動現金的計畫。

若 Simulator 或 Decision Workflow 已知即將提款，應先扣除後再判斷可投資現金。

---

# 7. 核心輸出契約

建議輸出：

```ts
interface HouseholdLiquidityResult {
  totalLiquidCash: number | null;
  monthlyEssentialLivingExpenses: number | null;
  monthlyDebtRepayment: number | null;
  monthlyEssentialOutflow: number | null;

  minimumSafetyReserve: number | null;
  recommendedSafetyReserve: number | null;
  selectedSafetyReserveTarget: number | null;

  protectedSafetyCash: number | null;
  safetyReserveShortfall: number | null;
  investableCash: number | null;

  requestedInvestmentBudget: number | null;
  executableBudget: number | null;
  externalFundingRequired: number | null;

  dataCompleteness: DataCompleteness;
  confidence: LiquidityConfidence;
  decisionState: LiquidityDecisionState;
  blockingReasons: LiquidityBlockingReason[];
  warnings: LiquidityWarning[];
  sourceSummary: LiquiditySourceSummary;
}
```

## 7.1 Null 的使用

輸出 `null` 表示：

- 無法安全計算
- 不適用
- 尚未提供必要資料

不得用 `0` 代替未知。

## 7.2 `0` 的合法語意

以下情況可合法為 `0`：

- 使用者確實沒有負債
- 使用者確實沒有必要生活費之外的某項支出
- 總流動現金確實為 0
- 可投資現金經公式計算為 0
- 外部資金需求確實為 0

前提是來源狀態為已知。

---

# 8. 核心公式與推導規則

## 8.1 每月必要支出

```text
monthlyEssentialOutflow
= monthlyEssentialLivingExpenses
+ monthlyDebtRepayment
```

若任一必要輸入未知：

- 結果為 `null`
- `dataCompleteness` 不得為 complete
- 買入相關輸出不得形成可執行金額

## 8.2 六個月最低安全存量

```text
minimumSafetyReserve
= monthlyEssentialOutflow × 6
```

## 8.3 十二個月建議安全存量

```text
recommendedSafetyReserve
= monthlyEssentialOutflow × 12
```

## 8.4 選定安全存量目標

```text
selectedSafetyReserveTarget
= monthlyEssentialOutflow × safetyReserveMonths
```

第一版預設：

```text
safetyReserveMonths = 6
```

12 個月可作為：

- 穩健建議
- 使用者選擇的更保守設定
- 特定高負債情境之後續規則

不得在不同模組各自選擇不同月份。

## 8.5 受保護安全現金

```text
protectedSafetyCash
= min(totalLiquidCash, selectedSafetyReserveTarget)
```

## 8.6 安全存量缺口

```text
safetyReserveShortfall
= max(0, selectedSafetyReserveTarget - totalLiquidCash)
```

## 8.7 可投資現金

若無提款：

```text
investableCash
= max(0, totalLiquidCash - selectedSafetyReserveTarget)
```

若存在已知提款：

```text
netLiquidCash
= max(0, totalLiquidCash - plannedWithdrawal)

investableCash
= max(0, netLiquidCash - selectedSafetyReserveTarget)
```

外部資金若已明確承諾並可立即使用，可由呼叫層決定是否加入：

```text
availableFunding
= investableCash + externalContribution
```

核心輸出應分別保留兩者，不應把外部資金混入 `investableCash`。

## 8.8 可執行預算

```text
executableBudget
= min(requestedInvestmentBudget, investableCash)
```

若策略允許外部新增資金：

```text
executableBudgetWithExternalFunding
= min(
    requestedInvestmentBudget,
    investableCash + externalContribution
  )
```

正式交易建議必須清楚顯示：

- 使用現有可投資現金多少
- 使用外部新增資金多少
- 是否仍有未滿足需求

## 8.9 外部資金需求

```text
externalFundingRequired
= max(0, theoreticalBuyAmount - executableBudget)
```

若 `theoreticalBuyAmount` 未提供，此欄為 `null` 或不適用。

---

# 9. Data Completeness、Confidence 與 Blocking Reasons

## 9.1 Data Completeness

建議狀態：

```ts
type DataCompleteness =
  | "complete"
  | "partial"
  | "insufficient";
```

### complete

- 總流動現金已知
- 生活費已知
- 負債還款已知或確定不適用
- 無重複來源
- 無 ambiguous debt
- 所有必要輸入可追溯

### partial

- 可顯示部分安全資訊
- 但仍有非關鍵欄位缺漏
- 是否允許產生買單，需看 blocking reasons

### insufficient

- 無法安全計算可投資現金
- 不得產生可執行買單

## 9.2 Confidence

建議：

```ts
type LiquidityConfidence =
  | "high"
  | "medium"
  | "low";
```

它只反映：

- 資料是否完整
- 來源是否一致
- 是否存在估算
- 是否存在過期資料
- 是否存在重複或模糊來源

它不表示：

- 投資勝率
- 報酬機率
- 市場預測信心

## 9.3 Blocking Reasons

建議至少包含：

```ts
type LiquidityBlockingReason =
  | "missing_total_liquid_cash"
  | "missing_living_expenses"
  | "missing_debt_repayment"
  | "ambiguous_debt_source"
  | "duplicate_cash_source"
  | "duplicate_debt_source"
  | "derived_account_unavailable"
  | "invalid_money_value"
  | "stale_critical_data"
  | "safety_reserve_shortfall"
  | "no_investable_cash"
  | "requested_budget_missing"
  | "planned_withdrawal_exceeds_cash";
```

## 9.4 Warning 與 Blocking 的差異

Blocking：

- 阻止產生可執行買單

Warning：

- 可以繼續顯示估算或理論建議
- 但需提醒使用者

例如：

- 使用 12 個月建議安全存量但目前只有 8 個月
- 生活費為使用者估算值
- 現金資料超過一定時間未更新

---

# 10. 防守資產、現金與可投資資金語意

## 10.1 三層概念

### A. Protected Safety Cash

- 屬於防守資產
- 不可投入
- 用於生活與還款安全

### B. Investable Cash

- 屬於現金
- 可投入
- 只包含超過安全存量的部分

### C. Defensive Holdings

- 屬於防守型投資資產
- 例如債券 ETF
- 是否可賣出由策略模式決定

## 10.2 防守資產統計

```text
totalDefensiveAssets
= totalLiquidCash + defensiveHoldingsMarketValue
```

## 10.3 防守型持股統計

```text
defensiveHoldingsMarketValue
= sum(marketValue of assets classified as defensive)
```

## 10.4 現金轉防守 ETF

若使用 10 萬元現金買入 00865B：

交易前：

```text
現金 10 萬
防守持股 0
防守總資產 10 萬
```

交易後：

```text
現金 0
防守持股 10 萬
防守總資產仍為 10 萬
```

因此：

- 防守總比例不增加
- 防守資產內部組成改變
- 若這 10 萬原本屬於受保護安全現金，交易不得執行

## 10.5 防守配置狀態

UI 不應只顯示「防守資產不足」，而應分開：

- 防守總比例
- 現金比例
- 防守型持股比例
- 安全存量是否足夠
- 可投資現金
- 是否需要外部資金
- 是否只是防守資產內部組成調整

---

# 11. 決策狀態模型

建議狀態：

```ts
type LiquidityDecisionState =
  | "insufficient_data"
  | "invalid_data"
  | "safety_reserve_shortfall"
  | "no_investable_cash"
  | "investable_cash_available"
  | "safe_to_invest";
```

## 11.1 判斷順序

1. 是否存在無效資料
2. 資料是否足夠
3. 安全存量是否不足
4. 是否有可投資現金
5. 是否有使用者預算或理論需求
6. 是否可以形成可執行買入

## 11.2 AI Decision 固定優先序

1. 資料完整性
2. 安全存量
3. 可投資現金
4. 配置偏離
5. 逢低訊號
6. 其他投資機會

後順位不得蓋過前順位。

---

# 12. 理論建議與可執行建議分離

## 12.1 理論層

可計算：

- 目標配置偏離
- 理論買入金額
- 理論賣出金額
- 防守配置理論缺口
- 成長配置理論缺口
- CLEC 理論調整量
- Dip Buying 理論建議

## 12.2 執行層

需進一步套用：

- data completeness
- blocking reasons
- protected safety cash
- investable cash
- requested budget
- standard／buy-only 模式
- 交易最小單位
- 資產可交易狀態
- 其他既有 execution eligibility

## 12.3 顯示範例

```text
理論建議：買入 00865B 100,000 元
可投資現金：0 元
實際可執行：0 元
狀態：延後
原因：目前現金需保留作生活與負債安全存量
外部資金需求：100,000 元
```

## 12.4 不得發生

- 將理論買入金額直接送進交易清單
- 只顯示買入金額，不顯示資金限制
- `executableAmount = theoreticalAmount` 作為預設
- 資料不完整時仍顯示精確買單

---

# 13. Standard 與 Buy-only 執行規則

## 13.1 Standard 模式

允許：

- 賣出超標資產
- 使用賣出後新增的可用現金
- 使用既有可投資現金
- 使用使用者明確提供的外部資金
- 增加防守型持股或成長型持股

禁止：

- 動用受保護安全現金
- 用安全現金填滿配置缺口
- 將未實現賣出收入提前視為已到帳現金
- 忽略交易成本或最小交易單位

Standard 的可買入資金可包含：

```text
existingInvestableCash
+ settledSellProceeds
+ explicitExternalContribution
```

其中 `settledSellProceeds` 的可用時點必須依現有交易模型決定。

## 13.2 Buy-only 模式

禁止賣出。

```text
buyOnlyExecutableBudget
= min(requestedInvestmentBudget, investableCash)
```

若 `investableCash = 0`：

- 不產生可執行買單
- 保留理論配置缺口
- 顯示需補安全現金或需要外部資金
- 不得將受保護現金列為候選資金

## 13.3 Buy-only 分配

所有候選買入金額加總：

```text
sum(executableBuyOrders)
<= executableBudget
```

需處理：

- 四捨五入
- 零股／整股規則
- 最低交易金額
- 最後一筆餘額分配
- 不因 rounding 超過預算

---

# 14. 逢低加碼與機會訊號 Gate

## 14.1 Dip Signal 本質

Dip Signal 是市場或價格條件訊號，不是資金資格。

## 14.2 狀態矩陣

| 跌幅訊號 | 資料完整 | 安全存量 | 可投資現金 | 結果 |
|---|---:|---:|---:|---|
| 無 | 是 | 足 | 有 | 不產生 Dip 買入 |
| 有 | 否 | 未知 | 未知 | 僅顯示資料不足 |
| 有 | 是 | 不足 | 0 | 補現金優先 |
| 有 | 是 | 足 | 0 | 僅觀察，不產生買單 |
| 有 | 是 | 足 | 有 | 可形成受預算限制的買入建議 |

## 14.3 UI 文案

不得只顯示：

```text
建議加碼 50,000 元
```

應顯示：

```text
逢低訊號成立
可投資現金：30,000 元
本次可執行加碼：30,000 元
未滿足理論需求：20,000 元
```

---

# 15. 外部資金與提款語意

## 15.1 外部新增資金

使用者明確新增的現金，不等於現有可投資現金。

需分開呈現：

- existingInvestableCash
- externalContribution
- combinedExecutableFunding

## 15.2 計畫提款

已知提款應先降低可用現金。

例如：

```text
總流動現金 500,000
安全存量 400,000
即將提款 80,000

可投資現金
= max(0, 500,000 - 80,000 - 400,000)
= 20,000
```

## 15.3 不得混用

- 外部新增資金不得計入家庭既有安全存量達成率，除非實際已入帳。
- 預計賣出金額不得在成交前加入現金。
- 預期股息不得在入帳前加入可投資現金。

---

# 16. Data Provenance 與防重複計算

## 16.1 常見重複來源風險

同一筆貸款月付可能同時存在：

- Loan 模組
- Cash Flow 固定支出
- 手動生活費
- 匯入交易分類

若全部加總，會重複計算。

## 16.2 建議欄位

Cash Flow 或相關資料未來可考慮加入：

```ts
liquidityRole:
  | "essential_living_expense"
  | "debt_repayment"
  | "discretionary_expense"
  | "income"
  | "transfer"
  | "excluded";

linkedLoanId?: string;
```

## 16.3 linkedLoanId

若 Cash Flow 項目已連結 Loan：

- 月付以 Loan 為 canonical
- Cash Flow 項目不得再次加總
- 但仍可用於實際支付紀錄或對帳

## 16.4 Ambiguous Debt Gate

若系統無法判斷一筆支出是否已包含在 Loan 月付：

- 標記 `ambiguous_debt_source`
- 不得靜默猜測
- 核心買入行動應被阻擋，直到來源釐清或使用者確認

## 16.5 Source Summary

核心結果應可提供：

- 採用幾個現金來源
- 採用幾個生活費來源
- 採用幾個貸款來源
- 排除哪些重複來源
- 哪些是估算值
- 哪些資料過期

---

# 17. 建議 TypeScript Domain Contract

以下為方向性契約，實作前需以 Repository 實際型別與命名盤點為準。

```ts
type MoneyStatus = "known" | "unavailable" | "not_applicable";

interface MoneyValue {
  status: MoneyStatus;
  amount?: number;
  reason?: string;
}

type LiquiditySourceKind = "stock" | "flow" | "plan";

interface LiquiditySourceReference {
  id: string;
  kind: LiquiditySourceKind;
  role:
    | "liquid_cash"
    | "essential_living_expense"
    | "debt_repayment"
    | "requested_budget"
    | "external_contribution"
    | "planned_withdrawal";
  field: string;
  updatedAt?: string;
  isDerived?: boolean;
  isEstimated?: boolean;
}

interface HouseholdLiquidityInput {
  totalLiquidCash: MoneyValue;
  monthlyEssentialLivingExpenses: MoneyValue;
  monthlyDebtRepayment: MoneyValue;
  requestedInvestmentBudget?: MoneyValue;
  safetyReserveMonths: 6 | 12;
  externalContribution?: MoneyValue;
  plannedWithdrawal?: MoneyValue;
  sources: LiquiditySourceReference[];
}

type DataCompleteness = "complete" | "partial" | "insufficient";
type LiquidityConfidence = "high" | "medium" | "low";

type LiquidityDecisionState =
  | "insufficient_data"
  | "invalid_data"
  | "safety_reserve_shortfall"
  | "no_investable_cash"
  | "investable_cash_available"
  | "safe_to_invest";

interface HouseholdLiquidityResult {
  totalLiquidCash: number | null;
  monthlyEssentialLivingExpenses: number | null;
  monthlyDebtRepayment: number | null;
  monthlyEssentialOutflow: number | null;

  minimumSafetyReserve: number | null;
  recommendedSafetyReserve: number | null;
  selectedSafetyReserveTarget: number | null;
  protectedSafetyCash: number | null;
  safetyReserveShortfall: number | null;
  investableCash: number | null;

  requestedInvestmentBudget: number | null;
  executableBudget: number | null;
  externalFundingRequired: number | null;

  dataCompleteness: DataCompleteness;
  confidence: LiquidityConfidence;
  decisionState: LiquidityDecisionState;
  blockingReasons: string[];
  warnings: string[];
}
```

## 17.1 核心函式建議

```ts
buildHouseholdLiquidityInput()
normalizeLiquidityMoneyValue()
validateLiquiditySources()
detectDuplicateLiquiditySources()
deriveHouseholdLiquidity()
deriveExecutableFunding()
deriveLiquidityDecisionState()
```

## 17.2 純函式要求

`deriveHouseholdLiquidity` 必須：

- 不依賴 React
- 不讀寫 localStorage
- 不呼叫 Firebase
- 不修改輸入
- 對相同輸入產生相同輸出
- 可完整單元測試

---

# 18. Adapter、Selector 與 Service 邊界

## 18.1 Adapter 責任

Adapter 負責將現有 AppState、Loan、Cash Flow、Accounts 等資料轉換成核心輸入。

Adapter 不負責：

- 畫 UI
- 產生交易指令
- 修改資料
- 寫入 Firebase

## 18.2 核心模型責任

核心模型負責：

- 驗證金額
- 推導安全存量
- 推導可投資現金
- 推導可執行預算
- 推導資料狀態與阻擋原因

## 18.3 Consumer 責任

各 Consumer：

- 只讀取核心輸出
- 不自行重算相同概念
- 依自身需求顯示或進一步限制
- 不得放寬核心阻擋條件

## 18.4 單一資料來源原則

同一頁需要安全現金、可投資現金與可執行預算時，必須來自同一 `HouseholdLiquidityResult` 實例或同一 selector。

---

# 19. 跨模組整合規格

必須接入：

- Dashboard
- Analytics
- Risk
- Rebalance
- Recommendations
- Trading List
- Dip Analysis
- AI Decision
- Investment Intelligence
- Daily Decision Workflow
- Investment Opportunities
- Investment Action Center
- Allocation Simulator
- CLEC

各模組不得：

- 直接使用 `liquidCash` 當買入預算
- 自行以月付乘 6
- 自行忽略生活費
- 自行決定 null 等於 0
- 自行將現金全部視為可投資

---

# 20. Dashboard／首頁規格

## 20.1 顯示內容

建議精簡顯示：

- 安全現金狀態
- 可投資現金
- 今日是否有可執行投資
- 資料完整性警示

## 20.2 顯示優先級

首頁不需要顯示全部計算細節。

優先：

1. 是否資料完整
2. 安全存量是否足夠
3. 可投資現金
4. 今日行動

## 20.3 不一致防護

Dashboard 與 Analytics、AI Decision 的結論必須一致。

---

# 21. Analytics／分析頁規格

## 21.1 保留既有分析

以下原則上不變：

- 報酬
- 損益
- CAGR
- IRR
- 最大回撤
- 趨勢圖
- 配置偏離

## 21.2 新增或修正

- 理論配置缺口
- 可執行買入金額
- 安全現金保護
- 外部資金需求
- 阻擋原因

## 21.3 顯示層級

第一層：

- 理論建議
- 可執行建議

展開後：

- 可投資現金
- 使用者預算
- 安全存量
- 外部資金需求
- 資料來源摘要

---

# 22. Risk Center 規格

Risk 必須新增或統一：

- 每月必要支出
- 六個月最低安全存量
- 十二個月建議安全存量
- 安全存量缺口
- 可投資現金
- 資料可信度
- 重複來源警示
- 負債資料過期警示

Risk 不得只用借款月付代表家庭全部安全需求。

---

# 23. Rebalance／交易建議規格

## 23.1 理論層

先計算：

- 理論買入
- 理論賣出
- 理論配置缺口

## 23.2 執行層

再套用：

- mode
- executableBudget
- execution eligibility
- 交易最小單位
- 可交易資產
- 賣出所得可用時點

## 23.3 Trading List

每筆建議應包含：

- theoreticalAmount
- executableAmount
- status
- reason
- fundingSource
- deferredAmount
- externalFundingRequired

## 23.4 Order Helper

Order Helper 不得自行放寬 `executableBudget`。

---

# 24. AI Decision 與 Daily Decision Workflow 規格

## 24.1 AI 不得自行推算資金

AI Decision 必須直接引用核心輸出。

## 24.2 決策順序

1. 資料完整性
2. 安全存量
3. 可投資現金
4. 配置偏離
5. 逢低機會
6. 其他機會

## 24.3 文案限制

若資料不足：

```text
目前缺少必要生活費或負債資料，無法安全計算可投資現金。
```

不得顯示：

```text
建議買入 100,000 元
```

---

# 25. Investment Action Center／Opportunities 規格

每個行動卡片至少需知道：

- 是否只是觀察
- 是否可執行
- 可執行金額
- 阻擋原因
- 需要多少外部資金
- 是否會侵蝕安全存量

Opportunity 不得自動等同 Action。

---

# 26. Allocation Simulator 規格

## 26.1 明確資金欄位

Simulator 應區分：

- `externalContribution`
- `existingInvestableCash`
- `protectedSafetyCash`
- `plannedWithdrawal`
- `allowSafetyCashUsage`

預設：

```text
allowSafetyCashUsage = false
```

## 26.2 模擬與正式建議

Simulator 可以允許使用者測試「假設動用安全現金」的結果，但：

- 必須明確標示高風險假設
- 不得回寫正式可執行建議
- 預設關閉
- 不得讓使用者誤以為正式決策已允許

---

# 27. CLEC 規格

CLEC 必須分離：

- `availableCash`
- `cashReserve`

建議進一步對應：

- `availableCash` → investableCash 或外部新增資金
- `cashReserve` → protectedSafetyCash

CLEC 理論比例可保留，但可執行交易仍受：

- data completeness
- safety reserve
- executable budget

限制。

---

# 28. UI 呈現與文案規格

## 28.1 「防守資產補足提醒」改名

建議改為：

```text
防守配置狀態
```

原因：

- 不一定需要補足防守總資產
- 可能只是現金與防守型持股組成需調整
- 可能是安全存量不足
- 可能需要外部資金

## 28.2 建議顯示欄位

- 防守總比例
- 現金比例
- 防守型持股比例
- 六個月安全存量
- 十二個月建議安全存量
- 受保護安全現金
- 可投資現金
- 理論缺口
- 可執行方式
- 阻擋原因

## 28.3 手機版

- 主要狀態一眼可讀
- 細節以展開方式顯示
- 避免同時塞入過多數字
- 理論與可執行不可只用顏色區分
- 阻擋原因需可閱讀

## 28.4 文案範例

安全存量不足：

```text
目前安全現金不足 120,000 元，系統暫不產生買入建議。
```

有可投資現金：

```text
扣除六個月生活與負債安全存量後，可投資現金為 80,000 元。
```

只有理論缺口：

```text
目前配置仍有理論缺口，但沒有可投資現金，建議先保留現金。
```

---

# 29. Schema、Migration 與同步相容性

## 29.1 第一 Sprint 禁止範圍

Core Model Foundation 第一階段不修改：

- AppState
- localStorage schema
- Firebase payload
- JSON Backup
- UI

## 29.2 後續若新增欄位

必須：

- 採加法式欄位
- 提供 schema version
- 提供 normalize
- 提供 migration
- 提供 legacy fixture
- 提供 Backup round-trip
- 提供 Firebase canonical fingerprint
- 評估舊版回退

## 29.3 建議未來欄位

- `liquidityRole`
- `linkedLoanId`
- `cashFlowSchemaVersion`
- 來源狀態與更新時間

## 29.4 Canonical 規則

Firebase、localStorage、Backup 的 canonical payload 必須一致。

不得出現：

- 本機可計算，但 Backup 遺失欄位
- Firebase 下載後 role 消失
- 舊 normalizer 丟棄未知欄位
- Preview 寫入 Production

---

# 30. 開發分期與 Sprint 邊界

## Phase 0：唯讀盤點

確認：

- 現有現金來源
- 生活費來源
- Loan 月付來源
- Cash Flow 重複來源
- 各模組現行 `liquidCash` 使用位置
- Standard／Buy-only 實作位置
- CLEC、Simulator 的現金語意
- 現有測試與型別

輸出：

- 依賴圖
- 實際檔案清單
- 風險清單
- 與本文件差異

## Sprint 1：Household Liquidity Core Model Foundation

只包含：

- input／output contract
- nullable money
- source classification
- duplicate detection
- completeness
- confidence
- blocking reasons
- 6／12 個月安全存量
- protectedSafetyCash
- safetyReserveShortfall
- investableCash
- executableBudget
- externalFundingRequired
- 單元測試

不包含：

- App.tsx
- UI
- AppState
- Firebase
- Backup
- consumer 接線

## Sprint 2：Liquidity Data Provenance & Migration

包含：

- CashFlow `liquidityRole`
- `linkedLoanId`
- schema version
- normalize
- migration
- ambiguous debt gate
- Firebase canonical
- Backup round-trip

## Sprint 3：Rebalance & Trade Execution Integration

包含：

- Standard
- Buy-only
- Trading List
- Order Helper
- Dip Gate
- theoretical／executable 分離

## Sprint 4：Risk & Decision Workflow Integration

包含：

- Portfolio Risk
- Dashboard
- AI Decision
- Investment Intelligence
- Daily Decision Workflow
- Opportunities
- Investment Action Center

## Sprint 5：CLEC & Simulator Funding Semantics

包含：

- CLEC cash semantics
- Simulator funding fields
- protected cash 預設不可用

## Sprint 6：Cross-Module Presentation Consistency

包含：

- 防守配置狀態
- 安全現金
- 可投資現金
- 理論缺口
- 可執行方式
- 阻擋原因
- 手機／桌機一致性

---

# 31. 測試策略與測試案例矩陣

## 31.1 單元測試類別

### A. 基本公式

1. 生活費 20,000、月付 10,000，必要支出為 30,000。
2. 六個月安全存量為 180,000。
3. 十二個月建議安全存量為 360,000。
4. 現金 500,000 時，可投資現金為 320,000。
5. 現金 100,000 時，可投資現金為 0。
6. requested budget 100,000、investable cash 80,000，executable 為 80,000。
7. requested budget 50,000、investable cash 80,000，executable 為 50,000。

### B. 零值

8. 無負債且已確認，月付為 0。
9. 現金為 0。
10. 使用者預算為 0。
11. 理論買入為 0。
12. 外部資金為 0。

### C. 缺漏

13. 生活費 unknown。
14. 負債 unknown。
15. 現金 unknown。
16. requested budget 未提供。
17. derived account unavailable。
18. 來源更新時間缺失。

### D. 無效數值

19. NaN。
20. Infinity。
21. 負現金。
22. 負生活費。
23. 負月付。
24. 負預算。
25. 超大數值。
26. 小數金額。

### E. 安全存量邊界

27. 現金剛好等於 6 個月安全存量。
28. 現金比安全存量少 1 元。
29. 現金比安全存量多 1 元。
30. 12 個月模式。
31. safetyReserveMonths 非法值。

### F. 提款與外部資金

32. 有提款後可投資現金下降。
33. 提款大於總現金。
34. 外部資金不混入 investableCash。
35. 外部資金加入 combined funding。
36. 未入帳外部資金不得使用。

### G. 重複來源

37. 同一 cash account 重複。
38. 同一 loan 月付重複。
39. Cash Flow 已 linkedLoanId。
40. ambiguous debt source。
41. 同一筆支出同時列入生活費與月付。

### H. Confidence

42. 全部 canonical 資料為 high。
43. 一項估算為 medium。
44. 關鍵資料過期為 low。
45. 有 blocking reason 時不可 high。

### I. 決策狀態

46. invalid_data。
47. insufficient_data。
48. safety_reserve_shortfall。
49. no_investable_cash。
50. investable_cash_available。
51. safe_to_invest。

## 31.2 Rebalance 整合測試

52. Buy-only 預算不超過 executableBudget。
53. Standard 不動用 protected cash。
54. 理論買入大於可執行買入。
55. 賣出所得未結算前不可用。
56. 外部資金明確提供時可使用。
57. 所有買單加總不超預算。
58. rounding 後不超預算。
59. 無可投資現金時買單為 0。
60. 保留理論缺口。

## 31.3 Dip 整合測試

61. 有 Dip、無現金，只觀察。
62. 有 Dip、安全存量不足，補現金優先。
63. 有 Dip、資料不足，不顯示精確買單。
64. 有 Dip、有預算，受 executableBudget 限制。

## 31.4 Cross-module 一致性

65. Dashboard investableCash 等於 Analytics。
66. Risk safety reserve 等於 AI Decision。
67. Rebalance executableBudget 等於 Action Center。
68. CLEC 不得使用 protected cash。
69. Simulator 預設不動用 safety cash。
70. Trading List 與 Order Helper 加總一致。

## 31.5 Migration 與相容性

71. 舊 CashFlow fixture 可 normalize。
72. 新 role 可 Backup round-trip。
73. Firebase canonical 保留新欄位。
74. 舊版未知欄位不被丟棄。
75. migration 失敗不覆蓋原資料。
76. Preview fixture 不進 Production。
77. Production bundle 不含 Preview marker。

## 31.6 UI 驗收案例

78. Desktop 1000px 無裁切。
79. Desktop 1600px 無錯位。
80. iPhone Safari 約 390px 可讀。
81. 理論與可執行文字可區分。
82. 阻擋原因完整顯示。
83. 大額金額使用萬元但可查看完整值。
84. 資料不足不顯示假精確數字。
85. 安全存量不足時有明確風險文案。

## 31.7 Regression

86. 市值未改變。
87. 成本未改變。
88. 今日損益未改變。
89. 歷史績效未改變。
90. CAGR 未改變。
91. IRR 未改變。
92. 最大回撤未改變。
93. 股息統計未改變。
94. 報價更新未改變。
95. 理論配置偏離未改變。

---

# 32. 驗收標準與完成定義

完整主題完成需同時滿足：

1. 所有行動模組使用同一核心模型。
2. 不再產生侵蝕安全現金的可執行買單。
3. 理論建議與可執行建議分離。
4. Standard／Buy-only 規則一致。
5. 現金轉防守 ETF 不增加防守總比例。
6. 資料不足時不產生假精確建議。
7. Analytics、Risk、AI、Rebalance 結論一致。
8. CLEC 與 Simulator 使用明確資金語意。
9. 既有績效、持股與報價未被破壞。
10. localStorage、Firebase、JSON Backup 相容。
11. Preview／Production 隔離正常。
12. 自動測試、TypeScript、Build、audit、diff check 通過。
13. 桌機與 iPhone Safari 驗收通過。
14. PR Merge。
15. Production 唯讀驗證通過。
16. Todo Backlog 更新。

單一 Sprint 只能依其範圍判定完成，不得因 Core Model 完成就宣告整個主題完成。

---

# 33. Rollback、失敗模式與風險控制

## 33.1 Core Model Sprint

由於不改 schema、不接 UI，Rollback 應為：

- 移除新增純函式與測試
- 不影響 Production 資料
- 不影響既有 Consumer

## 33.2 Schema Sprint

一旦新欄位寫入 Production：

- 不得直接回退到會丟棄欄位的舊 normalizer
- 必須先做相容性 Hotfix
- 必要時暫停舊版手動上傳

## 33.3 Consumer 接線失敗

若某模組尚未完成接線：

- 不得讓部分頁面使用新語意、部分頁面顯示相反建議而不加註
- 可透過 Feature Flag 或分 Sprint 明確控制
- 不得在 Production 顯示未驗證的混合結果

## 33.4 常見失敗模式

- null 被轉 0
- 同一貸款重複計算
- theoretical amount 直接變 executable amount
- 外部資金混入 investable cash
- protected cash 被當作 Buy-only budget
- Simulator 的高風險假設回流正式建議
- Dashboard 與 AI Decision 不一致

---

# 34. 未決策事項與唯讀盤點清單

以下不得在未盤點 Repository 前直接定案：

1. 真實 `liquidCash` 來源與型別。
2. Cash Flow 生活費的 canonical 欄位。
3. Loan 月付的 canonical selector。
4. 多筆 Loan 是否已有穩定 `loanId`。
5. derived account unavailable 現行表示。
6. Buy-only budget 的實際儲存位置。
7. Standard 賣出所得的可用時點。
8. 現有 rounding 與交易單位規則。
9. CLEC 的 `availableCash`／`cashReserve` 實際實作。
10. Simulator 的正式 input contract。
11. 是否已有 data confidence 類似型別。
12. 是否已有 cross-module selector。
13. 是否需要在第一階段加入 12 個月可選設定。
14. 多幣別是否已存在。
15. Cash Flow、Loan、Account 的 schema version 現況。

---

# 35. AI 開發與交接規則

## 35.1 開發前

必須：

- 讀取本文件
- 完成 Workspace 與 Repository 唯讀初始化
- 比對最新 main 與 Current Status
- 確認 Todo ID
- 確認 Sprint 邊界
- 不操作固定 stash

## 35.2 第一個實作 Sprint

建議名稱：

```text
Household Liquidity Core Model Foundation
```

對應：

```text
UR-TODO-006
```

不得順便修改 UI、AppState、Firebase 或 Backup。

## 35.3 交接內容

Handover 應記錄：

- 本次 Sprint 範圍
- 已完成型別與純函式
- 測試結果
- 尚未接線的 Consumer
- 與本文件是否有差異
- 下一步 Todo ID

---

# 36. 架構決策摘要

## ADR-001：受保護現金與可投資現金分離

決策：

- 受保護安全現金不可投入
- 可投資現金只包含超過安全存量的部分

## ADR-002：防守總資產與防守型持股分離

決策：

- 防守總資產包含現金與防守型持股
- 現金轉防守 ETF 不增加防守總比例

## ADR-003：理論建議與可執行建議分離

決策：

- 先算策略需求
- 再套用資金與執行限制

## ADR-004：資料不足不得假設為零

決策：

- 採 nullable／status-aware money
- 關鍵資料不足時阻擋買入

## ADR-005：單一 Household Liquidity Model

決策：

- 所有 Consumer 共用同一核心輸出
- 不允許各頁自行重算

## ADR-006：分階段導入

決策：

- Core → Provenance／Migration → Execution → Decision → CLEC／Simulator → Presentation
- 降低高風險跨模組重構一次性失敗機率

---

# 附錄 A：最小計算範例

輸入：

```text
總流動現金：500,000
每月必要生活費：20,000
每月負債還款：10,000
安全存量月份：6
使用者預算：100,000
```

計算：

```text
每月必要支出 = 20,000 + 10,000 = 30,000
六個月安全存量 = 30,000 × 6 = 180,000
受保護安全現金 = 180,000
可投資現金 = 500,000 - 180,000 = 320,000
實際可執行預算 = min(100,000, 320,000) = 100,000
```

---

# 附錄 B：安全存量不足範例

輸入：

```text
總流動現金：100,000
每月必要生活費：20,000
每月負債還款：10,000
安全存量月份：6
使用者預算：50,000
```

計算：

```text
六個月安全存量 = 180,000
安全存量缺口 = 80,000
可投資現金 = 0
實際可執行預算 = 0
```

結果：

```text
狀態：safety_reserve_shortfall
可執行買單：無
優先行動：補足安全現金
```

---

# 附錄 C：版本取代關係

- `013_Household_Liquidity_Model_Spec_v1.0.md`：舊版摘要，可封存
- `013_Household_Liquidity_Model_Spec_v2.0.md`：舊版摘要，可封存
- `013_Household_Liquidity_Model_Spec_v3.0.md`：目前正式詳細架構規格
