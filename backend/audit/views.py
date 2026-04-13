from django.shortcuts import render

# Create your views here.
from django.db import models
from django.conf import settings


class AuditLog(models.Model):

    MODULE_CHOICES = (
        ("Inventory", "Inventory"),
        ("Attendance", "Attendance"),
        ("WorkAssignment", "WorkAssignment"),
        ("UserManagement", "User Management"),
        ("Authentication", "Authentication"),
        ("System", "System"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    action = models.TextField()
    module = models.CharField(max_length=50, choices=MODULE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.module} - {self.action}"