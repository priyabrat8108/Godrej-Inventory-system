from rest_framework import serializers
from .models import EmployeeProfile, LeaveApplication


# ==========================================
# Employee Serializer
# ==========================================

class EmployeeProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = EmployeeProfile
        fields = ["id", "full_name", "role", "created_at"]
        read_only_fields = ["id", "created_at"]


# ==========================================
# Leave Apply Serializer
# ==========================================

from django.utils import timezone


class LeaveApplySerializer(serializers.Serializer):
    employee_name = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    reason = serializers.CharField()

    def validate(self, data):

        today = timezone.now().date()

        # 🔹 End date after start date
        if data["start_date"] > data["end_date"]:
            raise serializers.ValidationError(
                "End date must be after start date."
            )

        # 🔹 Prevent past leave
        if data["start_date"] < today:
            raise serializers.ValidationError(
                "Cannot apply leave for past dates."
            )

        return data



# ==========================================
# Leave History Serializer
# ==========================================

class LeaveHistorySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name")
    leave_duration = serializers.SerializerMethodField()

    class Meta:
        model = LeaveApplication
        fields = [
    "id",
    "employee_name",
    "start_date",
    "end_date",
    "reason",
    "leave_duration",
    "status",
    "applied_at"
]
    def get_leave_duration(self, obj):
        return f"{obj.start_date.strftime('%d %b %Y')} - {obj.end_date.strftime('%d %b %Y')}"


# ==========================================
# Leave Approval Serializer (RESTORED)
# ==========================================

class LeaveApprovalSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name")

    class Meta:
        model = LeaveApplication
        fields = [
            "id",
            "employee_name",
            "start_date",
            "end_date",
            "reason",
            "status"
        ]



# ==========================================
# Leave Reject Serializer
# ==========================================

class LeaveRejectSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(
        max_length=500,
        required=True,
        allow_blank=False
    )




