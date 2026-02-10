from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction  # Crucial for data safety
from Cart.models import Cart
from .models import Order, OrderItem

class PlaceOrderView(APIView):
    def post(self, request):
        user = request.auth_user
        
        if not user or user.role != "CUSTOMER":
            return Response({"error": "Unauthorized. Only customers can place orders."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            # Fetch the User's Cart
            cart = Cart.objects.get(user=user)
            cart_items = cart.items.all()
            
            if not cart_items.exists():
                return Response({"error": "Your cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

            #  Atomic Transaction 
            #  NO data is saved to the DB.
            with transaction.atomic():

                # Use the helper property from  Cart model
                total_to_pay = cart.get_cart_total 

                # Create the main Order record
                order = Order.objects.create(
                    user=user, 
                    total_amount=total_to_pay,
                    # status='Pending' 
                )

                # Create OrderItems (snapshot)
                for item in cart_items:
                    OrderItem.objects.create(
                        order=order,
                        product=item.product,
                        product_name=item.product.name, 
                        price=item.product.price,       
                        quantity=item.quantity
                    )

                # 4. Clear the cart after order
                cart_items.delete()

            # 5. Success Response
            return Response({
                "message": "Order placed successfully",
                "order_id": str(order.id),
                "total_amount": total_to_pay
            }, status=status.HTTP_201_CREATED)

        except Cart.DoesNotExist:
            return Response({"error": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
    
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)