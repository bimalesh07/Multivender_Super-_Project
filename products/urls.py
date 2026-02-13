"""from django.urls import path
from .views import (CreateProductView, ApproveProductView,AdminProductListView ,ApprovedProductList,PublicProductListView)

urlpatterns = [
    path('public/', PublicProductListView.as_view(), name='public-product-list'),
    path("create/", CreateProductView.as_view()),
    path("approve/<uuid:product_id>/", ApproveProductView.as_view()),
    path("admin-list/", AdminProductListView.as_view()),
    path("approved/", ApprovedProductList.as_view()),
]"""

# here ulrs 
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

)

urlpatterns = [
    # Public APIs
    path('public/', PublicProductListView.as_view(), name='public-product-list'),

    # Staff/Admin APIs
    path("create/", CreateProductView.as_view(), name='product-create'),
    path("approve/<uuid:product_id>/", ApproveProductView.as_view(), name='product-approve'),
    path("admin-list/", AdminProductListView.as_view(), name='admin-product-list'),
    path("approved/", ApprovedProductList.as_view(), name='approved-list'), 

    # Edit or delete 
    path("edit/<uuid:product_id>/", EditProductView.as_view(), name='product-edit'),
    path("delete/<uuid:product_id>/", DeleteProductView.as_view(), name='product-delete'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)