
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