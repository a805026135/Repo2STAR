import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Settings, Save, Loader2, BookOpen, MessageSquare, GitBranch } from 'lucide-react';

const integrationCards = [
  {
    key: 'notion',
    title: 'Notion',
    desc: '配置 Notion API Key 和目标页面',
    icon: BookOpen,
    fields: [
      { key: 'notion_api_key', label: 'API Key', placeholder: 'secret_xxx...' },
      { key: 'notion_page_id', label: 'Page ID', placeholder: 'xxxxx...' },
    ],
  },
  {
    key: 'feishu',
    title: '飞书',
    desc: '配置飞书 Webhook URL',
    icon: MessageSquare,
    fields: [
      { key: 'feishu_webhook_url', label: 'Webhook URL', placeholder: 'https://open.feishu.cn/open-apis/bot/v2/hook/...' },
    ],
  },
  {
    key: 'resume_repo',
    title: '简历仓库',
    desc: '配置 GitHub PR 目标仓库',
    icon: GitBranch,
    fields: [
      { key: 'resume_repo', label: '仓库名称', placeholder: 'username/resume-repo' },
    ],
  },
];

export default function SettingsView() {
  const { settings, dispatch, loadSettings, isAuthenticated } = useApp();
  const [localValues, setLocalValues] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    if (isAuthenticated) loadSettings();
  }, [isAuthenticated]);

  useEffect(() => {
    // Initialize local values from context settings
    if (settings && typeof settings === 'object') {
      setLocalValues((prev) => ({ ...settings, ...prev }));
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (card) => {
    setSavingKey(card.key);
    try {
      for (const field of card.fields) {
        const value = localValues[field.key] || '';
        await api.updateSetting(field.key, value);
      }
      dispatch({ type: 'SET_SETTINGS', payload: { ...settings, ...localValues } });
      toast.success(`${card.title} 设置已保存`);
    } catch (err) {
      toast.error('保存失败: ' + err.message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置集成和推送选项</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        {integrationCards.map((card) => {
          const Icon = card.icon;
          const isSaving = savingKey === card.key;

          return (
            <div key={card.key} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                  <Icon size={18} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                  <p className="text-xs text-gray-500">{card.desc}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {card.fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-gray-400 mb-1 block">{field.label}</label>
                    <input
                      type="text"
                      value={localValues[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave(card)}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
