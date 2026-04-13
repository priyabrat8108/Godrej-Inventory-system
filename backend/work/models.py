from django.db import models

import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings
from attendance.models import EmployeeProfile


class JobTitle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    date = models.DateField(default=timezone.now)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_job_titles'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('title', 'date')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.date}"


class WorkAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    employee_name = models.CharField(max_length=255)

    date = models.DateField(default=timezone.now)

    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_work'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('employee_name', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee_name} - {self.date}"



class WorkHourEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(
        WorkAssignment,
        on_delete=models.CASCADE,
        related_name='hours'
    )
    hour_number = models.IntegerField()
    job_title = models.ForeignKey(
        JobTitle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        unique_together = ('assignment', 'hour_number')

    def __str__(self):
         return f"{self.assignment.employee_name} - H{self.hour_number}"


from django.conf import settings
from django.db import models


# ---------------------------
# EXISTING MODELS
# ---------------------------







# ---------------------------
# NEW MODEL: WORK DAY LOCK
# ---------------------------

class WorkDayLock(models.Model):
    date = models.DateField(unique=True)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="locked_work_days"
    )
    locked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.date} locked by {self.locked_by}"
