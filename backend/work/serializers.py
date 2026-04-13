from rest_framework import serializers
from .models import JobTitle, WorkAssignment, WorkHourEntry
from attendance.models import EmployeeProfile


class JobTitleSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobTitle
        fields = ['id', 'title', 'date']
        read_only_fields = ['id', 'date']


class WorkAssignmentCreateSerializer(serializers.Serializer):
    employee_name = serializers.CharField()
    date = serializers.DateField()
    hours = serializers.DictField(
        child=serializers.UUIDField(allow_null=True)
    )



class WorkHourEntrySerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job_title.title', allow_null=True)

    class Meta:
        model = WorkHourEntry
        fields = ['hour_number', 'job_title']



class WorkAssignmentSerializer(serializers.ModelSerializer):
    employee = serializers.CharField(source='employee_name')
    hours = serializers.SerializerMethodField()

    class Meta:
        model = WorkAssignment
        fields = ['id', 'employee', 'date', 'hours']

    def get_hours(self, obj):
        hour_map = {str(i): None for i in range(1, 9)}

        for entry in obj.hours.all():
            hour_map[str(entry.hour_number)] = (
                entry.job_title.title if entry.job_title else None
            )

        return hour_map


