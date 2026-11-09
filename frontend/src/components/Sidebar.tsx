import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Cpu, 
  ShieldAlert, 
  FileText, 
  BookOpen, 
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  selectedTaskId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activePage, 
  onNavigate, 
  selectedTaskId 
}) => {
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  useEffect(() => {
    const fetchPending = () => {
      api.getApprovals('PENDING')
        .then((items) => setPendingApprovalsCount(items.length))
        .catch(() => {});
    };

    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'newTask',
      label: 'New Task',
      icon: PlusCircle,
      badge: null,
    },
    {
      id: 'execution',
      label: 'Live Execution',
      icon: Cpu,
      badge: selectedTaskId ? 'Active' : null,
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
    {
      id: 'approvals',
      label: 'Approval Center',
      icon: ShieldAlert,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950 flex flex-col shrink-0 h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Orchestration Hub
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-800/90 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Agent Capabilities
        </div>

        <div className="p-3 mx-1 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stateful LangGraph</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Multi-node graph with checkpointing, safe calculator AST, web search, reflection, and human approval interrupts.
          </p>
        </div>
      </div>

      {/* Footer / System Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-medium text-slate-300">LangGraph v0.2</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

