import { useState } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import {
  FileJson, FileText, GitPullRequest, BookOpen, MessageSquare,
  ExternalLink, Loader2, Download, Lightbulb
} from 'lucide-react';

const exportCards = [
  {
    key: 'jsonresume',
    title: 'JSON Resume',
    desc: '导出标准 JSON Resume 格式，可导入其他简历工具',
    icon: FileJson,
    color: 'blue',
    action: (setLoading) => async () => {
      const data = await api.exportJsonResume();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'resume.json'; a.click();
      URL.revokeObjectURL(url);
      toast.success('JSON Resume 导出成功');
      return data;
    },
  },
  {
    key: 'markdown',
    title: 'Markdown',
    desc: '导出 Markdown 格式简历，适合 GitHub 和博客',
    icon: FileText,
    color: 'green',
    action: (setLoading) => async () => {
      const data = await api.exportMarkdown();
      const text = typeof data === 'string' ? data : data.content || data.markdown || JSON.stringify(data);
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'resume.md'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Markdown 导出成功');
      return data;
    },
  },
  {
    key: 'pr',
    title: 'GitHub PR',
    desc: '自动在你的简历仓库创建 Pull Request 更新简历',
    icon: GitPullRequest,
    color: 'purple',
    action: (setLoading) => async () => {
      const result = await api.createResumePR();
      toast.success('PR 创建成功');
      return result;
    },
  },
  {
    key: 'notion',
    title: '推送 Notion',
    desc: '将简历内容推送到 Notion 页面',
    icon: BookOpen,
    color: 'gray',
    action: (setLoading) => async () => {
      await api.pushResume('notion');
      toast.success('已推送到 Notion');
    },
  },
  {
    key: 'feishu',
    title: '推送飞书',
    desc: '将简历内容推送到飞书文档',
    icon: MessageSquare,
    color: 'blue',
    action: (setLoading) => async () => {
      await api.pushResume('feishu');
      toast.success('已推送到飞书');
    },
  },
];

const colorStyles = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: 'text-green-400',
    button: 'bg-green-600 hover:bg-green-700',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    button: 'bg-purple-600 hover:bg-purple-700',
  },
  gray: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    icon: 'text-gray-400',
    button: 'bg-gray-600 hover:bg-gray-700',
  },
};

export default function ExportView() {
  const [loadingKey, setLoadingKey] = useState(null);
  const [prResult, setPrResult] = useState(null);

  const handleExport = async (card) => {
    setLoadingKey(card.key);
    try {
      const handler = card.action(setLoadingKey);
      const result = await handler();
      if (card.key === 'pr' && result) {
        setPrResult(result);
      }
    } catch (err) {
      toast.error(err.message || '导出失败');
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">导出</h1>
        <p className="text-sm text-gray-500 mt-1">将简历导出为多种格式</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {exportCards.map((card) => {
          const styles = colorStyles[card.color] || colorStyles.gray;
          const Icon = card.icon;
          const isLoading = loadingKey === card.key;

          return (
            <div
              key={card.key}
              className={`bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors`}
            >
              <div className={`w-10 h-10 ${styles.bg} rounded-lg flex items-center justify-center mb-4`}>
                <Icon size={20} className={styles.icon} />
              </div>
              <h3 className="text-white font-semibold mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{card.desc}</p>
              <button
                onClick={() => handleExport(card)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 ${styles.button} disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors`}
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {isLoading ? '处理中...' : '导出'}
              </button>
            </div>
          );
        })}
      </div>

      {/* PR Result */}
      {prResult && (
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitPullRequest size={16} className="text-purple-400" />
            <span className="text-sm font-medium text-purple-300">PR 已创建</span>
          </div>
          {prResult.url && (
            <a
              href={prResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink size={14} />
              {prResult.url}
            </a>
          )}
          {prResult.message && (
            <p className="text-sm text-gray-400 mt-1">{prResult.message}</p>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={16} className="text-amber-400" />
          <h3 className="text-sm font-medium text-white">使用提示</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>JSON Resume 是行业标准格式，可在 jsonresume.org 生态中使用</li>
          <li>GitHub PR 需要先在设置中配置简历仓库名称</li>
          <li>推送 Notion / 飞书前请确保已在设置中配置相关凭证</li>
          <li>建议先完成岗位匹配再导出，以获得最优化的简历内容</li>
        </ul>
      </div>
    </div>
  );
}
