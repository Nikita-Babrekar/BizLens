import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# On Render (or any cloud platform), the root filesystem may be read-only.
# Use /tmp for the SQLite database in production, otherwise use the local directory.
_is_production = os.environ.get("RENDER", "") == "true" or os.environ.get("RENDER_EXTERNAL_URL", "")

if _is_production:
    # Render provides a writable /tmp directory
    SQLALCHEMY_DATABASE_URL = "sqlite:////tmp/bizlens.db"
else:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./bizlens.db"

# connect_args={"check_same_thread": False} is required for SQLite with multi-threaded FastAPI workers
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that yields a database session per request and closes it after completion."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
