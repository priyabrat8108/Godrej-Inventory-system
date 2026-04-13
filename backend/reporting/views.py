from django.shortcuts import render
from audit.models import AuditLog
from django.db.models import Q

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import F

from authentication.permissions import IsHighAuthority
from inventory.models import Item, InventoryTransaction
from attendance.models import LeaveApplication
from .utils import export_to_excel


class HighAuthorityOverviewView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        total_inventory = Item.objects.count()

        low_stock_items = Item.objects.filter(
            quantity__lte=F('min_quantity')
        ).count()

        pending_leaves = LeaveApplication.objects.filter(
            status="PENDING"
        ).count()

        pending_inventory_approvals = InventoryTransaction.objects.filter(
            approval_status="PENDING"
        ).count()

        return Response({
            "total_inventory": total_inventory,
            "low_stock_items": low_stock_items,
            "pending_leaves": pending_leaves,
            "pending_inventory_approvals": pending_inventory_approvals
        }, status=status.HTTP_200_OK)

from authentication.models import User


class HighAuthorityUserListView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        users = User.objects.all().order_by("-created_at")

        data = [
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "mobile_number": user.mobile_number,
                "employee_id": user.employee_id,
                "status": user.status,
            }
            for user in users
        ]

        return Response(data, status=200)


from django.shortcuts import get_object_or_404


class ApproveUserView(APIView):
    permission_classes = [IsHighAuthority]

    def post(self, request, user_id):

        user = get_object_or_404(User, id=user_id)

        if user.status == "APPROVED":
            return Response(
                {"error": "User is already approved."},
                status=400
            )

        user.status = "APPROVED"
        user.save()

        AuditLog.objects.create(
            user=request.user,
            action="UPDATE",
            module="USER",
            description=f"Approved user {user.full_name}"
        )

        return Response(
            {"message": "User approved successfully"},
            status=200
        )
    

class RejectUserView(APIView):
    permission_classes = [IsHighAuthority]

    def post(self, request, user_id):

        user = get_object_or_404(User, id=user_id)

        if user.status == "REJECTED":
            return Response(
                {"error": "User is already rejected."},
                status=400
            )

        user.status = "REJECTED"
        user.save()

        AuditLog.objects.create(
            user=request.user,
            action="UPDATE",
            module="USER",
            description=f"Rejected user {user.full_name}"
        )

        return Response(
            {"message": "User rejected successfully"},
            status=200
        )

from inventory.models import InventoryTransaction
from authentication.permissions import IsHighAuthority


from django.db.models import Q
from rest_framework.pagination import PageNumberPagination


class InventoryPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class HighAuthorityInventoryRecordsView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        transactions = InventoryTransaction.objects.select_related(
            "item",
            "performed_by"
        ).order_by("-created_at")

        # 🔹 Date filtering
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            transactions = transactions.filter(
                created_at__date__gte=start_date
            )

        if end_date:
            transactions = transactions.filter(
                created_at__date__lte=end_date
            )

        # 🔹 Approval status filter
        approval_status = request.query_params.get("approval_status")
        if approval_status:
            transactions = transactions.filter(
                approval_status=approval_status.upper()
            )

        # 🔹 Search by item code
        search = request.query_params.get("search")
        if search:
            transactions = transactions.filter(
                Q(item__item_code__icontains=search)
            )

        # 🔹 Pagination
        paginator = InventoryPagination()
        paginated_transactions = paginator.paginate_queryset(
            transactions, request
        )

        data = [
            {
                "id": t.id,
                "item_code": t.item.item_code if t.item else None,
                "description": t.item.description if t.item else None,
                "transaction_type": t.transaction_type,
                "quantity": t.quantity,
                "approval_status": t.approval_status,
                "performed_by": t.performed_by.full_name if t.performed_by else None,
                "created_at": t.created_at
            }
            for t in paginated_transactions
        ]

        return paginator.get_paginated_response(data)


from rest_framework.pagination import PageNumberPagination
from django.db.models import Q


class UsagePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class HighAuthorityUsageLogsView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        usage_logs = InventoryTransaction.objects.select_related(
            "item",
            "performed_by"
        ).filter(
            transaction_type="USAGE"
        ).order_by("-created_at")

        # 🔹 Date filtering
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            usage_logs = usage_logs.filter(
                created_at__date__gte=start_date
            )

        if end_date:
            usage_logs = usage_logs.filter(
                created_at__date__lte=end_date
            )

        # 🔹 Search by item code
        search = request.query_params.get("search")
        if search:
            usage_logs = usage_logs.filter(
                Q(item__item_code__icontains=search)
            )

        # 🔹 Pagination
        paginator = UsagePagination()
        paginated_logs = paginator.paginate_queryset(
            usage_logs, request
        )

        data = [
            {
                "id": log.id,
                "item_code": log.item.item_code if log.item else None,
                "description": log.item.description if log.item else None,
                "quantity_used": log.quantity,
                "performed_by": log.performed_by.full_name if log.performed_by else None,
                "created_at": log.created_at
            }
            for log in paginated_logs
        ]

        return paginator.get_paginated_response(data)


