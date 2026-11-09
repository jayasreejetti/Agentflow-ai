from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# SQLite synchronous engine configured with check_same_thread=False and timeout for concurrency
engine = create_engine(
    settings.SYNC_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False, "timeout": 30} if "sqlite" in settings.SYNC_DATABASE_URL else {}
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False
)

# For backward compatibility with existing imports
sync_engine = engine
SyncSessionLocal = SessionLocal

Base = declarative_base()


def get_db():
    """Dependency for FastAPI route handlers."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def get_sync_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_db():
    Base.metadata.create_all(bind=engine)
