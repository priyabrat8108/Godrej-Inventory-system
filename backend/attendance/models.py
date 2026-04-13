from django.db import models

# Create your models here.
import uuid
from django.db import models
from django.conf import settings


import uuid
from django.db import models


class EmployeeProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name



class LeaveApplication(models.Model):

    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        related_name="leaves"
    )

    start_date = models.DateField()
    end_date = models.DateField()

    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    applied_at = models.DateTimeField(auto_now_add=True)

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_leaves"
    )

    approval_date = models.DateTimeField(null=True, blank=True)

    rejection_reason = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ["-applied_at"]

    def __str__(self):
        return f"{self.employee.full_name} - {self.status}"
