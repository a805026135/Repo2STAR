import { callAI } from './aiClient.js';

const ZH_PREFIX = '【重要】请全部使用简体中文回答。所有文本内容必须是中文。\n\n';

export class StarGeneratorService {
  async generateStarPoints(analysis, repoInfo) {
    const prompt = `${ZH_PREFIX}你是一位世界顶级的简历撰写专家，专注于为技术人员撰写 STAR 格式的简历要点。

## 项目信息
- 仓库: ${repoInfo.full_name}
- 描述: ${repoInfo.description || '无'}
- 主要语言: ${repoInfo.language || '无'}

## 技术分析
- 技术栈: ${JSON.stringify(analysis.tech_stack)}
- 架构: ${analysis.architecture}
- 核心逻辑: ${analysis.core_logic}
- 个人贡献: ${JSON.stringify(analysis.personal_contributions)}
- 提交摘要: ${analysis.commit_summary}

## 任务
为这个项目生成 3-5 条 STAR 格式的简历要点。每条应该：
1. 具体且技术性强（提到实际使用的技术和方法）
2. 尽可能包含量化成果（性能提升、规模等）
3. 突出不同方面（架构、优化、问题解决等）
4. 适合软件工程简历
5. 避免泛泛而谈 —— 针对这个代码实际做了什么

用 JSON 格式回答：
{
  "star_points": [
    {
      "situation": "简要背景（1句话）",
      "task": "需要完成什么（1句话）",
      "action": "采取的具体技术行动（1-2句话）",
      "result": "量化或定性的成果（1句话）",
      "skills": ["技能1", "技能2"],
      "tags": ["标签1", "标签2"]
    }
  ]
}`;

    const text = await callAI([{ role: 'user', content: prompt }], { maxTokens: 4096 });
    return this.parseResult(text);
  }

  async rewriteForJob(starPoints, jdText, jdTitle) {
    const prompt = `${ZH_PREFIX}你是一位简历优化专家。请将以下 STAR 格式的简历要点重写，使其与目标岗位描述对齐，同时保持真实性。

## 目标岗位
职位: ${jdTitle || '软件工程师'}
JD: ${jdText.substring(0, 3000)}

## 当前 STAR 要点
${JSON.stringify(starPoints, null, 2)}

## 任务
1. 重写每条 STAR 要点以最大化与 JD 的关键词对齐
2. 强调相关技能和经验
3. 保持事实准确性 —— 不要编造成就
4. 调整技术深度以匹配岗位级别

用 JSON 格式回答：
{
  "rewritten_points": [
    {
      "original_id": ${starPoints[0]?.id || 'null'},
      "situation": "...",
      "task": "...",
      "action": "...",
      "result": "...",
      "skills": ["技能1"],
      "tags": ["标签1"]
    }
  ],
  "match_report": {
    "matched_keywords": ["关键词1", "关键词2"],
    "missing_keywords": ["关键词3"],
    "coverage_score": 0.85,
    "suggestions": ["建议1"]
  }
}`;

    const text = await callAI([{ role: 'user', content: prompt }], { maxTokens: 4096 });
    return this.parseResult(text);
  }

  async suggestImprovements(starPoint, feedback) {
    const prompt = `${ZH_PREFIX}根据用户反馈改进这条 STAR 简历要点。

## 当前 STAR 要点
${JSON.stringify(starPoint, null, 2)}

## 用户反馈
${feedback > 0 ? '用户喜欢这条 👍 —— 保持风格，生成一个类似的替代版本。' : '用户不喜欢这条 👎 —— 调整重点、语气或技术侧重点。'}

生成改进版本，用 JSON 格式：
{
  "star_point": {
    "situation": "...",
    "task": "...",
    "action": "...",
    "result": "...",
    "skills": [],
    "tags": []
  }
}`;

    const text = await callAI([{ role: 'user', content: prompt }], { maxTokens: 2048 });
    return this.parseResult(text);
  }

  async synthesizeCrossRepoSkills(allStarPoints, allAnalyses) {
    const prompt = `${ZH_PREFIX}你是一位职业画像专家。分析多个仓库中的所有项目经验，提取统一的技能画像。

## 所有 STAR 要点（来自多个项目）
${JSON.stringify(allStarPoints.map(sp => ({
      repo: sp.full_name || sp.repo_id,
      skills: JSON.parse(sp.skills || '[]'),
      tags: JSON.parse(sp.tags || '[]'),
      situation: sp.situation,
      action: sp.action,
    })), null, 2)}

## 所有项目分析
${JSON.stringify(allAnalyses.map(a => ({
      repo_id: a.repo_id,
      tech_stack: JSON.parse(a.tech_stack || '[]'),
      architecture: a.architecture,
    })), null, 2)}

## 任务
提取统一的技能画像：
1. 识别跨项目反复出现的技术技能（频率表示熟练度）
2. 发现技术模式和分组
3. 基于使用深度确定核心优势
4. 分配熟练度等级：入门（1个项目）、中级（2-3个）、高级（4个以上）

用 JSON 格式回答：
{
  "skills": [
    { "name": "Node.js", "category": "后端", "proficiency": "advanced", "evidence": "在4个项目中用于API开发" }
  ],
  "strengths": ["优势1", "优势2"],
  "tech_patterns": [
    { "pattern": "全栈Web开发", "technologies": ["React", "Node.js", "PostgreSQL"], "frequency": 3 }
  ]
}`;

    const text = await callAI([{ role: 'user', content: prompt }], { maxTokens: 4096 });
    return this.parseResult(text);
  }

  parseResult(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return { star_points: [], rewritten_points: [], match_report: null };
  }
}
