from django.urls import path
from . import views
from django.urls import path, include


urlpatterns = [

    # ITEMS
    path('items/', views.get_items, name='get_items'),
    path('items/create/', views.create_item, name='create_item'),
    path('items/<uuid:pk>/update/', views.update_item, name='update_item'),
    path('items/<uuid:pk>/delete/', views.delete_item, name='delete_item'),

    # STOCK ACTIONS
    path('items/<uuid:pk>/use/', views.use_item, name='use_item'),
    path('items/<uuid:pk>/add-stock/', views.add_stock, name='add_stock'),

    # TRANSACTIONS
    

    # DASHBOARD
    path('dashboard/', views.inventory_dashboard, name='inventory_dashboard'),
    path('stock-overview/', views.stock_overview, name='stock_overview'),
    path('filters/', views.filter_options, name='filter_options'),
    path('low-stock-summary/', views.low_stock_summary, name='low_stock_summary'),
    path('notifications/', views.get_notifications, name='get_notifications'),
    path('notifications/<int:pk>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('filters/', views.inventory_filters, name='inventory_filters'),
    path('items/<uuid:pk>/transactions/', views.get_item_transactions, name='item-transactions'),
    
    path('reorder-suggestions/', views.reorder_suggestions, name='reorder_suggestions'),
    path('items/<int:pk>/history/', views.item_history, name='item_history'),
    path('notifications/unread-count/', views.unread_notification_count),
    path('notifications/mark-read/', views.mark_notifications_read),
    path('report/', views.generate_report),
path('report/download/excel/', views.download_excel),
path('report/download/pdf/', views.download_pdf),
path('usage-logs/', views.high_authority_usage_logs),
path("items/<uuid:pk>/use/", views.use_item, name="use_item"),
path("notifications/", views.get_notifications, name="get_notifications"),
path("notifications/<int:pk>/read/", views.mark_notification_read),
path("notifications/unread-count/", views.unread_notification_count),
path("notifications/mark-read/", views.mark_all_notifications_read),
path("history/", views.inventory_history),


]


