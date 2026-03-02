import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .utils import hash_password, verify_password
from .jwt import generate_jwt
from .serializers import UserRegisterSerializer, UserLoginSerializer, StaffCreateSerializer

logger = logging.getLogger(__name__)

class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        if User.objects.filter(email=email).exists():
            logger.warning("Registration failed: email %s already exists", email)
            return Response({"error": "Email already exists"}, status=400)

        user = User.objects.create(
            email=email,
            password=hash_password(password),
            role="CUSTOMER"
        )
        logger.info("New user registered: %s (ID: %s)", email, user.id)
        return Response({"message": "User registered successfully", "user_id": str(user.id)}, status=201)
    

class UserLoginView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning("Login failed: user %s not found", email)
            return Response({"error": "Invalid credentials User Does Not Exist "}, status=401)

        if not verify_password(password, user.password):
            logger.warning("Login failed: invalid password for %s", email)
            return Response({"error": "Invalid credentials"}, status=401)
    
        token = generate_jwt(user)
        logger.info("User logged in: %s (role: %s)", email, user.role)
        payload = {"token": token, "role": user.role, "email": user.email}
        if getattr(user, "organization", None):
            payload["organization_name"] = user.organization.name
        return Response(payload, status=200)
    

class CreateStaffView(APIView):
    def post(self, request):
        admin = request.auth_user
        if not admin or admin.role != "ADMIN":
            return Response({"error": "Unauthorized"}, status=401)

        if not admin.organization:
            return Response({"error": "Admin has no organization"}, status=400)

        serializer = StaffCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=400)

        staff = User.objects.create(
            email=email,
            password=hash_password(password),
            role="STAFF",
            organization=admin.organization
        )

        logger.info("Staff created: %s by admin %s (org: %s)", email, admin.email, admin.organization.name)
        return Response({
            "message": "Staff created successfully",
            "staff_id": str(staff.id),
            "organization": admin.organization.name
        }, status=201)


class UserProfileView(APIView):
    def get(self, request):
        user = request.auth_user
        if not user:
            return Response({"error": "Unauthorized"}, status=401)
        return Response({
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "organization": user.organization.name if user.organization else None,
            "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') else None
        }, status=200)