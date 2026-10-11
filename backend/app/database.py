from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

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
