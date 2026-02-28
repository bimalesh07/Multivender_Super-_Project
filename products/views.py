from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Product, ProductImage
from .serializers import ProductSerializer, PublicProductListSerializer

class PublicProductListView(APIView):
    def get(self, request):
        try:
            search_query = request.query_params.get('search', '').strip()
            products = Product.objects.filter(is_approved=True, is_active=True)
            if search_query:
                products = products.filter(Q(name__icontains=search_query) | Q(description__icontains=search_query))
            products = products.order_by('-created_at')
            serializer = PublicProductListSerializer(products, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            from django.conf import settings
            detail = str(e) if getattr(settings, 'DEBUG', False) else 'Failed to load products'
            return Response({'error': detail}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateProductView(APIView):
    def post(self, request):
        user = request.auth_user 

        if user.role != "ADMIN" and user.role != "STAFF":
            return Response({"error": "Only staff can add products"}, status=401)
        
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = Product.objects.create(
            name=serializer.validated_data["name"],
            description=serializer.validated_data.get("description"),
            price=serializer.validated_data["price"],
            discount_price=serializer.validated_data.get("discount_price"),
            stock=serializer.validated_data.get("stock", 0),
            thumbnail=request.FILES.get('thumbnail'),
            sku=serializer.validated_data.get("sku"),
            manufacturer=serializer.validated_data.get("manufacturer"),
            material=serializer.validated_data.get("material"),
            product_type=serializer.validated_data.get("product_type"),
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
    def get(self, request):
        user = request.auth_user

        if not user or user.role not in ("ADMIN", "STAFF"):
            return Response({"error": "Unauthorized"}, status=401)
        if not getattr(user, "organization", None):
            return Response({"error": "No organization"}, status=403)

        products = Product.objects.filter(organization=user.organization).order_by('-created_at')
        serializer = ProductSerializer(products, many=True)

        return Response(serializer.data, status=200)

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
        if user.role != "ADMIN" and user.role != "STAFF":
            return Response({"error": "Only staff can edit products"}, status=401)

        try:
        
            product = Product.objects.get(id=product_id, organization=user.organization)
        except Product.DoesNotExist:
            return Response({"error": "Product not found in your organization"}, status=404)

        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
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


class ProductDetailView(APIView):
    def get(self, request, product_id):
        try:
            product = Product.objects.prefetch_related('images').get(id=product_id, is_approved=True, is_active=True)
            serializer = ProductSerializer(product)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)


class RelatedProductsView(APIView):
    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
            related = Product.objects.filter(
                is_approved=True,
                is_active=True
            ).exclude(id=product_id)
            if product.organization:
                related = related.filter(organization=product.organization)
            if product.product_type:
                related = related.filter(product_type=product.product_type)
            related = related[:4]
            serializer = ProductSerializer(related, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)