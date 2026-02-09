from django.urls import path
from .views import AddToCartView, ViewCartView,CartItemDetailView

urlpatterns = [
    path("add/", AddToCartView.as_view()),
    path("view/", ViewCartView.as_view()),
    path('item/<uuid:item_id>/', CartItemDetailView.as_view(), name='cart-item-detail'),
]
