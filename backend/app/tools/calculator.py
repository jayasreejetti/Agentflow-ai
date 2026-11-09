import ast
import operator
import math
from typing import Dict, Any, Union

# Allowed operators in safe AST evaluation
SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

# Allowed math functions
SAFE_FUNCTIONS = {
    "abs": abs,
    "round": round,
    "min": min,
    "max": max,
    "sum": sum,
    "sqrt": math.sqrt,
    "log": math.log,
    "log10": math.log10,
    "ceil": math.ceil,
    "floor": math.floor,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "pi": math.pi,
    "e": math.e,
}


def _safe_eval_node(node: ast.AST) -> Union[int, float]:
    """Recursively evaluate an AST node safely without calling eval()."""
    if isinstance(node, ast.Constant):  # Python 3.8+ numbers/constants
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant type: {type(node.value)}")

    elif isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in SAFE_OPERATORS:
            raise ValueError(f"Operator {op_type.__name__} is not allowed")
        left = _safe_eval_node(node.left)
        right = _safe_eval_node(node.right)

        # Guard against power attacks like 99999999 ** 99999999
        if op_type == ast.Pow:
            if right > 1000 or (left > 1000 and right > 10):
                raise ValueError("Exponent or base is too large (computation limit exceeded)")

        # Guard against division by zero
        if op_type in (ast.Div, ast.FloorDiv, ast.Mod) and right == 0:
            raise ZeroDivisionError("Division by zero")

        return SAFE_OPERATORS[op_type](left, right)

    elif isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in SAFE_OPERATORS:
            raise ValueError(f"Unary operator {op_type.__name__} is not allowed")
        operand = _safe_eval_node(node.operand)
        return SAFE_OPERATORS[op_type](operand)

    elif isinstance(node, ast.Call):
        if not isinstance(node.func, ast.Name):
            raise ValueError("Only standard mathematical function calls are allowed")
        func_name = node.func.id.lower()
        if func_name not in SAFE_FUNCTIONS:
            raise ValueError(f"Function '{func_name}' is not in the allowed math functions list")
        args = [_safe_eval_node(arg) for arg in node.args]
        func = SAFE_FUNCTIONS[func_name]
        return func(*args)

    elif isinstance(node, ast.Name):
        name = node.id.lower()
        if name in ("pi", "e"):
            return SAFE_FUNCTIONS[name]
        raise ValueError(f"Variable '{node.id}' is not allowed in calculation")

    else:
        raise ValueError(f"Unsupported expression node: {type(node).__name__}")


def calculate(expression: str) -> Dict[str, Any]:
    """
    Safely evaluate mathematical expressions using AST parsing.
    Guarantees no arbitrary code execution or eval() is used.
    """
    if not expression or not expression.strip():
        return {"success": False, "error": "Empty expression provided"}

    # Basic length limitation to avoid ReDoS or memory exhaustion
    clean_expr = expression.strip()
    if len(clean_expr) > 200:
        return {"success": False, "error": "Expression exceeds maximum length of 200 characters"}

    try:
        parsed = ast.parse(clean_expr, mode="eval")
        result = _safe_eval_node(parsed.body)
        
        # Format floating points nicely if integer-like
        if isinstance(result, float) and result.is_integer():
            formatted_result = int(result)
        elif isinstance(result, float):
            formatted_result = round(result, 6)
        else:
            formatted_result = result

        return {
            "success": True,
            "expression": clean_expr,
            "result": formatted_result,
            "formatted": f"{clean_expr} = {formatted_result}"
        }
    except ZeroDivisionError:
        return {"success": False, "error": "Division by zero is undefined", "expression": clean_expr}
    except (SyntaxError, ValueError) as e:
        return {"success": False, "error": f"Invalid math expression: {str(e)}", "expression": clean_expr}
    except Exception as e:
        return {"success": False, "error": f"Calculation error: {str(e)}", "expression": clean_expr}

