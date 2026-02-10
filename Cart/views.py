from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
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

        try:
            product = Product.objects.get(id=product_id, is_approved=True)

        except (Product.DoesNotExist, ValueError):
            return Response({"error": "Product not found or not approved"}, status=404)
        
        # Get or create the cart for this user
        cart, _ = Cart.objects.get_or_create(user=user)

        # Get or create the specific item in the cart
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)

        if not created:
            cart_item.quantity += quantity

        else:
            # If created for the first time, ensure quantity is what user requested
            cart_item.quantity = quantity
        
        cart_item.save()

        return Response({"message": "Product added to cart"}, status=201)
    

class ViewCartView(APIView):
    def get(self, request):
        user = request.auth_user
        if not user or user.role != 'CUSTOMER':
             return Response({"error": "Unauthorized"}, status=401)
         
        cart, _ = Cart.objects.get_or_create(user=user)
        items = cart.items.all()
        
        # Use the @property helpers you wrote in your model!
        data = {
            "cart_id": str(cart.id),
            "total_price": cart.get_cart_total,        #  @property
            "total_items_count": cart.get_cart_items_count, # @property
            "items": [
                {
                    "id": str(item.id),
                    "product_id": str(item.product.id) if item.product else None,
                    "product_name": item.product.name if item.product else "Deleted Product",
                    "price": item.product.price if item.product else 0,
                    "quantity": item.quantity,
                    "subtotal": item.get_total # @property in CartItem
                } for item in items
            ]
        }

        return Response(data, status=200)
    
    
class CartItemDetailView(APIView):
    # --- DELETE: Remove item entirely ---
    def delete(self, request, item_id):
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) != "CUSTOMER":
            return Response({"error": "Unauthorized"}, status=401)

        try:
            cart_item = CartItem.objects.get(id=item_id, cart__user=user)
            cart_item.delete()
            return Response({"message": "Item removed from cart"}, status=204)
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)

    # --- PATCH: Update Quantity ---
    def patch(self, request, item_id):
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) != "CUSTOMER":
            return Response({"error": "Unauthorized"}, status=401)

        # Get the new quantity from request body
        new_quantity = request.data.get("quantity")

        # Validation: ensure quantity is a positive number
        if new_quantity is None or int(new_quantity) < 1:
            return Response({"error": "Valid quantity (min 1) is required"}, status=400)

        try:
            # Securely fetch the item belonging to this user
            cart_item = CartItem.objects.get(id=item_id, cart__user=user)
            cart_item.quantity = int(new_quantity)
            cart_item.save()

            return Response({
                "message": "Quantity updated",
                "new_quantity": cart_item.quantity,
                "subtotal": cart_item.get_total # Using your property!
            }, status=200)

        except CartItem.DoesNotExist:
            return Response({"error": "Item not found in your cart"}, status=404)