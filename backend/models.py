from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./voicemint.db")

# Fix per Supabase/PostgreSQL — la connection string inizia con postgres:// ma SQLAlchemy vuole postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# connect_args solo per SQLite
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True)
    hashed_password = Column(String)
    tier = Column(String, default="free")
    monthly_usage = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    pro_until = Column(DateTime, nullable=True)  # per utenti 51-100
    lifetime_pro = Column(Boolean, default=False)  # per primi 50
    google_sub = Column(String, unique=True, nullable=True, index=True)
    github_id = Column(String, unique=True, nullable=True, index=True)

class Conversion(Base):
    __tablename__ = "conversions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    transcription = Column(String)
    title = Column(String)
    output_type = Column(String)
    file_path = Column(String)
    duration_seconds = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class Waitlist(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def create_tables():
    Base.metadata.create_all(bind=engine)


def migrate_oauth_columns():
    """Aggiunge colonne OAuth su DB già esistenti (SQLite / PostgreSQL)."""
    from sqlalchemy import inspect, text

    try:
        insp = inspect(engine)
        if not insp.has_table("users"):
            return
        names = {c["name"] for c in insp.get_columns("users")}
    except Exception as e:
        print(f"migrate_oauth_columns inspect: {e}")
        return

    try:
        with engine.begin() as conn:
            if "google_sub" not in names:
                conn.execute(text("ALTER TABLE users ADD COLUMN google_sub VARCHAR"))
            if "github_id" not in names:
                conn.execute(text("ALTER TABLE users ADD COLUMN github_id VARCHAR"))
    except Exception as e:
        print(f"migrate_oauth_columns alter: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()