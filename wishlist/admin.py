from django.contrib import admin
from .models import Wishlist, WishlistItem

admin.site.register([Wishlist, WishlistItem])
