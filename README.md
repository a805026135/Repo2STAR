# Repo2STAR - AI 驱动的 GitHub 简历生成器

> **你只管写代码，它负责把代码翻译成 Offer。**
>
> 连接 GitHub 的 AI Agent，自动分析仓库、生成 STAR 简历要点、匹配目标岗位、一键导出专业简历。

![登录页](docs/screenshots/01-login.png)

![控制台总览](docs/screenshots/02-dashboard.png)

---

## 目录

- [项目简介](#项目简介)
- [功能详解](#功能详解)
  - [GitHub OAuth 登录](#1-github-oauth-登录)
  - [仓库导入与管理](#2-仓库导入与管理)
  - [AI 仓库深度分析](#3-ai-仓库深度分析)
  - [STAR 简历要点生成](#4-star-简历要点生成)
  - [JD 智能匹配与简历重写](#5-jd-智能匹配与简历重写)
  - [跨仓库技能画像合成](#6-跨仓库技能画像合成)
  - [智能简历编辑器](#7-智能简历编辑器)
  - [AI 对话助手](#8-ai-对话助手)
  - [多格式导出系统](#9-多格式导出系统)
  - [面试准备](#10-面试准备)
  - [Webhook 自动同步](#11-webhook-自动同步)
  - [Agent 日志](#12-agent-日志)
- [技术架构](#技术架构)
- [项目结构](#项目结构)
- [数据库设计](#数据库设计)
- [API 路由总览](#api-路由总览)
- [快速开始](#快速开始)
- [使用流程](#使用流程)
- [脚本命令](#脚本命令)
- [截图指南](#截图指南)
- [License](#license)

---

## 项目简介

Repo2STAR 是一个全栈 AI 应用，旨在帮助开发者将 GitHub 上的代码成果转化为专业的求职简历。

**核心理念：** 开发者的技术能力体现在代码中，而不是简历模板里。Repo2STAR 通过 AI 深度理解你的每一个仓库——技术栈选择、架构设计、提交模式、代码质量——然后用专业的 STAR 法则（Situation-Task-Action-Result）将这些技术成果转化为招聘官看得懂的简历语言。

**它不仅仅是一个简历模板工具，而是一个从代码分析到简历输出的完整 AI Pipeline。**

---

## 功能详解

### 1. GitHub OAuth 登录

通过 GitHub OAuth 2.0 安全登录，仅申请 `repo` 读取权限，**不会修改你的任何仓库**。

**登录流程：**

```
用户点击 "使用 GitHub 登录"
    → 前端跳转 GitHub OAuth 授权页
    → 用户授权后 GitHub 回调到后端 /api/auth/callback
    → 后端用 code 换取 access_token
    → 生成 JWT Token 返回前端
    → 前端保存 Token 完成登录
```

**技术实现：**
- OAuth 回调地址：`http://localhost:3001/api/auth/callback`
- JWT Token 存储在前端 localStorage
- 所有 API 请求通过 `Authorization: Bearer <token>` 鉴权
- 鉴权中间件：[`server/middleware/auth.js`](server/middleware/auth.js)

![GitHub 登录页](docs/screenshots/01-login.png)

---

### 2. 仓库导入与管理

登录后自动获取你在 GitHub 上的所有仓库，支持批量导入和单个管理。

**功能清单：**
- **批量导入：** 弹窗展示所有 GitHub 仓库，支持多选勾选，一键导入
- **仓库卡片：** 每个仓库展示名称、描述、语言、Star 数、分析次数、上次分析时间
- **分析状态：** 实时显示分析进度，完成后自动刷新
- **关注/取关：** 关注的仓库可通过 Webhook 自动同步更新
- **移除仓库：** 从管理列表中移除（不影响 GitHub 原始仓库）
- **新建议提示：** 当分析发现显著变化时，仓库卡片上显示"有新建议"徽章
- **Public/Private 标签：** 自动识别并标记仓库可见性

**侧边栏统计：**
- 已导入仓库数量
- STAR 素材总数
- 新建议数量徽章

![仓库管理页面](docs/screenshots/03-repos.png)

![导入仓库弹窗](docs/screenshots/04-import-repos.png)

---

### 3. AI 仓库深度分析

一键分析仓库，AI 从代码层面深度理解项目，自动提取四大维度：

| 维度 | 说明 | 示例 |
|------|------|------|
| **技术栈 (tech_stack)** | 实际使用的框架、库、工具 | `["React 18", "Express 5", "SQLite", "Tailwind CSS"]` |
| **架构 (architecture)** | 系统设计模式和模块关系 | `"前后端分离架构，RESTful API，Agent 编排模式"` |
| **核心逻辑 (core_logic)** | 核心业务实现和技术亮点 | `"多文件分层抽样 + AI 分析 Pipeline，支持 30+ 编程语言"` |
| **个人贡献 (personal_contributions)** | 从代码和提交中识别的具体成就 | `"设计 STAR 生成引擎，实现 Webhook 防抖机制"` |

**分析 Pipeline 详解：**

```
Step 1: 数据采集（并行）
  ├─ Octokit 获取仓库元数据（README、语言分布、Stars）
  ├─ 获取最近 50 条提交记录
  ├─ 获取 Issues 和 Pull Requests
  └─ 获取完整文件树

Step 2: 智能采样
  ├─ 按扩展名过滤代码文件（支持 30+ 语言）
  ├─ 排除 node_modules、dist、build 等目录
  ├─ 按文件类型分层抽样（每种语言至少 2 个文件，共 10 个）
  └─ 识别样板代码模式（如 create-react-app 脚手架）

Step 3: AI 分析
  ├─ 构建结构化 Prompt（仓库信息 + 代码样本 + 提交分析）
  ├─ 调用 Claude API（支持自定义 Base URL 和模型）
  ├─ 解析 JSON 结构化输出
  └─ 存入 SQLite 数据库

Step 4: 变更检测（增量分析时）
  ├─ 对比新旧分析结果
  ├─ 检测新增技术栈、新增贡献、架构变化
  └─ 如有显著变化，生成改进建议
```

**提交分析：**
- 自动分类提交信息：功能（feat）、修复（fix）、重构（refactor）、其他
- 统计个人提交占比
- 提取提交关键词作为分析参考

**关键代码：** [`server/services/analyzer.js`](server/services/analyzer.js)

![分析结果页面](docs/screenshots/05-analysis.png)

---

### 4. STAR 简历要点生成

基于仓库分析结果，AI 生成 3-5 条 STAR 格式的简历要点。每条包含：

| 字段 | 说明 |
|------|------|
| **Situation** | 项目背景（1 句话） |
| **Task** | 需要完成的任务（1 句话） |
| **Action** | 采取的具体技术行动（1-2 句话） |
| **Result** | 量化或定性的成果（1 句话） |
| **Skills** | 涉及的技能标签 |
| **Tags** | 内容分类标签 |

**STAR 素材库管理：**
- **双栏网格布局：** 每条 STAR 以卡片形式展示
- **内联编辑：** 点击编辑按钮直接修改 S/T/A/R 各字段
- **启用/停用：** 通过开关控制哪些素材参与简历生成
- **反馈机制：** 点赞/踩，AI 根据反馈生成改进版本
- **搜索过滤：** 支持全文搜索，可按"全部/已启用/已停用"筛选
- **技能标签：** 每条素材自动标记 skills 和 tags，便于后续匹配
- **来源标注：** 每条素材显示来源仓库名称

**反馈迭代流程：**
```
用户对某条 STAR 点击 👎
    → 记录反馈值到数据库
    → AI 根据反馈生成改进版本
    → 用户可选择采纳或忽略
```

**关键代码：** [`server/services/starGenerator.js`](server/services/starGenerator.js)

![STAR 素材库](docs/screenshots/06-star-points.png)

![STAR 卡片编辑态](docs/screenshots/07-star-edit.png)

---

### 5. JD 智能匹配与简历重写

输入目标岗位的 JD（职位描述），AI 自动完成两步匹配：

**第一步：项目筛选**
```
所有 STAR 素材（按仓库分组）
    → AI 评估每个项目与 JD 的相关性
    → 选出最匹配的 2-3 个项目
    → 给出每个项目的选中理由
    → 提供整体展示策略
```

**第二步：STAR 重写**
```
选中的 STAR 要点
    → AI 针对性重写以最大化关键词对齐
    → 保持事实准确性（不编造成就）
    → 调整技术深度匹配岗位级别
    → 输出优化前后对比
```

**匹配报告：**
- **覆盖率仪表盘：** SVG 环形图直观展示匹配程度（绿/黄/红三档）
- **匹配关键词：** 绿色标签展示 JD 中已覆盖的关键词
- **缺失关键词：** 黄色标签展示 JD 中未覆盖的关键词
- **改进建议：** AI 给出具体的优化方向
- **历史记录：** 保存所有匹配历史，支持回看和删除

![JD 匹配输入](docs/screenshots/08-jd-input.png)

![匹配结果](docs/screenshots/09-match-result.png)

---

### 6. 跨仓库技能画像合成

综合分析所有已分析仓库的 STAR 要点，AI 提取统一的技能画像：

**三个维度：**

| 维度 | 说明 | 示例 |
|------|------|------|
| **核心优势** | 经 AI 提炼的核心竞争力标签 | `"全栈开发"` `"系统设计"` `"性能优化"` |
| **技能详情** | 每项技能的名称、分类、熟练度、证据 | `React - 前端 - 高级 - 在4个项目中用于 SPA 开发` |
| **技术栈模式** | 反复出现的技术组合 | `"全栈 Web 开发：React + Node.js + PostgreSQL" ×3` |

**熟练度算法：**
- 入门（1 个项目中出现）
- 中级（2-3 个项目）
- 高级（4 个以上项目）

**缓存机制：** 24 小时内重复请求直接返回缓存结果，避免重复 API 调用。

![技能画像](docs/screenshots/10-skill-profile.png)

---

### 7. 智能简历编辑器

一个完整的所见即所得简历编辑器，支持丰富的编辑功能：

**模块管理系统：**
- 可自由开启/关闭以下模块：个人信息、教育经历、工作经历、实习经历、项目经历、专业技能、证书荣誉、自我评价
- "个人信息"为必选项，其余均可按需开关
- 关闭的模块不会出现在预览和导出中

**各模块编辑能力：**

| 模块 | 字段 | 特色功能 |
|------|------|----------|
| **个人信息** | 姓名、求职意向、手机、邮箱、城市、网站、简介 | 证件照上传（支持 JPG/PNG，最大 2MB） |
| **教育经历** | 学校、学历、专业、GPA、时间段、描述 | AI 润色描述 |
| **工作经历** | 公司、职位、时间段、描述、成就列表 | AI 润色 + 动态添加成就条目 |
| **实习经历** | 同工作经历 | 同工作经历 |
| **项目经历** | 项目名、角色、时间段、技术栈、描述、成就列表 | AI 润色 + 技术栈单独字段 |
| **专业技能** | 技能标签列表 | 回车添加，标签形式展示 |
| **证书荣誉** | 证书名称、颁发机构、获得时间 | 支持多条 |
| **自我评价** | 自由文本 | AI 润色 |

**AI 润色功能：**
编辑器中每个文本输入框旁都有"AI 润色"按钮，点击后 AI 会优化文本表达，使其更适合简历场景。支持上下文感知（如"教育经历 - XX大学 计算机专业"）。

**6 套简历模板：**

| 模板 | ID | 风格描述 | 适用场景 |
|------|-----|----------|----------|
| 现代极简 | `modern` | 左右双栏，浅灰侧边栏，柔和阴影卡片 | 科技 / 设计 / 产品 |
| 优雅传统 | `classic` | 居中大标题，深红分隔线，衬线字体 | 金融 / 法律 / 行政 |
| 色彩创意 | `fresh` | 紫蓝渐变侧边栏，彩色标签，圆角卡片 | 市场营销 / 艺术 / 媒体 |
| 侧边栏深色 | `tech` | 深紫黑色侧边栏，技能进度条，等宽字体 | 工程师 / 开发 / 创业 |
| 卡片北欧风 | `executive` | 独立卡片布局，柔和蓝配色，暖米色点缀 | 产品经理 / 运营 / 咨询 |
| 极简一页 | `minimalist` | 大留白，无卡片无阴影，墨蓝强调色 | 应届生 / 自由职业 |

**技术实现：**
- React Context + useReducer 管理全局简历状态（[`src/store/ResumeContext.jsx`](src/store/ResumeContext.jsx)）
- 每个模板为独立 React 组件（[`src/components/templates/`](src/components/templates/)），纯 inline style 保证导出一致性
- 编辑器与预览器通过同一个 Context 实时同步，切换模板即时生效
- 多字体支持：Inter、Noto Sans SC、Merriweather、Outfit、Poppins、Space Grotesk

![简历编辑器](docs/screenshots/11-editor.png)

![模板展示](docs/screenshots/12-templates.png)

![AI 润色](docs/screenshots/13-ai-polish.png)

---

### 8. AI 对话助手

内置多阶段 AI Agent 聊天面板，提供两种使用模式：

**模式一：引导式填写**
Agent 按阶段逐步引导用户填写简历信息：

```
选择模板 → 个人信息 → 教育经历 → 工作经历 → 实习经历
    → 项目经历 → 专业技能 → 证书荣誉 → 自我评价 → 完成
```

每个阶段：
- AI 提供清晰的问题引导
- 提供快捷选项按钮（如"本科/硕士/博士"、"跳过"）
- 用户输入自然语言后，AI 自动提取结构化数据并填入编辑器
- 支持模糊输入（如"北大本科计算机 2020-2024 GPA 3.8"）

**模式二：自由对话**
填写完成后切换为自由对话模式，可以：
- 请求修改某段描述
- 让 AI 帮你润色特定内容
- 询问简历优化建议
- 任何关于简历的问题

**文件上传解析：**
支持上传已有简历文件，AI 自动解析并填入编辑器：
- **PDF 文件：** 使用 `pdfjs-dist` 解析文本
- **Word 文件：** 使用 `mammoth` 提取内容
- **图片文件：** AI 视觉识别简历内容
- **文本/Markdown：** 直接解析

支持的格式：`.pdf` `.docx` `.doc` `.jpg` `.jpeg` `.png` `.webp` `.txt` `.md`

**聊天界面特性：**
- 支持全屏/小窗切换
- Markdown 渲染（支持加粗、列表等）
- 打字动画效果
- 选项按钮支持点击和手动输入

![AI 对话助手](docs/screenshots/14-ai-chat.png)

![文件上传解析](docs/screenshots/15-file-upload.png)

---

### 9. 多格式导出系统

支持 7 种导出方式，覆盖主流简历投递渠道：

| 格式 | 说明 | 实现技术 |
|------|------|----------|
| **PDF** | 高保真 PDF，所见即所得 | `html2canvas` + `jsPDF` |
| **Word (.docx)** | 结构化 Word 文档 | `docx` 库 |
| **JSON Resume** | 行业标准 JSON 格式，可导入其他简历工具 | 自定义序列化 |
| **Markdown** | Markdown 格式，适合 GitHub/博客 | 自定义序列化 |
| **GitHub PR** | 自动创建 PR 更新简历仓库 | Octokit API |
| **Notion** | 推送到 Notion 页面 | Notion API |
| **飞书** | 推送到飞书文档 | 飞书 API |

**PDF 导出细节：**
- 将预览区域通过 `html2canvas` 渲染为 Canvas
- 使用 `jsPDF` 将 Canvas 转为 A4 尺寸 PDF
- 自动处理模板缩放比例
- 导出时临时移除 transform 以保证正确渲染

**Word 导出细节：**
- 从简历数据结构直接构建 `docx` Document 对象
- 支持自定义字体、字号、间距
- 分节排版：个人信息、教育、工作、项目、技能等

![导出页面](docs/screenshots/16-export.png)

---

### 10. 面试准备

AI 根据你的 STAR 要点和项目分析，生成针对性的面试准备材料：

**生成内容：**
- **5 道面试题：** 覆盖技术面、行为面、系统设计三类
- **回答要点：** 基于实际代码和提交的建议回答
- **追问列表：** 面试官可能的深入追问

**题型分类：**

| 类型 | 图标 | 说明 |
|------|------|------|
| 技术 (technical) | 代码图标 | 技术实现细节、架构选择 |
| 行为 (behavioral) | 人员图标 | 团队协作、问题解决方式 |
| 系统设计 (system-design) | 分层图标 | 系统架构、可扩展性设计 |

**使用方式：**
1. 从下拉菜单选择一个已分析的仓库
2. 点击"生成面试题"
3. 点击题目卡片展开查看回答要点和追问
4. 历史记录支持回看

![面试准备](docs/screenshots/17-interview.png)

---

### 11. Webhook 自动同步

配置 GitHub Webhook 后，每次 `push` 事件自动触发仓库重新分析：

```
GitHub push event → Webhook → 后端接收
    → 60 秒防抖等待（避免频繁推送触发多次分析）
    → 检查仓库是否开启了关注
    → 自动执行完整 Pipeline（分析 → STAR 生成 → 变更检测）
    → 如有显著变化，生成改进建议
```

**变更检测维度：**
- 新增技术栈
- 新增个人贡献
- 架构设计变化

---

### 12. Agent 日志

完整的操作日志记录，支持追踪每次 AI 操作的状态：

- 分析开始/完成/失败
- STAR 生成记录
- JD 匹配记录
- 反馈记录
- 技能合成记录
- 面试题生成记录

![Agent 日志](docs/screenshots/18-logs.png)

---

## 技术架构

### 整体架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (React 18)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ AppContext    │  │ ResumeContext│  │  Views                  │ │
│  │ (全局状态)    │  │ (简历状态)   │  │  Dashboard / Editor /   │ │
│  │ 用户/仓库/   │  │ 简历数据/    │  │  STAR / Matcher /       │ │
│  │ STAR/匹配    │  │ 模板/章节    │  │  Skills / Interview     │ │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘ │
│  Vite 6 + Tailwind CSS 3 + Lucide React + React Hot Toast       │
├──────────────────────────────────────────────────────────────────┤
│                    Vite Dev Proxy (/api → :3001)                  │
├──────────────────────────────────────────────────────────────────┤
│                      Backend (Express 5)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Agent Orchestrator                        │ │
│  │  fullPipeline() = analyze → STAR → change detection         │ │
│  │  matchJob()     = project select → rewrite                  │ │
│  │  synthesizeSkills() = cross-repo skill extraction           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Analyzer  │  │ STAR Gen  │  │ Job Match │  │ AI Client    │ │
│  │ 代码采样  │  │ 要点生成  │  │ JD 匹配   │  │ Claude API   │ │
│  │ 提交分析  │  │ 反馈迭代  │  │ 重写优化  │  │ 重试+超时    │ │
│  └───────────┘  └───────────┘  └───────────┘  └──────────────┘ │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ GitHub    │  │ SQLite    │  │ Webhook   │  │ Scheduler    │ │
│  │ Octokit   │  │ sql.js    │  │ 60s 防抖  │  │ node-cron    │ │
│  └───────────┘  └───────────┘  └───────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 技术栈详解

| 层级 | 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|------|----------|
| **前端框架** | React | 18.3 | SPA | 组件化开发，生态成熟 |
| **构建工具** | Vite | 6.0 | HMR + 构建 | 极速热更新，原生 ESM |
| **CSS 框架** | Tailwind CSS | 3.4 | 原子化样式 | 快速原型，一致性好 |
| **状态管理** | React Context | - | 全局状态 | 轻量级，无需额外依赖 |
| **图标库** | Lucide React | 0.468 | 一致图标系统 | 树摇优化，风格统一 |
| **通知** | React Hot Toast | 2.5 | 消息提示 | 非侵入式，可定制 |
| **Markdown** | React Markdown | 9.0 | 聊天消息渲染 | GFM 支持 |
| **AI 引擎** | Anthropic API | - | 代码分析/生成 | Claude 模型，结构化输出 |
| **GitHub** | Octokit REST | 22.0 | 仓库数据 | 官方 SDK，API 完整 |
| **后端框架** | Express | 5.2 | RESTful API | 成熟稳定 |
| **数据库** | sql.js | 1.14 | 嵌入式 SQLite | 零配置，浏览器兼容 |
| **认证** | JWT | - | Token 鉴权 | 无状态，跨域友好 |
| **定时任务** | node-cron | 4.2 | 周期扫描 | cron 表达式，轻量 |
| **PDF** | html2canvas + jsPDF | - | PDF 导出 | 前端渲染，高保真 |
| **Word** | docx | 9.1 | Word 导出 | 纯 JS 生成 .docx |
| **PDF 解析** | pdfjs-dist | 4.9 | 上传 PDF 解析 | Mozilla 官方 |
| **Word 解析** | mammoth | 1.8 | 上传 Word 解析 | HTML 转换质量好 |
| **Notion** | @notionhq/client | 5.22 | Notion 集成 | 官方 SDK |
| **并发** | concurrently | 10.0 | 前后端并行启动 | 开发体验 |

---

## 项目结构

```
Repo2STAR/
├── server/                              # 后端服务
│   ├── index.js                         # Express 入口，路由注册，生产模式静态文件服务
│   ├── start.js                         # 启动脚本（加载 .env 环境变量）
│   ├── agent/
│   │   └── orchestrator.js              # Agent 编排器 —— 核心 Pipeline 控制器
│   ├── db/
│   │   └── schema.js                    # SQLite 初始化 + 11 张表建表语句
│   ├── middleware/
│   │   └── auth.js                      # JWT Token 验证中间件
│   ├── routes/
│   │   ├── auth.js                      # GitHub OAuth 登录 + 回调 + 用户信息
│   │   ├── repos.js                     # 仓库 CRUD + 导入 + 关注切换
│   │   ├── analysis.js                  # 触发分析 + 查看分析结果
│   │   ├── jobs.js                      # JD 匹配 + 历史记录
│   │   ├── export.js                    # JSON Resume / Markdown / PR / Notion 导出
│   │   ├── webhooks.js                  # GitHub Webhook 接收端点
│   │   └── settings.js                  # 用户设置 CRUD
│   └── services/
│       ├── aiClient.js                  # Claude API 封装（重试 3 次，120s 超时，429 限流处理）
│       ├── analyzer.js                  # 仓库分析引擎（数据采集 → 智能采样 → AI 分析）
│       ├── github.js                    # GitHub API 封装（Octokit，30+ 方法）
│       ├── integrations.js              # 第三方集成（Notion 等）
│       ├── jobMatcher.js                # JD 匹配（项目选择）+ 面试题生成
│       ├── scheduler.js                 # node-cron 定时任务（周期扫描仓库）
│       └── starGenerator.js             # STAR 生成 + 重写 + 改进 + 技能合成
│
├── src/                                 # 前端源码
│   ├── App.jsx                          # 根组件 + 页面路由
│   ├── main.jsx                         # React 入口
│   ├── index.css                        # 全局样式
│   ├── components/
│   │   ├── AgentChat.jsx                # AI 对话助手（多阶段引导 + 文件上传 + 自由对话）
│   │   ├── AgentLogView.jsx             # Agent 操作日志
│   │   ├── ExportView.jsx               # 多格式导出面板
│   │   ├── InterviewPrepView.jsx        # 面试准备
│   │   ├── JobMatcherView.jsx           # JD 匹配
│   │   ├── Navbar.jsx                   # 顶部导航栏
│   │   ├── RepoOverview.jsx             # 仓库总览
│   │   ├── ResumeEditor.jsx             # 简历编辑器（8 个模块 + AI 润色）
│   │   ├── ResumePreview.jsx            # 简历实时预览
│   │   ├── SettingsView.jsx             # 设置页
│   │   ├── Sidebar.jsx                  # 侧边栏导航
│   │   ├── SkillProfileView.jsx         # 技能画像
│   │   ├── StarPointsView.jsx           # STAR 素材库
│   │   ├── TemplateSelector.jsx         # 模板选择器
│   │   └── templates/                   # 6 套简历模板
│   │       ├── ClassicTemplate.jsx
│   │       ├── ExecutiveTemplate.jsx
│   │       ├── FreshTemplate.jsx
│   │       ├── MinimalistTemplate.jsx
│   │       ├── ModernTemplate.jsx
│   │       └── TechTemplate.jsx
│   ├── data/
│   │   ├── defaultResume.js             # 默认简历数据结构
│   │   └── templates.js                 # 模板注册表
│   ├── pages/
│   │   ├── Dashboard.jsx                # 主控制台
│   │   └── LoginPage.jsx                # 登录页
│   ├── services/
│   │   ├── api.js                       # 前端 API 封装
│   │   ├── exportDocx.js               # Word 导出
│   │   ├── exportPdf.js                # PDF 导出
│   │   ├── fileParser.js               # 文件解析
│   │   └── mimoApi.js                  # MiMo API 适配 + AI 润色
│   └── store/
│       ├── AppContext.jsx               # 全局应用状态
│       └── ResumeContext.jsx            # 简历编辑状态
│
├── data/                                # SQLite 数据库（gitignore）
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── .gitignore
```

---

## 数据库设计

使用 sql.js（纯 JS SQLite）作为嵌入式数据库，共 11 张表：

```
┌─────────────────┐       ┌──────────────────┐
│     users        │       │      repos        │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │──┐    │ id (PK)          │──┐
│ github_id       │  │    │ user_id (FK)     │  │
│ login           │  │    │ github_repo_id   │  │
│ name            │  │    │ full_name        │  │
│ avatar_url      │  │    │ description      │  │
│ access_token    │  │    │ language         │  │
│ created_at      │  │    │ is_watching      │  │
│ updated_at      │  │    │ last_analyzed_at │  │
└─────────────────┘  │    └──────────────────┘  │
                     │                           │
                     │    ┌──────────────────┐   │
                     │    │    analyses       │   │
                     │    ├──────────────────┤   │
                     │    │ id (PK)          │   │
                     │    │ repo_id (FK) ────│───┤
                     │    │ status           │   │
                     │    │ tech_stack       │   │
                     │    │ architecture     │   │
                     │    │ core_logic       │   │
                     │    │ personal_contrib │   │
                     │    │ commit_summary   │   │
                     │    └──────────────────┘   │
                     │                           │
                     │    ┌──────────────────┐   │
                     │    │  star_points      │   │
                     │    ├──────────────────┤   │
                     │    │ id (PK)          │   │
                     │    │ repo_id (FK) ────│───┤
                     │    │ analysis_id (FK) │   │
                     │    │ situation        │   │
                     │    │ task             │   │
                     │    │ action           │   │
                     │    │ result           │   │
                     │    │ skills (JSON)    │   │
                     │    │ tags (JSON)      │   │
                     │    │ is_active        │   │
                     │    │ feedback         │   │
                     │    └──────────────────┘   │
                     │                           │
                     │    ┌──────────────────┐   │
                     │    │  job_matches      │   │
                     │    ├──────────────────┤   │
                     │    │ id (PK)          │   │
                     │    │ user_id (FK) ────│───┘
                     │    │ jd_text          │
                     │    │ jd_title         │
                     │    │ jd_company       │
                     │    │ matched_points   │
                     │    │ rewritten_points │
                     │    │ coverage_score   │
                     │    └──────────────────┘
                     │
                     │    ┌──────────────────┐
                     │    │  skill_profiles   │
                     │    ├──────────────────┤
                     │    │ user_id (FK)     │
                     │    │ profile_json     │
                     │    │ analysis_count   │
                     │    └──────────────────┘
                     │
                     │    ┌──────────────────┐
                     │    │  interview_prep   │
                     │    ├──────────────────┤
                     │    │ repo_id (FK)     │
                     │    │ user_id (FK)     │
                     │    │ questions_json   │
                     │    └──────────────────┘
                     │
                     │    ┌──────────────────┐
                     │    │   suggestions     │
                     │    ├──────────────────┤
                     │    │ repo_id (FK)     │
                     │    │ user_id (FK)     │
                     │    │ change_summary   │
                     │    │ status           │
                     │    └──────────────────┘
                     │
                     │    ┌──────────────────┐
                     │    │   agent_logs      │
                     │    ├──────────────────┤
                     │    │ user_id (FK)     │
                     │    │ action           │
                     │    │ detail           │
                     │    │ status           │
                     │    └──────────────────┘
                     │
                     │    ┌──────────────────┐
                     └────│  user_settings    │
                          ├──────────────────┤
                          │ user_id (FK)     │
                          │ key              │
                          │ value            │
                          └──────────────────┘
```

---

## API 路由总览

| 方法 | 路径 | 说明 |
|------|------|------|
| **认证** | | |
| GET | `/api/auth/github` | 获取 GitHub OAuth 跳转 URL |
| GET | `/api/auth/callback` | GitHub OAuth 回调，交换 Token |
| GET | `/api/auth/me` | 获取当前用户信息 |
| **仓库** | | |
| GET | `/api/repos` | 获取已管理的仓库列表 |
| GET | `/api/repos/github` | 获取 GitHub 全部仓库 |
| POST | `/api/repos/import` | 批量导入仓库 |
| PUT | `/api/repos/:id/watch` | 切换关注状态 |
| DELETE | `/api/repos/:id` | 移除仓库 |
| **分析** | | |
| POST | `/api/analysis/:repoId` | 触发仓库分析（完整 Pipeline） |
| GET | `/api/analysis/:repoId` | 获取仓库分析结果 |
| **STAR** | | |
| GET | `/api/repos/star-points` | 获取所有 STAR 素材 |
| PUT | `/api/repos/star-points/:id` | 更新 STAR 素材 |
| PUT | `/api/repos/star-points/:id/toggle` | 启用/停用 STAR |
| POST | `/api/repos/star-points/:id/feedback` | 提交反馈 |
| **JD 匹配** | | |
| POST | `/api/jobs/match` | 执行 JD 匹配 |
| GET | `/api/jobs/matches` | 获取匹配历史 |
| DELETE | `/api/jobs/matches/:id` | 删除匹配记录 |
| **技能画像** | | |
| GET | `/api/repos/skill-profile` | 获取技能画像 |
| **面试准备** | | |
| POST | `/api/repos/:repoId/interview-prep` | 生成面试题 |
| GET | `/api/repos/interview-preps` | 获取面试题历史 |
| **导出** | | |
| GET | `/api/export/jsonresume` | 导出 JSON Resume |
| GET | `/api/export/markdown` | 导出 Markdown |
| POST | `/api/export/pr` | 创建 GitHub PR |
| POST | `/api/export/push/:target` | 推送到 Notion/飞书 |
| **Webhook** | | |
| POST | `/api/webhooks/github` | GitHub Webhook 接收 |
| **设置** | | |
| GET | `/api/settings` | 获取用户设置 |
| PUT | `/api/settings` | 更新用户设置 |
| **系统** | | |
| GET | `/api/health` | 健康检查 |

---

## 快速开始

### 前置条件

- **Node.js** >= 18
- **npm** >= 9
- **GitHub 账号**（用于 OAuth 和仓库访问）
- **Anthropic API Key**（用于 AI 分析）

### 1. 克隆项目

```bash
git clone https://github.com/a805026135/Repo2STAR.git
cd Repo2STAR
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# ===== 必填 =====
GITHUB_CLIENT_ID=your_github_client_id          # GitHub OAuth App ID
GITHUB_CLIENT_SECRET=your_github_client_secret  # GitHub OAuth App Secret
ANTHROPIC_API_KEY=your_anthropic_api_key        # Claude API 密钥
JWT_SECRET=change-this-to-a-random-secret       # JWT 签名密钥（任意随机字符串）
GITHUB_WEBHOOK_SECRET=change-this-webhook-secret # GitHub Webhook 密钥

# ===== 可选 =====
NOTION_API_KEY=                                 # Notion 集成密钥
ANTHROPIC_BASE_URL=https://api.anthropic.com    # 自定义 AI API 地址
AI_MODEL=claude-sonnet-4-6-20250514             # 自定义模型名称
FRONTEND_URL=http://localhost:5173              # 前端地址
API_URL=http://localhost:3001                   # 后端地址
PORT=3001                                       # 后端端口
```

### 4. 创建 GitHub OAuth App

1. 前往 [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. 点击 **New OAuth App**
3. 填写信息：
   - **Application name:** `Repo2STAR`
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `http://localhost:3001/api/auth/callback`
4. 创建后复制 **Client ID** 和 **Client Secret** 到 `.env`
5. （可选）在 OAuth App 设置中创建 Webhook 密钥

### 5. 启动开发服务器

```bash
npm run dev
```

同时启动：
- **前端：** Vite Dev Server → `http://localhost:5173`（HMR 热更新）
- **后端：** Express Server → `http://localhost:3001`

Vite 自动代理 `/api` 请求到后端，开发时无需处理跨域。

### 6. 打开浏览器

访问 `http://localhost:5173`，点击"使用 GitHub 登录"即可开始。

---

## 使用流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        完整使用流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ① GitHub 登录                                                  │
│     └→ 授权后自动获取仓库列表                                    │
│                                                                 │
│  ② 导入仓库                                                     │
│     └→ 勾选要分析的仓库 → 批量导入                               │
│                                                                 │
│  ③ AI 分析                                                      │
│     └→ 点击"分析" → 等待 AI 深度理解代码                         │
│                                                                 │
│  ④ 查看 STAR 素材                                               │
│     └→ 查看/编辑/反馈 AI 生成的简历要点                          │
│                                                                 │
│  ⑤ [可选] JD 匹配                                               │
│     └→ 粘贴目标岗位 JD → AI 筛选项目 + 重写 STAR                 │
│                                                                 │
│  ⑥ 编辑简历                                                     │
│     └→ 选择模板 → 填写/修改各模块 → AI 润色                      │
│     └→ 或使用 AI 助手引导式填写 / 上传已有简历文件               │
│                                                                 │
│  ⑦ 导出投递                                                     │
│     └→ PDF / Word / JSON / Markdown / PR / Notion / 飞书        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 脚本命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动前端 + 后端开发服务器 |
| `npm run dev:frontend` | 仅启动前端（Vite，端口 5173） |
| `npm run dev:server` | 仅启动后端（Express，端口 3001） |
| `npm run build` | 构建生产版本到 `dist/` 目录 |
| `npm run preview` | 预览生产构建 |

---

## 截图指南

截好的图片放入 `docs/screenshots/` 目录，按以下文件名命名：

| 序号 | 文件名 | 截图内容 | 截图位置 |
|------|--------|----------|----------|
| 01 | `01-login.png` | 登录首页：显示 Repo2STAR 标题、"使用 GitHub 登录"按钮、三个功能介绍卡片 | 打开 `localhost:5173` 未登录时的页面 |
| 02 | `02-dashboard.png` | 控制台总览：登录后的主界面，左侧侧边栏 + 右侧仓库卡片网格 + 顶部导航栏 | 登录后默认页面 |
| 03 | `03-repos.png` | 仓库管理页面：展示了已导入的仓库卡片（含语言、Star 数、分析次数等） | 登录并导入几个仓库后 |
| 04 | `04-import-repos.png` | 导入仓库弹窗：显示 GitHub 仓库列表，带勾选框，底部有"已选择 N 个"和导入按钮 | 点击"导入仓库"按钮后的弹窗 |
| 05 | `05-analysis.png` | 分析结果：某个仓库分析完成后的详情，包含技术栈、架构描述、个人贡献等 | 分析一个仓库后查看结果 |
| 06 | `06-star-points.png` | STAR 素材库：双栏卡片布局，每张卡片显示 S/T/A/R 四个字段，带编辑/反馈按钮 | 侧边栏点击"STAR素材库" |
| 07 | `07-star-edit.png` | STAR 编辑态：某张 STAR 卡片展开编辑模式，textarea 可编辑，底部有保存/取消按钮 | 点击某张 STAR 卡片的"编辑"按钮 |
| 08 | `08-jd-input.png` | JD 匹配输入：职位名称、公司名称输入框 + 大文本 JD 输入框 + "开始匹配"按钮 | 侧边栏点击"岗位匹配" |
| 09 | `09-match-result.png` | 匹配结果：覆盖率环形仪表盘 + 匹配/缺失关键词标签 + 优化后的 STAR 素材 | 输入 JD 并点击匹配后 |
| 10 | `10-skill-profile.png` | 技能画像：核心优势标签 + 技能详情网格（含进度条）+ 技术栈模式标签 | 侧边栏点击"技能画像" |
| 11 | `11-editor.png` | 简历编辑器：左侧编辑面板（个人信息/教育/工作等模块）+ 右侧简历实时预览 | 侧边栏点击"简历编辑器" |
| 12 | `12-templates.png` | 模板展示：编辑器中切换到"模板"标签页，显示 6 套模板的选择界面 | 编辑器顶部点击"模板"标签 |
| 13 | `13-ai-polish.png` | AI 润色：编辑器中某个文本框下方的"AI 润色"按钮，以及润色后的效果 | 在任意文本框点击"AI 润色" |
| 14 | `14-ai-chat.png` | AI 对话助手：右下角弹出的聊天面板，显示欢迎消息和模板选项按钮 | 编辑器中点击右上角"AI 助手"按钮 |
| 15 | `15-file-upload.png` | 文件上传解析：聊天中上传简历文件后，AI 返回解析出的简历信息摘要 | 在 AI 助手中上传一个 PDF/Word 文件 |
| 16 | `16-export.png` | 导出页面：5 个导出卡片（JSON Resume / Markdown / GitHub PR / Notion / 飞书） | 侧边栏点击"导出" |
| 17 | `17-interview.png` | 面试准备：选择仓库下拉框 + 生成的面试题卡片列表，某张卡片展开显示回答要点 | 侧边栏点击"面试准备"，生成面试题后 |
| 18 | `18-logs.png` | Agent 日志：操作日志列表，每条显示时间、操作类型、详情和状态 | 侧边栏点击"Agent日志" |

**截图建议：**
- 使用 **1280x800** 或 **1440x900** 分辨率的浏览器窗口
- 使用 **PNG** 格式保证清晰度
- 截图前确保页面有实际数据（导入仓库、完成分析后再截图）
- 避免截到敏感信息（API Key、真实 Token 等）

---

## License

MIT
