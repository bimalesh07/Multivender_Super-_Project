from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    CreateProductView, 
    ApproveProductView, 
    AdminProductListView, 
    ApprovedProductList,
    PublicProductListView,
    EditProductView,
    DeleteProductView,
    ProductDetailView,
    RelatedProductsView,
)

urlpatterns = [
    path('public/', PublicProductListView.as_view(), name='public-product-list'),
    path('public/<uuid:product_id>/', ProductDetailView.as_view(), name='product-detail'),
    path('public/<uuid:product_id>/related/', RelatedProductsView.as_view(), name='related-products'),
    path("create/", CreateProductView.as_view(), name='product-create'),
    path("approve/<uuid:product_id>/", ApproveProductView.as_view(), name='product-approve'),
    path("admin-list/", AdminProductListView.as_view(), name='admin-product-list'),
    path("approved/", ApprovedProductList.as_view(), name='approved-list'),
    path("edit/<uuid:product_id>/", EditProductView.as_view(), name='product-edit'),
    path("delete/<uuid:product_id>/", DeleteProductView.as_view(), name='product-delete'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)