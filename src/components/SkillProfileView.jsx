import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Brain, RefreshCw, Loader2, Sparkles, BarChart3 } from 'lucide-react';

export default function SkillProfileView() {
  const { skillProfile, dispatch } = useApp();
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const profile = await api.getSkillProfile(true);
      dispatch({ type: 'SET_SKILL_PROFILE', payload: profile });
      toast.success('技能画像已更新');
    } catch (err) {
      toast.error('生成失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!skillProfile) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">技能画像</h1>
            <p className="text-sm text-gray-500 mt-1">基于 STAR 素材综合分析你的技能</p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
            {loading ? '生成中...' : '重新生成'}
          </button>
        </div>

        <div className="text-center py-20">
          <Brain size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500 text-lg">还没有技能画像</p>
          <p className="text-gray-600 text-sm mt-1">分析仓库后点击上方按钮生成</p>
        </div>
      </div>
    );
  }

  const strengths = skillProfile.strengths || [];
  const skills = skillProfile.skills || [];
  const techPatterns = skillProfile.tech_patterns || skillProfile.techPatterns || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">技能画像</h1>
          <p className="text-sm text-gray-500 mt-1">基于 STAR 素材综合分析你的技能</p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          重新生成
        </button>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-indigo-400" />
            <h3 className="text-sm font-medium text-white">核心优势</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {strengths.map((s, i) => (
              <span
                key={i}
                className="text-sm bg-indigo-500/15 text-indigo-400 px-3 py-1.5 rounded-full font-medium"
              >
                {typeof s === 'string' ? s : s.name || s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills Grid */}
      {skills.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-indigo-400" />
            <h3 className="text-sm font-medium text-white">技能详情</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skills.map((skill, i) => {
              const name = typeof skill === 'string' ? skill : skill.name;
              const category = skill.category || '';
              const proficiency = skill.proficiency || skill.level || 0;
              const evidence = skill.evidence || skill.description || '';

              return (
                <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-200">{name}</span>
                    {category && (
                      <span className="text-[10px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                        {category}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(Math.max(proficiency, 0), 100)}%` }}
                    />
                  </div>
                  {evidence && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{evidence}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tech Patterns */}
      {techPatterns.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-indigo-400" />
            <h3 className="text-sm font-medium text-white">技术栈模式</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {techPatterns.map((tp, i) => {
              const label = typeof tp === 'string' ? tp : tp.name || tp.pattern;
              const freq = tp.frequency || tp.count || 0;
              return (
                <div key={i} className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-300">{label}</span>
                  {freq > 0 && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                      {freq}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
