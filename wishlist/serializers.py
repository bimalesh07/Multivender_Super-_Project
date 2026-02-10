from rest_framework import serializers
from .models import Wishlist, WishlistItem

class WishlistItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_name', 'product_price', 'added_at']


class AddWishlistItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()