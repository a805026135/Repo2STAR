import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus, RefreshCw, Eye, EyeOff, Trash2, GitBranch, Star as StarIcon,
  Clock, Loader2, X, Search, AlertCircle, Check
} from 'lucide-react';

export default function RepoOverview() {
  const { repos, suggestions, dispatch, loadRepos, analysisRunning } = useApp();
  const [showImport, setShowImport] = useState(false);
  const [githubRepos, setGithubRepos] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const pendingSuggestionsByRepo = suggestions.reduce((acc, s) => {
    acc[s.repo_id] = (acc[s.repo_id] || 0) + 1;
    return acc;
  }, {});

  const handleAnalyze = async (repoId, repoName) => {
    dispatch({ type: 'SET_ANALYSIS_RUNNING', payload: { repoId, running: true } });
    await toast.promise(
      api.analyzeRepo(repoId).then((result) => {
        if (result.star_points) {
          dispatch({ type: 'ADD_STAR_POINTS', payload: result.star_points });
        }
        loadRepos();
        return result;
      }),
      {
        loading: `正在分析 ${repoName}...`,
        success: `${repoName} 分析完成`,
        error: (err) => `分析失败: ${err.message}`,
      }
    );
    dispatch({ type: 'SET_ANALYSIS_RUNNING', payload: { repoId, running: false } });
  };

  const handleToggleWatch = async (repo) => {
    try {
      await api.toggleWatch(repo.id);
      dispatch({ type: 'UPDATE_REPO', payload: { id: repo.id, watching: !repo.watching } });
      toast.success(repo.watching ? '已取消关注' : '已开启关注');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemove = async (repo) => {
    if (!confirm(`确认移除 ${repo.name}？`)) return;
    try {
      await api.removeRepo(repo.id);
      dispatch({ type: 'REMOVE_REPO', payload: repo.id });
      toast.success('已移除');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openImport = async () => {
    setShowImport(true);
    setSelected(new Set());
    setLoadingRepos(true);
    try {
      const data = await api.listGithubRepos();
      setGithubRepos(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('加载 GitHub 仓库失败: ' + err.message);
    } finally {
      setLoadingRepos(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const result = await api.importRepos([...selected]);
      if (result.imported) dispatch({ type: 'ADD_REPOS', payload: result.imported });
      setShowImport(false);
      toast.success(`成功导入 ${selected.size} 个仓库`);
    } catch (err) {
      toast.error('导入失败: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">项目总览</h1>
          <p className="text-sm text-gray-500 mt-1">管理已导入的 GitHub 仓库</p>
        </div>
        <button
          onClick={openImport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          导入仓库
        </button>
      </div>

      {repos.length === 0 ? (
        <div className="text-center py-20">
          <GitBranch size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500 text-lg">还没有导入任何仓库</p>
          <p className="text-gray-600 text-sm mt-1">点击上方按钮从 GitHub 导入</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-white font-semibold truncate">{repo.full_name || repo.name}</h3>
                  {repo.private ? (
                    <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                      Private
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-900/40 text-emerald-400 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                      Public
                    </span>
                  )}
                </div>
                {repo.watching && (
                  <Eye size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                )}
              </div>

              {repo.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{repo.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    {repo.language}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <StarIcon size={12} />
                  {repo.stargazers_count ?? repo.stars ?? 0}
                </span>
                <span>分析 {repo.analysis_count ?? 0} 次</span>
                {pendingSuggestionsByRepo[repo.id] > 0 && (
                  <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    有新建议
                  </span>
                )}
              </div>

              {repo.last_analysis_at && (
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-4">
                  <Clock size={12} />
                  上次分析: {new Date(repo.last_analysis_at).toLocaleString('zh-CN')}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAnalyze(repo.id, repo.name)}
                  disabled={analysisRunning[repo.id]}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {analysisRunning[repo.id] ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  分析
                </button>
                <button
                  onClick={() => handleToggleWatch(repo)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-200 rounded-lg text-xs font-medium transition-colors"
                >
                  {repo.watching ? <EyeOff size={13} /> : <Eye size={13} />}
                  {repo.watching ? '取消关注' : '关注'}
                </button>
                <button
                  onClick={() => handleRemove(repo)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors ml-auto"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">从 GitHub 导入仓库</h2>
              <button onClick={() => setShowImport(false)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingRepos ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : githubRepos.length === 0 ? (
                <p className="text-center text-gray-500 py-12">没有找到仓库</p>
              ) : (
                githubRepos.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selected.has(r.id) ? 'bg-indigo-500/10 border border-indigo-500/30' : 'border border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white font-medium truncate">{r.full_name || r.name}</p>
                      {r.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{r.description}</p>
                      )}
                    </div>
                    {r.private && (
                      <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">Private</span>
                    )}
                  </label>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-800 flex items-center justify-between">
              <span className="text-sm text-gray-500">已选择 {selected.size} 个</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImport(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleImport}
                  disabled={selected.size === 0 || importing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  导入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
