from typing import Dict, Any, Callable
from .calculator import calculate
from .datetime_tool import get_current_datetime
from .db_tool import save_task_data, get_task_data, list_task_data
from .web_search import search_web
from .report_tool import generate_report
from .external_action import execute_external_action

# Allowlist of tools available to the agent
TOOL_DEFINITIONS = {
    "web_search": {
        "name": "web_search",
        "description": "Search the web for up-to-date company research, pricing, technical specifications, and news.",
        "parameters": {
            "query": "string (the search query)",
            "max_results": "integer (optional, default 5)"
        },
        "is_sensitive": False
    },
    "calculator": {
        "name": "calculator",
        "description": "Safely perform mathematical and financial calculations (e.g., ROI, cost comparison, token estimates).",
        "parameters": {
            "expression": "string (mathematical expression, e.g. '(15 - 3) * 100 / 30')"
        },
        "is_sensitive": False
    },
    "datetime_tool": {
        "name": "datetime_tool",
        "description": "Retrieve the current date, time, weekday, and ISO timestamp.",
        "parameters": {},
        "is_sensitive": False
    },
    "database_save": {
        "name": "database_save",
        "description": "Persist intermediate research findings or key-value data for the current task in SQLite.",
        "parameters": {
            "key": "string",
            "value": "any JSON-serializable value"
        },
        "is_sensitive": False
    },
    "database_get": {
        "name": "database_get",
        "description": "Retrieve previously saved intermediate research data for the current task by key.",
        "parameters": {
            "key": "string"
        },
        "is_sensitive": False
    },
    "report_generator": {
        "name": "report_generator",
        "description": "Generate a comprehensive, structured Markdown report with findings, comparative tables, and references.",
        "parameters": {
            "title": "string",
            "content_markdown": "string (Markdown formatted content with sections and tables)",
            "sources": "list of objects with title and url"
        },
        "is_sensitive": False
    },
    "external_action": {
        "name": "external_action",
        "description": "Perform an external operation such as drafting an alert, creating a project tracker item, or scheduling a broadcast. SENSITIVE: requires human approval before proceeding.",
        "parameters": {
            "action_type": "string (e.g. 'draft_notification', 'create_task')",
            "action_description": "string",
            "parameters": "dict of parameters"
        },
        "is_sensitive": True
    }
}

__all__ = [
    "calculate",
    "get_current_datetime",
    "save_task_data",
    "get_task_data",
    "list_task_data",
    "search_web",
    "generate_report",
    "execute_external_action",
    "TOOL_DEFINITIONS"
]

