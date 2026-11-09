export interface PlanStep {
  step_number: number;
  title: string;
  description: string;
  tool_name: string | null;
  is_sensitive: boolean;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
}

export interface TaskStep {
  id: string;
  task_id: string;
  step_number: number;
  title: string;
  description: string | null;
  tool_name: string | null;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  result: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ToolExecution {
  id: string;
  task_id: string;
  step_id?: string | null;
  tool_name: string;
  tool_input: Record<string, any>;
  tool_output: Record<string, any>;
  duration_ms: number;
  is_sensitive: boolean;
  status: 'SUCCESS' | 'FAILED' | 'PENDING_APPROVAL' | 'REJECTED';
  error_message?: string | null;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  task_id: string;
  tool_execution_id?: string | null;
  tool_name: string;
  action_type: string;
  action_description: string;
  parameters: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decision_reason?: string | null;
  requested_at: string;
  decided_at?: string | null;
}

export interface GeneratedReport {
  id: string;
  task_id: string;
  title: string;
  content_markdown: string;
  sources: Array<{ title: string; url: string }>;
  created_at: string;
}

export interface ReportSummary {
  id: string;
  task_id: string;
  title: string;
  sources_count: number;
  created_at: string;
}

export interface Task {
  id: string;
  objective: string;
  status: 'PENDING' | 'PLANNING' | 'EXECUTING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED';
  execution_plan: PlanStep[];
  current_step_index: number;
  final_summary?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  steps: TaskStep[];
  tool_executions: ToolExecution[];
  approval_requests?: ApprovalRequest[];
  reports?: GeneratedReport[];
}

export interface TaskSummary {
  id: string;
  objective: string;
  status: 'PENDING' | 'PLANNING' | 'EXECUTING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED';
  current_step_index: number;
  total_steps: number;
  has_pending_approval: boolean;
  has_report: boolean;
  created_at: string;
  completed_at?: string | null;
}

export interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  pending_approvals: number;
  active_tasks: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  service: string;
  version: string;
  database: {
    connected: boolean;
    engine: string;
  };
  providers: {
    gemini: {
      configured: boolean;
      model: string;
    };
    tavily: {
      configured: boolean;
    };
  };
  safety: {
    human_in_the_loop_enabled: boolean;
    max_agent_iterations: number;
    calculator_safe_ast: boolean;
  };
}

export interface SSEEventPayload {
  task_id: string;
  event_type: string;
  timestamp: string;
  data: any;
}

