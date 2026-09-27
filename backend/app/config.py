from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./ballot_boreal.db"
    database_direct_url: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    allowed_origins: str = "http://localhost:5173"
    public_api_rate_limit: int = 60

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def async_database_url(self) -> str:
        return self._as_async_url(self.database_url)

    @property
    def migration_database_url(self) -> str:
        """Prefer Neon's direct URL for migrations and keep asyncpg as the only driver."""
        return self._as_async_url(self.database_direct_url or self.database_url)

    @staticmethod
    def _as_async_url(url: str) -> str:
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
