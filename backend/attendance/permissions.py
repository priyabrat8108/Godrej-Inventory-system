from rest_framework.permissions import BasePermission


class IsHighAuthority(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == "HIGH_AUTHORITY"
        )
