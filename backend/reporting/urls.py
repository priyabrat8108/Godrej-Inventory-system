from django.urls import path
from .views import HighAuthorityOverviewView
from .views import HighAuthorityUserListView
from .views import ApproveUserView
from .views import RejectUserView
from .views import HighAuthorityInventoryRecordsView
from .views import HighAuthorityUsageLogsView
from .views import HighAuthorityAttendanceRecordsView
from .views import HighAuthorityWorkRecordsView, GlobalAuditLogsView
from .views import HighAuthorityAuditLogsView, ExportInventoryRecordsView, ExportUsageLogsView, ExportAttendanceRecordsView, ExportWorkRecordsView, ExportAuditLogsView



urlpatterns = [
    path("high-authority/overview/", HighAuthorityOverviewView.as_view(), name="ha-overview"),
    path("high-authority/overview/", HighAuthorityOverviewView.as_view(), name="ha-overview"),
    path("high-authority/users/", HighAuthorityUserListView.as_view(), name="ha-users"),
path("high-authority/overview/", HighAuthorityOverviewView.as_view(), name="ha-overview"),
    path("high-authority/users/", HighAuthorityUserListView.as_view(), name="ha-users"),
    path("high-authority/users/<uuid:user_id>/approve/", ApproveUserView.as_view(), name="ha-approve-user"),
    path("high-authority/users/<uuid:user_id>/reject/", RejectUserView.as_view(), name="ha-reject-user"),
path("high-authority/inventory-records/", HighAuthorityInventoryRecordsView.as_view(), name="ha-inventory-records"),
path("high-authority/usage-logs/", HighAuthorityUsageLogsView.as_view(), name="ha-usage-logs"),
path("high-authority/attendance-records/", HighAuthorityAttendanceRecordsView.as_view(), name="ha-attendance-records"),
path("high-authority/work-records/", HighAuthorityWorkRecordsView.as_view(), name="ha-work-records"),
path("high-authority/audit-logs/", HighAuthorityAuditLogsView.as_view(), name="ha-audit-logs"),
path("high-authority/inventory-records/export/", ExportInventoryRecordsView.as_view(), name="ha-inventory-export"),
path("high-authority/usage-logs/export/", ExportUsageLogsView.as_view(), name="ha-usage-export"),
path("high-authority/attendance-records/export/", ExportAttendanceRecordsView.as_view(), name="ha-attendance-export"),
path("high-authority/work-records/export/", ExportWorkRecordsView.as_view(), name="ha-work-export"),
path("high-authority/audit-logs/export/", ExportAuditLogsView.as_view(), name="ha-audit-export"),

path("audit-logs/", GlobalAuditLogsView.as_view(), name="global-audit-logs"),


]

