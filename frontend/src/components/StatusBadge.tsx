import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  Play, 
  XCircle,
  FileText
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  showIcon = true 
}) => {
  const normStatus = (status || 'PENDING').toUpperCase();

  const configs: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      icon: CheckCircle2,
    },
    SUCCESS: {
      label: 'Success',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      icon: CheckCircle2,
    },
    EXECUTING: {
      label: 'Executing',
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/20',
      icon: Play,
    },
    RUNNING: {
      label: 'Running',
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/20',
      icon: Play,
    },
    PLANNING: {
      label: 'Planning',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      icon: Clock,
    },
    WAITING_APPROVAL: {
      label: 'Approval Required',
      bg: 'bg-amber-500/15 animate-pulse',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: ShieldAlert,
    },
    PENDING: {
      label: 'Pending',
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700',
      icon: Clock,
    },
    FAILED: {
      label: 'Failed',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      icon: AlertCircle,
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      icon: XCircle,
    },
    APPROVED: {
      label: 'Approved',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      icon: CheckCircle2,
    },
    SKIPPED: {
      label: 'Skipped',
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700',
      icon: FileText,
    }
  };

  const current = configs[normStatus] || configs.PENDING;
  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium'
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]}`}>
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{current.label}</span>
    </span>
  );
};

