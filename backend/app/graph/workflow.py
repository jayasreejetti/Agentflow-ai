from typing import Literal
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from app.graph.state import AgentWorkflowState
from app.graph.nodes import (
    planner_node,
    agent_node,
    approval_node,
    tool_execution_node,
    reflection_node,
    final_response_node
)


def route_after_agent(state: AgentWorkflowState) -> Literal["final_response_node", "approval_node", "tool_execution_node"]:
    """
    Decide whether to execute tool, request approval, or proceed to final response.
    """
    if state.get("is_completed", False) or not state.get("active_tool_call"):
        return "final_response_node"

    tool_call = state.get("active_tool_call", {})
    is_sensitive = tool_call.get("is_sensitive", False)
    approval_status = state.get("approval_status")

    if is_sensitive and approval_status is None:
        return "approval_node"

    return "tool_execution_node"


def route_after_approval(state: AgentWorkflowState) -> Literal["tool_execution_node", "__end__"]:
    """
    If human approval was submitted, proceed to tool execution.
    If still pending, pause workflow (return to END with state saved in checkpointer).
    """
    approval_status = state.get("approval_status")
    if approval_status in ("APPROVED", "REJECTED"):
        return "tool_execution_node"
    # Workflow pauses here awaiting human approval
    return "__end__"


def route_after_reflection(state: AgentWorkflowState) -> Literal["final_response_node", "agent_node"]:
    """
    If all steps done or max iterations reached, wrap up with final response.
    Otherwise, loop back to agent node for next step.
    """
    if state.get("is_completed", False):
        return "final_response_node"
    return "agent_node"


def create_agent_graph():
    """Build and compile the LangGraph agent workflow graph with checkpointing."""
    builder = StateGraph(AgentWorkflowState)

    # Add Nodes
    builder.add_node("planner_node", planner_node)
    builder.add_node("agent_node", agent_node)
    builder.add_node("approval_node", approval_node)
    builder.add_node("tool_execution_node", tool_execution_node)
    builder.add_node("reflection_node", reflection_node)
    builder.add_node("final_response_node", final_response_node)

    # Add Edges
    builder.add_edge(START, "planner_node")
    builder.add_edge("planner_node", "agent_node")

    builder.add_conditional_edges(
        "agent_node",
        route_after_agent,
        {
            "final_response_node": "final_response_node",
            "approval_node": "approval_node",
            "tool_execution_node": "tool_execution_node"
        }
    )

    builder.add_conditional_edges(
        "approval_node",
        route_after_approval,
        {
            "tool_execution_node": "tool_execution_node",
            "__end__": END
        }
    )

    builder.add_edge("tool_execution_node", "reflection_node")

    builder.add_conditional_edges(
        "reflection_node",
        route_after_reflection,
        {
            "final_response_node": "final_response_node",
            "agent_node": "agent_node"
        }
    )

    builder.add_edge("final_response_node", END)

    # Use MemorySaver checkpointer so graph state can be paused and resumed
    checkpointer = MemorySaver()
    graph = builder.compile(checkpointer=checkpointer)
    return graph


# Singleton compiled graph instance
agent_graph = create_agent_graph()

