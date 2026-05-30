import { callAI } from './aiClient.js';

const ZH_PREFIX = '【重要】请全部使用简体中文回答。所有文本内容必须是中文。\n\n';

export class JobMatcherService {
  async selectBestProjects(allStarPoints, jdText, jdTitle) {
    const prompt = `${ZH_PREFIX}你是一位职业顾问。给定一个岗位描述和多个项目的 STAR 简历要点，选择 2-3 个最相关的项目并解释原因。

## 目标岗位
职位: ${jdTitle || '软件工程师'}
JD: ${jdText.substring(0, 2000)}

## 可用的 STAR 要点（按项目分组）
${JSON.stringify(allStarPoints, null, 2)}

用 JSON 格式回答：
{
  "selected_project_ids": [1, 2],
  "selection_reasons": {
    "1": "为什么这个项目相关",
    "2": "为什么这个项目相关"
  },
  "overall_strategy": "展示这些项目以匹配此 JD 的简要策略"
}`;

    const text = await callAI([{ role: 'user', content: prompt }], { maxTokens: 2048 });
    return this.parseResult(text);
  }

  async generateInterviewQuestions(starPoints, repoAnalysis) {
    const prompt = `${ZH_PREFIX}根据这些 STAR 简历要点和项目分析，生成面试准备材料。

## STAR 要点
${JSON.stringify(starPoints, null, 2)}

## 项目技术详情
${repoAnalysis?.architecture || '无'}
${repoAnalysis?.core_logic || '无'}

生成：
1. 面试官可能针对这些项目提出的 5 个面试问题
2. 基于实际代码/提交的建议回答要点

用 JSON 格式回答：
{
  "questions": [
    {
      "question": "面试问题文本",
      "category": "technical|behavioral|system-design",
      "answer_outline": "建议回答要点",
      "follow_ups": ["追问1"]
    }
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
    return {};
  }
}
