const API_KEY = 'tp-ce0haj98gsrzb2pjf05rbhfzpjmnuufb9o4vii1zfifhjsdv';
const BASE_URL = '/mimo-api';
const MODEL = 'mimo-v2.5-pro';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callWithRetry(messages, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Ensure messages content is properly formatted
      // String content stays as string, array content (multimodal blocks) stays as array
      const formattedMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: options.maxTokens ?? 2048,
          messages: formattedMessages,
          ...(options.system ? { system: options.system } : {}),
        }),
      });

      if (res.status === 429) {
        await sleep(1000 * (i + 1));
        continue;
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error ${res.status}: ${errText}`);
      }
      const data = await res.json();
      const textBlock = data.content?.find((b) => b.type === 'text');
      return textBlock?.text ?? '';
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(800 * (i + 1));
    }
  }
}

// AI润色简历内容
export async function polishText(text, context = '') {
  const system = `你是一位专业的简历润色专家。请根据以下规则优化简历内容：
1. 使用专业、简洁、有力的表达
2. 突出成果和量化数据（如适用）
3. 使用STAR法则（情境-任务-行动-结果）描述经历
4. 保持中文表达，去除冗余信息
5. 直接返回润色后的文本，不要解释

${context ? `上下文信息：${context}` : ''}`;

  return callWithRetry(
    [{ role: 'user', content: `请润色以下简历内容：\n\n${text}` }],
    { system, maxTokens: 1024 },
  );
}

// AI智能建议
export async function getSmartSuggestion(section, currentData) {
  const system = '你是一位简历顾问。根据用户提供的简历板块信息，给出具体的改进建议和示例内容。回复简洁实用。';

  return callWithRetry(
    [{ role: 'user', content: `板块：${section}\n当前内容：${JSON.stringify(currentData, null, 2)}\n\n请给出改进建议和优化示例。` }],
    { system, maxTokens: 1024 },
  );
}

// AI Agent 对话（用于引导用户制作简历）
export async function agentChat(messages) {
  const system = `你是ResumeAI智能助手，负责引导用户一步步完成简历制作。

你的工作流程：
1. 问候用户，询问选择模板还是先介绍自己
2. 如果用户选择模板，展示模板选项，用编号列出
3. 收集用户基本信息（姓名、职位、联系方式等）
4. 依次收集各模块信息（教育、工作、实习、项目、技能等）
5. 用户可以跳过任何模块
6. 最后生成简历并询问是否需要润色

规则：
- 回复简洁友好，每次只问1-2个问题
- 提供选项让用户选择，减少用户输入负担
- 用编号列表展示选项，用户可以输入编号或自定义内容
- 识别用户的意图，灵活调整流程
- 当用户提供信息时，确认收到并继续下一步`;

  return callWithRetry(messages, { system, maxTokens: 1024 });
}

// 根据用户输入提取简历数据
export async function extractResumeData(userInput, section) {
  const system = `你是一个简历信息提取器。从用户的自然语言描述中提取结构化数据。
只返回JSON，不要其他文字。

提取字段说明：
- personal: { name, title, phone, email, location, website, summary }
- education: [{ school, degree, major, startDate, endDate, gpa, description }]
- work/internship: [{ company, position, startDate, endDate, description, achievements:[] }]
- projects: [{ name, role, startDate, endDate, description, techStack, achievements:[] }]
- skills: string[]
- certificates: [{ name, issuer, date }]
- selfEval: string`;

  const result = await callWithRetry(
    [{ role: 'user', content: `请从以下内容中提取"${section}"部分的数据，返回JSON格式：\n\n${userInput}` }],
    { system, maxTokens: 1024 },
  );

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}

// 从上传的文件（文本/图片）中提取全部简历数据
export async function extractFromDocument(fileResult) {
  const system = `你是一个简历信息提取器。从上传的简历文件中提取所有可用的结构化数据。
只返回JSON，不要其他文字。尽量提取所有能找到的字段，找不到的留空字符串或空数组。

返回格式：
{
  "personal": { "name": "", "title": "", "phone": "", "email": "", "location": "", "website": "", "summary": "" },
  "education": [{ "school": "", "degree": "", "major": "", "startDate": "", "endDate": "", "gpa": "", "description": "" }],
  "work": [{ "company": "", "position": "", "startDate": "", "endDate": "", "description": "", "achievements": [""] }],
  "internship": [{ "company": "", "position": "", "startDate": "", "endDate": "", "description": "", "achievements": [""] }],
  "projects": [{ "name": "", "role": "", "startDate": "", "endDate": "", "description": "", "techStack": "", "achievements": [""] }],
  "skills": [],
  "certificates": [{ "name": "", "issuer": "", "date": "" }],
  "selfEval": ""
}`;

  let content;

  if (fileResult.type === 'image') {
    // Send image as multimodal content block (Anthropic vision format)
    const base64Data = fileResult.data.split(',')[1]; // strip data URL prefix
    const mediaType = fileResult.data.match(/data:(.*?);/)?.[1] || 'image/jpeg';
    content = [
      {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64Data },
      },
      {
        type: 'text',
        text: '请从这张简历图片中提取所有可用的结构化数据，返回JSON格式。',
      },
    ];
  } else {
    // Text content from PDF/DOCX/TXT
    content = [
      {
        type: 'text',
        text: `请从以下简历文本中提取所有可用的结构化数据，返回JSON格式：\n\n${fileResult.data}`,
      },
    ];
  }

  const result = await callWithRetry(
    [{ role: 'user', content }],
    { system, maxTokens: 4096 },
  );

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}
