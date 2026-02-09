from rest_framework import serializers
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
        fields = ['id', 'name', 'description', 'price', 'organization_name', 'created_at']