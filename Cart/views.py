from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from.models import Cart, CartItem
from products.models import Product
from .serializers import AddCartItemSerializer, CartItemResponseSerializer

class AddToCartView(APIView):
    def post(self , request):
        user = request.auth_user
        if not user or user != "CUSTOMER":
            return Response({"error":"Unauthorized"} ,status=401)
        
        serializer = AddCartItemSerializer(data= request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['Product_id']
        quantity = serializer.validated_data["quantity"]

        try:
            product = Product.objects.get(id = product_id, is_approved=True)

        except Product.DoesNotExist:
                return Response({"error": "Product not found or not approved"}, status=404)
        
        cart, _ = Cart.objects.get_or_create(user=user)

        cart_item , created = CartItem.objects.get_or_create(cart=cart, product=product)

        if not created:
             cart_item.quantity += quantity
             cart_item.save()

        return Response({"message": "Product added to cart"}, status=201)

class ViewCartView(APIView):
    def get(self, request):
        user = request.auth_user
        if not user or user != 'CUSTOMER':
              return Response({"error": "Unauthorized"}, status=401)
         
        cart, _ = Cart.objects.get_or_create(user=user)
        items = cart.items.all()
        
        data = [
            {
                "id": str(item.id),
                "product_id": str(item.product.id),
                "product_name": item.product.name,
                "quantity": item.quantity
            } for item in items
        ]

        return Response(data, status=200)