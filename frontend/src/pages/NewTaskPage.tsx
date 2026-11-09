import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  ShieldAlert, 
  Calculator, 
  Search, 
  Sliders, 
  HelpCircle,
  FileCheck2,
  ChevronDown,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

interface NewTaskPageProps {
  onTaskCreated: (taskId: string) => void;
}

export const NewTaskPage: React.FC<NewTaskPageProps> = ({ onTaskCreated }) => {
  const [objective, setObjective] = useState('');
  const [maxIterations, setMaxIterations] = useState(10);
  const [allowSensitive, setAllowSensitive] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samplePrompts = [
    {
      title: 'Compare 3 AI Frontier Companies',
      prompt: 'Research three AI companies, compare their products, pricing and features, and prepare a detailed report.',
      badge: 'Comprehensive Research',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Compute Economics & Financial ROI',
      prompt: 'Calculate the total cost of ownership and financial ROI between hosted API tokens and dedicated GPU infrastructure, then save findings.',
      badge: 'Math & Financials',
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'Market Audit + Human Approval Action',
      prompt: 'Research competitive AI agent orchestration frameworks, compile benchmark findings, and draft an executive broadcast notification.',
      badge: 'Triggers Human Sign-off',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Deep Multi-Model Feature Benchmark',
      prompt: 'Analyze Claude 3.5 Sonnet, GPT-4o, and Gemini 1.5 Pro across context window size, latency, tool use, and generate a structured comparison report.',
      badge: 'Report Generation',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) {
      setError('Please provide a task objective in natural language.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const task = await api.createTask(
        objective.trim(),
        maxIterations,
        allowSensitive
      );
      onTaskCreated(task.id);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize agent task');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous Multi-Step Goal Planner
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Initialize New Agent Execution
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Describe the desired outcome. The agent's planner node will break down your goal into atomic steps, query specialized tools, evaluate observations, and synthesize verified outputs.
        </p>
      </div>

      {/* Main Task Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Objective & Task Instructions
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {objective.length} characters
            </span>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={objective}
              onChange={(e) => {
                setObjective(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Research three AI companies, compare their products, pricing and features, and prepare a detailed report..."
              className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-sans leading-relaxed resize-y"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Advanced Configuration Accordion */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Execution Guardrails & Settings</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                {/* Max Iterations */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-300">Max Reasoning Loop Iterations</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{maxIterations}</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Prevents runaway execution cycles and token runaway.</p>
                </div>

                {/* Human Approval Simulation */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="allowSensitive"
                    checked={allowSensitive}
                    onChange={(e) => setAllowSensitive(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500/50"
                  />
                  <label htmlFor="allowSensitive" className="cursor-pointer">
                    <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <span>Enable Sensitive Tool Actions</span>
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Allows planning steps that pause the workflow to request human admin authorization.
                    </p>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || !objective.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Formulating Graph Plan...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Execute Autonomous Agent</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Template Prompts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>One-Click Template Objectives</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {samplePrompts.map((sample, idx) => (
            <div
              key={idx}
              onClick={() => {
                setObjective(sample.prompt);
                if (error) setError(null);
              }}
              className="p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {sample.title}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-medium ${sample.badgeColor}`}>
                  {sample.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {sample.prompt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

