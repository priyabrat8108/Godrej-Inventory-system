from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()


# -----------------------------
# INITIALIZE SYSTEM
# -----------------------------
class InitializeSystemSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["full_name", "email", "password"]

    def create(self, validated_data):

        user = User.objects.create_user(
            email=validated_data["email"],
            full_name=validated_data["full_name"],
            password=validated_data["password"],
            role="HIGH_AUTHORITY",
        )

        user.status = "APPROVED"
        user.is_staff = True
        user.is_superuser = True
        user.save()

        return user


# -----------------------------
# REGISTER USER
# -----------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "full_name",
            "email",
            "password",
            "role",
            "mobile_number",
            "employee_id"
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            full_name=validated_data["full_name"],
            password=validated_data["password"],
            role=validated_data["role"],
            mobile_number=validated_data.get("mobile_number"),
            employee_id=validated_data.get("employee_id"),
        )

        user.status = "PENDING"
        user.save()

        return user


# -----------------------------
# LOGIN SERIALIZER
# -----------------------------
class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# -----------------------------
# USER APPROVAL
# -----------------------------
class UserApprovalSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "role",
            "status",
            "mobile_number",
            "employee_id",
            "created_at"
        ]


# -----------------------------
# PROFILE
# -----------------------------
class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "full_name",
            "email",
            "mobile_number",
            "employee_id",
            "role",
            "in_app_notifications"
        ]

        read_only_fields = ["email", "role"]


# -----------------------------
# CHANGE PASSWORD
# -----------------------------
class ChangePasswordSerializer(serializers.Serializer):

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):

        user = self.context["request"].user

        if not user.check_password(data["current_password"]):
            raise serializers.ValidationError({
                "current_password": "Current password is incorrect."
            })

        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        validate_password(data["new_password"], user)

        return data


# -----------------------------
# LOGOUT ALL SESSIONS
# -----------------------------
class LogoutAllSessionsSerializer(serializers.Serializer):

    refresh = serializers.CharField()

    def save(self, **kwargs):

        try:
            refresh_token = RefreshToken(self.validated_data["refresh"])
            refresh_token.blacklist()
        except Exception:
            raise serializers.ValidationError({
                "refresh": "Invalid or expired token."
            })


# -----------------------------
# CUSTOM LOGIN
# -----------------------------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):

        data = super().validate(attrs)

        if self.user.status != "APPROVED":
            raise AuthenticationFailed("Account pending approval.")

        return data