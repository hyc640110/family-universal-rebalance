# Universal Rebalance Design System

版本：v1.1.0（UR-TODO-074 Production Verified Closeout）

最後更新：2026-08-22

**狀態：Section 2.2–2.6、2.10–2.13 已依 UR-TODO-073（PR #408）／UR-TODO-074（PR #410，merge commit `0d1cdacad30df11fa8a8074333a70ff8d877ee87`，**已 Merge／已 Production Verified，2026-08-22**）Preview 人工驗收通過並經 Production 唯讀驗證確認的實際落地 CSS 正式記錄。Section 2.1、2.7、2.8、2.9 仍待補完（非本 Sprint 範圍）。**

**重要邊界聲明**：本文件記錄的是**已穩定、已通過 Preview 真機驗收與 Production 驗證**的全站共用 token／primitive 規則（背景層次、文字階層、Primary/Secondary 色彩、共用 Card/Button/Input 慣例、Navigation、Modal/Sheet），以及 Section 2.13 記錄的 Holding Card Mobile Compact Layout 正式契約（UR-TODO-074 Production Verified）。**Holding Card 桌面（`≥901px`）9-column row 版面與 Holding Detail Dialog 內部排版不在本文件正式規範範圍**，維持既有 UR-TODO-071／072 條目為準。

## 0. 文件定位

本文件是 Universal Rebalance 全站 UI 元件層級視覺規範的正式來源，對應產品版本 **V7.0E（Design Polish）**。

本文件不是：

- `013_HOUSEHOLD_LIQUIDITY_SPEC.md` 的替代品：財務資料與計算邏輯規格仍以 013 為準，本文件只定義視覺與元件層級規範
- `018_Dashboard_UX_Guideline.md` 的替代品：頁面級資訊架構與互動流程屬於 018 的範圍
- 已完成實作的證明

## 1. 與其他文件的分工

- `013_HOUSEHOLD_LIQUIDITY_SPEC.md`：定義「顯示什麼資料、什麼文案」（內容層級）
- `018_Dashboard_UX_Guideline.md`：定義「頁面怎麼排版、怎麼互動」（頁面層級）
- 本文件：定義「元件長什麼樣子、怎麼組成」（元件層級）

---

## 2. 章節內容

### 2.1 設計原則
（待補完：呼應 `016_Product_Decisions.md` 十大產品原則，特別是 Less is More、Mobile First。已落地實作已符合此精神，但正式文字規範留待後續 Sprint。）

### 2.2 色彩系統（Color）

固定深色介面（不提供 Light Mode／Theme toggle，為刻意產品決策，見 `008_TODO_BACKLOG.md` UR-TODO-073 條目）。CSS custom properties 定義於 `src/styles.css` `:root`：

**背景層次（page → surface → surface-2，禁止 OLED 純黑）**
- `--bg-page: #07080a`（全站背景，接近黑但非 `#000000`；UR-TODO-074 Production Verified 收斂值，較 UR-TODO-073 初版更暗、更中性，降低藍色 hue 偏移）
- `--bg-surface: #0c0f11`（Card／Section／Nav 主要表面，比 page 略亮）
- `--bg-surface-2: #131619`（次層表面，如 input 背景、Modal/Sheet 主體、次要資訊區塊——比 surface 再亮一階，維持三層可辨識層次）
- `--bg-surface-inset: #050607`（input 內凹背景）
- 三層 token 的藍色 channel 刻意壓低至僅比紅／綠 channel 高 2–3（而非 UR-TODO-073 初版的 10–15），避免多張巢狀 surface-2-on-surface 卡片並排時視覺上讀成「藍灰」而非「中性深灰／近黑」。

**文字階層**
- `--text-primary: #f1f5f9`（主要資訊：持股名稱、主要金額）
- `--text-secondary: #a7b0bf`（次要資訊：symbol、label、輔助說明）
- `--text-muted: #7f8a9a`（更弱化的資訊：Navigation inactive 狀態等）

