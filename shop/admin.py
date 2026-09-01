from django.contrib import admin
from .models import Category, Product, Cart, CartItem, Order, OrderItem

# Register Category so it appears in admin
admin.site.register(Category)

# Register Product so you can add products with a category
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'created')
    list_filter = ('category',)
    search_fields = ('name', 'description')


