from app.services.llm_factory import llm_service


def _run_coroutine(coro):
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value
    return None


def test_planner_output_validation():
    objective = "Research three AI companies, compare their products, pricing and features, and prepare a detailed report."
    plan = _run_coroutine(llm_service.generate_plan(objective))

    assert isinstance(plan, list)
    assert len(plan) >= 3

    for step in plan:
        assert "step_number" in step
        assert "title" in step
        assert "description" in step
        assert "tool_name" in step


def test_tool_selection():
    objective = "Calculate ROI for cloud infrastructure"
    plan = _run_coroutine(llm_service.generate_plan(objective))

    valid_tools = {"datetime_tool", "web_search", "calculator", "database_save", "report_generator", "external_action", None}
    for step in plan:
        assert step.get("tool_name") in valid_tools
