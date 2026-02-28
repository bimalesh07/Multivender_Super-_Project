from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .serializers import (
    AddCartItemSerializer, 
    CartItemResponseSerializer, 
    UpdateCartItemSerializer
)

class AddToCartView(APIView):
    def post(self, request):
        # Auth Check
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) != "CUSTOMER":
            return Response({"error": "Unauthorized. Customers only."}, status=401)
        

        # pass 'context' so the serializer can access the user securely
        serializer = AddCartItemSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            cart_item = serializer.save() # Calls create() in serializer
            
            return Response({
                "message": "Product added to cart", 
                "current_quantity": cart_item.quantity,
                # Model has a property named 'subtotal' or 'get_total'
                "subtotal": getattr(cart_item, 'subtotal', 0) 
            }, status=201)
            
        return Response(serializer.errors, status=400)


class ViewCartView(APIView):
    def get(self, request):
        user = getattr(request, 'auth_user', None)
        
        if not user or getattr(user, 'role', None) != 'CUSTOMER':
             return Response({"error": "Unauthorized"}, status=401)
         
        cart, _ = Cart.objects.get_or_create(user=user)
        items = cart.items.select_related('product').all()
        serializer = CartItemResponseSerializer(items, many=True)
        return Response({
            "cart_id": str(cart.id),
            "total_price": cart.get_cart_total, 
            "total_items_count": cart.get_cart_items_count,
            "items": serializer.data
        }, status=200)


class CartItemDetailView(APIView):
    
    def delete(self, request, item_id):
        user = getattr(request, 'auth_user', None)
        if not user: 
            return Response({"error": "Unauthorized"}, status=401)

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

        try:
            cart_item = CartItem.objects.select_related('product').get(id=item_id, cart__user=user)
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)

        # Pass the instance so the serializer knows for updating
        serializer = UpdateCartItemSerializer(cart_item, data=request.data, partial=True)

        if serializer.is_valid():
            updated_item = serializer.save() 
            
            return Response({
                "message": "Quantity updated",
                "quantity": updated_item.quantity,
                "subtotal": getattr(updated_item, 'subtotal', 0)
            }, status=200)

        return Response(serializer.errors, status=400)