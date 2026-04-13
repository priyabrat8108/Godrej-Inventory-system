import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.exceptions import ValidationError


# =====================================================
# USER MANAGER
# =====================================================

class UserManager(BaseUserManager):

    def create_user(self, email, full_name, password=None, role='OPERATOR', **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            full_name=full_name,
            role=role,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None):
        user = self.create_user(
            email=email,
            full_name=full_name,
            password=password,
            role='HIGH_AUTHORITY'
        )

        user.is_staff = True
        user.is_superuser = True
        user.status = 'APPROVED'
        user.is_approved = True
        user.email_verified = True
        user.save(using=self._db)

        return user


# =====================================================
# USER MODEL
# =====================================================

class User(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = [
        ('HIGH_AUTHORITY', 'High Authority'),
        ('MANAGER', 'Manager'),
        ('ADMIN', 'Admin'),
        ('OPERATOR', 'Operator'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    mobile_number = models.CharField(max_length=20, blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='OPERATOR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    email_verified = models.BooleanField(default=False)

    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)

    reset_token = models.CharField(max_length=255, null=True, blank=True)
    reset_token_expiry = models.DateTimeField(null=True, blank=True)

    email_otp = models.CharField(max_length=6, null=True, blank=True)
    email_otp_expiry = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)

    in_app_notifications = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=False)
    is_initialized_high_authority = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return self.email


    # =====================================================
    # SECURITY RULES
    # =====================================================

    def save(self, *args, **kwargs):

        # 🔒 Only ONE High Authority allowed
        if self.role == "HIGH_AUTHORITY":
            existing = type(self).objects.filter(role="HIGH_AUTHORITY").exclude(id=self.id)
            if existing.exists():
                raise ValidationError("Only one High Authority is allowed in the system.")

        # 🔒 Prevent changing role of existing High Authority
        if self.pk and type(self).objects.filter(pk=self.pk).exists():
            old = type(self).objects.get(pk=self.pk)
            if old.role == "HIGH_AUTHORITY" and self.role != "HIGH_AUTHORITY":
                raise ValidationError("High Authority role cannot be changed.")

        super().save(*args, **kwargs)


    def delete(self, *args, **kwargs):

        # 🔒 Prevent deletion of High Authority
        if self.role == "HIGH_AUTHORITY":
            raise ValidationError("High Authority cannot be deleted.")

        super().delete(*args, **kwargs)