from attendance.models import LeaveApplication
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination


class AttendancePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class HighAuthorityAttendanceRecordsView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        leaves = LeaveApplication.objects.select_related(
            "employee",
            "approved_by"
        ).order_by("-applied_at")

        # 🔹 Date filtering (based on applied date)
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            leaves = leaves.filter(applied_at__date__gte=start_date)

        if end_date:
            leaves = leaves.filter(applied_at__date__lte=end_date)

        # 🔹 Status filter
        status_filter = request.query_params.get("status")
        if status_filter:
            leaves = leaves.filter(status=status_filter.upper())

        # 🔹 Search by employee name
        search = request.query_params.get("search")
        if search:
            leaves = leaves.filter(
                Q(employee__full_name__icontains=search)
            )

        # 🔹 Pagination
        paginator = AttendancePagination()
        paginated_leaves = paginator.paginate_queryset(
            leaves, request
        )

        data = [
            {
                "id": leave.id,
                "employee_name": leave.employee.full_name if leave.employee else None,
                "start_date": leave.start_date,
                "end_date": leave.end_date,
                "status": leave.status,
                "approved_by": leave.approved_by.full_name if leave.approved_by else None,
                "applied_at": leave.applied_at
            }
            for leave in paginated_leaves
        ]

        return paginator.get_paginated_response(data)


from work.models import WorkAssignment, WorkHourEntry
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination


class WorkPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class HighAuthorityWorkRecordsView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        assignments = WorkAssignment.objects.select_related(
            "assigned_by"
        ).prefetch_related(
            "hours__job_title"
        ).order_by("-date")

        # 🔹 Date filtering
        date = request.query_params.get("date")
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if date:
            assignments = assignments.filter(date=date)

        if start_date:
            assignments = assignments.filter(date__gte=start_date)

        if end_date:
            assignments = assignments.filter(date__lte=end_date)

        # 🔹 Search by employee name
        search = request.query_params.get("search")
        if search:
            assignments = assignments.filter(
                Q(employee_name__icontains=search)
            )

        # 🔹 Pagination
        paginator = WorkPagination()
        paginated_assignments = paginator.paginate_queryset(
            assignments, request
        )

        data = []

        for assignment in paginated_assignments:

            hour_mapping = {
                f"H{entry.hour_number}":
                entry.job_title.title if entry.job_title else None
                for entry in assignment.hours.all()
            }

            data.append({
                "id": assignment.id,
                "employee_name": assignment.employee_name,
                "date": assignment.date,
                "assigned_by": assignment.assigned_by.full_name if assignment.assigned_by else None,
                "hours": hour_mapping
            })

        return paginator.get_paginated_response(data)


from audit.models import AuditLog
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination

# imports
from rest_framework.pagination import PageNumberPagination
from audit.models import AuditLog
from django.db.models import Q
from django.utils.timezone import localtime


# Pagination class
class AuditPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = "page_size"
    max_page_size = 100


# View class
class HighAuthorityAuditLogsView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        logs = AuditLog.objects.select_related("user").order_by("-created_at")

        # 🔹 Date filtering
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            logs = logs.filter(created_at__date__gte=start_date)

        if end_date:
            logs = logs.filter(created_at__date__lte=end_date)

        # 🔹 Module filtering
        module = request.query_params.get("module")
        if module:
            logs = logs.filter(module__iexact=module)

        # 🔹 Action filtering
        action = request.query_params.get("action")
        if action:
            logs = logs.filter(action__iexact=action)

        # 🔹 Search (user / module / action / description)
        # 🔹 Global Search (User / Module / Action / Description / Old / New / Date / Time)
        search = request.query_params.get("search")

        if search:
            logs = logs.filter(
        Q(user__full_name__icontains=search) |
        Q(module__icontains=search) |
        Q(action__icontains=search) |
        Q(description__icontains=search) |
        Q(old_value__icontains=search) |
        Q(new_value__icontains=search) |
        Q(created_at__date__icontains=search)
    )


        # 🔹 Pagination
        paginator = AuditPagination()
        paginated_logs = paginator.paginate_queryset(logs, request)

        data = []

        for log in paginated_logs:
            local_dt = localtime(log.created_at)

            data.append({
                "id": log.id,
                "user": log.user.full_name if log.user else "System",
                "action": log.action,
                "module": log.module,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "date": local_dt.date(),
                "time": local_dt.strftime("%H:%M:%S"),
            })

        return paginator.get_paginated_response(data)


