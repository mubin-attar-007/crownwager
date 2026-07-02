"""Auth + profile endpoints. Fixes the legacy bug where the profile view 500'd for anon users.

JWTs are returned in the response body (Bearer flow) and, when AUTH_COOKIE_ENABLED, ALSO mirrored
into HttpOnly cookies. Both work simultaneously, so the frontend can migrate off localStorage
without a flag-day. With the flag off (default) behavior is identical to the original views.
"""
from __future__ import annotations

from django.conf import settings as dj_settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .emails import send_password_reset_email
from .serializers import (
    ChangePasswordSerializer,
    DeleteAccountSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)


class _AuthScopedThrottle(ScopedRateThrottle):
    """Tighter, dedicated rate limit for credential endpoints (login/register/reset)."""

    scope = "auth"


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
    throttle_classes = [_AuthScopedThrottle]

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

    throttle_classes = [_AuthScopedThrottle]

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


class ChangePasswordView(APIView):
    """Change password while logged in (verify current, then set new). Keeps the session."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [_AuthScopedThrottle]

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Your password has been changed."}, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    """Permanently delete the account (requires the current password). Cascades owned rows."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [_AuthScopedThrottle]

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = DeleteAccountSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(dj_settings.AUTH_ACCESS_COOKIE, path=dj_settings.AUTH_COOKIE_PATH)
        response.delete_cookie(dj_settings.AUTH_REFRESH_COOKIE, path=dj_settings.AUTH_COOKIE_PATH)
        user.delete()  # FK cascade removes profile, saved bets, tracked bets
        return response


class PasswordResetRequestView(APIView):
    """Start a password reset. Always returns a generic 200 — never reveals whether an account
    exists (no enumeration). Emails a reset link when the address is real."""

    permission_classes = [AllowAny]
    throttle_classes = [_AuthScopedThrottle]

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user is not None:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{dj_settings.FRONTEND_URL.rstrip('/')}/reset-password?uid={uid}&token={token}"
            send_password_reset_email(to_email=user.email, reset_url=reset_url)
        return Response(
            {"detail": "If an account exists for that email, a reset link is on its way."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """Finish a password reset: validate the uid+token, then set the new password."""

    permission_classes = [AllowAny]
    throttle_classes = [_AuthScopedThrottle]

    def post(self, request: Request, *args, **kwargs) -> Response:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            uid = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {"detail": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not default_token_generator.check_token(user, data["token"]):
            return Response(
                {"detail": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset. You can sign in now."}, status=status.HTTP_200_OK)
