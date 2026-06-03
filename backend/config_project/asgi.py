"""ASGI entrypoint. Honors DJANGO_SETTINGS_MODULE (fixes the legacy bug where asgi ignored it)."""
from __future__ import annotations

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config_project.settings.dev")

application = get_asgi_application()
