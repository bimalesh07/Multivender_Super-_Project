import uuid
from django.db import models
from accounts.models import User
from products.models import Product

class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.email}"

    @property
    def get_cart_total(self):
        items = self.items.select_related('product').all()
        return sum(item.get_total for item in items)

    @property
    def get_cart_items_count(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True) 
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.quantity} x {self.product.name if self.product else 'Unknown Product'}"

    @property
    def get_total(self):
        if self.product:
            return self.product.current_price * self.quantity
        return 0

    @property
    def is_stock_sufficient(self):
        if self.product:
            return self.product.stock >= self.quantity
        return False