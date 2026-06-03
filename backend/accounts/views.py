"""Auth + profile endpoints. Fixes the legacy bug where the profile view 500'd for anon users."""
from __future__ import annotations

from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer


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
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": access,
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated user + their profile. Requires auth (no more 500s)."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self) -> User:
        return self.request.user
