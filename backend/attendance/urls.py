from django.urls import path


from .views import (
    CreateEmployeeView,
    ApplyLeaveView,
    LeaveHistoryView,
    PendingLeaveView,
    ApproveLeaveView,
    RejectLeaveView,
    EmployeeListView,
    
)

urlpatterns = [

    # ===============================
    # Employee Registration
    # ===============================
    path(
        "employees/create/",
        CreateEmployeeView.as_view(),
        name="create-employee"
    ),

    # ===============================
    # Leave Application
    # ===============================
    path(
        "leaves/apply/",
        ApplyLeaveView.as_view(),
        name="apply-leave"
    ),

    # ===============================
    # Leave History
    # ===============================
    path(
        "leaves/",
        LeaveHistoryView.as_view(),
        name="leave-history"
    ),

    # ===============================
    # Pending Leaves (Approval Panel)
    # ===============================
    path(
        "leaves/pending/",
        PendingLeaveView.as_view(),
        name="pending-leaves"
    ),

    # ===============================
    # Approve Leave
    # ===============================
    path(
        "leaves/<uuid:pk>/approve/",
        ApproveLeaveView.as_view(),
        name="approve-leave"
    ),

    # ===============================
    # Reject Leave
    # ===============================
    path(
        "leaves/<uuid:pk>/reject/",
        RejectLeaveView.as_view(),
        name="reject-leave"
    ),
    path(
    "employees/",
    EmployeeListView.as_view(),
    name="employee-list"
    ),

    

    

]
