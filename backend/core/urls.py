from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/work/', include('work.urls')),
    path('api/reporting/', include('reporting.urls')),
path('api/notification/', include('notification.urls')),





]



