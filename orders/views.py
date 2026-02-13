from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction, DatabaseError
from django.shortcuts import get_object_or_404
from Cart.models import Cart
from .models import Order, OrderItem

class PlaceOrderView(APIView):
    def post(self, request):
        # 1. Authentication Check
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) != "CUSTOMER":
            return Response({"error": "Unauthorized. Only customers can place orders."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            cart = Cart.objects.get(user=user)
            # Optimization: distinct() avoids duplicates if join logic gets complex later
            if not cart.items.exists():
                return Response({"error": "Your cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

            # 2. START ATOMIC TRANSACTION
            # This ensures that if ANY product is out of stock, the whole order fails.
            with transaction.atomic():
                # Create the Order Shell
                # We calculate the final total inside the loop to be 100% accurate
                order = Order.objects.create(
                    user=user,
                    total_amount=0, 
                    status='PENDING' 
                )
                
                final_order_total = 0

                # 3. Process Items with Stock Locking
                # select_for_update() locks these rows in the DB so no one else can buy them 
                # until this transaction finishes.
               # We add .filter(product__isnull=False)
                cart_items = cart.items.select_related('product').filter(product__isnull=False).select_for_update()
                
                for item in cart_items:
                    product = item.product
                    
                    # --- A. Check Stock ---
                    if product.stock < item.quantity:
                        # This raises an error that rolls back the transaction automatically
                        raise ValueError(f"Out of stock: {product.name}. Only {product.stock} left.")
                    
                    # --- B. Deduct Stock ---
                    product.stock -= item.quantity
                    # Auto-update the is_in_stock boolean (handled in Product.save())
                    product.save()

                    # --- C. Determine Final Price ---
                    # Use the property we created earlier to get the DISCOUNTED price
                    price_at_purchase = product.current_price 

                    # --- D. Create Order Item Snapshot ---
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        product_name=product.name,
                        product_sku=product.sku,  # Crucial for warehouse
                        price=price_at_purchase,  # Save the price the user actually paid
                        quantity=item.quantity
                    )

                    # Add to running total
                    final_order_total += price_at_purchase * item.quantity

                # 4. Finalize Order
                order.total_amount = final_order_total
                order.save()

                # 5. Empty the Cart
                cart.items.all().delete()

            # 6. Success Response
            return Response({
                "message": "Order placed successfully",
                "order_id": str(order.id),
                "total_amount": final_order_total,
                "status": order.status
            }, status=status.HTTP_201_CREATED)

        except Cart.DoesNotExist:
            return Response({"error": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)
            
        except ValueError as e:
            # Handles our custom "Out of stock" error
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            # Handles database errors or unexpected crashes
            return Response({"error": f"Order failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)