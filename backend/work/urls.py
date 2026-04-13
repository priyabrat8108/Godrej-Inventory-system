from django.urls import path
from .views import UpdateWorkAssignmentView
from .views import DeleteWorkAssignmentView
from .views import DeleteJobTitleView
from .views import LockWorkDayView
from .views import WorkDayLockStatusView




from .views import (
    CreateJobTitleView,
    TodayJobTitlesView,
    CreateWorkAssignmentView,
    TodayWorkAssignmentsView,
    WorkHistoryView,
    WorkDayLockStatusView,

)

urlpatterns = [
    path('job-titles/', CreateJobTitleView.as_view()),
    path('job-titles/today/', TodayJobTitlesView.as_view()),
    path('assign/', CreateWorkAssignmentView.as_view()),
    path('today/', TodayWorkAssignmentsView.as_view()),
    path('history/', WorkHistoryView.as_view()),
    path('assign/<uuid:assignment_id>/', UpdateWorkAssignmentView.as_view()),
    path('assign/<uuid:assignment_id>/delete/', DeleteWorkAssignmentView.as_view()),
path('job-titles/<uuid:job_id>/delete/', DeleteJobTitleView.as_view()),
path("lock-day/", LockWorkDayView.as_view(), name="lock-work-day"),
path("lock-status/", WorkDayLockStatusView.as_view(), name="work-lock-status"),


]
