import { useApp } from '../store/AppContext';
import {
  LayoutDashboard, Star, Brain, Target, MessageSquare, FileText,
  Download, ScrollText, Settings
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', label: '项目总览', icon: LayoutDashboard, hasBadge: 'suggestions' },
  { key: 'stars', label: 'STAR素材库', icon: Star },
  { key: 'skills', label: '技能画像', icon: Brain },
  { key: 'matcher', label: '岗位匹配', icon: Target },
  { key: 'interview', label: '面试准备', icon: MessageSquare },
  { key: 'editor', label: '简历编辑器', icon: FileText },
  { key: 'export', label: '导出', icon: Download },
  { key: 'logs', label: 'Agent日志', icon: ScrollText },
  { key: 'settings', label: '设置', icon: Settings },
];

export default function Sidebar() {
  const { activeView, dispatch, repos, starPoints, suggestions } = useApp();

  const setActive = (key) => {
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: key });
  };

  return (
    <aside className="w-56 bg-gray-900/50 border-r border-gray-800 flex flex-col flex-shrink-0">
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map(({ key, label, icon: Icon, hasBadge }) => {
          const isActive = activeView === key;
          const badgeCount = hasBadge === 'suggestions' ? suggestions.length : 0;

          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <Icon size={17} />
              <span>{label}</span>
              {badgeCount > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>已导入仓库</span>
          <span className="text-gray-400 font-medium">{repos.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>STAR 素材</span>
          <span className="text-gray-400 font-medium">{starPoints.length}</span>
        </div>
      </div>
    </aside>
  );
}
