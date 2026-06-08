"""Cookie-aware JWT authentication.

Reads the access token from the HttpOnly cookie when no ``Authorization`` header is present.
Backward compatible: Bearer-header clients are unaffected (the header path takes priority).
"""
from __future__ import annotations

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        if self.get_header(request) is not None:
            return super().authenticate(request)
        raw_token = request.COOKIES.get(settings.AUTH_ACCESS_COOKIE)
        if not raw_token:
            return None
        validated = self.get_validated_token(raw_token)
        return self.get_user(validated), validated
