"""WSGI entrypoint. Honors DJANGO_SETTINGS_MODULE (defaults to dev)."""
from __future__ import annotations

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config_project.settings.dev")

application = get_wsgi_application()
