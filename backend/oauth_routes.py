"""OAuth2 Google e GitHub: redirect → callback → JWT → redirect al frontend."""
import os
from urllib.parse import quote

import httpx
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import secrets

from auth import create_token
from models import get_db
from oauth_helpers import find_or_create_oauth_user

router = APIRouter()

oauth = OAuth()

BACKEND_PUBLIC_URL = os.getenv(
    "BACKEND_PUBLIC_URL", "https://voicemint-backend.onrender.com"
).rstrip("/")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://voicemint.it").rstrip("/")

GOOGLE_ENABLED = bool(os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET"))
GITHUB_ENABLED = bool(os.getenv("GITHUB_CLIENT_ID") and os.getenv("GITHUB_CLIENT_SECRET"))


def _configure_oauth():
    if GOOGLE_ENABLED:
        oauth.register(
            name="google",
            client_id=os.environ["GOOGLE_CLIENT_ID"],
            client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )
    if GITHUB_ENABLED:
        oauth.register(
            name="github",
            client_id=os.environ["GITHUB_CLIENT_ID"],
            client_secret=os.environ["GITHUB_CLIENT_SECRET"],
            access_token_url="https://github.com/login/oauth/access_token",
            authorize_url="https://github.com/login/oauth/authorize",
            api_base_url="https://api.github.com/",
            client_kwargs={"scope": "user:email"},
        )


_configure_oauth()


def _redirect_frontend_token(token: str) -> RedirectResponse:
    response = RedirectResponse(
        # usa fragment (#) per ridurre leak via referrer/logs di querystring
        url=f"{FRONTEND_URL}/#oauth=success",
        status_code=302,
    )
    secure = os.getenv("COOKIE_SECURE", "1") != "0"
    samesite = os.getenv("COOKIE_SAMESITE", "none").lower()
    if samesite not in ("lax", "strict", "none"):
        samesite = "lax"
    response.set_cookie(
        key="vm_token",
        value=token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    csrf = secrets.token_urlsafe(24)
    response.set_cookie(
        key="vm_csrf",
        value=csrf,
        httponly=False,
        secure=secure,
        samesite=samesite,
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return response


def _redirect_frontend_error(code: str) -> RedirectResponse:
    return RedirectResponse(
        url=f"{FRONTEND_URL}/#oauth_error={quote(code, safe='')}",
        status_code=302,
    )


async def _google_userinfo(access_token: str, token_payload: dict) -> dict:
    userinfo = token_payload.get("userinfo")
    if isinstance(userinfo, dict) and userinfo.get("email"):
        return userinfo
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=20.0,
        )
        r.raise_for_status()
        return r.json()


@router.get("/google/login")
async def google_login(request: Request):
    if not GOOGLE_ENABLED:
        return _redirect_frontend_error("not_configured")
    redirect_uri = f"{BACKEND_PUBLIC_URL}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    if not GOOGLE_ENABLED:
        return _redirect_frontend_error("not_configured")
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        print(f"google_callback token error: {e}")
        return _redirect_frontend_error("google_denied")
    access_token = token.get("access_token") or ""
    try:
        info = await _google_userinfo(access_token, token)
    except Exception as e:
        print(f"google userinfo error: {e}")
        return _redirect_frontend_error("google_profile")

    email = info.get("email")
    sub = info.get("sub")
    if not email or not sub:
        return _redirect_frontend_error("google_email")

    try:
        user = find_or_create_oauth_user(db, "google", str(sub), email)
    except ValueError as e:
        print(f"google create user: {e}")
        return _redirect_frontend_error("google_user")

    jwt_token = create_token({"sub": user.email})
    return _redirect_frontend_token(jwt_token)


@router.get("/github/login")
async def github_login(request: Request):
    if not GITHUB_ENABLED:
        return _redirect_frontend_error("not_configured")
    redirect_uri = f"{BACKEND_PUBLIC_URL}/auth/github/callback"
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/github/callback")
async def github_callback(request: Request, db: Session = Depends(get_db)):
    if not GITHUB_ENABLED:
        return _redirect_frontend_error("not_configured")
    try:
        token = await oauth.github.authorize_access_token(request)
    except Exception as e:
        print(f"github_callback token error: {e}")
        return _redirect_frontend_error("github_denied")

    access_token = token.get("access_token")
    if not access_token:
        return _redirect_frontend_error("github_token")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
    }
    try:
        async with httpx.AsyncClient() as client:
            ur = await client.get(
                "https://api.github.com/user", headers=headers, timeout=20.0
            )
            ur.raise_for_status()
            gh = ur.json()
            er = await client.get(
                "https://api.github.com/user/emails", headers=headers, timeout=20.0
            )
            er.raise_for_status()
            emails = er.json()
    except Exception as e:
        print(f"github api error: {e}")
        return _redirect_frontend_error("github_profile")

    gh_id = str(gh.get("id", ""))
    if not gh_id:
        return _redirect_frontend_error("github_id")

    primary = None
    if isinstance(emails, list):
        for row in emails:
            if isinstance(row, dict) and row.get("primary"):
                primary = row.get("email")
                break
        if not primary and emails:
            first = emails[0]
            if isinstance(first, dict):
                primary = first.get("email")

    if not primary:
        return _redirect_frontend_error("github_no_email")

    try:
        user = find_or_create_oauth_user(db, "github", gh_id, primary)
    except ValueError as e:
        print(f"github create user: {e}")
        return _redirect_frontend_error("github_user")

    jwt_token = create_token({"sub": user.email})
    return _redirect_frontend_token(jwt_token)
