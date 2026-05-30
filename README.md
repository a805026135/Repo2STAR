# ResumeAI - AI 驱动的 GitHub 简历生成器

> 从 GitHub 仓库自动提取技术亮点，用 AI 生成 STAR 格式简历，一键匹配 JD 并导出 PDF/Word。

---

<!-- 截图占位：项目整体概览 -->
<!-- ![项目概览](docs/screenshots/overview.png) -->

## 项目简介

ResumeAI（内部代号 Repo2STAR）是一个全栈 AI 应用。它通过 GitHub OAuth 登录后自动获取你的仓库列表，利用 AI 深度分析每个仓库的代码、提交记录和架构设计，自动生成符合 STAR 法则的简历要点，并提供 JD 匹配、面试准备、技能画像等一站式求职辅助功能。

<!-- 截图占位：登录页面 -->
<!-- ![登录页面](docs/screenshots/login.png) -->

---

## 核心功能

### 1. GitHub 仓库智能分析

一键分析仓库，AI 自动识别技术栈、架构模式、核心业务逻辑和个人贡献，过滤样板代码（如 `create-react-app` 脚手架），聚焦真实项目能力。

**实现流程：**

```
GitHub API (Octokit)
  ├─ 获取 README、语言分布、提交历史、Issues、PR
  ├─ 递归获取文件树 → 按扩展名过滤代码文件
  ├─ 分层抽样（按文件类型均衡采样 10 个文件）
  └─ 识别并标记样板代码模式
          ↓
Claude AI 分析引擎
  ├─ 综合仓库元数据 + 代码样本 + 提交分析
  ├─ 提取 tech_stack / architecture / core_logic / personal_contributions
  └─ 结构化 JSON 输出 → 存入 SQLite
```

**关键代码：** [`server/services/analyzer.js`](server/services/analyzer.js)

<!-- 截图占位：仓库分析页面 -->
<!-- ![仓库分析](docs/screenshots/repo-analysis.png) -->

---

### 2. STAR 简历要点自动生成

基于仓库分析结果，AI 生成 3-5 条 STAR（Situation-Task-Action-Result）格式的简历要点，每条都包含具体的技术细节和量化成果。

**实现要点：**
- Prompt 工程引导 AI 聚焦技术深度而非泛泛描述
- 自动标记 skills 和 tags 便于后续匹配
- 支持用户反馈（点赞/踩）驱动迭代优化
- 基于反馈 AI 自动生成改进版本

**关键代码：** [`server/services/starGenerator.js`](server/services/starGenerator.js)

<!-- 截图占位：STAR 要点列表 -->
<!-- ![STAR 要点](docs/screenshots/star-points.png) -->

---

### 3. JD 智能匹配与简历重写

输入目标岗位的 JD 文本，AI 自动：
1. 从所有 STAR 要点中筛选最相关的 2-3 个项目
2. 重写要点以最大化关键词对齐
3. 输出匹配报告（覆盖率评分、匹配/缺失关键词、改进建议）

**实现流程：**

```
JD 文本输入
    ↓
JobMatcherService.selectBestProjects()
  ├─ AI 评估所有项目与 JD 的相关性
  └─ 选出 top 2-3 个项目
    ↓
StarGeneratorService.rewriteForJob()
  ├─ 针对性重写 STAR 要点
  └─ 生成 match_report（coverage_score, keywords）
    ↓
存入 job_matches 表 → 支持历史查看
```

**关键代码：** [`server/services/jobMatcher.js`](server/services/jobMatcher.js)

<!-- 截图占位：JD 匹配结果 -->
<!-- ![JD 匹配](docs/screenshots/job-match.png) -->

---

### 4. 跨仓库技能画像合成

综合分析所有已分析仓库的 STAR 要点，AI 提取统一的技能画像：

- 按出现频率自动计算熟练度等级（入门/中级/高级）
- 识别技术模式分组（如"全栈 Web 开发：React + Node.js + PostgreSQL"）
- 24 小时缓存机制避免重复计算

**关键代码：** [`server/services/starGenerator.js`](server/services/starGenerator.js) → `synthesizeCrossRepoSkills()`

<!-- 截图占位：技能画像 -->
<!-- ![技能画像](docs/screenshots/skill-profile.png) -->

---

### 5. 多模板实时预览简历编辑器

提供 6 套精心设计的简历模板，所见即所得的实时编辑体验：

| 模板 | 风格 | 适用场景 |
|------|------|----------|
| 现代极简 | 左右双栏、柔和阴影卡片 | 科技 / 设计 / 产品 |
| 优雅传统 | 居中大标题、衬线字体 | 金融 / 法律 / 行政 |
| 色彩创意 | 紫蓝渐变、彩色标签 | 市场营销 / 艺术 / 媒体 |
| 侧边栏深色 | 深紫黑色侧边栏、进度条 | 工程师 / 开发 / 创业 |
| 卡片北欧风 | 独立卡片、柔和蓝配色 | 产品经理 / 运营 / 咨询 |
| 极简一页 | 大留白、无卡片 | 应届生 / 自由职业 |

