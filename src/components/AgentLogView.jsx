import { useEffect } from 'react';
import { useApp } from '../store/AppContext';
import {
  Clock, CheckCircle2, XCircle, Zap, Activity, Sparkles,
  Brain, MessageSquare, GitPullRequest, Send, ScrollText
} from 'lucide-react';

const ACTION_LABELS = {
  analyze_start: '开始分析',
  analyze_complete: '分析完成',
  analyze_failed: '分析失败',
  star_generated: '生成STAR',
  job_match: '岗位匹配',
  feedback_recorded: '用户反馈',
  scheduled_scan: '定时扫描',
  suggestion_available: '新建议',
  suggestion_accepted: '接受建议',
  skill_synthesis: '技能综合',
  interview_prep: '面试准备',
  pr_created: '创建PR',
  push_notion: '推送Notion',
  push_feishu: '推送飞书',
};

const ACTION_ICONS = {
  analyze_start: Activity,
  analyze_complete: CheckCircle2,
  analyze_failed: XCircle,
  star_generated: Sparkles,
  job_match: Zap,
  feedback_recorded: MessageSquare,
  scheduled_scan: Clock,
  suggestion_available: Sparkles,
  suggestion_accepted: CheckCircle2,
  skill_synthesis: Brain,
  interview_prep: MessageSquare,
  pr_created: GitPullRequest,
  push_notion: Send,
  push_feishu: Send,
};

const ERROR_ACTIONS = new Set(['analyze_failed']);

export default function AgentLogView() {
  const { agentLogs, loadLogs, isAuthenticated } = useApp();

  useEffect(() => {
    if (isAuthenticated) loadLogs();
  }, [isAuthenticated]);

  const getIcon = (action) => ACTION_ICONS[action] || Activity;
  const getLabel = (action) => ACTION_LABELS[action] || action;
  const isError = (action) => ERROR_ACTIONS.has(action);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent 日志</h1>
        <p className="text-sm text-gray-500 mt-1">查看 Agent 的活动记录</p>
      </div>

      {agentLogs.length === 0 ? (
        <div className="text-center py-20">
          <ScrollText size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500 text-lg">暂无日志</p>
          <p className="text-gray-600 text-sm mt-1">Agent 活动记录将显示在这里</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-800" />

          <div className="space-y-1">
            {agentLogs.map((log, idx) => {
              const Icon = getIcon(log.action);
              const error = isError(log.action);

              return (
                <div key={log.id || idx} className="relative flex items-start gap-4 pl-2 py-3">
                  {/* Icon dot */}
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    error
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    <Icon size={13} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-medium ${error ? 'text-red-400' : 'text-gray-200'}`}>
                        {getLabel(log.action)}
                      </span>
                      {log.created_at && (
                        <span className="text-xs text-gray-600">
                          {new Date(log.created_at).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </div>
                    {log.message && (
                      <p className={`text-sm ${error ? 'text-red-400/70' : 'text-gray-500'} leading-relaxed`}>
                        {log.message}
                      </p>
                    )}
                    {log.repo_name && (
                      <span className="text-xs text-gray-600 mt-1 inline-block">
                        仓库: {log.repo_name}
                      </span>
                    )}
                    {log.details && typeof log.details === 'object' && (
                      <pre className="text-xs text-gray-600 mt-1 bg-gray-900/50 rounded-lg p-2 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-600">
        共 {agentLogs.length} 条日志
      </div>
    </div>
  );
}
