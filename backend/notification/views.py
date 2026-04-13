from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from authentication.permissions import IsHighAuthority
from .models import Notification


class HighAuthorityNotificationView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):
        notifications = Notification.objects.all()

        data = [
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at
            }
            for n in notifications
        ]

        return Response(data, status=status.HTTP_200_OK)

from django.shortcuts import get_object_or_404


class MarkNotificationReadView(APIView):
    permission_classes = [IsHighAuthority]

    def post(self, request, pk):

        notification = get_object_or_404(Notification, pk=pk)

        notification.is_read = True
        notification.save()

        return Response(
            {"message": "Notification marked as read"},
            status=status.HTTP_200_OK
        )

class NotificationUnreadCountView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        count = Notification.objects.filter(is_read=False).count()

        return Response(
            {"unread_count": count},
            status=status.HTTP_200_OK
        )
