from django.urls import path
from .views import UserRegisterView, UserLoginView, CreateStaffView, UserProfileView

urlpatterns = [
    path("register/", UserRegisterView.as_view(), name="user-register"),
    path("login/", UserLoginView.as_view(), name="user-login"),
    path("create-staff/", CreateStaffView.as_view()),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
]
