import { useEffect } from 'react';
import { useApp } from '../store/AppContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import RepoOverview from '../components/RepoOverview';
import StarPointsView from '../components/StarPointsView';
import JobMatcherView from '../components/JobMatcherView';
import ExportView from '../components/ExportView';
import AgentLogView from '../components/AgentLogView';
import SkillProfileView from '../components/SkillProfileView';
import InterviewPrepView from '../components/InterviewPrepView';
import SettingsView from '../components/SettingsView';

export default function Dashboard() {
  const { activeView, loadRepos, loadStarPoints, loadMatchHistory, loadLogs, loadSuggestions, isAuthenticated } = useApp();

  useEffect(() => {
    if (isAuthenticated) {
      loadRepos();
      loadStarPoints();
      loadMatchHistory();
      loadLogs();
      loadSuggestions();
    }
  }, [isAuthenticated]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <RepoOverview />;
      case 'stars': return <StarPointsView />;
      case 'skills': return <SkillProfileView />;
      case 'matcher': return <JobMatcherView />;
      case 'interview': return <InterviewPrepView />;
      case 'export': return <ExportView />;
      case 'logs': return <AgentLogView />;
      case 'settings': return <SettingsView />;
      default: return <RepoOverview />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{renderView()}</main>
      </div>
    </div>
  );
}
