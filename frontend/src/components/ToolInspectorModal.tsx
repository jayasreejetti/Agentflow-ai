import React from 'react';
import { Terminal, Clock, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ToolExecution } from '../types';

interface ToolInspectorModalProps {
  execution: ToolExecution | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ToolInspectorModal: React.FC<ToolInspectorModalProps> = ({
  execution,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !execution) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 font-mono">{execution.tool_name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  {execution.duration_ms}ms
                </span>
              </div>
              <p className="text-xs text-slate-400">Detailed Tool Invocation & Output Payload</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className={`font-semibold flex items-center gap-1 ${execution.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {execution.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {execution.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(execution.created_at).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Tool Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Input Arguments</span>
              <span className="text-xs text-slate-500 font-mono">JSON</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-sky-300 max-h-48 overflow-y-auto">
              <pre>{JSON.stringify(execution.tool_input, null, 2)}</pre>
            </div>
          </div>

          {/* Tool Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Output Result</span>
              <span className="text-xs text-slate-500 font-mono">JSON</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-emerald-300/90 max-h-64 overflow-y-auto">
              <pre>{JSON.stringify(execution.tool_output, null, 2)}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

