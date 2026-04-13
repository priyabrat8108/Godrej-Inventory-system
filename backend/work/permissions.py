from rest_framework.permissions import BasePermission

class IsWorkManager(BasePermission):

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

from rest_framework.permissions import BasePermission


class IsHighAuthority(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated and
            user.role == "HIGH_AUTHORITY" and
            user.status == "APPROVED" and
            user.email_verified
        )
