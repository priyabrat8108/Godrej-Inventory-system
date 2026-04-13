from django.urls import path
from .views import HighAuthorityNotificationView
from .views import HighAuthorityNotificationView, MarkNotificationReadView, NotificationUnreadCountView
urlpatterns = [
    path("high-authority/", HighAuthorityNotificationView.as_view(), name="ha-notifications"),
 path("high-authority/", HighAuthorityNotificationView.as_view(), name="ha-notifications"),
    path("high-authority/<int:pk>/read/", MarkNotificationReadView.as_view(), name="ha-notification-read"),
path("high-authority/unread-count/", NotificationUnreadCountView.as_view(), name="ha-notification-unread-count"),


]
