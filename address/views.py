import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from .models import Address
from .serializers import AddressSerializer

logger = logging.getLogger(__name__)

class AddressListCreateView(APIView):
    def get(self, request):
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) != "CUSTOMER":
            return Response({"error": "Unauthorized. Customers only."}, status=status.HTTP_401_UNAUTHORIZED)
        
        addresses = Address.objects.filter(user=user)

        paginator = PageNumberPagination()
        paginated_addresses = paginator.paginate_queryset(addresses, request)
        serializer = AddressSerializer(paginated_addresses, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) != "CUSTOMER":
            return Response({"error": "Unauthorized. Customers only."}, status=status.HTTP_401_UNAUTHORIZED)
        
        serializer = AddressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user)
            logger.info("Address created for %s in %s", user.email, serializer.data.get('city', ''))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddressDetailView(APIView):
    def get_object(self, pk, user):
        try:
            return Address.objects.get(pk=pk, user=user)
        except Address.DoesNotExist:
            return None

    def get(self, request, pk):
        user = getattr(request, 'auth_user', None)
        if not user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        address = self.get_object(pk, user)
        if not address:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = AddressSerializer(address)
        return Response(serializer.data)

    def put(self, request, pk):
        user = getattr(request, 'auth_user', None)
        if not user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        address = self.get_object(pk, user)
        if not address:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AddressSerializer(address, data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info("Address updated: %s by %s", pk, user.email)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = getattr(request, 'auth_user', None)
        if not user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        address = self.get_object(pk, user)
        if not address:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

        address.delete()
        logger.info("Address deleted: %s by %s", pk, user.email)
        return Response({"message": "Address deleted successfully"}, status=status.HTTP_204_NO_CONTENT)