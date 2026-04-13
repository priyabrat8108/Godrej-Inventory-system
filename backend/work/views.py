from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination


from .models import JobTitle, WorkAssignment, WorkHourEntry
from .serializers import (
    JobTitleSerializer,
    WorkAssignmentCreateSerializer,
    WorkAssignmentSerializer
)
from .permissions import IsWorkManager


from reporting.models import Notification
from audit.models import AuditLog


# 🔹 CREATE JOB TITLE
class CreateJobTitleView(APIView):
    permission_classes = [IsWorkManager]

    def post(self, request):
        today = timezone.now().date()

        # 🔒 LOCK CHECK (must be first rule)
        if WorkDayLock.objects.filter(date=today).exists():
            return Response(
                {"error": "This day is locked. Cannot create job title."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = JobTitleSerializer(data=request.data)

        if serializer.is_valid():
            job = serializer.save(
                created_by=request.user,
                date=today
            )

            AuditLog.objects.create(
                user=request.user,
                action="CREATE",
                module="WORK",
                description=f"Created Job Title: {job.title} for {today}"
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 🔹 GET TODAY JOB TITLES
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.utils.dateparse import parse_date
from .models import WorkAssignment, WorkHourEntry, JobTitle, WorkDayLock
from .serializers import WorkAssignmentCreateSerializer
from audit.models import AuditLog
from .permissions import IsWorkManager


class CreateWorkAssignmentView(APIView):
    permission_classes = [IsWorkManager]

    def post(self, request):
        serializer = WorkAssignmentCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        employee_name = data['employee_name']
        target_date = data['date']   # already validated date object

        # 🔒 LOCK CHECK (MUST BE FIRST BUSINESS RULE)
        if WorkDayLock.objects.filter(date=target_date).exists():
            return Response(
                {"error": "This day is locked and cannot be modified."},
                status=400
            )

        # Prevent duplicate assignment (same name, same date)
        if WorkAssignment.objects.filter(
            employee_name=employee_name,
            date=target_date
        ).exists():
            return Response(
                {"error": "Work already assigned for this employee on this date"},
                status=400
            )

        with transaction.atomic():

            assignment = WorkAssignment.objects.create(
                employee_name=employee_name,
                date=target_date,
                assigned_by=request.user
            )

            for hour, job_id in data['hours'].items():
                hour = int(hour)

                if hour < 1 or hour > 8:
                    continue

                job = None
                if job_id:
                    job = JobTitle.objects.get(id=job_id, date=target_date)

                WorkHourEntry.objects.create(
                    assignment=assignment,
                    hour_number=hour,
                    job_title=job
                )

            

            AuditLog.objects.create(
                user=request.user,
                action="CREATE",
                module="WORK",
                description=f"Assigned work to {employee_name} for {target_date}"
            )

            


        return Response(
            {"message": "Work assigned successfully"},
            status=201
        )


# 🔹 GET TODAY WORK ASSIGNMENTS
class TodayWorkAssignmentsView(APIView):
    permission_classes = [IsWorkManager]

    def get(self, request):
        today = timezone.now().date()
        assignments = WorkAssignment.objects.filter(date=today)
        serializer = WorkAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)


# 🔹 WORK HISTORY VIEW (THIS WAS MISSING)
class WorkHistoryView(APIView):
    permission_classes = [IsWorkManager]

    def get(self, request):
        date = request.GET.get("date")
        employee_name = request.GET.get("employee_name")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        qs = WorkAssignment.objects.all().order_by("-date")

        # Exact date filter
        if date:
            qs = qs.filter(date=date)
        else:
            if start_date:
                qs = qs.filter(date__gte=start_date)
            if end_date:
                qs = qs.filter(date__lte=end_date)

        if employee_name:
            qs = qs.filter(employee_name__icontains=employee_name)

        paginator = WorkAssignmentPagination()
        paginated_qs = paginator.paginate_queryset(qs, request)

        serializer = WorkAssignmentSerializer(
            paginated_qs,
            many=True
        )

        return paginator.get_paginated_response(serializer.data)

class UpdateWorkAssignmentView(APIView):
    permission_classes = [IsWorkManager]

    def put(self, request, assignment_id):
        serializer = WorkAssignmentCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        employee_name = data['employee_name']
        new_date = data['date']

        try:
            assignment = WorkAssignment.objects.get(id=assignment_id)
        except WorkAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=404)

        # 🔒 LOCK CHECK (must check both old and new date)
        if WorkDayLock.objects.filter(date=assignment.date).exists():
            return Response(
                {"error": "This day is locked and cannot be edited."},
                status=400
            )

        if WorkDayLock.objects.filter(date=new_date).exists():
            return Response(
                {"error": "Target date is locked and cannot be assigned."},
                status=400
            )

        # Prevent editing past dates
        if assignment.date < timezone.now().date():
            return Response(
                {"error": "Past assignments cannot be edited"},
                status=400
            )

        # Prevent duplicate (same name same date)
        if WorkAssignment.objects.filter(
            employee_name=employee_name,
            date=new_date
        ).exclude(id=assignment_id).exists():
            return Response(
                {"error": "Work already assigned for this employee on this date"},
                status=400
            )

        with transaction.atomic():

            # Save old hours for audit
            old_hours = {
                str(entry.hour_number): (
                    entry.job_title.title if entry.job_title else None
                )
                for entry in assignment.hours.all()
            }

            # Update main fields
            assignment.employee_name = employee_name
            assignment.date = new_date
            assignment.save()

            # Delete old hour entries
            assignment.hours.all().delete()

            # Create new hour entries
            for hour, job_id in data['hours'].items():
                hour = int(hour)

                if hour < 1 or hour > 8:
                    continue

                job = None
                if job_id:
                    job = JobTitle.objects.get(id=job_id, date=new_date)

                WorkHourEntry.objects.create(
                    assignment=assignment,
                    hour_number=hour,
                    job_title=job
                )

            new_hours = data['hours']

            AuditLog.objects.create(
                user=request.user,
                action="UPDATE",
                module="WORK",
                description=f"Updated work assignment for {employee_name}",
                old_value=str(old_hours),
                new_value=str(new_hours)
            )

        return Response(
            {"message": "Work assignment updated successfully"},
            status=200
        )


class DeleteWorkAssignmentView(APIView):
    permission_classes = [IsWorkManager]

    def delete(self, request, assignment_id):

        try:
            assignment = WorkAssignment.objects.get(id=assignment_id)
        except WorkAssignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=404)

        employee_name = assignment.employee_name
        assignment_date = assignment.date

        # 🔒 LOCK CHECK
        if WorkDayLock.objects.filter(date=assignment_date).exists():
            return Response(
                {"error": "This day is locked and cannot be deleted."},
                status=400
            )

        # 🛑 Prevent deleting past assignments (recommended for compliance)
        if assignment_date < timezone.now().date():
            return Response(
                {"error": "Past assignments cannot be deleted"},
                status=400
            )

        assignment.delete()

        AuditLog.objects.create(
            user=request.user,
            action="DELETE",
            module="WORK",
            description=f"Deleted work assignment for {employee_name} on {assignment_date}"
        )

        return Response(
            {"message": "Work assignment deleted successfully"},
            status=200
        )

