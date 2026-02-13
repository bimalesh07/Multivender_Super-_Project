"""from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Product
from .serializers import ProductCreateSerializer, ProductResponseSerializer,ProductResponseSerializer

class PublicProductListView(APIView):
  
    def get(self, request):
        # Only show products where is_approved is True
        products = Product.objects.filter(is_approved=True).order_by('-created_at')
        
        # Serialize the queryset (many=True because it's a list)
        serializer = ProductResponseSerializer(products, many=True)
        
        # Return the data with a 200 OK status
        return Response(serializer.data, status=status.HTTP_200_OK)


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
    
    
class ApprovedProductList(APIView):
    def get(self, request):
        products = Product.objects.filter(is_approved = True)
        serializer = ProductResponseSerializer(products, many = True)
        return Response(serializer.data, status=200)

"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Product, ProductImage
from .serializers import ProductSerializer  

class PublicProductListView(APIView):
    # approved product
    def get(self, request):
        products = Product.objects.filter(is_approved=True, is_active=True).order_by('-created_at')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateProductView(APIView):
    def post(self, request):
        user = request.auth_user 

        if not user or user.role != "STAFF":
            return Response({"error": "Only staff can add products"}, status=401)

        
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Product Create 
        product = Product.objects.create(
            name=serializer.validated_data["name"],
            description=serializer.validated_data.get("description"),
            price=serializer.validated_data["price"],
            discount_price=serializer.validated_data.get("discount_price"),
            stock=serializer.validated_data.get("stock", 0),
            thumbnail=request.FILES.get('thumbnail'), # Image file handling
            sku=serializer.validated_data.get("sku"),
            organization=user.organization,
            created_by=user
        )

        return Response({
            "message": "Product created, waiting for approval",
            "product": {
                "id": product.id,
                "name": product.name,
                "price": product.price,
                "stock": product.stock,
            }
        }, status=201)

    
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

        return Response({"message": f"Product '{product.name}' approved successfully"}, status=200)
    

class AdminProductListView(APIView):
    """
    Admin can see organization all products (Approved + Pending)
    """
    def get(self, request):
        user = request.auth_user

        if not user or user.role != "ADMIN":
            return Response({"error": "Unauthorized"}, status=401)

        products = Product.objects.filter(organization=user.organization).order_by('-created_at')
        serializer = ProductSerializer(products, many=True)

        return Response(serializer.data, status=200)

# Stff see Approved Products
class ApprovedProductList(APIView):
    def get(self, request):
        user = request.auth_user
        if user or user.role !="STAFF":
            return Response({"error":"Anuthorized","message":"Onely staff can see Approved Product"}, status=201)
         
        products = Product.objects.filter(is_approved=True, is_active=True)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=200)
    

class EditProductView(APIView):
    def patch(self, request, product_id):
        user = request.auth_user 
        if not user or user.role != "STAFF":
            return Response({"error": "Only staff can edit products"}, status=401)

        try:
        
            product = Product.objects.get(id=product_id, organization=user.organization)
        except Product.DoesNotExist:
            return Response({"error": "Product not found in your organization"}, status=404)

        serializer = ProductSerializer(product, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Edit after proved waiting for re approvel
            serializer.save(is_approved=False) 
            return Response({
                "message": f"Product '{product.name}' updated and sent for re-approval",
                "data": serializer.data
            }, status=200)
        
        return Response(serializer.errors, status=400)

class DeleteProductView(APIView):
    def delete(self, request, product_id):
        user = request.auth_user

        if not user or user.role != "ADMIN":
            return Response({"error": "Only admin can delete products"}, status=401)

        try:
            product = Product.objects.get(id=product_id, organization=user.organization)
            product_name = product.name
            product.delete()
            return Response({"message": f"Product '{product_name}' has been deleted"}, status=200)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)