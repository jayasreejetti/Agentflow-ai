import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  Play, 
  FileText,
  RefreshCw,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, TaskSummary } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardPageProps {
  onNavigate: (page: string, taskId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, tasksData] = await Promise.all([
        api.getStats(),
        api.getTasks(15, 0)
      ]);
      setStats(statsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Autonomous Agent Orchestrator Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            AgentFlow AI Autonomous Workflow Engine
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Submit complex goals in natural language. The agent decomposes objectives, selects authorized tools, evaluates intermediate observations, requests human approval for sensitive actions, and synthesizes structured reports.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('newTask')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Launch New Agent Task</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Browse Research Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tasks */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tasks</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono">
            {stats ? stats.total_tasks : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Autonomous workflows initialized</div>
        </div>

        {/* Completed */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {stats ? stats.completed_tasks : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Full objectives achieved</div>
        </div>

        {/* Active Workflows */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">Active Tasks</span>
            <RefreshCw className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
            {stats ? stats.active_tasks : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Currently orchestrating</div>
        </div>

        {/* Pending Approvals */}
        <div className={`p-5 rounded-2xl border transition-all ${
          (stats?.pending_approvals ?? 0) > 0 
            ? 'bg-amber-500/10 border-amber-500/30 glow-amber' 
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${(stats?.pending_approvals ?? 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              Pending Approvals
            </span>
            <ShieldAlert className={`w-4 h-4 ${(stats?.pending_approvals ?? 0) > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${(stats?.pending_approvals ?? 0) > 0 ? 'text-amber-300' : 'text-slate-100'}`}>
            {stats ? stats.pending_approvals : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {(stats?.pending_approvals ?? 0) > 0 ? 'Human sign-off required' : 'Zero actions blocked'}
          </div>
        </div>

        {/* Failed */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400/90">Failed</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
            {stats ? stats.failed_tasks : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Errors caught & safely contained</div>
        </div>
      </div>

      {/* Recent Executions Section */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/80">
          <div>
            <h2 className="text-base font-bold text-slate-100">Recent Workflow Executions</h2>
            <p className="text-xs text-slate-400">History of autonomous tasks, status checkpoints, and generated artifacts</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700/80 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-200">No autonomous tasks yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Launch your first research or comparative workflow to see real-time tool calling and LangGraph orchestration.
            </p>
            <button
              onClick={() => onNavigate('newTask')}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Start First Task</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Task Objective</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Workflow Progress</th>
                  <th className="px-6 py-3.5">Created At</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 max-w-md">
                      <div className="font-semibold text-slate-100 truncate" title={task.objective}>
                        {task.objective}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: {task.id.substring(0, 13)}...
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={task.status} size="sm" />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${task.total_steps > 0 ? Math.min(100, Math.round((task.current_step_index / task.total_steps) * 100)) : (task.status === 'COMPLETED' ? 100 : 20)}%`
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {task.current_step_index}/{task.total_steps || '-'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(task.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigate('execution', task.id)}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
                        >
                          <span>Live Stream</span>
                          <ArrowRight className="w-3 h-3 text-emerald-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

