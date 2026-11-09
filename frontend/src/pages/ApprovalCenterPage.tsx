import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { ApprovalRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ApprovalCenterPageProps {
  onNavigate: (page: string, taskId?: string) => void;
}

export const ApprovalCenterPage: React.FC<ApprovalCenterPageProps> = ({ onNavigate }) => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const data = await api.getApprovals(filter === 'ALL' ? undefined : filter);
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
    const interval = setInterval(loadApprovals, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleApprove = async (id: string, taskId: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const note = decisionNotes[id] || 'Approved from Approval Center';
      await api.approveAction(id, note);
      await loadApprovals();
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: string, taskId: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const note = decisionNotes[id] || 'Rejected from Approval Center';
      await api.rejectAction(id, note);
      await loadApprovals();
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Human-in-the-Loop Safety Gate
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Approval Center
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Audit sensitive operations before they take effect. The agent's stateful LangGraph pauses until an authorized operator approves or rejects the action.
          </p>
        </div>

        <button
          onClick={loadApprovals}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === tab
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>{tab === 'ALL' ? 'All Requests' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
            {tab === 'PENDING' && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {approvals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-slate-800/60 text-slate-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-sm font-semibold text-slate-200">
              No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests found
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filter === 'PENDING'
                ? 'All autonomous agent workflows are executing smoothly with zero actions blocked.'
                : 'No historical approval requests match this filter.'}
            </p>
          </div>
        ) : (
          approvals.map((req) => {
            const isPending = req.status === 'PENDING';
            const isBusy = actionLoading[req.id];

            return (
              <div
                key={req.id}
                className={`p-6 rounded-2xl bg-slate-900/70 border transition-all space-y-4 shadow-xl ${
                  isPending
                    ? 'border-amber-500/40 shadow-amber-500/5 glow-amber'
                    : 'border-slate-800'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={req.status} size="md" />
                    <span className="text-xs font-mono text-slate-400">
                      Tool: <span className="font-bold text-slate-200">{req.tool_name}</span> &bull; Action: <span className="text-sky-400">{req.action_type}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {new Date(req.requested_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => onNavigate('execution', req.task_id)}
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      <span>View Task</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {req.action_description}
                  </h3>
                  {req.decision_reason && (
                    <p className="text-xs text-slate-400 mt-1 italic">
                      Decision Note: "{req.decision_reason}"
                    </p>
                  )}
                </div>

                {/* Parameters JSON */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Proposed Parameters
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300/90 max-h-48 overflow-y-auto">
                    <pre>{JSON.stringify(req.parameters, null, 2)}</pre>
                  </div>
                </div>

                {/* Decision Actions (for Pending) */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Optional decision note for audit logs..."
                      value={decisionNotes[req.id] || ''}
                      onChange={(e) => setDecisionNotes({ ...decisionNotes, [req.id]: e.target.value })}
                      className="flex-1 min-w-[240px] px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(req.id, req.task_id)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprove(req.id, req.task_id)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isBusy ? 'Resuming...' : 'Approve & Resume'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

