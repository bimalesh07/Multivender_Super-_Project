from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Product
from .serializers import ProductCreateSerializer, ProductResponseSerializer


class CreateProductView(APIView):
    def post(self, request):
        user = request.auth_user

        if not user or user.role != "STAFF":
            return Response({"error": "Only staff can add products"}, status=401)

        serializer = ProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = Product.objects.create(
            name=serializer.validated_data["name"],
            description=serializer.validated_data["description"],
            price=serializer.validated_data["price"],
            organization=user.organization,
            created_by=user
        )

        return Response({
        "message": "Product created, waiting for approval",
        "product": {
        "id": product.id,
        "name": product.name,
        "price": product.price
    }}, status=201)
    
    
class ApproveProductView(APIView):
    def post(self, request, product_id):
        user = request.auth_user

        if not user or user.role != "ADMIN":
            return Response({"error": "Only admin can approve"}, status=401)

        try:
            product = Product.objects.get(
                id=product_id,
                organization=user.organization
            )
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

        product.is_approved = True
        product.save()

        return Response({"message": "Product approved"}, status=200)
    

class AdminProductListView(APIView):
    def get(self, request):
        user = request.auth_user

        if not user or user.role != "ADMIN":
            return Response({"error": "Unauthorized"}, status=401)

        products = Product.objects.filter(organization=user.organization)
        serializer = ProductResponseSerializer(products, many=True)

        return Response(serializer.data, status=200)
    
class AdminProductListView(APIView):
    def get(self, request):
        user = request.auth_user

        if not user or user.role != "ADMIN":
            return Response({"error": "Unauthorized"}, status=401)

        products = Product.objects.filter(organization=user.organization)
        serializer = ProductResponseSerializer(products, many=True)

        return Response(serializer.data, status=200)
    
    
class ApprovedProductList(APIView):
    def get(self, request):
        products = Product.objects.filter(is_approved = True)
        serializer = ProductResponseSerializer(products, many = True)
        return Response(serializer.data, status=200)