**Primary 色彩（僅保留給真正需要注意的互動元素）**
- `--primary: #2d7bff`（Primary CTA 實色填滿、selected tab 實色填滿）
- `--primary-hover: #4a90ff`（Active Navigation icon/label、hover 狀態、focus ring accent）
- `--primary-soft: rgba(45,123,255,.14)` / `--primary-soft-strong: rgba(45,123,255,.24)`（Active Navigation 背景 soft tint，禁止用實色 `--primary` 當作大面積 active 背景）

**邊框與陰影**
- `--border: #23272b`（一般邊框，如 input、次要按鈕邊框；UR-TODO-074 隨背景加深同步微調，維持相對層次不變）
- `--border-subtle: rgba(148,163,184,.10)`（Card 邊框，刻意調得非常淡——層次主要靠 surface 對比與陰影，而非高對比藍框）
- `--shadow-card: 0 2px 8px rgba(0,0,0,.4)`（Card 淡陰影，取代重邊框建立 elevation）
- `--shadow-modal: 0 24px 64px rgba(0,0,0,.6)`（Modal/Sheet 較強陰影）

**語意色（UI outcome semantics，與市場漲跌色為兩個獨立軸線）**
- `--warning: #f59e0b` / `--warning-soft: rgba(245,158,11,.14)`
- `--danger: #ef4444` / `--danger-soft: rgba(239,68,68,.14)` / `--danger-strong: #7f1d1d`（如「封存已清倉」等不可逆操作）
- `--success: #22c55e`（保留供一般 UI 成功狀態使用）

**台股市場漲跌色（Market semantic，永久契約，不得反轉）**
- `--market-up: #ff5b5b`（上漲＝紅，對應 `.up`／`.bad`）
- `--market-down: #43d17a`（下跌＝綠，對應 `.down`／`.good`）
- **不得**因西方 Design System「green=positive／red=negative」慣例而反轉此 mapping；`--market-up`／`--market-down` 與 `--success`／`--danger` 是兩個獨立軸線，不得合併為同一 token。

### 2.3 文字排印（Typography）

Mobile-first，桌機不得為資訊密度犧牲 Mobile 可讀性。已落地 token：

- `--font-name: 18px`（持股名稱等主要資訊，字重 700）
- `--font-symbol: 13px`（symbol 等次要 metadata，字重 500，色彩 `--text-secondary`）
- `--font-amount: 19px`（主要金額，字重 700）
- `--font-pnl: 18px`（損益百分比，字重 700）
- `--font-button: 15px`（按鈕文字，字重 700）

視覺主次原則：**主要資訊（名稱／金額／百分比）> 次要資訊（symbol／label／輔助說明）**。此原則已於 Holding Card 落地（名稱 > symbol），具體欄位排列方式見下方 2.13 節（UR-TODO-074 Production Verified 後正式記錄）。

行動裝置最低字級（`≤768px`）：`h1` 1.7rem、`h2` 1.1rem、`h3` 1.05rem、`button` .95rem——不得為求版面緊湊而低於此地板值。

### 2.4 間距系統（Spacing）

- `--space-1: 4px` / `--space-2: 8px` / `--space-3: 12px` / `--space-4: 16px` / `--space-6: 24px` / `--space-8: 32px` / `--space-10: 40px` / `--space-12: 48px`
- Card 內距約 16px（`--space-4`），Card 間距約 12px（`--space-3`），Section 間距約 24px（`--space-6`）。

### 2.5 卡片（Card）

- `--radius-sm: 8px` / `--radius-md: 12px` / `--radius-lg: 16px` / `--radius-xl: 20px`；一般 Card 使用 `--radius-lg`（16px）。
- 背景 `--bg-surface`，邊框 `1px solid --border-subtle`（刻意極淡），陰影 `--shadow-card`。
- 層次原則：**主要依 surface 對比／spacing／極淡陰影建立層次，不主要依賴高對比藍色邊框**。僅有「Active／Selected／true accent」狀態（如 selected tab、Tool Center 已上線工具卡）才使用 `--primary` 或 `--primary-hover` 邊框，一般 Card／Section／Information box 不預設藍框。

