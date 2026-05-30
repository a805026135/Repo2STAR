import { useState, useRef, useEffect, useCallback } from 'react';
import { agentChat, extractResumeData, extractFromDocument } from '../services/mimoApi';
import { parseFile, getFileCategory } from '../services/fileParser';
import { useResume } from '../store/ResumeContext';
import { templates } from '../data/templates';
import { Send, Bot, User, Sparkles, Loader2, X, Maximize2, Minimize2, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const AGENT_STAGES = {
  WELCOME: 'welcome',
  TEMPLATE: 'template',
  PERSONAL: 'personal',
  EDUCATION: 'education',
  WORK: 'work',
  INTERNSHIP: 'internship',
  PROJECTS: 'projects',
  SKILLS: 'skills',
  CERTIFICATES: 'certificates',
  SELF_EVAL: 'selfEval',
  DONE: 'done',
};

const STAGE_QUESTIONS = {
  [AGENT_STAGES.PERSONAL]: '请告诉我你的基本信息：**姓名、求职意向、手机号、邮箱、所在城市**。\n\n可以直接一次性告诉我，也可以一个个来。',
  [AGENT_STAGES.EDUCATION]: '请告诉我你的**教育经历**：学校、学历、专业、GPA（选填）、在校时间。',
  [AGENT_STAGES.WORK]: '你有**工作经历**吗？如果有请告诉我公司、职位、时间和主要成就。',
  [AGENT_STAGES.INTERNSHIP]: '你有**实习经历**吗？如果有请告诉我公司、职位、时间和工作内容。',
  [AGENT_STAGES.PROJECTS]: '你有**项目经历**吗？请告诉我项目名称、角色、时间、技术栈和成果。',
  [AGENT_STAGES.SKILLS]: '你掌握了哪些**专业技能**？用逗号分隔即可，如：React, Python, 英语六级',
  [AGENT_STAGES.CERTIFICATES]: '你有哪些**证书或荣誉**？如：CET-6、竞赛获奖等。',
  [AGENT_STAGES.SELF_EVAL]: '最后，请用几句话总结你的**核心优势和职业特质**。',
};

// 每个阶段的快捷选项
const STAGE_OPTIONS = {
  [AGENT_STAGES.PERSONAL]: null, // 自由输入
  [AGENT_STAGES.EDUCATION]: ['本科', '硕士', '博士'],
  [AGENT_STAGES.WORK]: ['跳过，没有工作经历'],
  [AGENT_STAGES.INTERNSHIP]: ['跳过，没有实习经历'],
  [AGENT_STAGES.PROJECTS]: ['跳过，没有项目经历'],
  [AGENT_STAGES.SKILLS]: null,
  [AGENT_STAGES.CERTIFICATES]: ['跳过，暂无证书'],
  [AGENT_STAGES.SELF_EVAL]: ['跳过'],
};

const STAGE_ORDER = [
  AGENT_STAGES.TEMPLATE,
  AGENT_STAGES.PERSONAL,
  AGENT_STAGES.EDUCATION,
  AGENT_STAGES.WORK,
  AGENT_STAGES.INTERNSHIP,
  AGENT_STAGES.PROJECTS,
  AGENT_STAGES.SKILLS,
  AGENT_STAGES.CERTIFICATES,
  AGENT_STAGES.SELF_EVAL,
  AGENT_STAGES.DONE,
];

// 可点击的选项按钮
function OptionChips({ options, onSelect, disabled }) {
  if (!options || options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => !disabled && onSelect(opt.value)}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all
            bg-gray-800 text-indigo-400 border-gray-700 hover:bg-gray-700 hover:border-indigo-500 hover:shadow-sm
            disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function AgentChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(AGENT_STAGES.WELCOME);
  const [expanded, setExpanded] = useState(false);
  const [currentOptions, setCurrentOptions] = useState(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const { setTemplate, mergeResume, setActiveSection } = useResume();

  const addMessage = useCallback((role, content, options = null) => {
    setMessages((prev) => [...prev, { role, content, options, id: Date.now() + Math.random() }]);
    if (options) setCurrentOptions(options);
    else setCurrentOptions(null);
  }, []);

  const scrollBottom = useCallback(() => {
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  // Init welcome
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const templateOptions = templates.map((t) => ({
        label: t.name,
        value: t.name,
      }));
      templateOptions.push({ label: '先填信息，稍后选模板', value: '先填信息' });

      addMessage('assistant',
        `你好！我是 Repo2STAR 智能助手 👋\n\n我可以帮你：\n- 📋 **选择模板**并引导填写简历\n- 📎 **上传文件**（PDF/Word/图片）自动解析填入\n- ✨ **AI 润色**简历内容\n\n首先，你想用哪个模板？`,
        templateOptions,
      );
      setStage(AGENT_STAGES.TEMPLATE);
    }
  }, [isOpen]);

  useEffect(scrollBottom, [messages, scrollBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // 模糊匹配模板
  const matchTemplate = (text) => {
    const lower = text.toLowerCase();

    // 精确数字匹配
    const num = parseInt(text);
    if (num >= 1 && num <= templates.length) return templates[num - 1];

    // ID 匹配
    const byId = templates.find((t) => lower.includes(t.id));
    if (byId) return byId;

    // 关键词匹配映射
    const keywordMap = {
      '现代': 'modern', '极简': 'modern', '科技': 'modern', '双栏': 'modern', '设计': 'modern',
      '经典': 'classic', '传统': 'classic', '优雅': 'classic', '金融': 'classic', '法律': 'classic', '商务': 'classic', '行政': 'classic',
      '色彩': 'fresh', '创意': 'fresh', '渐变': 'fresh', '营销': 'fresh', '艺术': 'fresh', '媒体': 'fresh', '紫': 'fresh',
      '深色': 'tech', '侧边栏': 'tech', '程序员': 'tech', '工程师': 'tech', '开发': 'tech', '创业': 'tech', '代码': 'tech', '终端': 'tech',
      '卡片': 'executive', '北欧': 'executive', '产品': 'executive', '运营': 'executive', '咨询': 'executive', '管理': 'executive',
      '一页': 'minimalist', '留白': 'minimalist', '应届': 'minimalist', '简约': 'minimalist', '自由': 'minimalist', '黑白': 'minimalist',
      '现代极简': 'modern', '优雅传统': 'classic', '色彩创意': 'fresh', '侧边栏深色': 'tech', '卡片北欧': 'executive', '极简一页': 'minimalist',
    };

    for (const [keyword, id] of Object.entries(keywordMap)) {
      if (lower.includes(keyword)) return templates.find((t) => t.id === id);
    }

    // 名称模糊匹配
    const byName = templates.find((t) => t.name.includes(text.trim()));
    if (byName) return byName;

    return null;
  };

  const handleTemplateChoice = (text) => {
    if (text.includes('跳过') || text.includes('先填') || text.includes('稍后')) {
      addMessage('assistant', `好的，保持默认模板。接下来收集你的信息。\n\n${STAGE_QUESTIONS[AGENT_STAGES.PERSONAL]}`);
      setStage(AGENT_STAGES.PERSONAL);
      return true;
    }

    const tpl = matchTemplate(text);
    if (tpl) {
      setTemplate(tpl.id);
      addMessage('assistant', `已选择 **${tpl.name}** 模板！接下来收集你的个人信息。\n\n${STAGE_QUESTIONS[AGENT_STAGES.PERSONAL]}`);
      setStage(AGENT_STAGES.PERSONAL);
      setActiveSection('personal');
      return true;
    }

    addMessage('assistant', `没有找到匹配的模板，请点击选择或输入模板名称：`,
      templates.map((t) => ({ label: t.name, value: t.name })),
    );
    return true;
  };

  const handleSectionInput = async (text, currentStage) => {
    const sectionMap = {
      [AGENT_STAGES.PERSONAL]: 'personal',
      [AGENT_STAGES.EDUCATION]: 'education',
      [AGENT_STAGES.WORK]: 'work',
      [AGENT_STAGES.INTERNSHIP]: 'internship',
      [AGENT_STAGES.PROJECTS]: 'projects',
      [AGENT_STAGES.SKILLS]: 'skills',
      [AGENT_STAGES.CERTIFICATES]: 'certificates',
      [AGENT_STAGES.SELF_EVAL]: 'selfEval',
    };

    const sectionKey = sectionMap[currentStage];

    // Skip
    if (['跳过', '没有', '暂无', '无', '没有经历'].some((k) => text.includes(k)) && currentStage !== AGENT_STAGES.PERSONAL && currentStage !== AGENT_STAGES.SELF_EVAL) {
      advanceStage(currentStage);
      return;
    }

    // Skills as comma-separated list
    if (currentStage === AGENT_STAGES.SKILLS && !text.includes('{')) {
      const skills = text.split(/[,，、;；\n]+/).map((s) => s.trim()).filter(Boolean);
      mergeResume({ skills });
      const next = AGENT_STAGES.CERTIFICATES;
      addMessage('assistant', `已记录 ${skills.length} 项技能：${skills.map((s) => `**${s}**`).join('、')}\n\n${STAGE_QUESTIONS[next]}`,
        STAGE_OPTIONS[next]?.map((v) => ({ label: v, value: v })),
      );
      setStage(next);
      setActiveSection(next);
      return;
    }

    // Self eval
    if (currentStage === AGENT_STAGES.SELF_EVAL) {
      if (['跳过', '暂无', '没有'].some((k) => text.includes(k))) {
        addMessage('assistant', `简历信息收集完成！🎉\n\n你现在可以：\n- 右侧**预览**简历效果\n- 左侧编辑器**修改细节**\n- 点击 **AI润色** 优化内容\n- **导出** PDF 或 Word 文件\n\n有需要随时告诉我！`);
        setStage(AGENT_STAGES.DONE);
        return;
      }
      mergeResume({ selfEval: text });
      addMessage('assistant', `太棒了！简历信息已收集完成！🎉\n\n你现在可以：\n- 右侧**预览**简历效果\n- 左侧编辑器**修改细节**\n- 点击 **AI润色** 优化内容\n- **导出** PDF 或 Word 文件\n\n有需要随时告诉我！`);
      setStage(AGENT_STAGES.DONE);
      return;
    }

    // Use AI to extract structured data
    setLoading(true);
    try {
      const data = await extractResumeData(text, sectionKey);
      if (data) {
        const toMerge = {};
        toMerge[sectionKey] = Array.isArray(data) ? data : data[sectionKey] || data;
        if (Array.isArray(toMerge[sectionKey])) {
          toMerge[sectionKey] = toMerge[sectionKey].map((item) => ({
            id: crypto.randomUUID(),
            achievements: [''],
            ...item,
          }));
        }
        mergeResume(toMerge);
        const nextIdx = STAGE_ORDER.indexOf(currentStage) + 1;
        if (nextIdx < STAGE_ORDER.length) {
          const next = STAGE_ORDER[nextIdx];
          addMessage('assistant', `已记录你的信息！（AI 已自动提取整理）\n\n${STAGE_QUESTIONS[next]}`,
            STAGE_OPTIONS[next]?.map((v) => ({ label: v, value: v })),
          );
          setStage(next);
          setActiveSection(next === AGENT_STAGES.DONE ? 'personal' : next);
        }
      } else {
        addMessage('assistant', '抱歉，没能很好地理解。能否按以下格式描述？\n\n例如：**"XX大学，本科，计算机专业，2020-2024，GPA 3.8"**');
      }
    } catch (err) {
      toast.error('AI解析失败，已保存原始文本');
      if (currentStage === AGENT_STAGES.PERSONAL) {
        mergeResume({ personal: { summary: text } });
      } else if (currentStage === AGENT_STAGES.SELF_EVAL) {
        mergeResume({ selfEval: text });
      }
      advanceStage(currentStage);
    } finally {
      setLoading(false);
    }
  };

  const advanceStage = (currentStage) => {
    const idx = STAGE_ORDER.indexOf(currentStage);
    const next = STAGE_ORDER[idx + 1];
    if (next) {
      if (next === AGENT_STAGES.DONE) {
        addMessage('assistant', `简历信息收集完成！🎉 你现在可以预览和导出简历了。`);
      } else {
        addMessage('assistant', `好的，已跳过。\n\n${STAGE_QUESTIONS[next]}`,
          STAGE_OPTIONS[next]?.map((v) => ({ label: v, value: v })),
        );
      }
      setStage(next);
      setActiveSection(next === AGENT_STAGES.DONE ? 'personal' : next);
    }
  };

  const handleOptionSelect = (value) => {
    addMessage('user', value);
    if (stage === AGENT_STAGES.TEMPLATE) {
      handleTemplateChoice(value);
    } else {
      handleSectionInput(value, stage);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so the same file can be selected again
    e.target.value = '';

    const category = getFileCategory(file);
    const icon = category === 'image' ? '🖼️' : '📄';
    addMessage('user', `${icon} ${file.name}`);
    setLoading(true);
    addMessage('assistant', `正在解析 **${file.name}** ，请稍候...`);

    try {
      const fileResult = await parseFile(file);
      const data = await extractFromDocument(fileResult);

      if (data) {
        // Process arrays to add IDs
        const processed = { ...data };
        for (const key of ['education', 'work', 'internship', 'projects', 'certificates']) {
          if (Array.isArray(processed[key])) {
            processed[key] = processed[key].map((item) => ({
              id: crypto.randomUUID(),
              achievements: [''],
              ...item,
            }));
          }
        }
        // Filter out empty arrays and empty strings
        for (const [key, val] of Object.entries(processed)) {
          if (Array.isArray(val) && val.length === 0) delete processed[key];
          if (typeof val === 'string' && !val.trim()) delete processed[key];
        }

        mergeResume(processed);

        // Build summary of what was extracted
        const extracted = [];
        if (data.personal?.name) extracted.push(`姓名：${data.personal.name}`);
        if (data.education?.length) extracted.push(`教育经历：${data.education.length} 条`);
        if (data.work?.length) extracted.push(`工作经历：${data.work.length} 条`);
        if (data.internship?.length) extracted.push(`实习经历：${data.internship.length} 条`);
        if (data.projects?.length) extracted.push(`项目经历：${data.projects.length} 条`);
        if (data.skills?.length) extracted.push(`技能：${data.skills.length} 项`);
        if (data.certificates?.length) extracted.push(`证书：${data.certificates.length} 个`);
        if (data.selfEval) extracted.push('自我评价');

        addMessage('assistant',
          `文件解析完成！AI 已自动提取以下信息：\n\n${extracted.map((e) => `- ${e}`).join('\n')}\n\n你可以在左侧编辑器中修改细节，或继续告诉我需要调整的地方。`,
        );
        setStage(AGENT_STAGES.DONE);
        setActiveSection('personal');
      } else {
        addMessage('assistant', '抱歉，AI 未能从文件中提取到有效的简历信息。请尝试上传更清晰的文件，或手动输入信息。');
      }
    } catch (err) {
      toast.error('文件解析失败');
      addMessage('assistant', `文件解析出错：${err.message}\n\n请检查文件格式是否正确，或尝试其他格式。`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    addMessage('user', text);

    if (stage === AGENT_STAGES.TEMPLATE) {
      handleTemplateChoice(text);
      return;
    }

    if (stage === AGENT_STAGES.DONE) {
      setLoading(true);
      try {
        const chatHistory = [...messages, { role: 'user', content: text }].map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const reply = await agentChat(chatHistory);
        addMessage('assistant', reply);
      } catch (err) {
        addMessage('assistant', '抱歉，AI 服务暂时不可用，请稍后再试。');
      } finally {
        setLoading(false);
      }
      return;
    }

    await handleSectionInput(text, stage);
  };

  if (!isOpen) return null;

  // 找到最新的有待选选项的消息
  const latestWithOptions = [...messages].reverse().find((m) => m.options && m.role === 'assistant');

  return (
    <div className={`fixed z-50 shadow-2xl rounded-2xl border border-gray-800 bg-gray-900 flex flex-col transition-all ${
      expanded ? 'inset-4' : 'bottom-4 right-4 w-[420px] h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary-600 to-primary-500 rounded-t-2xl">
        <div className="flex items-center gap-2 text-white">
          <Bot size={20} />
          <span className="font-semibold">Repo2STAR 智能助手</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Agent</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-white/80 hover:text-white p-1" onClick={() => setExpanded(!expanded)}>
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button className="text-white/80 hover:text-white p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles size={14} className="text-indigo-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-gray-800 text-gray-200 rounded-bl-sm'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-indigo-400 prose-p:text-gray-300">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {/* 只在最新的 assistant 消息上显示选项 */}
                  {msg.options && latestWithOptions?.id === msg.id && (
                    <OptionChips options={msg.options} onSelect={handleOptionSelect} disabled={loading} />
                  )}
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Loader2 size={14} className="text-indigo-400 animate-spin" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-700 text-gray-400 hover:text-indigo-400 hover:border-indigo-500 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="上传简历文件（PDF/Word/图片/文本）"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.txt,.md"
            onChange={handleFileUpload}
          />
          <input
            ref={inputRef}
            className="input-field flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={
              stage === AGENT_STAGES.TEMPLATE ? '输入模板名称或上传简历文件...' :
              stage === AGENT_STAGES.SKILLS ? '输入技能，用逗号分隔...' :
              '输入信息、点击选项或上传文件...'
            }
            disabled={loading}
          />
          <button className="btn-primary" onClick={handleSend} disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          支持上传 PDF、Word、图片、文本文件，AI 自动解析填入简历
        </p>
      </div>
    </div>
  );
}
