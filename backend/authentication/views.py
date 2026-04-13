from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.contrib.auth import authenticate
import uuid
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail

from rest_framework_simplejwt.tokens import RefreshToken
import uuid
from django.utils import timezone
from datetime import timedelta
from audit.utils import create_audit_log
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import User
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .permissions import IsHighAuthority
from .serializers import UserApprovalSerializer
from .models import User
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer
from .models import User


# -----------------------------
# REGISTER
# -----------------------------
class RegisterView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = serializer.save()

        # create verification token
        token = str(uuid.uuid4())
        user.email_verification_token = token
        user.email_otp_expiry = timezone.now() + timedelta(hours=24)
        user.save()

        verification_link = f"http://127.0.0.1:8000/api/auth/verify-email/{token}/"

        send_mail(
    subject="Verify Your Email - Godrej Inventory System",
    message=f"Hi {user.full_name},\n\nClick below link to verify your email:\n\n{verification_link}",
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=[user.email],
    fail_silently=True,   # prevents crash
)

        # create notification
        from notification.models import Notification

        Notification.objects.create(
            type="NEW_USER_SIGNUP",
            message=f"New signup: {user.full_name} ({user.email})"
        )

        return Response(
            {"message": "Registration submitted. Verify email."},
            status=201
        )




      


      
# -----------------------------
# VERIFY EMAIL OTP
# -----------------------------
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):

        user = User.objects.filter(email_verification_token=token).first()

        if not user:
            return Response(
                {"error": "Invalid or expired verification link"},
                status=400
            )

        # mark email verified
        user.email_verified = True
        user.email_verification_token = None

        # user still requires High Authority approval
        user.status = "PENDING"

        user.save()

        return Response({
            "message": "Email verified successfully. Awaiting High Authority approval."
        })


# -----------------------------
# LOGIN
# -----------------------------

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        user = authenticate(username=email, password=password)

        if not user:
            return Response({"error": "Invalid credentials"}, status=400)

        # 🚫 Account locked check
        if user.account_locked_until and user.account_locked_until > timezone.now():
            return Response(
                {"error": "Account temporarily locked due to multiple failed attempts"},
                status=403
            )

        # 🚫 Email verification check
        if not user.email_verified:
            return Response(
                {"error": "Please verify your email first"},
                status=403
            )

        # 🚫 Approval check
        if user.status != "APPROVED":
            return Response(
                {"error": "Account not approved yet"},
                status=403
            )

        # ✅ Reset failed attempts on successful login
        user.failed_login_attempts = 0
        user.account_locked_until = None
        user.last_login = timezone.now()
        user.save()

        refresh = RefreshToken.for_user(user)
        
        if not user.email_verified:
         return Response(
        {"error": "Email not verified. Please verify before login."},
        status=403
    )
        return Response({
            "message": "Login successful",
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        })




class LogoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()

            # 🟢 Audit Log
            create_audit_log(
                user=request.user,
                action="User Logout",
                module="Authentication"
            )

            return Response(
                {"message": "Logged out successfully"},
                status=status.HTTP_200_OK
            )

        except Exception:
            return Response(
                {"error": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST
            )

        

class PendingUsersView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "HIGH_AUTHORITY":
            return Response({"error": "Not authorized"}, status=403)

        users = User.objects.filter(status="PENDING")

        data = [
            {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "status": user.status
            }
            for user in users
        ]

        return Response(data)

class ApproveUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        if request.user.role != 'HIGH_AUTHORITY':
            return Response({"error": "Permission denied"}, status=403)

        try:
            user = User.objects.get(id=id)
            user.status = 'APPROVED'
            user.save()
            return Response({"message": "User approved"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

class RejectUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        if request.user.role != 'HIGH_AUTHORITY':
            return Response({"error": "Permission denied"}, status=403)

        try:
            user = User.objects.get(id=id)
            user.status = 'REJECTED'
            user.save()
            return Response({"message": "User rejected"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)







class ApproveUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != "HIGH_AUTHORITY":
            return Response({"error": "Not authorized"}, status=403)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        user.status = "APPROVED"
        user.save()

        return Response({"message": "User approved"})

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class InitializeSystemView(APIView):

    def post(self, request):

        # Check if HIGH_AUTHORITY already exists
        if User.objects.filter(role='HIGH_AUTHORITY').exists():
            return Response(
                {"error": "System already initialized"},
                status=status.HTTP_400_BAD_REQUEST
            )

        full_name = request.data.get("full_name")
        email = request.data.get("email")
        password = request.data.get("password")

        if not full_name or not email or not password:
            return Response(
                {"error": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            email=email,
            full_name=full_name,
            password=password,
            role='HIGH_AUTHORITY'
        )

        user.status = 'APPROVED'
        user.is_staff = True
        user.is_superuser = True
        user.save()

        return Response(
            {"message": "System initialized successfully"},
            status=status.HTTP_201_CREATED
        )
    




class ApproveRejectUserView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):

        if request.user.role != "HIGH_AUTHORITY":
            return Response({"error": "Not authorized"}, status=403)

        action = request.data.get("action")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if action == "approve":
            user.status = "APPROVED"

        elif action == "reject":
            user.status = "REJECTED"

        else:
            return Response({"error": "Invalid action"}, status=400)

        user.save()

        return Response({"message": f"User {action}d"})


from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        refresh_token = request.data.get("refresh")

        if not old_password or not new_password:
            return Response(
                {"error": "Both passwords required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not request.user.check_password(old_password):
            return Response(
                {"error": "Old password incorrect"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔐 Change password
        request.user.set_password(new_password)
        request.user.save()

        # 🚨 Blacklist old refresh token (force logout)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        return Response({
            "message": "Password changed successfully. Please login again."
        })


class InventoryPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'

class ResetUserPasswordView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):

        if request.user.role != "HIGH_AUTHORITY":
            return Response(
                {"error": "Only High Authority can reset passwords"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        new_password = request.data.get("new_password")

        if not new_password:
            return Response({"error": "New password required"}, status=400)

        user.set_password(new_password)
        user.save()

        return Response({"message": "Password reset successfully"})

class ChangePasswordView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not request.user.check_password(old_password):
            return Response(
                {"error": "Old password incorrect"},
                status=400
            )

        request.user.set_password(new_password)
        request.user.save()

        return Response({"message": "Password changed successfully"})


class UserActionView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):

        if request.user.role != "HIGH_AUTHORITY":
            return Response(
                {"error": "Only High Authority can perform this action"},
                status=status.HTTP_403_FORBIDDEN
            )

        action = request.data.get("action")

        if action not in ["approve", "reject"]:
            return Response(
                {"error": "Invalid action. Use 'approve' or 'reject'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)

            if action == "approve":
                user.status = "APPROVED"
                action_text = "User Approved"
            else:
                user.status = "REJECTED"
                action_text = "User Rejected"

            user.save()

            # 🟢 Audit Log
            create_audit_log(
                user=request.user,
                action=f"{action_text} - {user.email}",
                module="Authentication"
            )

            return Response({
                "message": f"User {action}d successfully"
            })

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class ForgotPasswordView(APIView):

    def post(self, request):
        email = request.data.get("email")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        token = str(uuid.uuid4())
        user.reset_token = token
        user.reset_token_expiry = timezone.now() + timedelta(minutes=15)
        user.save()

        reset_link = f"http://localhost:3000/reset-password/{token}"

        # TEMP: print link in console (until email service added)
        print("Reset link:", reset_link)

        return Response({
            "message": "Reset token generated",
            "reset_token": token  # later replace with email sending
        })
        


class ResetPasswordView(APIView):

    def post(self, request):
        email = request.data.get("email")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        try:
            user = User.objects.get(email=email, reset_token=token)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.reset_token_expiry < timezone.now():
            return Response(
                {"error": "Token expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        user.save()

        return Response({"message": "Password reset successful"})





class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response({
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "status": user.status,
            "email_verified": user.email_verified
        })




class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, token):

        new_password = request.data.get("new_password")

        if not new_password:
            return Response(
                {"error": "New password required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(reset_token=token).first()

        if not user:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.reset_token_expiry < timezone.now():
            return Response(
                {"error": "Token expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        user.save()

        return Response({"message": "Password reset successfully"})







from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import ProfileSerializer


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = ProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Profile updated successfully"}
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


from .serializers import ChangePasswordSerializer
from django.contrib.auth import update_session_auth_hash


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data["new_password"])
            user.save()

            # Keep user logged in after password change
            update_session_auth_hash(request, user)

            return Response(
                {"message": "Password changed successfully."}
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

from .serializers import LogoutAllSessionsSerializer


class LogoutAllSessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = LogoutAllSessionsSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Logged out from all sessions successfully."}
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .serializers import InitializeSystemSerializer

User = get_user_model()

class InitializeSystemView(APIView):

    def post(self, request):
        if User.objects.filter(role="HIGH_AUTHORITY").exists():
            return Response(
                {"detail": "System already initialized."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = InitializeSystemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "System initialized successfully."},
            status=status.HTTP_201_CREATED
        )


    
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


from rest_framework.views import APIView
from rest_framework.response import Response
from authentication.models import User

class CheckInitializationStatusView(APIView):
    permission_classes = []  # public endpoint

    def get(self, request):
        is_initialized = User.objects.filter(
            role="HIGH_AUTHORITY"
        ).exists()

        return Response({
            "is_initialized": is_initialized
        })

from authentication.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def fix_live_user(request):
    email = "shibapradhan8108@gmail.com"

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "full_name": "Priyabrat",
            "role": "HIGH_AUTHORITY",
            "is_approved": True,
            "status": "ACTIVE",
            "email_verified": True,
        }
    )

    user.set_password("123456")
    user.is_staff = True
    user.is_superuser = True
    user.is_approved = True
    user.status = "ACTIVE"
    user.email_verified = True
    user.save()

    return Response({
        "status": "fixed",
        "created": created
    })