from django.contrib import admin
from .models import Product, ProductCategory

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('product_name', 'sku_code', 'category', 'unit_of_measure', 'reorder_level', 'created_at')
    list_filter = ('category', 'unit_of_measure')
    search_fields = ('product_name', 'sku_code')
