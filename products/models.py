import uuid
from django.db import models
from django.core.exceptions import ValidationError
from organizations.models import Organization
from accounts.models import User

class Product(models.Model):
    # --- Identity ---
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sku = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Stock Keeping Unit")
    
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    thumbnail = models.ImageField(upload_to='products/thumbnails/', null=True, blank=True)
    manufacturer = models.CharField(max_length=255, null=True, blank=True)
    material = models.CharField(max_length=255, null=True, blank=True)
    product_type = models.CharField(max_length=255, null=True, blank=True)
    
    # --- Pricing ---
    # FIX 1: Added default=0.00 so migration doesn't crash on existing rows
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) 
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # --- Inventory ---
    stock = models.PositiveIntegerField(default=0)
    is_in_stock = models.BooleanField(default=True)
    
    # --- Status & Control ---
    is_active = models.BooleanField(default=True) 
    is_approved = models.BooleanField(default=False)
    
    # --- Relationships ---
    # FIX 2: Added null=True, blank=True. This fixes the "Select an option" error.
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='products',
        null=True, 
        blank=True
    )
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_products'
    )

    # --- Timestamps ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.sku})"

    # --- Professional Logic Methods ---

    @property
    def current_price(self):
        """Returns the best price available for the customer."""
        if self.discount_price and self.discount_price < self.price:
            return self.discount_price
        return self.price

    def save(self, *args, **kwargs):
        """Custom save logic to handle stock status and SKU generation."""
        # 1. Automatically update stock status
        self.is_in_stock = self.stock > 0
        
        # 2. Basic Validation: Discount cannot be higher than original price
        if self.discount_price and self.discount_price >= self.price:
            raise ValidationError("Discount price must be lower than the original price.")
            
        super().save(*args, **kwargs)

# --- Multiple Images for Gallery ---
class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/gallery/')
    alt_text = models.CharField(max_length=255, null=True, blank=True)
    is_feature = models.BooleanField(default=False)

    def __str__(self):
        return f"Gallery Image for {self.product.name}"