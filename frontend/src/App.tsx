import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { NewTaskPage } from './pages/NewTaskPage';
import { LiveExecutionPage } from './pages/LiveExecutionPage';
import { ApprovalCenterPage } from './pages/ApprovalCenterPage';
import { ReportsPage } from './pages/ReportsPage';

export function App() {
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleNavigate = (page: string, id?: string) => {
    setActivePage(page);
    if (page === 'execution' && id) {
      setSelectedTaskId(id);
    } else if (page === 'reports' && id) {
      setSelectedReportId(id);
    }
  };

  const handleTaskCreated = (newTaskId: string) => {
    setSelectedTaskId(newTaskId);
    setActivePage('execution');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <Navbar onNavigate={handleNavigate} activePage={activePage} />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          selectedTaskId={selectedTaskId}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950/50">
          {activePage === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} />
          )}

          {activePage === 'newTask' && (
            <NewTaskPage onTaskCreated={handleTaskCreated} />
          )}

          {activePage === 'execution' && (
            <LiveExecutionPage
              taskId={selectedTaskId}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'approvals' && (
            <ApprovalCenterPage onNavigate={handleNavigate} />
          )}

          {activePage === 'reports' && (
            <ReportsPage
              initialReportId={selectedReportId}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