**技术实现：**
- React Context + useReducer 管理简历状态
- 每个模板独立组件（`src/components/templates/`），纯 inline style 保证导出一致性
- 编辑器与预览器双向绑定，切换模板即时生效

<!-- 截图占位：简历编辑器 -->
<!-- ![简历编辑器](docs/screenshots/resume-editor.png) -->

<!-- 截图占位：模板切换 -->
<!-- ![模板切换](docs/screenshots/templates.png) -->

---

### 6. PDF / Word 多格式导出

- **PDF 导出：** 基于 `html2canvas` + `jsPDF`，将预览区域直接渲染为高保真 PDF
- **Word 导出：** 基于 `docx` 库，从简历数据结构化生成 `.docx` 文件，支持自定义样式

**关键代码：** [`src/services/exportPdf.js`](src/services/exportPdf.js) / [`src/services/exportDocx.js`](src/services/exportDocx.js)

<!-- 截图占位：导出功能 -->
<!-- ![导出](docs/screenshots/export.png) -->

---

### 7. AI 对话助手

内置 AI Agent 聊天面板，支持在简历编辑过程中随时提问、请求润色、获取建议。

**关键代码：** [`src/components/AgentChat.jsx`](src/components/AgentChat.jsx)

<!-- 截图占位：AI 助手 -->
<!-- ![AI 助手](docs/screenshots/ai-chat.png) -->

---

### 8. Webhook 自动同步

配置 GitHub Webhook 后，每次 push 事件自动触发仓库重新分析（60 秒防抖），确保简历内容始终与最新代码同步。

**关键代码：** [`server/agent/orchestrator.js`](server/agent/orchestrator.js) → `handleWebhookPush()`

---

### 9. 面试准备

AI 根据你的 STAR 要点和项目分析，自动生成针对性的面试题目和回答要点，覆盖技术面、行为面和系统设计。

**关键代码：** [`server/services/jobMatcher.js`](server/services/jobMatcher.js) → `generateInterviewQuestions()`

<!-- 截图占位：面试准备 -->
<!-- ![面试准备](docs/screenshots/interview-prep.png) -->

