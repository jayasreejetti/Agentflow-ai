# AgentFlow AI – Autonomous Research & Workflow Agent

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jayasreejetti/Agentflow-ai)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Stateful_Graph-FF6F00.svg?style=flat)](https://github.com/langchain-ai/langgraph)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**AgentFlow AI** is a production-grade, stateful Agentic AI platform built with **LangGraph**, **FastAPI**, and **React**. It accepts complex natural language objectives, autonomously plans multi-step execution graphs, selects and runs tools in sequence, checks progress via reflection loops, and features **Human-in-the-Loop (HITL) approval gates** for sensitive operations.

---

## 🌟 Key Features

- **Autonomous Goal Planning:** Decomposes natural language requests into structured execution steps with assigned specialized tools.
- **Stateful LangGraph Orchestration:** Graph-driven state machine with checkpointing, reflection, conditional branching, and automatic loop prevention.
- **Human-in-the-Loop (HITL) Safety:** Pauses execution prior to triggering sensitive tools. Displays proposed parameters in the **Approval Center** and **Live Stream Console** for one-click approval or rejection.
- **Comprehensive Tool Ecosystem:**
  - 🔍 **Web Search Tool:** Connects to Tavily API with prompt injection defense (`sanitize_search_content`).
  - 🧮 **Safe Calculator Tool:** Pure Python Abstract Syntax Tree (`ast.parse`) evaluation. No `eval()` or code execution risk.
  - 🕒 **Date & Time Tool:** Real-time temporal context and timezone conversions.
  - 💾 **Task Database Tool:** Task-scoped persistent key-value store in SQLite.
  - 📑 **Report Generation Tool:** Synthesizes comprehensive, structured Markdown reports with citations.
  - 🛡️ **Simulated External Action Tool:** Safe external action execution behind administrative approval gates.
- **Real-Time Live Execution Stream:** Server-Sent Events (SSE) stream terminal logs, step transitions, and tool payloads directly to the browser.
- **Interactive SaaS Dashboard:** Modern dark-mode interface with KPI metrics, task history, live execution stepper, and report reader with `.md` downloads.

---

## 🏗️ Project Structure

```
AgentFlow AI/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST & SSE routers (tasks, approvals, reports, health)
│   │   ├── core/            # Configuration & environment settings
│   │   ├── database/        # SQLAlchemy engine, session maker, and schema initialization
│   │   ├── graph/           # LangGraph state machine, nodes, and compiled workflow
│   │   ├── models/          # SQLAlchemy ORM models (Task, TaskStep, ToolExecution, etc.)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Orchestrator, LLM factory, and SSE event manager
│   │   ├── tools/           # Calculator, Web Search, DateTime, Database, and Report tools
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # 19 comprehensive pytest test cases
│   ├── requirements.txt     # Python backend dependencies
│   ├── .env.example         # Environment template
│   └── pytest.ini           # Pytest configuration
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, StatusBadge, MarkdownRenderer, Modals
│   │   ├── hooks/           # useTaskEventSource hook for real-time SSE streaming
│   │   ├── pages/           # Dashboard, NewTask, LiveExecution, Approvals, Reports
│   │   ├── services/        # Fetch API client
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # Application root
│   │   └── main.tsx         # React bootstrap
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/
│   └── architecture.md      # Detailed system design & Mermaid architecture diagrams
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** & **npm** installed

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
```

Edit `backend/.env` to optionally add your API keys:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-1.5-flash
MAX_AGENT_ITERATIONS=10
```
> **Note:** If API keys are left blank, AgentFlow AI runs with its high-fidelity simulated reasoning and search engine so the entire application can be tested immediately out of the box!

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Build the frontend assets
npm run build
```

### 4. Running the Application

You can run the full-stack application in two ways:

#### Option A: Unified Server (FastAPI serves built React frontend)
```bash
# In backend/ (with venv activated)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser!

#### Option B: Dual Development Server (Vite Hot-Reload + FastAPI)
```bash
# Terminal 1: Backend
cd backend
.\venv\Scripts\activate
python -m uvicorn app.main:app --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🧪 Running Automated Tests

All 19 test cases verify planner output validation, tool execution safety, database persistence, approval workflows, and error handling:

```bash
cd backend
$env:PYTHONPATH="backend"
.\venv\Scripts\pytest backend\tests -v
```

All 19 tests pass cleanly:
```
backend/tests/test_api.py::test_health_endpoint PASSED
backend/tests/test_api.py::test_task_creation_and_retrieval PASSED
backend/tests/test_api.py::test_task_listing PASSED
backend/tests/test_api.py::test_dashboard_stats PASSED
backend/tests/test_api.py::test_approval_workflow PASSED
backend/tests/test_api.py::test_report_endpoints PASSED
backend/tests/test_api.py::test_not_found_errors PASSED
backend/tests/test_calculator.py::test_basic_arithmetic PASSED
backend/tests/test_calculator.py::test_math_functions PASSED
backend/tests/test_calculator.py::test_division_by_zero PASSED
backend/tests/test_calculator.py::test_security_eval_prevention PASSED
backend/tests/test_calculator.py::test_empty_and_invalid_syntax PASSED
backend/tests/test_database.py::test_task_data_persistence PASSED
backend/tests/test_database.py::test_missing_key PASSED
backend/tests/test_datetime.py::test_get_current_datetime PASSED
backend/tests/test_planner.py::test_planner_output_validation PASSED
backend/tests/test_planner.py::test_tool_selection PASSED
backend/tests/test_web_search.py::test_sanitize_search_content_injection_defense PASSED
backend/tests/test_web_search.py::test_search_web_execution PASSED
================ 19 passed in 3.45s ================
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/tasks` | Create and immediately launch an autonomous task |
| `GET` | `/api/tasks` | List previous agent execution summaries |
| `GET` | `/api/tasks/{task_id}` | Retrieve full task state, step history, and tool outputs |
| `GET` | `/api/tasks/{task_id}/events` | **Server-Sent Events (SSE)** real-time stream |
| `GET` | `/api/tasks/dashboard/stats` | Aggregated KPI metrics (total, completed, failed, pending) |
| `GET` | `/api/approvals` | List pending and historical human approval requests |
| `POST` | `/api/approvals/{id}/approve` | Approve a sensitive action and resume LangGraph |
| `POST` | `/api/approvals/{id}/reject` | Reject a sensitive action with operator feedback |
| `GET` | `/api/reports` | List generated intelligence reports |
| `GET` | `/api/reports/{id}` | Retrieve markdown report content and sources |
| `GET` | `/api/reports/{id}/download` | Download report as a `.md` file attachment |
| `GET` | `/api/health` | Health check & provider status |

---

## 🔒 Security & Safe Execution Design

1. **AST Math Engine:** The calculator uses Python `ast` syntax parsing. It completely forbids `eval()`, `exec()`, or system calls, and rejects large-power Denial of Service attacks.
2. **Tool Allowlisting:** Only tools registered in `TOOL_DEFINITIONS` can be executed by the agent node.
3. **Prompt Injection Mitigation:** Scraped web snippets are sanitized with regex to neutralize override directives (e.g. `Ignore previous instructions`).
4. **Execution Boundaries:** No unrestricted filesystem access or arbitrary shell command execution.
5. **Human Approval Interrupts:** Any action with `is_sensitive=True` checkpoints the workflow until approved by a human operator.

