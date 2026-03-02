from rest_framework import serializers
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from products.models import Product


class CartItemResponseSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(source='product.id')
    product_name = serializers.CharField(source='product.name')
    product_thumbnail = serializers.ImageField(source='product.thumbnail', read_only=True)
    unit_price = serializers.DecimalField(source='product.current_price', max_digits=10, decimal_places=2, read_only=True)
    original_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(source='get_total', max_digits=10, decimal_places=2, read_only=True)
    stock_available = serializers.IntegerField(source='product.stock', read_only=True)
    is_stock_problem = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'product_id', 'product_name', 'product_thumbnail',
            'unit_price', 'original_price', 'quantity', 'subtotal',
            'stock_available', 'is_stock_problem'
        ]

    def get_is_stock_problem(self, obj):
        if not obj.product: return True
        return obj.quantity > obj.product.stock


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(default=1)

    def validate(self, data):
        """Validates product existence and stock availability."""
        request = self.context.get('request')
        user = getattr(request, 'auth_user', None)

        if not user:
            raise serializers.ValidationError("Authentication required. Please login.")

        quantity = data['quantity']
        product_id = data['product_id']

        if quantity < 1:
            raise serializers.ValidationError("Quantity must be at least 1")

        try:
            product = Product.objects.get(id=product_id, is_approved=True, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or unavailable.")

        cart, _ = Cart.objects.get_or_create(user=user)
        
        try:
            existing_item = CartItem.objects.get(cart=cart, product=product)
            future_quantity = existing_item.quantity + quantity
        except CartItem.DoesNotExist:
            future_quantity = quantity

        if future_quantity > product.stock:
            raise serializers.ValidationError(
                f"Insufficient stock. Only {product.stock} units available."
            )

        data['product'] = product
        data['cart'] = cart
        return data

    def create(self, validated_data):
        """Handles creating or updating the cart item."""
        cart = validated_data['cart']
        product = validated_data['product']
        quantity = validated_data['quantity']

        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)

        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity
        
        cart_item.save()
        return cart_item


class UpdateCartItemSerializer(serializers.ModelSerializer):
    quantity = serializers.IntegerField()
    class Meta:
        model = CartItem
        fields = ['quantity']

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1")
        return value

    def validate(self, data):
        """Check stock for the new quantity."""
        new_quantity = data['quantity']
        cart_item = self.instance
        
        if cart_item.product and new_quantity > cart_item.product.stock:
             raise serializers.ValidationError(
                f"Cannot update quantity. Only {cart_item.product.stock} items left in stock."
            )
        return data

    def update(self, instance, validated_data):
        instance.quantity = validated_data['quantity']
        instance.save()
        return instance