class DeleteJobTitleView(APIView):
    permission_classes = [IsWorkManager]

    def delete(self, request, job_id):

        try:
            job = JobTitle.objects.get(id=job_id)
        except JobTitle.DoesNotExist:
            return Response({"error": "Job title not found"}, status=404)

        # Prevent deleting if used in assignment
        if WorkHourEntry.objects.filter(job_title=job).exists():
            return Response(
                {"error": "Cannot delete job title. It is used in assignments."},
                status=400
            )

        job.delete()

        AuditLog.objects.create(
            user=request.user,
            action="DELETE",
            module="WORK",
            description=f"Deleted Job Title: {job.title}"
        )

        return Response({"message": "Job title deleted successfully"})


class TodayJobTitlesView(APIView):
    permission_classes = [IsWorkManager]

    def get(self, request):
        today = timezone.now().date()
        jobs = JobTitle.objects.filter(date=today)
        serializer = JobTitleSerializer(jobs, many=True)
        return Response(serializer.data)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import WorkDayLock
from .permissions import IsHighAuthority
from audit.models import AuditLog


class LockWorkDayView(APIView):
    permission_classes = [IsHighAuthority]

    def post(self, request):
        date = request.data.get("date")

        if not date:
            return Response({"error": "Date is required."}, status=400)

        today = timezone.now().date()

        if str(date) > str(today):
            return Response({"error": "Cannot lock future date."}, status=400)

        if WorkDayLock.objects.filter(date=date).exists():
            return Response({"error": "Day already locked."}, status=400)

        lock = WorkDayLock.objects.create(
            date=date,
            locked_by=request.user
        )

        # Audit Log
        AuditLog.objects.create(
            user=request.user,
            action="CREATE",
            module="WORK_DAY_LOCK",
            description=f"Locked work day {date}",
            new_value=str(date)
        )

        return Response(
            {"message": f"{date} successfully locked."},
            status=status.HTTP_201_CREATED
        )


from django.utils.dateparse import parse_date


class WorkDayLockStatusView(APIView):
    permission_classes = [IsWorkManager]

    def get(self, request):
        date_str = request.query_params.get("date")

        if not date_str:
            return Response(
                {"error": "Date query parameter is required."},
                status=400
            )

        target_date = parse_date(date_str)

        if not target_date:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=400
            )

        is_locked = WorkDayLock.objects.filter(date=target_date).exists()

        return Response(
            {
                "date": target_date,
                "is_locked": is_locked
            },
            status=200
        )


class WorkAssignmentPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "per_page"
    max_page_size = 100

    from rest_framework.pagination import PageNumberPagination


class WorkAssignmentPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "per_page"
    max_page_size = 100