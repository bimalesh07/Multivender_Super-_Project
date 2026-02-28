from django.urls import path
from .views import AddressListCreateView, AddressDetailView

urlpatterns = [
    # GET: List all addresses
    # POST: Create new address
    path('create/', AddressListCreateView.as_view(), name='address-list-create'),

    # GET: Retrieve one address
    # PUT: Update address
    # DELETE: Delete address
    path('<uuid:pk>/', AddressDetailView.as_view(), name='address-detail'),
]