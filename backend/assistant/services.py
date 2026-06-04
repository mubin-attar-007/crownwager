"""CrownBot — a Claude-powered assistant grounded in the platform's current best bets.

Falls back to a deterministic, rule-based summary when ``ANTHROPIC_API_KEY`` is not configured, so
the feature is always demoable. The Anthropic call uses prompt caching on the system prompt.
"""
from __future__ import annotations

import logging

from django.conf import settings

from predictions.services.pipeline import gather_best_bets

logger = logging.getLogger(__name__)

ASSISTANT_MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = (
    "You are CrownBot, the assistant for CrownWager — a data-driven sports-betting ANALYTICS tool. "
    "You explain betting concepts (expected value, Kelly criterion, arbitrage, odds formats) and help "
    "users interpret the platform's model picks. Rules you must always follow:\n"
    "- This is INFORMATIONAL ONLY. Never tell anyone to place a specific wager; never promise profit or "
    "guarantee outcomes. Models can be wrong and odds move.\n"
    "- Always encourage responsible gambling (18+, bet what you can afford to lose, 1-800-GAMBLER).\n"
    "- Ground your answers in the BEST BETS DATA provided in the user's message when relevant; if the "
    "data doesn't cover something, say so plainly.\n"
    "- Be concise, friendly, and numerate."
)


def build_context(sport: str) -> str:
    bets, source = gather_best_bets(sport)
    if not bets:
        return "No current best bets available."
    lines = [f"Current best bets ({source} data) for {sport}:"]
    for b in bets[:8]:
        lines.append(
            f"- {b['selection']} ({b['market']}) @ {b['american_odds']} on {b['bookmaker']}: "
            f"model {float(b['model_probability']) * 100:.1f}%, edge {b['edge_pct']}%, "
            f"EV/$100 ${b['expected_value']}"
        )
    return "\n".join(lines)


def _fallback_reply(message: str, context: str) -> str:
    return (
        "CrownBot is running in offline mode (no AI key configured), so here's a data summary instead of "
        f"a conversational answer.\n\n{context}\n\nReminder: this is informational only — bet responsibly, 18+."
    )


def _provider() -> str:
    """Pick an LLM provider from config. OpenAI-compatible (Groq/Gemini/OpenRouter/Ollama/OpenAI)
    takes precedence if configured, then Anthropic, else the offline fallback."""
    if settings.LLM_API_KEY and settings.LLM_BASE_URL:
        return "openai"
    if settings.ANTHROPIC_API_KEY:
        return "anthropic"
    return "none"


def _user_prompt(message: str, context: str) -> str:
    return f"BEST BETS DATA:\n{context}\n\nUser question: {message}"


def _anthropic_chat(message: str, history: list[dict], context: str) -> dict:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    messages = [
        *[{"role": h["role"], "content": h["content"]} for h in history[-8:]],
        {"role": "user", "content": _user_prompt(message, context)},
    ]
    resp = client.messages.create(
        model=ASSISTANT_MODEL,
        max_tokens=600,
        system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        messages=messages,  # type: ignore[arg-type]  # plain dicts; SDK accepts them at runtime
    )
    text = "".join(getattr(b, "text", "") for b in resp.content)
    return {"reply": text.strip(), "powered_by": ASSISTANT_MODEL}


def _openai_compatible_chat(message: str, history: list[dict], context: str) -> dict:
    """Works with any OpenAI-compatible endpoint: Groq, Google Gemini (OpenAI-compat),
    OpenRouter, Ollama, or OpenAI itself — selected purely via LLM_BASE_URL / LLM_MODEL."""
    from openai import OpenAI

    client = OpenAI(api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)
    model = settings.LLM_MODEL or "llama-3.3-70b-versatile"
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *[{"role": h["role"], "content": h["content"]} for h in history[-8:]],
        {"role": "user", "content": _user_prompt(message, context)},
    ]
    resp = client.chat.completions.create(
        model=model,
        max_tokens=1024,  # generous so "thinking" models (e.g. gemini-2.5-flash) still emit a reply
        messages=messages,  # type: ignore[arg-type]  # plain dicts; SDK accepts them at runtime
    )
    text = (resp.choices[0].message.content or "").strip()
    host = settings.LLM_BASE_URL.split("//")[-1].split("/")[0]
    return {"reply": text, "powered_by": f"{model} via {host}"}


def chat(message: str, history: list[dict] | None = None, sport: str = "basketball_nba") -> dict:
    context = build_context(sport)
    history = history or []
    provider = _provider()

    if provider == "none":
        return {"reply": _fallback_reply(message, context), "powered_by": "offline-fallback"}

    try:
        if provider == "anthropic":
            return _anthropic_chat(message, history, context)
        return _openai_compatible_chat(message, history, context)
    except Exception as exc:  # pragma: no cover - network/SDK errors
        logger.warning("CrownBot LLM call failed (%s): %s", provider, exc)
        return {"reply": _fallback_reply(message, context), "powered_by": "offline-fallback"}
