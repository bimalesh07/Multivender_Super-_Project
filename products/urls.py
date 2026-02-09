from django.urls import path
from .views import (CreateProductView, ApproveProductView,AdminProductListView ,ApprovedProductList,PublicProductListView)

urlpatterns = [
    path('public/', PublicProductListView.as_view(), name='public-product-list'),
    path("create/", CreateProductView.as_view()),
    path("approve/<uuid:product_id>/", ApproveProductView.as_view()),
    path("admin-list/", AdminProductListView.as_view()),
    path("approved/", ApprovedProductList.as_view()),
]