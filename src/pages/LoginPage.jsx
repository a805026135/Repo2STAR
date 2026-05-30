import { api } from '../services/api';
import { Github, Zap, Brain, FileText, ArrowRight } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI 深度分析', desc: '自动理解你的代码架构、技术栈和个人贡献' },
  { icon: Zap, title: 'STAR 自动生成', desc: '将代码成果转化为专业的简历描述，持续迭代优化' },
  { icon: FileText, title: '岗位精准匹配', desc: '输入 JD，自动挑选最相关项目并重写描述' },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-2xl font-bold">R</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Repo2STAR</h1>
              <p className="text-indigo-400 text-sm font-medium">AI Agent</p>
            </div>
          </div>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent leading-tight">
            你只管写代码<br /><span className="text-indigo-400">它负责把代码翻译成 Offer</span>
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">连接 GitHub 的 AI Agent，自动分析仓库、生成 STAR 简历要点、匹配目标岗位</p>
          <a href={api.getGithubAuthUrl()} className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]">
            <Github size={22} /> 使用 GitHub 登录 <ArrowRight size={18} />
          </a>
          <p className="text-gray-600 text-sm mt-4">仅申请 repo 读取权限，不会修改你的仓库</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full px-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4"><Icon size={20} className="text-indigo-400" /></div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <footer className="text-center py-6 text-gray-600 text-sm border-t border-gray-900">Repo2STAR Agent &mdash; 让你的代码为自己说话</footer>
    </div>
  );
}
