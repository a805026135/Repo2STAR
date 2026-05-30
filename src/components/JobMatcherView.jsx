import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import {
  Target, Search, Loader2, CheckCircle, AlertTriangle, X, ArrowRight,
  ChevronDown, ChevronUp, Trash2
} from 'lucide-react';

function CoverageGauge({ percent }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const color = percent >= 70 ? '#22c55e' : percent >= 40 ? '#eab308' : '#ef4444';

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{percent}%</span>
        <span className="text-[10px] text-gray-500">覆盖率</span>
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const [showRewrites, setShowRewrites] = useState({});
  const toggleRewrite = (idx) => setShowRewrites((p) => ({ ...p, [idx]: !p[idx] }));

  return (
    <div className="space-y-5">
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 flex items-center gap-6">
        <CoverageGauge percent={result.coverage_percent ?? 0} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{result.jd_title || '岗位匹配'}</h3>
          {result.jd_company && <p className="text-sm text-gray-500 mb-3">{result.jd_company}</p>}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-400">
              <CheckCircle size={14} /> 匹配 {result.matched_keywords?.length ?? 0} 项
            </span>
            <span className="flex items-center gap-1.5 text-yellow-400">
              <AlertTriangle size={14} /> 缺失 {result.missing_keywords?.length ?? 0} 项
            </span>
          </div>
        </div>
      </div>

      {/* Matched Keywords */}
      {result.matched_keywords?.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-white mb-3">匹配关键词</h4>
          <div className="flex flex-wrap gap-2">
            {result.matched_keywords.map((kw, i) => (
              <span key={i} className="text-xs bg-green-500/15 text-green-400 px-2.5 py-1 rounded-full">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {result.missing_keywords?.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-white mb-3">缺失关键词</h4>
          <div className="flex flex-wrap gap-2">
            {result.missing_keywords.map((kw, i) => (
              <span key={i} className="text-xs bg-yellow-500/15 text-yellow-400 px-2.5 py-1 rounded-full">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions?.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <h4 className="text-sm font-medium text-yellow-300 mb-3">改进建议</h4>
          <ul className="space-y-2">
            {result.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-yellow-200/80 flex items-start gap-2">
                <ArrowRight size={14} className="flex-shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rewritten STAR Points */}
      {result.rewritten_stars?.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-medium text-white mb-3">优化后的 STAR 素材</h4>
          <div className="space-y-3">
            {result.rewritten_stars.map((star, idx) => (
              <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                <button
                  onClick={() => toggleRewrite(idx)}
                  className="w-full flex items-center justify-between text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <span className="font-medium">STAR #{idx + 1}</span>
                  {showRewrites[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showRewrites[idx] && (
                  <div className="mt-3 space-y-2 text-sm">
                    {star.before && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">优化前</span>
                        <p className="text-gray-400 mt-0.5 leading-relaxed">{star.before}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">优化后</span>
                      <p className="text-gray-200 mt-0.5 leading-relaxed">{star.after || star.rewritten || star.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobMatcherView() {
  const { matchHistory, dispatch } = useApp();
  const [jdTitle, setJdTitle] = useState('');
  const [jdCompany, setJdCompany] = useState('');
  const [jdText, setJdText] = useState('');
  const [matching, setMatching] = useState(false);
  const [result, setResult] = useState(null);

  const handleMatch = async () => {
    if (!jdText.trim()) {
      toast.error('请输入职位描述');
      return;
    }
    setMatching(true);
    setResult(null);
    try {
      const res = await api.matchJob(jdText, jdTitle, jdCompany);
      setResult(res);
      dispatch({ type: 'ADD_MATCH', payload: res });
      toast.success('匹配完成');
    } catch (err) {
      toast.error('匹配失败: ' + err.message);
    } finally {
      setMatching(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      await api.deleteMatch(matchId);
      dispatch({
        type: 'SET_MATCH_HISTORY',
        payload: matchHistory.filter((m) => m.id !== matchId),
      });
      if (result?.id === matchId) setResult(null);
      toast.success('已删除');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const loadMatch = (match) => {
    setResult(match);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">岗位匹配</h1>
        <p className="text-sm text-gray-500 mt-1">粘贴 JD，智能匹配你的 STAR 素材</p>
      </div>

      {/* Input Form */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">职位名称</label>
            <input
              type="text"
              value={jdTitle}
              onChange={(e) => setJdTitle(e.target.value)}
              placeholder="如: Senior Frontend Engineer"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">公司名称</label>
            <input
              type="text"
              value={jdCompany}
              onChange={(e) => setJdCompany(e.target.value)}
              placeholder="如: ByteDance"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">职位描述 (JD)</label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="粘贴完整的职位描述..."
            rows={6}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleMatch}
            disabled={matching || !jdText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {matching ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
            {matching ? '匹配中...' : '开始匹配'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && <ResultCard result={result} />}

      {/* Match History */}
      {matchHistory.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-3">匹配历史</h3>
          <div className="space-y-2">
            {matchHistory.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                <button onClick={() => loadMatch(m)} className="flex-1 text-left flex items-center gap-3">
                  <span className="text-sm text-gray-200">{m.jd_title || '未命名岗位'}</span>
                  {m.jd_company && <span className="text-xs text-gray-500">{m.jd_company}</span>}
                  <span className="text-xs text-gray-600">{m.coverage_percent ?? 0}%</span>
                  {m.created_at && (
                    <span className="text-xs text-gray-600 ml-auto">{new Date(m.created_at).toLocaleDateString('zh-CN')}</span>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteMatch(m.id)}
                  className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
