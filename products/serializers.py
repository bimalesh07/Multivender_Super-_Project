"""from rest_framework import serializers
from .models import Product

class ProductCreateSerializer(serializers.Serializer):
    name =serializers.CharField()
    description = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)

class ProductResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name=serializers.CharField()
    description = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_approved = serializers.BooleanField()


class ProductResponseSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'organization_name', 'created_at']"""


from rest_framework import serializers
from .models import Product, ProductImage

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text']


class PublicProductListSerializer(serializers.ModelSerializer):
    is_in_stock = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'discount_price',
            'thumbnail', 'stock', 'sku', 'is_in_stock', 'is_approved', 'images'
        ]

    def get_is_in_stock(self, obj):
        return getattr(obj, 'stock', 0) > 0


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    is_in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'discount_price', 
            'thumbnail', 'stock', 'sku', 'is_in_stock', 'is_approved', 
            'images', 'organization', 'created_by', 'created_at',
            'manufacturer', 'material', 'product_type'
        ]
        read_only_fields = ['id', 'is_approved', 'created_at', 'created_by','is_in_stock']

    def get_is_in_stock(self, obj):
        return obj.stock > 0