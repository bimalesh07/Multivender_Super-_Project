import uuid
from django.db import models
from accounts.models import User
from products.models import Product

class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.user)

    @property
    def get_cart_total(self):
        """Calculates total price for all items in the cart"""
        items = self.items.all()
        total = sum([item.get_total for item in items])
        return total

    @property
    def get_cart_items_count(self):
        """Returns total quantity of items in the cart"""
        items = self.items.all()
        total = sum([item.quantity for item in items])
        return total


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True) # Recommended: SET_NULL
    quantity = models.PositiveBigIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name if self.product else 'Deleted Product'}"

    @property
    def get_total(self):
        """Calculates price * quantity for this specific line item"""
        if self.product:
            return self.product.price * self.quantity
        return 0