from django.urls import path
from .views import AddressListCreateView, AddressDetailView

urlpatterns = [
    path('create/', AddressListCreateView.as_view(), name='address-list-create'),
    path('<uuid:pk>/', AddressDetailView.as_view(), name='address-detail'),
]