from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Wishlist, WishlistItem
from products.models import Product
from .serializers import WishlistItemSerializer,AddWishlistItemSerializer

class AddToWishlistView(APIView):
    def post(self, request):
        user = getattr(request, 'auth_user', None)
        if not user or user.role != "CUSTOMER":
            return Response({"error": "Unauthorized: Only customers can add items"}, status=status.HTTP_401_UNAUTHORIZED)

        # Validation
        serializer = AddWishlistItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data['product_id']

        # Product Existence Check
        try:
            product = Product.objects.get(id=product_id, is_approved=True)

        except Product.DoesNotExist:
            return Response({"error": "Product not found or not approved"}, status=status.HTTP_404_NOT_FOUND)

        #  Wishlist Logic (Container -> Item)
        wishlist_obj, _ = Wishlist.objects.get_or_create(user=user)
        
        # item added
        item, created = WishlistItem.objects.get_or_create(
            wishlist=wishlist_obj, 
            product=product
        )

        if not created:
            return Response({"message": "Product is already in your wishlist"}, status=status.HTTP_200_OK)
        
        return Response({
         "message": 
         f"'{
             product.name,
             product.description 
                        
            }' added to wishlist successfully"
        }, status=status.HTTP_201_CREATED)

class ViewWishlistView(APIView):
    def get(self, request):
        user = getattr(request, 'auth_user', None)
        if not user or user.role != "CUSTOMER":
            return Response({"error": "Unauthorized" , },
             status=status.HTTP_401_UNAUTHORIZED)

        # Fetch Data with Optimization
        wishlist_obj, _ = Wishlist.objects.get_or_create(user=user)
        items = wishlist_obj.items.all().select_related('product')

        # Response Formatting (Using Serializer)
        serializer = WishlistItemSerializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RemoveFromWishlistView(APIView):
    def delete(self, request, product_id):
        user = getattr(request, 'auth_user', None)
        if not user or user.role != "CUSTOMER":
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        deleted_count, _ = WishlistItem.objects.filter(
            wishlist__user=user, 
            product_id=product_id

        ).delete()

        if deleted_count > 0:
            return Response({"message": "Product removed from wishlist"}, status=status.HTTP_204_NO_CONTENT)
            
        return Response({"error": "Product not found in your wishlist"}, status=status.HTTP_404_NOT_FOUND)