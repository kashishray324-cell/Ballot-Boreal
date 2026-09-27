from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./ballot_boreal.db"
    database_direct_url: str | None = None
    database_url_unpooled: str | None = None
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
        direct_url = self.database_direct_url or self.database_url_unpooled or self.database_url
        return self._as_async_url(direct_url)

    @staticmethod
    def _as_async_url(url: str) -> str:
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        else:
            return url

        # SQLAlchemy expands URL query values into asyncpg keyword arguments.
        # Translate Neon's libpq-style SSL option and discard channel binding,
        # which asyncpg does not implement, while preserving encrypted transport.
        parts = urlsplit(url)
        query = parse_qsl(parts.query, keep_blank_values=True)
        ssl_mode = next((value for key, value in query if key == "sslmode"), None)
        normalized = [(key, value) for key, value in query if key not in {"sslmode", "channel_binding"}]
        if ssl_mode and not any(key == "ssl" for key, _ in normalized):
            normalized.append(("ssl", ssl_mode))
        return urlunsplit(parts._replace(query=urlencode(normalized)))


@lru_cache
def get_settings() -> Settings:
    return Settings()
