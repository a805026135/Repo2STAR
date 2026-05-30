import { useApp } from '../store/AppContext';
import { Bell, Github, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, suggestions, logout } = useApp();

  return (
    <nav className="h-14 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          R
        </div>
        <span className="text-white font-semibold text-lg">Repo2STAR</span>
        <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-medium">
          Agent
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50">
          <Bell size={18} />
          {suggestions.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {suggestions.length}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
              {user?.login?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="text-sm text-gray-300">{user?.login || 'User'}</span>
        </div>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
        >
          <Github size={18} />
        </a>

        <button
          onClick={logout}
          className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800/50"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
