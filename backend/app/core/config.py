from typing import List, Union
import json
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # API Keys
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key")
    TAVILY_API_KEY: str = Field(default="", description="Tavily Web Search API Key")

    # LLM Settings
    LLM_PROVIDER: str = Field(default="gemini", description="LLM provider: gemini or mock")
    GEMINI_MODEL: str = Field(default="gemini-1.5-flash", description="Gemini model name")
    MAX_AGENT_ITERATIONS: int = Field(default=10, description="Max agent reasoning/execution loop iterations")

    # Database
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./agentflow.db", description="SQLAlchemy async DB URL")
    SYNC_DATABASE_URL: str = Field(default="sqlite:///./agentflow.db", description="Sync DB URL for sync tools/checkpoints")

    # Server & Networking
    BACKEND_HOST: str = Field(default="0.0.0.0", description="Backend host")
    BACKEND_PORT: int = Field(default=8000, description="Backend port")
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
        description="Allowed CORS origins"
    )

    # Tool Execution Safety
    TOOL_EXECUTION_TIMEOUT_SECONDS: int = Field(default=30, description="Timeout for individual tool runs")
    REQUIRE_APPROVAL_FOR_SENSITIVE: bool = Field(default=True, description="Pause and ask for approval on sensitive tools")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @property
    def has_gemini_key(self) -> bool:
        return bool(self.GEMINI_API_KEY and len(self.GEMINI_API_KEY.strip()) > 5)

    @property
    def has_tavily_key(self) -> bool:
        return bool(self.TAVILY_API_KEY and len(self.TAVILY_API_KEY.strip()) > 5)


settings = Settings()
