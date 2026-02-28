from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem
from Cart.models import Cart
from address.models import Address
from address.serializers import AddressSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product_name', 'product_sku', 'price', 'quantity', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = AddressSerializer(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'total_amount', 'status', 'shipping_address', 'items', 'created_at', 'payment_method', 'is_paid']


class PlaceOrderSerializer(serializers.Serializer):
    address_id = serializers.UUIDField(required=False)
    payment_method = serializers.ChoiceField(choices=['UPI', 'CASH_ON_DELIVERY'], default='CASH_ON_DELIVERY') 

    def validate(self, data):
        user = self.context['request'].auth_user
        address_id = data.get('address_id') 
        address = None
        if address_id:
            try:
                address = Address.objects.get(id=address_id, user=user)
            except Address.DoesNotExist:
                raise serializers.ValidationError("Invalid address selected or address not found.")
        else:
            address = Address.objects.filter(user=user, is_default=True).first()
            if not address:
                raise serializers.ValidationError(
                    "No address provided and no default address found. Please add an address first."
                )
        try:
            cart = Cart.objects.get(user=user)
            if not cart.items.exists():
                raise serializers.ValidationError("Your cart is empty.")
        except Cart.DoesNotExist:
            raise serializers.ValidationError("Cart not found.")
        data['address'] = address
        data['cart'] = cart
        return data

    def create(self, validated_data):
        user = self.context['request'].auth_user
        address = validated_data['address']
        cart = validated_data['cart']
        payment_method = validated_data.get('payment_method', 'CASH_ON_DELIVERY')
        with transaction.atomic():
            order = Order.objects.create(
                user=user,
                total_amount=0,
                status='PENDING',
                shipping_address=address,
                payment_method=payment_method,
                is_paid=(payment_method == 'UPI')
            )
            final_order_total = 0
            cart_items = cart.items.select_related('product').filter(product__isnull=False).select_for_update()
            for item in cart_items:
                product = item.product
                if product.stock < item.quantity:
                    raise serializers.ValidationError(
                        f"Out of stock: {product.name}. Only {product.stock} left."
                    )
                product.stock -= item.quantity
                product.save()
                price_at_purchase = product.current_price
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    product_sku=product.sku,
                    price=price_at_purchase,
                    quantity=item.quantity
                )
                final_order_total += price_at_purchase * item.quantity
            order.total_amount = final_order_total
            order.save()
            cart.items.all().delete()
            return order

class OrderListSerializer(serializers.ModelSerializer):
    product_names = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'created_at',
            'total_amount',
            'status',
            'product_names',
        ]

    def get_product_names(self, obj):
        return [item.product_name for item in obj.items.all()]