import uuid
from app.tools.db_tool import save_task_data, get_task_data, list_task_data
from app.database.session import sync_engine, Base


def setup_module():
    Base.metadata.create_all(bind=sync_engine)


def test_task_data_persistence():
    task_id = str(uuid.uuid4())
    
    # Save data
    save_res = save_task_data(task_id, "competitor_prices", {"openai": 2.5, "anthropic": 3.0})
    assert save_res["success"] is True

    # Get data
    get_res = get_task_data(task_id, "competitor_prices")
    assert get_res["success"] is True
    assert get_res["value"]["openai"] == 2.5
    assert get_res["value"]["anthropic"] == 3.0

    # List data
    list_res = list_task_data(task_id)
    assert list_res["success"] is True
    assert list_res["count"] == 1
    assert "competitor_prices" in list_res["data"]


def test_missing_key():
    task_id = str(uuid.uuid4())
    get_res = get_task_data(task_id, "non_existent_key")
    assert get_res["success"] is False
    assert get_res["found"] is False

