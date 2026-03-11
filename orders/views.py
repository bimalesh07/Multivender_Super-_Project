import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from .serializers import PlaceOrderSerializer, OrderSerializer, OrderListSerializer
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Order

logger = logging.getLogger(__name__)

class PlaceOrderView(APIView):
    def post(self, request):
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) != "CUSTOMER":
            return Response({"error": "Unauthorized. Customers only."}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = PlaceOrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                order = serializer.save()
                logger.info("Order placed: #%s by %s — ₹%s", str(order.id)[:8], user.email, order.total_amount)
                response_serializer = OrderSerializer(order)
                return Response({
                    "message": "Order placed successfully",
                    "order": response_serializer.data
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error("Order failed for %s: %s", user.email, str(e))
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class OrderDetailView(APIView):
    def get_object(self, pk, user):
        return get_object_or_404(Order, pk=pk, user=user)

    def get(self, request, pk):
        user = getattr(request, 'auth_user', None)
        if not user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        order = self.get_object(pk, user)
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        user = getattr(request, 'auth_user', None)
        if not user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        order = self.get_object(pk, user)
        action = request.data.get('action')
        if action != 'cancel':
            return Response({"error": "Invalid action. Use 'cancel'."}, status=status.HTTP_400_BAD_REQUEST)
        if order.status not in ['PENDING', 'PROCESSING']:
            return Response({
                "error": f"Cannot cancel order. It is already {order.status}."
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                for item in order.items.all():
                    if item.product:
                        item.product.stock += item.quantity
                        item.product.save()
                order.status = 'CANCELLED'
                order.save()
            logger.info("Order cancelled: #%s by %s — stock restored", str(order.id)[:8], user.email)
            return Response({
                "message": "Order cancelled successfully. Stock has been restored.",
                "status": "CANCELLED"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Order cancellation failed for #%s: %s", str(pk)[:8], str(e))
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class AdminOrderListView(APIView):
    def get(self, request):
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) not in ('ADMIN', 'STAFF', 'SUPERUSER'):
            return Response({"error": "Unauthorized. Admin or Staff only."}, status=403)
        orders = Order.objects.select_related('user').prefetch_related('items').order_by('-created_at')

        paginator = PageNumberPagination()
        paginated_orders = paginator.paginate_queryset(orders, request)
        serializer = OrderListSerializer(paginated_orders, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminUpdateOrderStatusView(APIView):
    def patch(self, request, pk):
        user = getattr(request, 'auth_user', None)
        if not user or getattr(user, 'role', None) not in ('ADMIN', 'STAFF', 'SUPERUSER'):
            return Response({"error": "Unauthorized. Admin or Staff only."}, status=403)
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get("status")
        if new_status not in ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']:
            return Response({"error": "Invalid status"}, status=400)
        order.status = new_status
        order.save()
        logger.info("Order #%s status updated to %s by admin %s", str(pk)[:8], new_status, user.email)
        return Response({
            "message": f"Order status updated to {new_status}",
            "order_id": order.id,
            "current_status": order.status
        })
    
class OrderHistoryView(APIView):
    def get(self, request):
        user = getattr(request, 'auth_user', None)
        if not user:
            return Response({"error": "Unauthorized. Please login."}, status=status.HTTP_401_UNAUTHORIZED)
        orders = Order.objects.filter(user=user).order_by('-created_at')
        if not orders.exists():
            return Response({"message": "You have no past orders.", "orders": []}, status=status.HTTP_200_OK)

        paginator = PageNumberPagination()
        paginated_orders = paginator.paginate_queryset(orders, request)
        serializer = OrderListSerializer(paginated_orders, many=True)
        return paginator.get_paginated_response(serializer.data)