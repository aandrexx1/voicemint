"""Creazione / collegamento utenti OAuth (Google, GitHub)."""
import re
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from auth import hash_password
from models import User


def _unique_username(db: Session, base: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9_]", "", base)[:30] or "user"
    u = base
    n = 0
    while db.query(User).filter(User.username == u).first():
        n += 1
        u = f"{base}_{n}"
    return u


def find_or_create_oauth_user(
    db: Session,
    provider: str,
    provider_sub: str,
    email: str,
) -> User:
    email = (email or "").strip().lower()
    if not email or "@" not in email:
        raise ValueError("Email non valida dal provider OAuth")

    if provider == "google":
        existing = db.query(User).filter(User.google_sub == provider_sub).first()
    elif provider == "github":
        existing = db.query(User).filter(User.github_id == provider_sub).first()
    else:
        raise ValueError("Provider non supportato")

    if existing:
        return existing

    by_email = db.query(User).filter(User.email == email).first()
    if by_email:
        if provider == "google":
            by_email.google_sub = provider_sub
        else:
            by_email.github_id = provider_sub
        db.add(by_email)
        db.commit()
        db.refresh(by_email)
        return by_email

    user_count = db.query(User).count()
    registration_rank = user_count + 1
    if registration_rank <= 50:
        tier = "pro"
        lifetime_pro = True
        pro_until = None
    elif registration_rank <= 100:
        tier = "pro"
        lifetime_pro = False
        pro_until = datetime.utcnow() + timedelta(days=30)
    else:
        tier = "free"
        lifetime_pro = False
        pro_until = None

    username = _unique_username(db, email.split("@")[0])
    dummy_password = hash_password(secrets.token_urlsafe(32))

    user = User(
        email=email,
        username=username,
        hashed_password=dummy_password,
        tier=tier,
        lifetime_pro=lifetime_pro,
        pro_until=pro_until,
        google_sub=provider_sub if provider == "google" else None,
        github_id=provider_sub if provider == "github" else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
