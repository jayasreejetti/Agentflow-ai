import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  BrainCircuit,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { SystemHealth } from '../types';

interface NavbarProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activePage }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch((err) => console.error('Health fetch error:', err));

    const interval = setInterval(() => {
      api.getHealth().then(setHealth).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const pageTitles: Record<string, string> = {
    dashboard: 'System Overview & Execution Metrics',
    newTask: 'Create Autonomous Agent Task',
    execution: 'Live Workflow Orchestration',
    approvals: 'Human-in-the-Loop Approval Center',
    reports: 'Intelligence Reports & Research Repository'
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Branding & Current Page */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-100 flex items-center gap-1.5">
              AgentFlow <span className="text-emerald-400 text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-mono">AI</span>
            </span>
          </div>
        </div>

        <div className="hidden md:block h-4 w-px bg-slate-800" />

        <div className="hidden md:block">
          <span className="text-xs font-medium text-slate-400">
            {pageTitles[activePage] || 'Autonomous Agent Engine'}
          </span>
        </div>
      </div>

      {/* Right: System Status Badges & Quick Action */}
      <div className="flex items-center gap-3">
        {/* Status Indicators */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Gemini LLM Pill */}
          <div 
            title={health?.providers.gemini.configured ? 'Google Gemini API Connected' : 'Running in Simulated/Test LLM Mode'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300"
          >
            <BrainCircuit className={`w-3.5 h-3.5 ${health?.providers.gemini.configured ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>Gemini:</span>
            <span className={health?.providers.gemini.configured ? 'text-emerald-400' : 'text-amber-400'}>
              {health?.providers.gemini.configured ? 'Live' : 'Simulated'}
            </span>
          </div>

          {/* Tavily Search Pill */}
          <div 
            title={health?.providers.tavily.configured ? 'Tavily Web Search Live' : 'Simulated Research Knowledge Engine'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300"
          >
            <Search className={`w-3.5 h-3.5 ${health?.providers.tavily.configured ? 'text-emerald-400' : 'text-sky-400'}`} />
            <span>Search:</span>
            <span className={health?.providers.tavily.configured ? 'text-emerald-400' : 'text-sky-400'}>
              {health?.providers.tavily.configured ? 'Tavily' : 'Sandbox'}
            </span>
          </div>

          {/* HITL Safety Mode */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HITL Guard Active</span>
          </div>
        </div>

        {/* New Task CTA */}
        {activePage !== 'newTask' && (
          <button
            onClick={() => onNavigate('newTask')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Task</span>
          </button>
        )}
      </div>
    </header>
  );
};

