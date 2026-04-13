from django.shortcuts import render
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from audit.models import AuditLog
from .serializers import LeaveApprovalSerializer
from .permissions import IsHighAuthority


from django.conf import settings


# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.pagination import PageNumberPagination

from .models import EmployeeProfile, LeaveApplication
from .serializers import (
    EmployeeProfileSerializer,
    LeaveApplySerializer,
    LeaveHistorySerializer,
    LeaveApprovalSerializer,
    LeaveRejectSerializer
)

# Import from inventory app (adjust if needed)
from inventory.models import Notification





# ================================
# Custom Permission
# ================================
class IsHighAuthority(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "HIGH_AUTHORITY"


# ================================
# Pagination Class
# ================================
class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


# ================================
# Create Employee
# ================================
class CreateEmployeeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):

        if request.user.role != "HIGH_AUTHORITY":
            return Response(
                {"error": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = EmployeeProfileSerializer(data=request.data)

        if serializer.is_valid():
            employee = serializer.save()

            return Response(
                {
                    "id": employee.id,
                    "full_name": employee.full_name,
                    "role": employee.role
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ================================
# Apply Leave
# ================================
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
User = get_user_model()

from django.conf import settings

def send_safe_email(subject, message, recipient_list):
    try:
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            recipient_list,
            fail_silently=True
        )
    except Exception as e:
        print("EMAIL ERROR:", str(e))



class ApplyLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):

        serializer = LeaveApplySerializer(data=request.data)
        if serializer.is_valid():

            # Find employee by name
            employee_name = serializer.validated_data["employee_name"].strip()

            employee = EmployeeProfile.objects.filter(
                full_name__icontains=employee_name
            ).first()

            if not employee:
                return Response(
                    {"error": "Employee not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            start_date = serializer.validated_data["start_date"]
            end_date = serializer.validated_data["end_date"]

            # 🔥 OVERLAPPING VALIDATION
            overlapping_leave = LeaveApplication.objects.filter(
                employee=employee,
                start_date__lte=end_date,
                end_date__gte=start_date
            ).exists()

            if overlapping_leave:
                return Response(
                    {"error": "Leave already exists for this date range."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create leave
            leave = LeaveApplication.objects.create(
                employee=employee,
                start_date=start_date,
                end_date=end_date,
                reason=serializer.validated_data["reason"]
            )

            # 🔔 Website Notification
            Notification.objects.create(
                type="LEAVE_REQUEST",
                message=f"New leave request from {employee.full_name}"
            )

# =========================
# LEAVE EMAIL (SAFE)
# =========================

            try:
                print("🔥 ENTERED LEAVE EMAIL BLOCK")
                subject = "New Leave Application Submitted"

                message = message = f"""
                ===============================
                📌 LEAVE APPLICATION ALERT
                ===============================
                
                👤 Employee: {employee.full_name}

                📅 Duration:
                From: {leave.start_date}
                To:   {leave.end_date}

                📝 Reason:
                {leave.reason}

                ===============================
                Inventory & HR Management System
                ===============================
                """

                recipients = list(
    User.objects.filter(role="HIGH_AUTHORITY", is_approved=True)
    .values_list("email", flat=True)
)

                if not recipients:
                 recipients = [settings.EMAIL_HOST_USER]

                send_safe_email(subject, message, recipients)

            except Exception as e:
                print("Leave Email Failed:", str(e))



            # 📝 Audit Log
            AuditLog.objects.create(
                user=request.user,
                action="LEAVE_APPLIED",
                description=f"{employee.full_name} applied for leave."
            )

            return Response(
                {
                    "id": leave.id,
                    "employee_name": employee.full_name,
                    "start_date": leave.start_date,
                    "end_date": leave.end_date,
                    "status": leave.status
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ================================
# Leave History (Paginated + Filterable)
# ================================
from django.db.models import F


class LeaveHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):

        leaves = LeaveApplication.objects.select_related("employee")

        # 🔹 Date filtering
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            leaves = leaves.filter(applied_at__date__gte=start_date)

        if end_date:
            leaves = leaves.filter(applied_at__date__lte=end_date)

        # 🔹 Status filtering
        status_filter = request.query_params.get("status")
        if status_filter:
            leaves = leaves.filter(status=status_filter.upper())

        # 🔹 Search by employee name
        search = request.query_params.get("search")
        if search:
            leaves = leaves.filter(employee__full_name__icontains=search)

        # 🔹 Ordering
        ordering = request.query_params.get("ordering")

        if ordering:
            if ordering == "employee_name":
                leaves = leaves.order_by("employee__full_name")
            elif ordering == "-employee_name":
                leaves = leaves.order_by("-employee__full_name")
            elif ordering in ["applied_at", "-applied_at", "status", "-status"]:
                leaves = leaves.order_by(ordering)

        # Pagination
        paginator = StandardPagination()
        paginated_leaves = paginator.paginate_queryset(leaves, request)

        serializer = LeaveHistorySerializer(paginated_leaves, many=True)

        return paginator.get_paginated_response(serializer.data)


# ================================
# Pending Leaves
# ================================
class PendingLeaveView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        if request.user.role != "HIGH_AUTHORITY":
            return Response(
                {"error": "Permission denied."},
                status=status.HTTP_403_FORBIDDEN
            )

        leaves = LeaveApplication.objects.filter(
            status="PENDING"
        ).select_related("employee")

        # 🔹 Search
        search = request.query_params.get("search")
        if search:
            leaves = leaves.filter(employee__full_name__icontains=search)

        # 🔹 Ordering
        ordering = request.query_params.get("ordering")

        if ordering:
            if ordering == "employee_name":
                leaves = leaves.order_by("employee__full_name")
            elif ordering == "-employee_name":
                leaves = leaves.order_by("-employee__full_name")
            elif ordering in [
                "start_date", "-start_date",
                "applied_at", "-applied_at"
            ]:
                leaves = leaves.order_by(ordering)

        # 🔹 Pagination
        paginator = StandardPagination()
        paginated_leaves = paginator.paginate_queryset(leaves, request)

        serializer = LeaveApprovalSerializer(paginated_leaves, many=True)

        return paginator.get_paginated_response(serializer.data)



# ================================
# Approve Leave
# ================================
class ApproveLeaveView(APIView):
    permission_classes = [IsHighAuthority]

    def post(self, request, pk):

        leave = get_object_or_404(LeaveApplication, pk=pk)

        if leave.status != "PENDING":
            return Response(
                {"error": "Leave already processed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            leave.status = "APPROVED"
            leave.approved_by = request.user
            leave.approval_date = timezone.now()
            leave.save()

            

            Notification.objects.create(
    type="LEAVE_APPROVED",
    message=f"Leave approved for {leave.employee.full_name}"
)




            

        return Response({"message": "Leave approved successfully."})


# ================================
# Reject Leave
# ================================
class RejectLeaveView(APIView):
    permission_classes = [IsHighAuthority]

    def post(self, request, pk):

        leave = get_object_or_404(LeaveApplication, pk=pk)

        if leave.status != "PENDING":
            return Response(
                {"error": "Leave already processed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = LeaveRejectSerializer(data=request.data)
        if serializer.is_valid():

            with transaction.atomic():
                leave.status = "REJECTED"
                leave.rejection_reason = serializer.validated_data["rejection_reason"]
                leave.approved_by = request.user
                leave.approval_date = timezone.now()
                leave.save()

                Notification.objects.create(
    type="LEAVE_REJECTED",
    message=f"Leave rejected for {leave.employee.full_name}."
)



                

            return Response({"message": "Leave rejected successfully."})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmployeeListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):

        employees = EmployeeProfile.objects.all()

        data = [
            {
                "id": emp.id,
                "full_name": emp.full_name,
                "role": emp.role
            }
            for emp in employees
        ]

        return Response(data)
