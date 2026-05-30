import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import {
  Search, ThumbsUp, ThumbsDown, ToggleLeft, ToggleRight,
  Tag, Wrench, Star as StarIcon
} from 'lucide-react';

function StarCard({ point, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({
    situation: point.situation || '',
    task: point.task || '',
    action: point.action || '',
    result: point.result || '',
  });

  const handleFeedback = async (value) => {
    try {
      await api.feedbackStarPoint(point.id, value);
      onUpdate({ id: point.id, user_feedback: value });
      toast.success(value > 0 ? '已标记为有用' : '已标记为无用');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggle = async () => {
    try {
      await api.toggleStarPoint(point.id);
      onUpdate({ id: point.id, is_active: !point.is_active });
      toast.success(point.is_active ? '已停用' : '已启用');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSave = async () => {
    try {
      await api.updateStarPoint(point.id, fields);
      onUpdate({ id: point.id, ...fields });
      setEditing(false);
      toast.success('已更新');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const renderField = (label, key) => (
    <div key={key} className="mb-2">
      <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">{label}</span>
      {editing ? (
        <textarea
          value={fields[key]}
          onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
          rows={2}
          className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
        />
      ) : (
        <p className="text-sm text-gray-300 mt-0.5 leading-relaxed">{point[key] || '-'}</p>
      )}
    </div>
  );

  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl p-4 transition-all ${!point.is_active ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StarIcon size={16} className="text-amber-400" />
          <span className="text-xs text-gray-500">{point.repo_name || '未知仓库'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggle}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            title={point.is_active ? '停用' : '启用'}
          >
            {point.is_active ? <ToggleRight size={20} className="text-indigo-400" /> : <ToggleLeft size={20} />}
          </button>
        </div>
      </div>

      {renderField('Situation', 'situation')}
      {renderField('Task', 'task')}
      {renderField('Action', 'action')}
      {renderField('Result', 'result')}

      {/* Skills */}
      {point.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 mb-2">
          {point.skills.map((s, i) => (
            <span key={i} className="flex items-center gap-1 text-[11px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
              <Wrench size={10} /> {s}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {point.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {point.tags.map((t, i) => (
            <span key={i} className="flex items-center gap-1 text-[11px] bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">
              <Tag size={10} /> {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              保存
            </button>
            <button
              onClick={() => { setEditing(false); setFields({ situation: point.situation, task: point.task, action: point.action, result: point.result }); }}
              className="px-3 py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
            >
              取消
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-200 rounded-lg text-xs font-medium transition-colors"
            >
              编辑
            </button>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => handleFeedback(1)}
                className={`p-1.5 rounded-lg transition-colors ${point.user_feedback > 0 ? 'text-green-400 bg-green-500/10' : 'text-gray-500 hover:text-green-400'}`}
              >
                <ThumbsUp size={14} />
              </button>
              <button
                onClick={() => handleFeedback(-1)}
                className={`p-1.5 rounded-lg transition-colors ${point.user_feedback < 0 ? 'text-red-400 bg-red-500/10' : 'text-gray-500 hover:text-red-400'}`}
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function StarPointsView() {
  const { starPoints, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  const filtered = useMemo(() => {
    let list = [...starPoints];
    if (filterActive === 'active') list = list.filter((p) => p.is_active !== false);
    if (filterActive === 'inactive') list = list.filter((p) => p.is_active === false);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        [p.situation, p.task, p.action, p.result, ...(p.skills || []), ...(p.tags || [])]
          .filter(Boolean)
          .some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [starPoints, search, filterActive]);

  const handleUpdate = (partial) => {
    dispatch({ type: 'UPDATE_STAR', payload: partial });
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">STAR 素材库</h1>
        <p className="text-sm text-gray-500 mt-1">管理 AI 生成的 STAR 简历素材</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 STAR 内容..."
            className="w-full pl-9 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
          {['all', 'active', 'inactive'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                filterActive === f ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f === 'all' ? '全部' : f === 'active' ? '已启用' : '已停用'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <StarIcon size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500 text-lg">
            {starPoints.length === 0 ? '还没有 STAR 素材' : '没有匹配的素材'}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {starPoints.length === 0 ? '分析仓库后将自动生成' : '尝试调整搜索条件'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((point) => (
            <StarCard key={point.id} point={point} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      <div className="text-center text-xs text-gray-600">
        共 {filtered.length} 条素材
      </div>
    </div>
  );
}
