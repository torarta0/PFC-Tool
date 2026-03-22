# PRD: PFC Commander (PFC 指挥官)

## 1. 项目概述 (Project Overview)
**项目名称**: PFC 指挥官 (PFC Commander)
**核心愿景**: 一个基于游戏化机制的自律与习惯养成系统。通过量化日常行为（认知、生理、秩序等），赋予用户“指挥官”身份，建立正向反馈循环。
**目标人群**: 希望通过量化自我、提升自律性、克服冲动并建立健康生活习惯的用户。

---

## 2. 核心概念 (Core Concepts)
- **累积积分 (Total Points)**: 用户自创建以来获得的所有积分总和，决定“指挥官等级”。
- **当前余额 (Balance)**: 累积积分减去已消费积分，用于在奖励商店兑换奖励。
- **等级系统 (Leveling System)**: 共 20 个等级，每个等级有独特的军衔名称（如“反应弧战士”、“首席指挥官”）。
- **分类 (Categories)**: 行为分为“认知”、“生理”、“秩序”、“冲动”、“负面”等类别。
- **日志 (Diary)**: 提供极简日记功能，用于记录思考与复盘。

---

## 3. 功能需求与数据逻辑 (Functional Requirements & Data Logic)

### 3.1 积分双轨制 (Dual-Track Point System)
- **累积积分 (Total Points)**: 
  - **逻辑**: 仅增不减（除非删除行为日志）。
  - **用途**: 唯一决定指挥官等级 (Level) 的指标。
- **当前余额 (Balance)**: 
  - **逻辑**: `累积积分 - 已消费积分`。
  - **用途**: 作为“货币”在奖励商店兑换物品。兑换行为不影响等级。

### 3.2 指挥中心 (Command Center)
- **快捷协议 (Quick Protocols)**: 
  - **功能**: 预设常用行为，一键增加积分。
  - **数据**: 每个磁贴包含 `label`, `icon`, `category`, `value`。
- **手动记录 (Manual Entry)**: 
  - **入口**: 指挥中心“手动记录”选项卡。
  - **表单字段**:
    - `行为名称`: 必填，描述达成的成就。
    - `类别`: 下拉选择（认知、生理、秩序、冲动、负面）。
    - `积分`: 快捷选择（1, 2, 5, 10, 15, 20）。
    - `备注`: 选填，详细说明。
    - `图片上传`: 选填，支持 Base64 图片预览与存储。
  - **逻辑**: 选择“负面”类别时，积分值自动转为负数。
- **行为日志 (Activity Logs)**: 
  - **排版**: 按时间倒序排列。
  - **详情弹窗**: 点击日志条目弹出，展示完整备注、上传的图片、精确时间戳，并提供删除功能。
  - **逻辑**: 删除日志会同步扣除“累积积分”和“当前余额”。

### 3.3 奖励商店 (Reward Store)
- **兑换流程**: 
  1. 检查 `Balance >= Reward.points`。
  2. 检查 `Level >= Reward.minLevel`。
  3. 成功后，弹出成功提示（含撤回按钮），增加一条 `RedemptionLog`，更新 `spentPoints`。
- **背包系统 (Inventory)**: 
  - **入口**: 奖励商店“我的仓库”选项卡。
  - **分类**: 分为“待使用”和“已使用”两个子选项卡。
  - **逻辑**: 点击“使用”记录 `usedAt` 时间戳，弹出成功提示（含撤回按钮），但不影响积分。

### 3.4 日志 (Diary)
- **核心功能**:
  - **写入**: 支持标题、正文、分类选择。
  - **删除**: 支持删除单条日志。
  - **自动记录**: 自动保存创建时间戳。
  - **分类**: 支持自定义日志类别（如随笔、复盘、感悟、计划），可直接在日志页面进行管理。
  - **查找**: 支持按标题或正文内容进行实时搜索，支持按类别筛选。

### 3.5 升级庆典逻辑 (Level Up Logic)
- **触发条件**: 当 `Total Points` 增加导致 `getLevel()` 返回值大于前一次记录的等级时。
- **表现**: 触发全屏模态框，展示新军衔、随机励志语录及五彩纸屑特效。

### 3.5 数据分析 (Analytics)
- **积分趋势**: 展示每日/每周获得的积分趋势图。
- **分类分布**: 通过饼图展示不同行为类别的积分占比。

### 3.6 系统设置 (Settings)
- **行为管理**:
  - **类别管理**: 添加/删除自定义行为类别（“负面”为系统内置，不可删除）。
  - **协议配置**: 
    - **表单**: 名称、类别、分值、图标选择器（提供 30+ 预设图标）。
- **奖励管理**:
  - **类别管理**: 添加/删除自定义奖励类别。
  - **奖励配置**:
    - **表单**: 名称、类别、所需积分、展示模式（图标或图片上传）、是否可重复购买。
- **外观设置 (Appearance)**:
  - **配色系统**: 支持 `Bright` (明亮), `Dark` (暗黑), `Nordic Moss` (北欧苔), `Sunset Rose` (落日玫) 四套主题。采用紧凑的横向滚动选择器。
  - **字体选择**: 提供 4 种字体风格（无衬线、衬线、等宽、展示字体）。
  - **字体大小**: 提供 `Small`, `Medium`, `Large` 三档调节，针对移动端优化适配。
