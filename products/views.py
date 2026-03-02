import logging
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from .models import Product, ProductImage
from .serializers import ProductSerializer, PublicProductListSerializer

logger = logging.getLogger(__name__)

class PublicProductListView(APIView):
    def get(self, request):
        try:
            search_query = request.query_params.get('search', '').strip()
            products = Product.objects.filter(is_approved=True, is_active=True)
            if search_query:
                products = products.filter(Q(name__icontains=search_query) | Q(description__icontains=search_query))
                logger.info("Product search: '%s' — %d results", search_query, products.count())
            products = products.order_by('-created_at')

            paginator = PageNumberPagination()
            paginated_products = paginator.paginate_queryset(products, request)
            serializer = PublicProductListSerializer(paginated_products, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            logger.error("Failed to load products: %s", str(e))
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

        logger.info("Product created: '%s' (ID: %s) by %s", product.name, product.id, user.email)
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

        logger.info("Product approved: '%s' (ID: %s) by admin %s", product.name, product.id, user.email)
        return Response({"message": f"Product '{product.name}' approved successfully"}, status=200)
    

class AdminProductListView(APIView):
    def get(self, request):
        user = request.auth_user

        if not user or user.role not in ("ADMIN", "STAFF"):
            return Response({"error": "Unauthorized"}, status=401)
        if not getattr(user, "organization", None):
            return Response({"error": "No organization"}, status=403)

        products = Product.objects.filter(organization=user.organization).order_by('-created_at')

        paginator = PageNumberPagination()
        paginated_products = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(paginated_products, many=True)
        return paginator.get_paginated_response(serializer.data)


class ProductDetailView(APIView):
    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, is_approved=True, is_active=True)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = PublicProductListSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminProductDetailView(APIView):
    def get(self, request, product_id):
        user = request.auth_user
        if not user or user.role not in ("ADMIN", "STAFF"):
            return Response({"error": "Unauthorized"}, status=401)
        
        try:
            product = Product.objects.get(id=product_id, organization=user.organization)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)
        
        serializer = ProductSerializer(product)
        return Response(serializer.data, status=200)

    def put(self, request, product_id):
        user = request.auth_user
        if not user or user.role not in ("ADMIN", "STAFF"):
            return Response({"error": "Unauthorized"}, status=401)

        try:
            product = Product.objects.get(id=product_id, organization=user.organization)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product.name = serializer.validated_data["name"]
        product.description = serializer.validated_data.get("description", product.description)
        product.price = serializer.validated_data["price"]
        product.discount_price = serializer.validated_data.get("discount_price", product.discount_price)
        product.stock = serializer.validated_data.get("stock", product.stock)
        product.sku = serializer.validated_data.get("sku", product.sku)
        product.manufacturer = serializer.validated_data.get("manufacturer", product.manufacturer)
        product.material = serializer.validated_data.get("material", product.material)
        product.product_type = serializer.validated_data.get("product_type", product.product_type)

        if 'thumbnail' in request.FILES:
            product.thumbnail = request.FILES['thumbnail']

        product.save()

        logger.info("Product updated: '%s' (ID: %s) by %s", product.name, product.id, user.email)
        return Response({
            "message": "Product updated successfully",
            "product": ProductSerializer(product).data
        }, status=200)

    def delete(self, request, product_id):
        user = request.auth_user
        if not user or user.role not in ("ADMIN", "STAFF"):
            return Response({"error": "Unauthorized"}, status=401)

        try:
            product = Product.objects.get(id=product_id, organization=user.organization)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

        product_name = product.name
        product.delete()
        logger.info("Product deleted: '%s' (ID: %s) by %s", product_name, product_id, user.email)
        return Response({"message": f"Product '{product_name}' deleted successfully"}, status=200)


class ApprovedProductList(APIView):
    def get(self, request):
        user = request.auth_user
        if not user or user.role not in ("ADMIN", "STAFF"):
            return Response({"error": "Unauthorized"}, status=401)

        products = Product.objects.filter(
            organization=user.organization,
            is_approved=True
        ).order_by('-created_at')

        paginator = PageNumberPagination()
        paginated_products = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(paginated_products, many=True)
        return paginator.get_paginated_response(serializer.data)


class RelatedProductsView(APIView):
    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, is_approved=True, is_active=True)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        related = Product.objects.filter(
            is_approved=True,
            is_active=True,
            organization=product.organization
        ).exclude(id=product.id).order_by('-created_at')[:5]

        serializer = PublicProductListSerializer(related, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


EditProductView = AdminProductDetailView
DeleteProductView = AdminProductDetailView
