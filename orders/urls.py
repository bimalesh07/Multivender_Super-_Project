from django.urls import path
from .views import (
    PlaceOrderView,
    AdminOrderListView,
    AdminUpdateOrderStatusView,
    OrderHistoryView,
)

urlpatterns = [
    path("place/", PlaceOrderView.as_view()),
    path("history/", OrderHistoryView.as_view(), name='order-history'),
    path("admin/list/", AdminOrderListView.as_view()),
    path('admin/update-status/<uuid:pk>/', AdminUpdateOrderStatusView.as_view()),
]