### 2.6 按鈕（Button）

四種視覺層級（`src/styles.css` 已建立，供全站共用）：

- **Primary**：實色 `--primary` 填滿、白字，用於真正的主要互動（Primary CTA、selected tab、submit 等）。
- **Secondary**：`--bg-surface-2` 背景 + `1px solid --border` 邊框 + `--text-primary` 文字，無填色。例：Holding Card「詳細」按鈕——**Secondary Action 不得使用與 Primary CTA 相同的大面積實色藍**。
- **Danger**：`--danger-strong` 背景，僅用於真正不可逆／危險操作（如「封存已清倉」）。
- **Ghost**：透明背景、`--text-secondary` 文字，用於低優先級操作／icon-only 按鈕，hover 時淡入 `--bg-surface-2`。

按鈕文字 `--font-button`（15px）、字重 700。

### 2.7 圖示（Icon）
（待補完：現行使用 `lucide-react`，正式選用規則／尺寸／色彩搭配規則留待後續 Sprint 正式記錄）

### 2.8 動畫（Animation）
（待補完：轉場時長、緩動曲線、使用時機與禁止濫用原則）

### 2.9 骨架屏（Skeleton）
（待補完：Loading 狀態的骨架屏規範，與現有各頁面 Loading 狀態的相容性）

### 2.10 響應式斷點與 Mobile First 規則

已驗證斷點（UR-TODO-073 四輪 Preview 皆於下列寬度確認無 horizontal overflow）：

- Mobile：320px、390px、430px
- Desktop：1000px、1280px、1600px
- CSS media query 斷點：`≤420px`（最窄手機微調）、`≤768px`（Mobile 主要斷點）、`769–900px`（過渡區間）、`≥901px`（Desktop，UR-TODO-071 既有 9-column row contract 生效區間）

Mobile First：所有共用 primitive／token 以 Mobile 為基準設計，Desktop 不得反向壓縮 Mobile 字級或觸控目標（既有 44px 最小觸控目標維持）。

### 2.11 導覽（Navigation）

Navigation IA（項目、順序、路由）不在本文件範圍，見既有 `NAV_ITEMS`／`018_Dashboard_UX_Guideline.md`。本節僅記錄視覺慣例：

- **Inactive**：icon／label 皆使用 `--text-muted`（中性、弱化）。
- **Active**：icon／label 皆使用 `--primary-hover`（Mobile Bottom Navigation 與 Desktop Sidebar 已統一一致，UR-TODO-073 第二輪修正 Desktop Sidebar 原本誤用 `--text-primary` 的不一致）。
- **Active 背景**：soft tint（Mobile 用 `--primary-soft`，Desktop Sidebar 用 `--primary-soft-strong`），**禁止使用大面積實色 `--primary` 當作 active 背景**（會過於刺眼）。
- Icon 為 `lucide-react` 元件，不硬編色彩 prop，透過父層 `color` 繼承（`currentColor`），因此上述規則同時驅動 icon 與 label 顏色。

### 2.12 Modal／Sheet

- Desktop：置中 Modal，`max-width: 680px`。
- Mobile（`≤768px`）：near-full-height Bottom Sheet（`96dvh`），頂部圓角 `--radius-lg`。
- 背景遮罩：`rgba(3,7,13,.78)` + 極輕微 `backdrop-filter: blur(2px)`（不得影響效能）。
- 主體表面使用 `--bg-surface-2`（比 page／一般 Card 表面更亮一階，明確區隔出 elevation），陰影 `--shadow-modal`。
- Interaction contract（scroll 還原、focus 管理、`role="dialog"`、safe-area、background scroll lock 等）屬 UR-TODO-072 正式契約，見 `008_TODO_BACKLOG.md`，本文件不重複定義、亦不得被本文件的視覺規則覆蓋。

