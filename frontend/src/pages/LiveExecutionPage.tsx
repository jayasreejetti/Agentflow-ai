import React, { useEffect, useState, useRef } from 'react';
import { 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ArrowLeft, 
  FileText, 
  Play, 
  XCircle, 
  Maximize2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Layers,
  Search,
  Calculator,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { Task, ToolExecution, ApprovalRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useTaskEventSource } from '../hooks/useEventSource';
import { ApprovalModal } from '../components/ApprovalModal';
import { ToolInspectorModal } from '../components/ToolInspectorModal';

interface LiveExecutionPageProps {
  taskId: string | null;
  onNavigate: (page: string, taskId?: string) => void;
}

export const LiveExecutionPage: React.FC<LiveExecutionPageProps> = ({ taskId, onNavigate }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedToolExecution, setSelectedToolExecution] = useState<ToolExecution | null>(null);
  const [activeApprovalRequest, setActiveApprovalRequest] = useState<ApprovalRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Connect SSE live stream
  const { events, isConnected, latestEvent } = useTaskEventSource(taskId);

  // Fetch task state from DB
  const loadTask = async () => {
    if (!taskId) return;
    try {
      const data = await api.getTask(taskId);
      setTask(data);

      // Check if there is an active pending approval request
      const pending = data.approval_requests?.find((a) => a.status === 'PENDING');
      if (pending) {
        setActiveApprovalRequest(pending);
      } else {
        setActiveApprovalRequest(null);
      }
    } catch (err) {
      console.error('Failed to load task details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
    const interval = setInterval(loadTask, 3000);
    return () => clearInterval(interval);
  }, [taskId]);

  // When new SSE events arrive, refresh immediately
  useEffect(() => {
    if (latestEvent) {
      loadTask();
    }
  }, [latestEvent]);

  // Auto-scroll terminal log
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  const handleApprove = async (id: string, reason: string) => {
    try {
      await api.approveAction(id, reason);
      setActiveApprovalRequest(null);
      await loadTask();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await api.rejectAction(id, reason);
      setActiveApprovalRequest(null);
      await loadTask();
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  if (!taskId) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-400 w-16 h-16 mx-auto flex items-center justify-center">
          <Cpu className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">No Task Selected</h2>
        <p className="text-xs text-slate-400">
          Select an active workflow from the dashboard or launch a new execution.
        </p>
        <button
          onClick={() => onNavigate('newTask')}
          className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
        >
          Launch New Task
        </button>
      </div>
    );
  }

  const getToolIcon = (name: string | null) => {
    switch (name) {
      case 'web_search': return <Search className="w-3.5 h-3.5 text-sky-400" />;
      case 'calculator': return <Calculator className="w-3.5 h-3.5 text-emerald-400" />;
      case 'database_save':
      case 'database_get': return <Database className="w-3.5 h-3.5 text-indigo-400" />;
      case 'external_action': return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case 'report_generator': return <FileText className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Cpu className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-900 border border-slate-800 text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>SSE Stream: {isConnected ? 'Live' : 'Polling'}</span>
          </div>
          {task?.reports && task.reports.length > 0 && (
            <button
              onClick={() => onNavigate('reports', task.reports![0].id)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Generated Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Objective Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={task?.status || 'PLANNING'} size="md" />
            <span className="text-xs text-slate-500 font-mono">ID: {taskId}</span>
          </div>
          <span className="text-xs text-slate-400">
            Started: {task ? new Date(task.created_at).toLocaleTimeString() : '-'}
          </span>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-100 leading-snug">
          {task?.objective}
        </h1>
      </div>

      {/* URGENT APPROVAL REQUIRED BANNER */}
      {activeApprovalRequest && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10 space-y-4 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Human Oversight Checkpoint
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">
                  Action Paused: Approval Required
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  The autonomous agent wishes to execute a sensitive action: <span className="font-semibold text-amber-300">"{activeApprovalRequest.action_description}"</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReject(activeApprovalRequest.id, 'User rejected from live execution console')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Action</span>
              </button>
              <button
                onClick={() => handleApprove(activeApprovalRequest.id, 'User approved from live execution console')}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Continue Workflow</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs font-mono text-amber-300/90 overflow-x-auto">
            <span className="text-slate-500 text-[11px] block mb-1 uppercase font-semibold">Parameters:</span>
            <pre>{JSON.stringify(activeApprovalRequest.parameters, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Main Grid: Plan Stepper & Tool Outputs (Left 7 cols) + SSE Live Terminal (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Plan & Tools */}
        <div className="lg:col-span-7 space-y-6">
          {/* Execution Plan Stepper */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-100">LangGraph Execution Plan</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {task?.steps?.filter((s) => s.status === 'COMPLETED').length || 0} / {task?.steps?.length || task?.execution_plan?.length || 0} Steps
              </span>
            </div>

            <div className="p-6 divide-y divide-slate-800/60">
              {(!task?.execution_plan || task.execution_plan.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Planner node synthesizing logical workflow graph...</p>
                </div>
              ) : (
                task.execution_plan.map((step, idx) => {
                  const dbStep = task.steps?.find((s) => s.step_number === step.step_number);
                  const currentStatus = dbStep?.status || step.status || 'PENDING';
                  const isCurrent = (task.current_step_index === idx) && (task.status === 'EXECUTING' || task.status === 'PLANNING');

                  return (
                    <div key={idx} className={`py-4 first:pt-0 last:pb-0 transition-colors ${isCurrent ? 'bg-emerald-500/5 -mx-4 px-4 rounded-xl' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                            currentStatus === 'COMPLETED'
                              ? 'bg-emerald-500 text-slate-950'
                              : isCurrent
                              ? 'bg-sky-500 text-slate-950 animate-pulse'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {currentStatus === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : step.step_number}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-200">
                                {step.title}
                              </span>
                              {step.is_sensitive && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>Approval Gate</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {step.tool_name && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 font-mono text-slate-300 flex items-center gap-1.5">
                              {getToolIcon(step.tool_name)}
                              <span>{step.tool_name}</span>
                            </span>
                          )}
                          <StatusBadge status={currentStatus} size="sm" showIcon={false} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tool Executions & Artifact History */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold text-slate-100">Tool Calls & Observations</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {task?.tool_executions?.length || 0} Executions
              </span>
            </div>

            <div className="p-6 space-y-3">
              {(!task?.tool_executions || task.tool_executions.length === 0) ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Tool invocations will appear here as the agent executes graph nodes.
                </div>
              ) : (
                task.tool_executions.map((exec, idx) => (
                  <div
                    key={exec.id || idx}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-slate-800 border border-slate-700">
                          {getToolIcon(exec.tool_name)}
                        </span>
                        <span className="text-xs font-bold font-mono text-slate-200">
                          {exec.tool_name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {exec.duration_ms}ms
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={exec.status} size="sm" />
                        <button
                          onClick={() => setSelectedToolExecution(exec)}
                          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Inspect full payload"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Output summary */}
                    <div className="text-xs text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 line-clamp-2">
                      {JSON.stringify(exec.tool_output)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live SSE Terminal */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[640px]">
            {/* Terminal Header */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 font-mono">Agent Stream Console</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {isConnected ? 'LIVE SSE' : 'OFFLINE'}
                </span>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-slate-300 overflow-y-auto space-y-2 bg-slate-950/90">
              <div className="text-slate-500 select-none pb-2 border-b border-slate-900">
                // AgentFlow AI Stateful Orchestration Log [task_id={taskId.substring(0, 8)}]
              </div>

              {events.length === 0 ? (
                <div className="text-slate-600 italic py-6 text-center">
                  Listening for graph events...
                </div>
              ) : (
                events.map((evt) => {
                  const tagColors: Record<string, string> = {
                    task_started: 'text-indigo-400',
                    plan_created: 'text-emerald-400 font-bold',
                    step_started: 'text-sky-400',
                    tool_called: 'text-amber-400',
                    tool_result: 'text-emerald-300',
                    approval_required: 'text-amber-300 font-bold bg-amber-500/10 px-1 py-0.5 rounded',
                    approval_resolved: 'text-emerald-400 font-bold',
                    reflection: 'text-purple-400',
                    task_completed: 'text-emerald-400 font-black',
                    task_failed: 'text-rose-400 font-black'
                  };

                  const color = tagColors[evt.eventType] || 'text-slate-400';

                  return (
                    <div key={evt.id} className="flex items-start gap-2 animate-fadeIn hover:bg-slate-900/50 p-1 rounded">
                      <span className="text-slate-600 shrink-0 select-none">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour12: false })}
                      </span>
                      <span className={`shrink-0 ${color}`}>
                        [{evt.eventType.toUpperCase()}]
                      </span>
                      <span className="text-slate-300 break-all">
                        {typeof evt.data === 'string' ? evt.data : JSON.stringify(evt.data)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Footer */}
            <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between shrink-0 font-mono">
              <span>Status: {task?.status || 'PENDING'}</span>
              <span>Events: {events.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ApprovalModal
        request={activeApprovalRequest}
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <ToolInspectorModal
        execution={selectedToolExecution}
        isOpen={Boolean(selectedToolExecution)}
        onClose={() => setSelectedToolExecution(null)}
      />
    </div>
  );
};

