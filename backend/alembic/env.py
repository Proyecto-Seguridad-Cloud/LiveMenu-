import asyncio
from logging.config import fileConfig
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context
from app.core.config import settings
from app.db.base import Base
from app.models import user  

config = context.config
fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.connect() as connection:
        await connection.run_sync(
            lambda conn: context.configure(
                connection=conn,
                target_metadata=target_metadata,
            )
        )
        async with connection.begin():
            await connection.run_sync(lambda conn: context.run_migrations())

def run_async_migrations() -> None:
    asyncio.run(run_migrations_online())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_async_migrations()