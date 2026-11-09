import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import { ApprovalRequest } from '../types';

interface ApprovalModalProps {
  request: ApprovalRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, reason: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !request) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(request.id, reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(request.id, reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Human Approval Required</h3>
              <p className="text-xs text-amber-400/80 font-medium">Autonomous workflow paused for safety</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Action description banner */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proposed Action</div>
                <div className="text-sm font-medium text-slate-100 mt-0.5">{request.action_description}</div>
                <div className="mt-1 text-xs text-slate-400">
                  Tool: <span className="font-mono text-emerald-400">{request.tool_name}</span> &bull; Action: <span className="font-mono text-sky-400">{request.action_type}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parameters JSON */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Action Parameters Payload
            </label>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300/90 max-h-48 overflow-y-auto">
              <pre>{JSON.stringify(request.parameters, null, 2)}</pre>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Decision Note / Audit Reason <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Approved for internal executive test run"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Decide Later
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Action</span>
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Approve & Resume'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

