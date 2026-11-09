from fastapi import APIRouter
from .tasks import router as tasks_router
from .approvals import router as approvals_router
from .reports import router as reports_router
from .health import router as health_router

api_router = APIRouter(prefix="/api")
api_router.include_router(tasks_router)
api_router.include_router(approvals_router)
api_router.include_router(reports_router)
api_router.include_router(health_router)

__all__ = ["api_router"]