---

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│  Vite + Tailwind CSS + React Context + Lucide Icons  │
├─────────────────────────────────────────────────────┤
│                    API Proxy (Vite Dev)               │
├─────────────────────────────────────────────────────┤
│                 Backend (Express.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ GitHub   │  │ Claude   │  │ Agent Orchestrator │  │
│  │ OAuth +  │  │ AI API   │  │ (Pipeline 编排)    │  │
│  │ Octokit  │  │ Client   │  │                    │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ SQLite   │  │ Webhook  │  │ Scheduler (Cron)   │  │
│  │ (sql.js) │  │ Handler  │  │                    │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| **前端** | React 18 + Vite 6 | SPA 框架，HMR 开发体验 |
| **样式** | Tailwind CSS 3 | 原子化 CSS，快速 UI 开发 |
| **状态** | React Context + useReducer | 轻量级全局状态管理 |
| **图标** | Lucide React | 一致的图标系统 |
| **通知** | React Hot Toast | 非侵入式消息提示 |
| **AI** | Anthropic SDK (Claude API) | 代码分析、STAR 生成、JD 匹配 |
| **GitHub** | Octokit REST | 仓库数据获取、OAuth 认证 |
| **后端** | Express 5 | RESTful API 服务 |
| **数据库** | sql.js (SQLite in-memory) | 零依赖嵌入式数据库 |
| **定时任务** | node-cron | 周期性仓库扫描 |
| **PDF** | html2canvas + jsPDF | 简历导出为 PDF |
| **Word** | docx | 简历导出为 DOCX |
| **文件解析** | pdfjs-dist + mammoth | 上传文件内容提取 |

---

## 项目结构

```
ResumeAI/
├── server/                        # 后端服务
│   ├── index.js                   # Express 入口，路由注册
│   ├── start.js                   # 启动脚本（加载 .env）
│   ├── agent/
│   │   └── orchestrator.js        # Agent 编排器（核心 Pipeline）
│   ├── db/
│   │   └── schema.js              # SQLite 建表 + DB 初始化
│   ├── middleware/
│   │   └── auth.js                # JWT 鉴权中间件
│   ├── routes/
│   │   ├── auth.js                # GitHub OAuth 认证路由
│   │   ├── repos.js               # 仓库管理 API
│   │   ├── analysis.js            # 仓库分析 API
│   │   ├── jobs.js                # JD 匹配 API
│   │   ├── export.js              # 导出 API
│   │   ├── webhooks.js            # GitHub Webhook 接收
│   │   └── settings.js            # 用户设置 API
│   └── services/
│       ├── aiClient.js            # Claude API 调用封装（含重试）
│       ├── analyzer.js            # 仓库分析引擎
│       ├── github.js              # GitHub API 封装（Octokit）
│       ├── integrations.js        # 第三方集成（Notion 等）
│       ├── jobMatcher.js          # JD 匹配 + 面试题生成
│       ├── scheduler.js           # 定时任务调度
│       └── starGenerator.js       # STAR 要点生成 + 技能合成
│
├── src/                           # 前端源码
│   ├── App.jsx                    # 根组件 + 路由
│   ├── main.jsx                   # 入口
│   ├── index.css                  # 全局样式 + Tailwind
│   ├── components/
│   │   ├── AgentChat.jsx          # AI 对话助手
│   │   ├── AgentLogView.jsx       # Agent 日志查看
│   │   ├── ExportView.jsx         # 导出面板
│   │   ├── InterviewPrepView.jsx  # 面试准备
│   │   ├── JobMatcherView.jsx     # JD 匹配
│   │   ├── Navbar.jsx             # 顶部导航
│   │   ├── RepoOverview.jsx       # 仓库概览
│   │   ├── ResumeEditor.jsx       # 简历编辑器
│   │   ├── ResumePreview.jsx      # 简历实时预览
│   │   ├── SettingsView.jsx       # 设置页
│   │   ├── Sidebar.jsx            # 侧边栏导航
│   │   ├── SkillProfileView.jsx   # 技能画像
│   │   ├── StarPointsView.jsx     # STAR 要点管理
│   │   ├── TemplateSelector.jsx   # 模板选择器
│   │   └── templates/             # 6 套简历模板组件
│   │       ├── ClassicTemplate.jsx
│   │       ├── ExecutiveTemplate.jsx
│   │       ├── FreshTemplate.jsx
│   │       ├── MinimalistTemplate.jsx
│   │       ├── ModernTemplate.jsx
│   │       └── TechTemplate.jsx
│   ├── data/
│   │   ├── defaultResume.js       # 默认简历数据结构
│   │   └── templates.js           # 模板注册表
│   ├── pages/
│   │   ├── Dashboard.jsx          # 主控制台
│   │   └── LoginPage.jsx          # 登录页
│   ├── services/
│   │   ├── api.js                 # 前端 API 封装
│   │   ├── exportDocx.js          # Word 导出逻辑
│   │   ├── exportPdf.js           # PDF 导出逻辑
│   │   ├── fileParser.js          # 文件解析（PDF/Word 上传）
│   │   └── mimoApi.js             # MiMo API 适配
│   └── store/
│       ├── AppContext.jsx          # 全局应用状态
│       └── ResumeContext.jsx       # 简历编辑状态
│
├── data/                          # SQLite 数据库文件（gitignore）
├── index.html                     # HTML 入口
├── package.json
├── vite.config.js                 # Vite + API 代理配置
├── tailwind.config.js             # Tailwind 主题定制
├── postcss.config.js
└── .env.example                   # 环境变量模板
```

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/<your-username>/ResumeAI.git
cd ResumeAI
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 填入你的密钥：

| 变量 | 必填 | 说明 |
|------|------|------|
| `GITHUB_CLIENT_ID` | 是 | GitHub OAuth App 的 Client ID |
| `GITHUB_CLIENT_SECRET` | 是 | GitHub OAuth App 的 Client Secret |
| `ANTHROPIC_API_KEY` | 是 | Claude API 密钥 |
| `JWT_SECRET` | 是 | JWT 签名密钥（随机字符串） |
| `GITHUB_WEBHOOK_SECRET` | 否 | GitHub Webhook 签名密钥 |
| `NOTION_API_KEY` | 否 | Notion 集成密钥（可选） |
| `ANTHROPIC_BASE_URL` | 否 | 自定义 AI API 地址（默认官方地址） |
| `AI_MODEL` | 否 | 自定义模型名称（默认 claude-sonnet-4-6） |
| `PORT` | 否 | 后端端口（默认 3001） |

### 4. 创建 GitHub OAuth App

1. 前往 [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. 新建 OAuth App
3. Homepage URL: `http://localhost:5173`
4. Authorization callback URL: `http://localhost:3001/api/auth/callback`
5. 将 Client ID 和 Secret 填入 `.env`

### 5. 启动开发服务器

```bash
npm run dev
```

同时启动前端（Vite，端口 5173）和后端（Express，端口 3001），访问 `http://localhost:5173`。

---

## 使用流程

```
1. GitHub 登录 → 自动获取仓库列表
       ↓
2. 选择仓库 → 一键 AI 分析（技术栈 + 架构 + 贡献）
       ↓
3. 生成 STAR 要点 → 编辑 / 反馈 / 迭代
       ↓
4. 输入 JD → 智能匹配项目 + 重写要点
       ↓
5. 进入简历编辑器 → 选择模板 → 实时预览
       ↓
6. 导出 PDF / Word → 投递简历
```

<!-- 截图占位：使用流程示意 -->
<!-- ![使用流程](docs/screenshots/workflow.png) -->

---

## 脚本命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动前端 + 后端开发服务器 |
| `npm run dev:frontend` | 仅启动前端（Vite） |
| `npm run dev:server` | 仅启动后端（Express） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |

---

## License

MIT
