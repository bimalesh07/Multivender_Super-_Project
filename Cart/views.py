from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from products.models import Product
from .serializers import AddCartItemSerializer

class AddToCartView(APIView):
    def post(self, request):
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) != "CUSTOMER":
            return Response({"error": "Unauthorized. Customers only."}, status=401)
        
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data.get("quantity", 1)

        # 1. Fetch Product
        try:
            product = Product.objects.get(id=product_id, is_approved=True, is_active=True)
        except Product.DoesNotExist:
            return Response({"error": "Product not found or unavailable"}, status=404)

        # 2. STOCK CHECK (Critical Step!)
        # We need to check if adding this quantity exceeds what we have.
        cart, _ = Cart.objects.get_or_create(user=user)
        
        # Check if item already exists to calculate total future quantity
        try:
            existing_item = CartItem.objects.get(cart=cart, product=product)
            future_quantity = existing_item.quantity + quantity
            
        except CartItem.DoesNotExist:
            future_quantity = quantity

        if future_quantity > product.stock:
            return Response({
                "error": f"Insufficient stock. Only {product.stock} units available.",
                "available_stock": product.stock
            }, status=400)

        # 3. Add to Cart
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)

        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity
        
        cart_item.save()

        return Response({
            "message": "Product added to cart", 
            "current_cart_quantity": cart_item.quantity
        }, status=201)


class ViewCartView(APIView):
    def get(self, request):
        user = getattr(request, 'auth_user', None)
        if not user or user.role != 'CUSTOMER':
             return Response({"error": "Unauthorized"}, status=401)
         
        cart, _ = Cart.objects.get_or_create(user=user)
        
        # OPTIMIZATION: Use select_related to stop 100 queries for 100 items
        items = cart.items.select_related('product').all()
        
        data = {
            "cart_id": str(cart.id),
            "total_price": cart.get_cart_total,        # Uses Discount Price automatically
            "total_items_count": cart.get_cart_items_count,
            "items": [
                {
                    "id": str(item.id),
                    "product_id": str(item.product.id) if item.product else None,
                    "product_name": item.product.name if item.product else "Deleted Product",
                    
                    # --- PRICE DISPLAY ---
                    # Show the current selling price (discounted)
                    "unit_price": item.product.current_price if item.product else 0,
                    # Show original price so UI can show strikethrough (e.g. $100 -> $80)
                    "original_price": item.product.price if item.product else 0,
                    
                    "quantity": item.quantity,
                    "subtotal": item.get_total,
                    
                    # --- STOCK WARNING ---
                    # Tell frontend if this item is now out of stock
                    "is_stock_problem": item.quantity > item.product.stock if item.product else True
                } for item in items
            ]
        }

        return Response(data, status=200)


class CartItemDetailView(APIView):
    
    def delete(self, request, item_id):
        user = getattr(request, 'auth_user', None)
        if not user: 
            return Response({"error": "Unauthorized"}, status=401)

        # Ensure we only delete items belonging to THIS user's cart
        try:
            cart_item = CartItem.objects.get(id=item_id, cart__user=user)
            cart_item.delete()
            return Response({"message": "Item removed"}, status=204)
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)

    def patch(self, request, item_id):
        user = getattr(request, 'auth_user', None)
        if not user:
            return Response({"error": "Unauthorized"}, status=401)

        new_quantity = request.data.get("quantity")
        if new_quantity is None or int(new_quantity) < 1:
            return Response({"error": "Quantity must be at least 1"}, status=400)
        
        new_quantity = int(new_quantity)

        try:
            cart_item = CartItem.objects.select_related('product').get(id=item_id, cart__user=user)
            
            # --- STOCK CHECK FOR UPDATE ---
            if cart_item.product and new_quantity > cart_item.product.stock:
                 return Response({
                    "error": f"Cannot update quantity. Only {cart_item.product.stock} items left in stock."
                }, status=400)

            cart_item.quantity = new_quantity
            cart_item.save()

            return Response({
                "message": "Quantity updated",
                "id": str(cart_item.id),
                "quantity": cart_item.quantity,
                "subtotal": cart_item.get_total # Recalculates based on new qty
            }, status=200)

        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)