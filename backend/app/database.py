from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from .config import get_settings
from .models import Base

settings = get_settings()
engine = create_async_engine(settings.database_url, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session():
    async with SessionLocal() as session:
        yield session


async def init_models() -> None:
    if settings.environment == "development" and settings.database_url.startswith("sqlite"):
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
