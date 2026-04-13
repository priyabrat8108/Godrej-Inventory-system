from django.contrib import admin

# Register your models here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from authentication.models import User
from .serializers import RegisterSerializer


class RegisterView(APIView):

    def post(self, request):

        # 🔒 BLOCK SECOND HIGH AUTHORITY
        requested_role = request.data.get("role")

        if requested_role == "HIGH_AUTHORITY":
            if User.objects.filter(role="HIGH_AUTHORITY").exists():
                return Response(
                    {"error": "High Authority already exists in the system."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Validate request data
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save user
        serializer.save()

        return Response(
            {"detail": "Registration submitted. Pending approval."},
            status=status.HTTP_201_CREATED
        )