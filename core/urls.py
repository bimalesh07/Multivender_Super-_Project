from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/organizations/", include("organizations.urls")),
    path("api/v1/products/", include("products.urls")),
    path("api/v1/cart/", include("Cart.urls")),
    path("api/v1/orders/", include("orders.urls")),
    path("api/v1/wishlist/", include("wishlist.urls")),
    path('api/v1/address/', include('address.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
