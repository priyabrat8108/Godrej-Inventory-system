from django.db import models


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        STOCK_ADDED = "STOCK_ADDED", "Stock Added"
        STOCK_USED = "STOCK_USED", "Stock Used"
        LOW_STOCK = "LOW_STOCK", "Low Stock"
        GENERAL = "GENERAL", "General"

    recipient_role = models.CharField(max_length=50)

    type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL
    )

    message = models.TextField()

    is_read = models.BooleanField(default=False)   # ✅ NEW (important)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recipient_role} - {self.type}"
