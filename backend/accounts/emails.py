"""Transactional email helpers with graceful degradation.

Uses Django's configured ``EMAIL_BACKEND``: the console backend in dev (the link prints to the
terminal) and SMTP in prod. To actually deliver in prod, set ``EMAIL_HOST_USER`` +
``EMAIL_HOST_PASSWORD`` (a Google **App Password**) — see ``.env.example``. If sending fails or
isn't configured, we log the link and move on so the caller can still return a generic response
(password reset must never reveal whether an account exists).
"""
from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("accounts")


def _from_email() -> str:
    return (
        getattr(settings, "DEFAULT_FROM_EMAIL", "")
        or getattr(settings, "EMAIL_HOST_USER", "")
        or "no-reply@crownwager.app"
    )


def send_password_reset_email(*, to_email: str, reset_url: str) -> None:
    subject = "Reset your CrownWager password"
    body = (
        "We received a request to reset your CrownWager password.\n\n"
        f"Reset it here (this link expires soon):\n{reset_url}\n\n"
        "If you didn't request this, you can safely ignore this email."
    )
    try:
        send_mail(subject, body, _from_email(), [to_email], fail_silently=False)
        logger.info("password_reset_email_sent to=%s", to_email)
    except Exception as exc:  # noqa: BLE001 - never surface delivery errors to the requester
        logger.warning("password_reset_email_failed: %s | link=%s", exc, reset_url)
