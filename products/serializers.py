from rest_framework import serializers

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