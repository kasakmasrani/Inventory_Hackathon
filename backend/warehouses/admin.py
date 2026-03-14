from django.contrib import admin
from .models import Warehouse, WarehouseLocation, StockByLocation

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')

@admin.register(WarehouseLocation)
class WarehouseLocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'warehouse')
    list_filter = ('warehouse',)

@admin.register(StockByLocation)
class StockByLocationAdmin(admin.ModelAdmin):
    list_display = ('product', 'location', 'quantity', 'updated_at')
    list_filter = ('location__warehouse',)
