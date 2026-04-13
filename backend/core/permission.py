from rest_framework.response import Response
from rest_framework import status


def check_approved(user):
    if user.status != "APPROVED":
        return Response(
            {"error": "Your account is not approved"},
            status=status.HTTP_403_FORBIDDEN
        )
    return None


def check_role(user, allowed_roles):
    if user.role not in allowed_roles:
        return Response(
            {"error": "You are not authorized for this action"},
            status=status.HTTP_403_FORBIDDEN
        )
    return None
