from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .utils import hash_password, verify_password
from .jwt import generate_jwt
from .serializers import UserRegisterSerializer, UserLoginSerializer, StaffCreateSerializer

class UserRegisterView(APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=400)

        user = User.objects.create(
            email=email,
            password=hash_password(password),
            role="CUSTOMER"
        )
        return Response({"message": "User registered successfully", "user_id": str(user.id)}, status=201)
    

class UserLoginView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
            print("user",user)
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials User Does Not Exist "}, status=401)

        if not verify_password(password, user.password):
            return Response({"error": "Invalid credentials"}, status=401)
    
        token = generate_jwt(user)

        return Response({"token": token, "role": user.role}, status=200)
    

class CreateStaffView(APIView):
    def post(self, request):
        admin = request.auth_user

        # Only ADMIN can create staff
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

        return Response({
            "message": "Staff created successfully",
            "staff_id": str(staff.id),
            "organization": admin.organization.name
        }, status=201)