from rest_framework.permissions import BasePermission

class IsHighAuthority(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "HIGH_AUTHORITY"


from rest_framework.permissions import BasePermission


class IsHighAuthority(BasePermission):
    """
    Allows access only to HIGH_AUTHORITY users
    who are approved and email verified.
    """

    def has_permission(self, request, view):
        user = request.user

        return (
            user and
            user.is_authenticated and
            user.role == "HIGH_AUTHORITY" and
            user.status == "APPROVED" and
            user.email_verified
        )