class ExportInventoryRecordsView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        transactions = InventoryTransaction.objects.select_related(
            "item",
            "performed_by"
        ).order_by("-created_at")

        headers = [
            "Item Code",
            "Description",
            "Transaction Type",
            "Quantity",
            "Approval Status",
            "Performed By",
            "Created At"
        ]

        data_rows = [
            [
                t.item.item_code if t.item else "",
                t.item.description if t.item else "",
                t.transaction_type,
                t.quantity,
                t.approval_status,
                t.performed_by.full_name if t.performed_by else "",
                str(t.created_at),
            ]
            for t in transactions
        ]

        return export_to_excel("inventory_records", headers, data_rows)

class ExportUsageLogsView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        usage_logs = InventoryTransaction.objects.filter(
            transaction_type="USAGE"
        ).select_related("item", "performed_by")

        headers = [
            "Item Code",
            "Description",
            "Quantity Used",
            "Performed By",
            "Created At"
        ]

        data_rows = [
            [
                log.item.item_code if log.item else "",
                log.item.description if log.item else "",
                log.quantity,
                log.performed_by.full_name if log.performed_by else "",
                str(log.created_at),
            ]
            for log in usage_logs
        ]

        return export_to_excel("usage_logs", headers, data_rows)


class ExportAttendanceRecordsView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        leaves = LeaveApplication.objects.select_related("employee", "approved_by")

        headers = [
            "Employee",
            "Start Date",
            "End Date",
            "Status",
            "Approved By",
            "Applied At"
        ]

        data_rows = [
            [
                leave.employee.full_name if leave.employee else "",
                str(leave.start_date),
                str(leave.end_date),
                leave.status,
                leave.approved_by.full_name if leave.approved_by else "",
                str(leave.applied_at),
            ]
            for leave in leaves
        ]

        return export_to_excel("attendance_records", headers, data_rows)


class ExportWorkRecordsView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        assignments = WorkAssignment.objects.prefetch_related("hours__job_title")

        headers = [
            "Employee",
            "Date",
            "Assigned By",
            "Hours"
        ]

        data_rows = []

        for a in assignments:
            hour_mapping = ", ".join(
                [
                    f"H{h.hour_number}:{h.job_title.title if h.job_title else ''}"
                    for h in a.hours.all()
                ]
            )

            data_rows.append([
                a.employee_name,
                str(a.date),
                a.assigned_by.full_name if a.assigned_by else "",
                hour_mapping
            ])

        return export_to_excel("work_records", headers, data_rows)

class ExportAuditLogsView(APIView):
    permission_classes = [IsHighAuthority]

    def get(self, request):

        logs = AuditLog.objects.select_related("user").order_by("-created_at")

        # 🔹 Same filters as main view
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        module = request.query_params.get("module")
        action = request.query_params.get("action")
        search = request.query_params.get("search")

        if start_date:
            logs = logs.filter(created_at__date__gte=start_date)

        if end_date:
            logs = logs.filter(created_at__date__lte=end_date)

        if module:
            logs = logs.filter(module__iexact=module)

        if action:
            logs = logs.filter(action__iexact=action)

        if search:
            logs = logs.filter(
                Q(user__full_name__icontains=search) |
                Q(module__icontains=search) |
                Q(action__icontains=search) |
                Q(description__icontains=search)
            )

        headers = [
            "User",
            "Action",
            "Module",
            "Old Value",
            "New Value",
            "Date",
            "Time"
        ]

        data_rows = []

        for log in logs:
            local_dt = localtime(log.created_at)

            data_rows.append([
                log.user.full_name if log.user else "System",
                log.action,
                log.module,
                str(log.old_value),
                str(log.new_value),
                str(local_dt.date()),
                local_dt.strftime("%H:%M:%S"),
            ])

        return export_to_excel("audit_logs", headers, data_rows)

from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import localtime


class GlobalAuditLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        logs = AuditLog.objects.select_related("user").order_by("-created_at")

        # 🔒 Restriction Logic
        if request.user.role in ["OPERATOR", "MANAGER"]:
            logs = logs.filter(user=request.user)

        # 🔎 Search (User / Module / Action / Description)
        search = request.query_params.get("search")

        if search:
            logs = logs.filter(
                Q(user__full_name__icontains=search) |
                Q(module__icontains=search) |
                Q(action__icontains=search) |
                Q(description__icontains=search)
            )

        paginator = AuditPagination()
        paginated_logs = paginator.paginate_queryset(logs, request)

        data = []

        for log in paginated_logs:
            local_dt = localtime(log.created_at)

            data.append({
                "id": log.id,
                "user": log.user.full_name if log.user else "System",
                "action": log.action,
                "module": log.module,
                "description": log.description,
                "date": local_dt.date(),
                "time": local_dt.strftime("%H:%M:%S"),
            })

        return paginator.get_paginated_response(data)
