import pytest
from app.tools.calculator import calculate


def test_basic_arithmetic():
    res = calculate("2 + 2")
    assert res["success"] is True
    assert res["result"] == 4

    res = calculate("(10 - 4) * 5 / 2")
    assert res["success"] is True
    assert res["result"] == 15

    res = calculate("2 ** 8")
    assert res["success"] is True
    assert res["result"] == 256


def test_math_functions():
    res = calculate("sqrt(144)")
    assert res["success"] is True
    assert res["result"] == 12

    res = calculate("round(3.14159, 2)")
    assert res["success"] is True
    assert res["result"] == 3.14

    res = calculate("max(10, 25, 5)")
    assert res["success"] is True
    assert res["result"] == 25


def test_division_by_zero():
    res = calculate("10 / 0")
    assert res["success"] is False
    assert "division by zero" in res["error"].lower()


def test_security_eval_prevention():
    # Attempting arbitrary system calls or code injection
    res = calculate("__import__('os').system('ls')")
    assert res["success"] is False

    res = calculate("exec('print(1)')")
    assert res["success"] is False

    res = calculate("open('/etc/passwd')")
    assert res["success"] is False


def test_empty_and_invalid_syntax():
    res = calculate("")
    assert res["success"] is False

    res = calculate("2 +* 5")
    assert res["success"] is False