- **等级系统**:
  - **配置**: 自由编辑每一级的 `minPoints` 和 `title`，支持添加/删除等级序列。
- **数据管理**: 支持一键重置所有 `localStorage` 数据。

---

## 4. 页面排版与布局关系 (Layout & UI Relationships)

### 4.1 全局框架 (Global Shell)
- **顶部导航 (TopAppBar)**: 
  - **左侧**: 用户头像与应用名称。
  - **中间 (仅桌面端)**: 选项卡导航。
  - **右侧**: 实时显示等级与累积积分。
  - **特性**: `fixed` 定位，背景毛玻璃 (`backdrop-blur`)。
- **底部导航 (BottomNavBar)**: 
  - **特性**: 仅在移动端显示，`fixed` 底部。

### 4.2 核心内容区 (Main Content)
- **Hero 区域 (状态看板)**: 
  - 位于页面最上方，展示：
    - **左侧**: 当前余额 (Balance) 大字显示。
    - **右侧**: 升级进度条 (Progress Bar)，显示当前等级到下一等级的百分比。
  - **注意**: 在“日志”页面隐藏此区域，以提供更纯粹的记录环境。
- **动态内容区**: 根据 `activeTab` 渲染对应的子页面（指挥/商店/分析/设置）。

### 4.3 响应式设计 (Responsive Design)
- **移动端**: 采用单列布局，磁贴以网格形式排列，导航移至底部。
- **桌面端**: 采用宽屏布局，内容最大宽度限制为 `7xl`，导航位于顶部。

---

## 5. 技术架构 (Technical Architecture)

### 4.1 技术栈 (Tech Stack)
- **框架**: React 19 + TypeScript.
- **样式**: Tailwind CSS 4 (移动优先设计).
- **动画**: Framer Motion (`motion/react`) + `canvas-confetti`.
- **图表**: `recharts`.
- **图标**: `lucide-react` (功能图标) + Google Material Symbols (装饰图标).

### 4.2 状态管理与持久化 (State & Persistence)
- **Context API**: 使用自定义的 `CommanderProvider` 管理全局状态。
- **持久化**: 所有数据（日志、兑换记录、配置）实时同步至 `localStorage` (`pfc_commander_state`)。

---

## 5. UI/UX 设计规范 (Design Guidelines)

### 5.1 视觉风格
- **风格**: 北欧极简主义 (Nordic Minimalist) 结合 Material Design 3。
- **配色主题**: 
  - `Bright`: 核心明亮主题。
  - `Dark`: 深邃暗黑主题。
  - `Nordic Moss`: 自然深绿主题。
  - `Sunset Rose`: 活力粉红主题。
- **圆角**: 大圆角设计 (`rounded-2xl` / `rounded-3xl`)。

### 5.2 交互与动画
- **Tab 切换**: 平滑的内容渲染切换。
- **升级庆典**: 检测到等级提升时，弹出全屏模态框并触发五彩纸屑 (`canvas-confetti`) 效果。
- **微交互**: 按钮点击缩放、卡片悬浮提升。

---

## 6. 数据模型 (Data Models)

### UserState
```typescript
interface UserState {
  totalPoints: number;      // 累积积分
  spentPoints: number;      // 已消费积分
  logs: ActivityLog[];      // 行为日志
  redemptions: RedemptionLog[]; // 兑换记录
  diary: DiaryEntry[];      // 日志
  quickTiles: QuickTile[];  // 快速记录配置
  rewards: Reward[];        // 奖励商店配置
  categories: string[];     // 行为分类列表
  rewardCategories: string[]; // 奖励分类列表
  levelTargets: LevelTarget[]; // 等级阈值配置
}
```

---

## 7. 关键逻辑实现 (Key Logic)

### 等级计算
```typescript
const getLevel = (totalPoints, targets) => {
  const sorted = [...targets].sort((a, b) => b.minPoints - a.minPoints);
  return sorted.find(t => totalPoints >= t.minPoints)?.level || 1;
};
```

### 进度条逻辑
```typescript
const progress = (totalPoints - currentLevelMin) / (nextLevelMin - currentLevelMin) * 100;
```

---

## 8. 给 AI 的重生成指南 (AI Regeneration Guide)
1. **初始化**: 使用 Vite + React + TS 模板。
2. **样式**: 引入 Tailwind CSS，并在 `index.css` 中定义 Material 3 颜色变量。
3. **状态**: 实现一个包含 `localStorage` 自动同步功能的 Context Provider。
4. **组件化**: 
   - `App.tsx`: 负责 Tab 切换和升级检测。
   - `CommandCenter.tsx`: 渲染快速磁贴和日志。
   - `RewardStore.tsx`: 处理兑换逻辑。
   - `Analytics.tsx`: 使用 Recharts 渲染数据。
5. **资产**: 使用 `picsum.photos` 作为占位图，`Material Symbols` 作为装饰性图标。
