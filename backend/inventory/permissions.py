from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "admin"


class IsAdminOrSupervisor(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ["admin", "supervisor"]