### 2.13 Holding Card（Mobile Compact Layout，UR-TODO-074 Production Verified）

僅記錄已經 Production Verified 且穩定的排版契約；一次性 workaround（如特定像素微調的推導過程）不在此重複，詳見 `008_TODO_BACKLOG.md` UR-TODO-074 條目的逐輪記錄。

- **版面結構**：Mobile（`≤768px`）為 3 列 grid：第 1 列「股票名稱＋Symbol」與 drag handle；第 2 列「市值」label＋金額（同排）；第 3 列 compact「詳細」按鈕，與未實現損益 label 同排。未實現損益的百分比與 label 共用一個 grid-area（`pnl`），跨第 2／3 列顯示，百分比為主要視覺、label 為次要視覺（column-reverse，緊密成組，間距 3px）。
- **Allocation Ring**：置於卡片左側，因巢狀於 identity 容器內，以 `position:absolute` 達成跨列視覺效果（不變動 grid 容器的直接子元素數量，保護 UR-TODO-071 桌面 9-column row 的既有依賴）。外徑依斷點縮放：320px 64px／390px 70px／421–768px 76px；punch-hole 環厚（inset）5–6px，百分比文字 14–16px，皆已透過圓弧弦寬（chord-width，非僅外接矩形寬度）幾何驗證確保 1–2 位小數的百分比字串不溢出。Ring 與右側內容欄之間維持 14–16px 固定間距。
- **股票名稱**：Mobile 範圍內透過 `.holding-card-identity .holding-name` 選擇器放大為 20px（僅此情境，不變動全域 `--font-name` token，桌面 9-column row 與 Holding Detail Dialog header 仍使用未變動的 `--font-name`）。
- **「詳細」按鈕**：Secondary Action，`min-width: 88px`、`min-height: 37px`，非全寬。
- **現價／今日漲跌**：Mobile 摘要卡不顯示（無其他欄位可承接時，優先移至 Holding Detail Sheet 顯示，而非直接刪除資料點）。
- 以上排版契約僅適用於 Mobile Compact Card；桌面（`≥901px`）9-column row 版面（見既有 UR-TODO-071 條目）與 Holding Detail Dialog 內部排版不在此規範範圍。

---

## 3. 版本歷史

- v0.1（2026-07-25）：建立骨架，落地 V7.0A Foundation & Product Governance 的一部分；章節內容待 V7.0E 啟動後補完。
- v1.0（2026-08-22）：依 UR-TODO-073 Phase 1（PR #408，final head `1a8c4f7941b23ccab0754385ae69798fa8c6108f`）四輪 Preview 人工驗收通過的實際落地 CSS，正式補完 Section 2.2 色彩系統、2.3 文字排印、2.4 間距系統、2.5 卡片、2.6 按鈕、2.10 響應式斷點、2.11 導覽、2.12 Modal／Sheet。Holding Card 內部具體排版明確排除於本次記錄範圍，defer 至 UR-TODO-074。Section 2.1／2.7／2.8／2.9 仍待補完。
- v1.0.1（2026-08-22）：PR #408 已 Merge（merge commit `d348372599c4bdcfba8d5b4d5fb21722366bc33e`）並經 Production 唯讀驗證確認，UR-TODO-073 正式 CLOSED／Production Verified；本節內容未變動，僅更新頂部狀態旗標與版本歷史。
- v1.1.0（2026-08-22）：UR-TODO-074（PR #410，merge commit `0d1cdacad30df11fa8a8074333a70ff8d877ee87`）已 Merge 並經 Production 唯讀驗證確認，正式 CLOSED／Production Verified。更新 Section 2.2 背景層次／邊框 token 為 UR-TODO-074 收斂後的加深、降藍值；新增 Section 2.13 記錄 Holding Card Mobile Compact Layout 的正式排版契約（Ring 位置與尺寸、股票名稱 Mobile-only 放大、詳細按鈕尺寸、未實現損益分組方式）。
