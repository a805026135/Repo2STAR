import { useState, useRef } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { ResumeProvider } from './store/ResumeContext';
import { useResume } from './store/ResumeContext';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ResumeEditor from './components/ResumeEditor';
import ResumePreview from './components/ResumePreview';
import TemplateSelector from './components/TemplateSelector';
import AgentChat from './components/AgentChat';
import { exportPdf } from './services/exportPdf';
import { exportDocx } from './services/exportDocx';
import toast from 'react-hot-toast';
import {
  FileDown, Bot, Eye, Edit3, Layout, Loader2, FileText, FileType, ArrowLeft,
} from 'lucide-react';

function ResumeEditorContent() {
  const { dispatch: appDispatch } = useApp();
  const { resumeData } = useResume();
  const [showAgent, setShowAgent] = useState(false);
  const [sideTab, setSideTab] = useState('editor');
  const [exporting, setExporting] = useState(null);
  const previewRef = useRef(null);

  const handleExportPdf = async () => {
    setExporting('pdf');
    try {
      const el = previewRef.current;
      if (!el) throw new Error('预览区域未找到');
      const wrapper = el.querySelector('[style*="transform"]');
      if (wrapper) {
        const orig = wrapper.style.transform;
        wrapper.style.transform = 'none';
        await exportPdf(wrapper, `${resumeData.personal.name || 'resume'}.pdf`);
        wrapper.style.transform = orig;
      } else {
        await exportPdf(el, `${resumeData.personal.name || 'resume'}.pdf`);
      }
      toast.success('PDF 导出成功');
    } catch (err) {
      toast.error('PDF 导出失败：' + err.message);
    } finally {
      setExporting(null);
    }
  };

  const handleExportDocx = async () => {
    setExporting('docx');
    try {
      await exportDocx(resumeData, `${resumeData.personal.name || 'resume'}.docx`);
      toast.success('Word 导出成功');
    } catch (err) {
      toast.error('Word 导出失败：' + err.message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      <header className="h-14 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => appDispatch({ type: 'SET_ACTIVE_VIEW', payload: 'dashboard' })} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> 返回 Agent
          </button>
          <div className="w-px h-5 bg-gray-800" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"><FileText size={18} className="text-white" /></div>
            <span className="font-bold text-white text-lg">简历编辑器</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors" onClick={handleExportPdf} disabled={!!exporting}>
            {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} PDF
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors" onClick={handleExportDocx} disabled={!!exporting}>
            {exporting === 'docx' ? <Loader2 size={14} className="animate-spin" /> : <FileType size={14} />} Word
          </button>
          <div className="w-px h-6 bg-gray-800 mx-1" />
          <button className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${showAgent ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-500/25'}`} onClick={() => setShowAgent(!showAgent)}>
            <Bot size={16} /> AI 助手
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[480px] flex-shrink-0 border-r border-gray-800 flex flex-col bg-gray-900/50">
          <div className="flex border-b border-gray-800">
            {[{ key: 'editor', icon: Edit3, label: '编辑' }, { key: 'template', icon: Layout, label: '模板' }].map(({ key, icon: Icon, label }) => (
              <button key={key} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 ${sideTab === key ? 'text-indigo-400 border-indigo-400 bg-indigo-500/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/50'}`} onClick={() => setSideTab(key)}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {sideTab === 'editor' && <ResumeEditor />}
            {sideTab === 'template' && (<div><h3 className="font-semibold text-white mb-3">选择模板</h3><TemplateSelector /></div>)}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-950 p-6">
          <div className="flex items-center justify-center gap-2 mb-4"><Eye size={16} className="text-gray-600" /><span className="text-sm text-gray-500 font-medium">实时预览</span></div>
          <ResumePreview ref={previewRef} />
        </div>
      </div>
      <AgentChat isOpen={showAgent} onClose={() => setShowAgent(false)} />
    </div>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading, activeView } = useApp();
  if (isLoading) return <div className="h-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <LoginPage />;
  if (activeView === 'editor') return <ResumeProvider><ResumeEditorContent /></ResumeProvider>;
  return <Dashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-center" />
      <AppRouter />
    </AppProvider>
  );
}
