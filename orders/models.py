import uuid
from django.db import models
from accounts.models import User
from products.models import Product

class Order(models.Model):
    # --- Status Choices ---
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),      # Order placed, not processed
        ('PROCESSING', 'Processing'), # Warehouse is packing it
        ('SHIPPED', 'Shipped'),      # Handed to courier
        ('DELIVERED', 'Delivered'),  # Customer has it
        ('CANCELLED', 'Cancelled'),  # Stock issue or user request
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    
    # --- Financials ---
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_paid = models.BooleanField(default=False) # Integration with Payment Gateway
    
    # --- Logistics ---
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # --- Timestamps ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # Tracks when status changes

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{str(self.id)[:8]} - {self.user.email}"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    
    # --- Snapshots (Freezing History) ---
    # We save these text fields so if the Product is deleted later, 
    # the Order history still looks correct.
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=50, null=True) # NEW: Helps warehouse find items
    price = models.DecimalField(max_digits=10, decimal_places=2) # The price AT MOMENT of purchase
    
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

    @property
    def subtotal(self):
        return self.price * self.quantity