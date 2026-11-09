from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.database.session import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def check_health(db: Session = Depends(get_db)):
    """
    Application health and configuration status.
    """
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "service": "AgentFlow AI",
        "version": "1.0.0",
        "database": {
            "connected": db_ok,
            "engine": "sqlite"
        },
        "providers": {
            "gemini": {
                "configured": settings.has_gemini_key,
                "model": settings.GEMINI_MODEL
            },
            "tavily": {
                "configured": settings.has_tavily_key
            }
        },
        "safety": {
            "human_in_the_loop_enabled": settings.REQUIRE_APPROVAL_FOR_SENSITIVE,
            "max_agent_iterations": settings.MAX_AGENT_ITERATIONS,
            "calculator_safe_ast": True
        }
    }
