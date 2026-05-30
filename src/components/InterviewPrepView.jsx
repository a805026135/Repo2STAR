import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import {
  MessageSquare, Loader2, ChevronDown, ChevronUp,
  BookOpen, Code, Users, Layers
} from 'lucide-react';

const CATEGORY_STYLES = {
  technical: { label: '技术', color: 'blue', icon: Code },
  behavioral: { label: '行为', color: 'green', icon: Users },
  'system-design': { label: '系统设计', color: 'purple', icon: Layers },
};

const CATEGORY_COLORS = {
  blue: 'bg-blue-500/15 text-blue-400',
  green: 'bg-green-500/15 text-green-400',
  purple: 'bg-purple-500/15 text-purple-400',
};

function QuestionCard({ question }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_STYLES[question.category] || { label: question.category || '其他', color: 'gray', icon: BookOpen };
  const CatIcon = cat.icon;
  const colorClass = CATEGORY_COLORS[cat.color] || 'bg-gray-500/15 text-gray-400';

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-800/30 transition-colors"
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <CatIcon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 leading-relaxed">{question.question}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${colorClass}`}>
          {cat.label}
        </span>
        <div className="text-gray-500 flex-shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-800/50 pt-3">
          {/* Answer Outline */}
          {question.answer_outline && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">回答要点</span>
              <div className="mt-2 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {question.answer_outline}
              </div>
            </div>
          )}
          {question.answer && !question.answer_outline && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">回答要点</span>
              <div className="mt-2 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {question.answer}
              </div>
            </div>
          )}

          {/* Follow-ups */}
          {question.follow_ups?.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">追问</span>
              <ul className="mt-2 space-y-1.5">
                {question.follow_ups.map((fu, i) => (
                  <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-indigo-400 flex-shrink-0">Q:</span>
                    {fu}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InterviewPrepView() {
  const { repos, interviewPreps, dispatch, loadInterviewPreps, isAuthenticated } = useApp();
  const [selectedRepo, setSelectedRepo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentPrep, setCurrentPrep] = useState(null);

  useEffect(() => {
    if (isAuthenticated) loadInterviewPreps();
  }, [isAuthenticated]);

  const handleGenerate = async () => {
    if (!selectedRepo) {
      toast.error('请选择一个仓库');
      return;
    }
    setGenerating(true);
    setCurrentPrep(null);
    try {
      const result = await api.getInterviewPrep(selectedRepo);
      setCurrentPrep(result);
      dispatch({ type: 'ADD_INTERVIEW_PREP', payload: result });
      toast.success('面试题生成完成');
    } catch (err) {
      toast.error('生成失败: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const loadPrep = async (prep) => {
    if (prep.questions) {
      setCurrentPrep(prep);
    } else {
      try {
        const detail = await api.getInterviewPrepDetail(prep.id);
        setCurrentPrep(detail);
      } catch (err) {
        toast.error('加载失败: ' + err.message);
      }
    }
  };

  const questions = currentPrep?.questions || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">面试准备</h1>
        <p className="text-sm text-gray-500 mt-1">基于仓库分析生成面试题目</p>
      </div>

      {/* Controls */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-end gap-3">
        <div className="flex-1">
          <label className="text-sm text-gray-400 mb-1.5 block">选择仓库</label>
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 appearance-none"
          >
            <option value="">-- 请选择 --</option>
            {repos.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedRepo}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
          {generating ? '生成中...' : '生成面试题'}
        </button>
      </div>

      {/* Current Questions */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">
            面试题 ({questions.length})
            {currentPrep.repo_name && <span className="text-gray-500 ml-2">-- {currentPrep.repo_name}</span>}
          </h3>
          {questions.map((q, idx) => (
            <QuestionCard key={q.id || idx} question={q} />
          ))}
        </div>
      )}

      {/* History */}
      {interviewPreps.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-3">历史记录</h3>
          <div className="space-y-2">
            {interviewPreps.map((prep) => (
              <button
                key={prep.id}
                onClick={() => loadPrep(prep)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-300">{prep.repo_name || '未命名'}</span>
                </div>
                <div className="flex items-center gap-3">
                  {prep.questions?.length > 0 && (
                    <span className="text-xs text-gray-500">{prep.questions.length} 题</span>
                  )}
                  {prep.created_at && (
                    <span className="text-xs text-gray-600">
                      {new Date(prep.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!currentPrep && interviewPreps.length === 0 && !generating && (
        <div className="text-center py-16">
          <MessageSquare size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500 text-lg">还没有面试题</p>
          <p className="text-gray-600 text-sm mt-1">选择仓库并点击生成</p>
        </div>
      )}
    </div>
  );
}
