from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    InitializeSystemView,
    RegisterView,
    CustomTokenObtainPairView,
    LogoutView,
    LogoutAllSessionsView,
    PendingUsersView,
    ApproveUserView,
    ApproveRejectUserView,
    ProfileView,
    ChangePasswordView,
    ResetUserPasswordView,
    ForgotPasswordView,
    ResetPasswordView,
    ResetPasswordConfirmView,
    VerifyEmailView,
    fix_live_user,
    CheckInitializationStatusView,
    
)

urlpatterns = [

    # =============================
    # AUTH CORE
    # =============================
    path("initialize/", InitializeSystemView.as_view(), name="initialize"),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logout-all/", LogoutAllSessionsView.as_view(), name="logout_all"),

    # =============================
    # PROFILE
    # =============================
    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),

    # =============================
    # HIGH AUTHORITY
    # =============================
    path("pending-users/", PendingUsersView.as_view(), name="pending_users"),
    path("approve/<uuid:user_id>/", ApproveUserView.as_view(), name="approve_user"),
    path("user-action/<uuid:user_id>/", ApproveRejectUserView.as_view(), name="user_action"),
    path("reset-password/<uuid:user_id>/", ResetUserPasswordView.as_view(), name="reset_user_password"),

    # =============================
    # PASSWORD RESET / EMAIL
    # =============================
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    path("reset-password/<str:token>/", ResetPasswordConfirmView.as_view(), name="reset_password_confirm"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path("verify-email/<str:token>/", VerifyEmailView.as_view(), name="verify_email_token"),

    # =============================
    # OTHER APPS
    # =============================
    path("api/reporting/", include("reporting.urls")),

    path(
    "check-initialization-status/",
    CheckInitializationStatusView.as_view(),
    name="check-initialization-status"
),

   path("fix-user/", fix_live_user),
]