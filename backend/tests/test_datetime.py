from app.tools.datetime_tool import get_current_datetime


def test_get_current_datetime():
    res = get_current_datetime()
    assert res["success"] is True
    assert "utc_iso" in res
    assert "date" in res
    assert "time" in res
    assert "day_of_week" in res
    assert res["timestamp"] > 0

