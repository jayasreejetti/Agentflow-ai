import {
  Task,
  TaskSummary,
  DashboardStats,
  ApprovalRequest,
  GeneratedReport,
  ReportSummary,
  SystemHealth
} from '../types';

const API_BASE = '/api';

export const api = {
  // Tasks
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/tasks/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getTasks(limit = 50, offset = 0): Promise<TaskSummary[]> {
    const res = await fetch(`${API_BASE}/tasks?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getTask(id: string): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}`);
    if (!res.ok) throw new Error('Failed to fetch task details');
    return res.json();
  },

  async createTask(
    objective: string,
    maxIterations?: number,
    allowSensitiveSimulation: boolean = true
  ): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objective,
        max_iterations: maxIterations,
        allow_sensitive_simulation: allowSensitiveSimulation
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to initialize agent task');
    }
    return res.json();
  },

  // Approvals
  async getApprovals(status?: string): Promise<ApprovalRequest[]> {
    const url = status ? `${API_BASE}/approvals?status=${status}` : `${API_BASE}/approvals`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch approval requests');
    return res.json();
  },

  async approveAction(approvalId: string, reason?: string): Promise<ApprovalRequest> {
    const res = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision_reason: reason || '' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to approve action');
    }
    return res.json();
  },

  async rejectAction(approvalId: string, reason?: string): Promise<ApprovalRequest> {
    const res = await fetch(`${API_BASE}/approvals/${approvalId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision_reason: reason || '' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to reject action');
    }
    return res.json();
  },

  // Reports
  async getReports(): Promise<ReportSummary[]> {
    const res = await fetch(`${API_BASE}/reports`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async getReport(reportId: string): Promise<GeneratedReport> {
    const res = await fetch(`${API_BASE}/reports/${reportId}`);
    if (!res.ok) throw new Error('Failed to fetch report content');
    return res.json();
  },

  getDownloadUrl(reportId: string): string {
    return `${API_BASE}/reports/${reportId}/download`;
  },

  // Health
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  }
};

