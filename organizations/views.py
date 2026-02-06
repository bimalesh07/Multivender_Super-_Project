from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Organization
from .serializers import CreateOrganizationSerializer
from accounts.models import User
from accounts.utils import hash_password

class CreateOrganizationView(APIView):
    def post(self, request):
        user = request.auth_user

        # Only SUPERUSER
        if not user or user.role != "SUPERUSER":
            return Response({"error": "Unauthorized"}, status=401)

        serializer = CreateOrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        org_name = serializer.validated_data["organization_name"]
        admin_email = serializer.validated_data["admin_email"]
        admin_password = serializer.validated_data["admin_password"]

        if Organization.objects.filter(name=org_name).exists():
            return Response({"error": "Organization already exists"}, status=400)

        if User.objects.filter(email=admin_email).exists():
            return Response({"error": "Admin email already exists"}, status=400)

        #  Create Organization
        organization = Organization.objects.create(name=org_name)

        # Create Admin linked to Organization
        admin = User.objects.create(
            email=admin_email,
            password=hash_password(admin_password),
            role="ADMIN",
            organization=organization
        )

        return Response({
            "message": "Organization & Admin created successfully",
            "organization_id": str(organization.id),
            "admin_id": str(admin.id)
        }, status=201)
