from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Address
from .serializers import AddressSerializer

class AddressListCreateView(APIView):
    def get(self, request):
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) != "CUSTOMER":
            return Response({"error": "Unauthorized. Customers only."}, status=status.HTTP_401_UNAUTHORIZED)
        
        # addresses created by this user
        addresses = Address.objects.filter(user=user)
        serializer = AddressSerializer(addresses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    #Create a new address ---
    def post(self, request):
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) != "CUSTOMER":
            return Response({"error": "Unauthorized. Customers only."}, status=status.HTTP_401_UNAUTHORIZED)
        
        serializer = AddressSerializer(data=request.data)
        if serializer.is_valid():
            # Save the address and link it to the user manually
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddressDetailView(APIView):
    def get_object(self, pk, user):
        try:
            return Address.objects.get(pk=pk, user=user)
        except Address.DoesNotExist:
            return None

    #Retrieve single address ---
    def get(self, request, pk):
        user = getattr(request, 'auth_user', None)
        if not user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        address = self.get_object(pk, user)
        if not address:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = AddressSerializer(address)
        return Response(serializer.data)

    # Update address
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
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Remove address ---
    def delete(self, request, pk):
        user = getattr(request, 'auth_user', None)
        if not user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        address = self.get_object(pk, user)
        if not address:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

        address.delete()
        return Response({"message": "Address deleted successfully"}, status=status.HTTP_204_NO_CONTENT)