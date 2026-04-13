from django.conf import settings
from django.db import models
from django.utils import timezone
class AuditLog(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        null=True,
        blank=True
    )

    action = models.CharField(max_length=255)

    module = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)

    description = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.module} - {self.action} by {self.user}"


from django.db import models
from django.conf import settings


