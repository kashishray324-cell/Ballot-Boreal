from app.config import Settings


def test_neon_url_is_normalized_for_sqlalchemy_asyncpg():
    settings = Settings(
        database_url=(
            "postgresql://voter:secret@example-pooler.neon.tech/ballot"
            "?sslmode=require&channel_binding=require"
        )
    )
    assert settings.async_database_url == (
        "postgresql+asyncpg://voter:secret@example-pooler.neon.tech/ballot?ssl=require"
    )


def test_migrations_prefer_standard_unpooled_neon_url():
    settings = Settings(
        database_url="postgresql://voter:secret@example-pooler.neon.tech/ballot?sslmode=require",
        database_url_unpooled="postgresql://voter:secret@example.neon.tech/ballot?sslmode=require",
    )
    assert "example.neon.tech" in settings.migration_database_url
    assert "example-pooler.neon.tech" not in settings.migration_database_url
