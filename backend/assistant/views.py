"""CrownBot chat endpoint."""
from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .services import chat


class ChatMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant"])
    content = serializers.CharField(max_length=2000)


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=500)
    sport = serializers.CharField(required=False, default="basketball_nba", max_length=40)
    history = ChatMessageSerializer(many=True, required=False, default=list)


class ChatView(APIView):
    # LLM-backed: strictly throttled (10/min, see DEFAULT_THROTTLE_RATES['assistant'])
    # to prevent cost/quota abuse of the CrownBot endpoint.
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "assistant"

    @extend_schema(
        request=ChatRequestSerializer,
        responses={200: dict},
        description="Ask CrownBot about the current best bets or betting concepts. "
        "Uses Claude when configured; otherwise returns a deterministic data summary.",
    )
    def post(self, request: Request) -> Response:
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        result = chat(
            message=data["message"],
            history=[dict(h) for h in data["history"]],
            sport=data["sport"],
        )
        result["disclaimer"] = "Informational only. 18+. Please bet responsibly."
        return Response(result)
