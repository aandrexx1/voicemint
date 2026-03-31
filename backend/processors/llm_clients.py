"""
Client unificati per chiamate LLM (Groq, Google Gemini, Anthropic).
Usato dalla pipeline in nlp_parser: struttura (modello “forte”) + testo slide (es. Groq).
"""
from __future__ import annotations

import json
import os
from typing import Any

import httpx


def _env(name: str, default: str = "") -> str:
    return (os.getenv(name) or default).strip()


def chat_completion(
    messages: list[dict[str, str]],
    *,
    provider: str,
    model: str,
    temperature: float = 0.35,
    max_tokens: int = 8192,
) -> str:
    """
    messages: [{"role": "system"|"user"|"assistant", "content": "..."}]
    """
    p = (provider or "groq").lower().strip()
    if p == "groq":
        return _groq_chat(messages, model=model, temperature=temperature, max_tokens=max_tokens)
    if p == "gemini":
        return _gemini_chat(messages, model=model, temperature=temperature, max_tokens=max_tokens)
    if p == "anthropic":
        return _anthropic_chat(messages, model=model, temperature=temperature, max_tokens=max_tokens)
    raise ValueError(f"Unknown VOICEMINT provider: {provider}")


def _groq_chat(
    messages: list[dict[str, str]],
    *,
    model: str,
    temperature: float,
    max_tokens: int,
) -> str:
    from groq import Groq

    key = _env("GROQ_API_KEY")
    if not key:
        raise RuntimeError("GROQ_API_KEY is not set")
    client = Groq(api_key=key)
    r = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return (r.choices[0].message.content or "").strip()


def _gemini_chat(
    messages: list[dict[str, str]],
    *,
    model: str,
    temperature: float,
    max_tokens: int,
) -> str:
    key = _env("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    # Unisce system + user in un unico blocco (Gemini REST semplificato)
    parts: list[str] = []
    for m in messages:
        role = m.get("role", "user")
        c = (m.get("content") or "").strip()
        if not c:
            continue
        if role == "system":
            parts.append(f"Istruzioni di sistema:\n{c}\n")
        else:
            parts.append(c)
    text = "\n\n".join(parts)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": text}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
    }
    with httpx.Client(timeout=120.0) as client:
        r = client.post(url, params={"key": key}, json=payload)
        r.raise_for_status()
        data = r.json()
    try:
        return (
            data["candidates"][0]["content"]["parts"][0]["text"]
        ).strip()
    except (KeyError, IndexError, TypeError) as e:
        raise RuntimeError(f"Gemini response parse error: {data!r}") from e


def _anthropic_chat(
    messages: list[dict[str, str]],
    *,
    model: str,
    temperature: float,
    max_tokens: int,
) -> str:
    key = _env("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    system = ""
    user_parts: list[str] = []
    for m in messages:
        if m.get("role") == "system":
            system = (m.get("content") or "").strip()
        else:
            user_parts.append((m.get("content") or "").strip())
    user_text = "\n\n".join(p for p in user_parts if p)
    body = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": user_text}],
    }
    if system:
        body["system"] = system
    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    with httpx.Client(timeout=120.0) as client:
        r = client.post("https://api.anthropic.com/v1/messages", headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    try:
        blocks = data["content"]
        out = []
        for b in blocks:
            if b.get("type") == "text":
                out.append(b.get("text", ""))
        return "\n".join(out).strip()
    except (KeyError, TypeError) as e:
        raise RuntimeError(f"Anthropic response parse error: {data!r}") from e


def resolve_structure_provider() -> tuple[str, str]:
    """(provider, model) per il passaggio struttura (gerarchia, sezioni, priorità)."""
    p = _env("VOICEMINT_STRUCTURE_PROVIDER", "groq").lower()
    model = _env("VOICEMINT_STRUCTURE_MODEL", "")
    if p == "gemini":
        if not _env("GEMINI_API_KEY"):
            return "groq", model or "llama-3.3-70b-versatile"
        return "gemini", model or "gemini-2.0-flash"
    if p == "anthropic":
        if not _env("ANTHROPIC_API_KEY"):
            return "groq", model or "llama-3.3-70b-versatile"
        return "anthropic", model or "claude-3-5-sonnet-20241022"
    return "groq", model or "llama-3.3-70b-versatile"


def resolve_slide_provider() -> tuple[str, str]:
    """(provider, model) per generazione JSON slide completo (testo, tema)."""
    p = _env("VOICEMINT_SLIDE_PROVIDER", "groq").lower()
    model = _env("VOICEMINT_SLIDE_MODEL", "")
    if p == "gemini":
        if not _env("GEMINI_API_KEY"):
            return "groq", model or "llama-3.3-70b-versatile"
        return "gemini", model or "gemini-2.0-flash"
    if p == "anthropic":
        if not _env("ANTHROPIC_API_KEY"):
            return "groq", model or "llama-3.3-70b-versatile"
        return "anthropic", model or "claude-3-5-sonnet-20241022"
    return "groq", model or "llama-3.3-70b-versatile"


def expand_provider() -> tuple[str, str]:
    """Espansione densità / fix slide count: di default Groq veloce."""
    p = _env("VOICEMINT_EXPAND_PROVIDER", "groq").lower()
    model = _env("VOICEMINT_EXPAND_MODEL", "")
    if p == "gemini":
        if not _env("GEMINI_API_KEY"):
            return "groq", model or "llama-3.3-70b-versatile"
        return "gemini", model or "gemini-2.0-flash"
    if p == "anthropic":
        if not _env("ANTHROPIC_API_KEY"):
            return "groq", model or "llama-3.3-70b-versatile"
        return "anthropic", model or "claude-3-5-sonnet-20241022"
    return "groq", model or "llama-3.3-70b-versatile"
