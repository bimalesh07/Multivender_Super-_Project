from django.urls import path
from .views import AddToCartView, ViewCartView

urlpatterns = [
    path("add/", AddToCartView.as_view()),
    path("view/", ViewCartView.as_view()),
]
