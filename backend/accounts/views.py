"""Auth + profile endpoints. Fixes the legacy bug where the profile view 500'd for anon users.

JWTs are returned in the response body (Bearer flow) and, when AUTH_COOKIE_ENABLED, ALSO mirrored
into HttpOnly cookies. Both work simultaneously, so the frontend can migrate off localStorage
without a flag-day. With the flag off (default) behavior is identical to the original views.
"""
from __future__ import annotations

from django.conf import settings as dj_settings
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import RegisterSerializer, UserSerializer


def _set_cookie(response: Response, name: str, value: str, max_age: int) -> None:
    response.set_cookie(
        key=name,
        value=value,
        max_age=max_age,
        httponly=True,
        secure=dj_settings.AUTH_COOKIE_SECURE,
        samesite=dj_settings.AUTH_COOKIE_SAMESITE,
        path=dj_settings.AUTH_COOKIE_PATH,
    )


def _apply_jwt_cookies(response: Response) -> Response:
    """Mirror access/refresh tokens from the response body into HttpOnly cookies (if enabled)."""
    if not dj_settings.AUTH_COOKIE_ENABLED:
        return response
    data = getattr(response, "data", None) or {}
    if data.get("access"):
        _set_cookie(
            response,
            dj_settings.AUTH_ACCESS_COOKIE,
            data["access"],
            int(jwt_settings.ACCESS_TOKEN_LIFETIME.total_seconds()),
        )
    if data.get("refresh"):
        _set_cookie(
            response,
            dj_settings.AUTH_REFRESH_COOKIE,
            data["refresh"],
            int(jwt_settings.REFRESH_TOKEN_LIFETIME.total_seconds()),
        )
    return response


class RegisterView(generics.CreateAPIView):
    """Create an account and return JWT access/refresh tokens immediately."""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    @extend_schema(responses={201: UserSerializer})
    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User = serializer.save()
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)  # type: ignore[attr-defined]  # RefreshToken property
        response = Response(
            {
                "user": UserSerializer(user).data,
                "access": access,
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )
        return _apply_jwt_cookies(response)


class CookieTokenObtainPairView(TokenObtainPairView):
    """Login — sets the JWT cookies (when enabled) in addition to returning them in the body."""

    def post(self, request: Request, *args, **kwargs) -> Response:
        return _apply_jwt_cookies(super().post(request, *args, **kwargs))


class CookieTokenRefreshView(TokenRefreshView):
    """Refresh — accepts the refresh token from the body OR the cookie, re-sets the cookies."""

    def post(self, request: Request, *args, **kwargs) -> Response:
        if dj_settings.AUTH_COOKIE_ENABLED and not request.data.get("refresh"):
            cookie_refresh = request.COOKIES.get(dj_settings.AUTH_REFRESH_COOKIE)
            if cookie_refresh:
                serializer = self.get_serializer(data={"refresh": cookie_refresh})
                serializer.is_valid(raise_exception=True)
                return _apply_jwt_cookies(Response(serializer.validated_data, status=status.HTTP_200_OK))
        return _apply_jwt_cookies(super().post(request, *args, **kwargs))


class LogoutView(APIView):
    """Blacklist the refresh token (body or cookie) and clear the auth cookies."""

    permission_classes = [AllowAny]

    def post(self, request: Request, *args, **kwargs) -> Response:
        refresh = request.data.get("refresh") or request.COOKIES.get(dj_settings.AUTH_REFRESH_COOKIE)
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except Exception:  # noqa: BLE001 - already-invalid token is a no-op for logout
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(dj_settings.AUTH_ACCESS_COOKIE, path=dj_settings.AUTH_COOKIE_PATH)
        response.delete_cookie(dj_settings.AUTH_REFRESH_COOKIE, path=dj_settings.AUTH_COOKIE_PATH)
        return response


class MeView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated user + their profile. Requires auth (no more 500s)."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self) -> User:
        return self.request.user
