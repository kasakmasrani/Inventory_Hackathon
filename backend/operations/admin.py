from django.contrib import admin
from .models import (
    Receipt, ReceiptItem, DeliveryOrder, DeliveryItem,
    Transfer, Adjustment, StockLedger, StockAlert
)

class ReceiptItemInline(admin.TabularInline):
    model = ReceiptItem
    extra = 1

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('reference', 'supplier', 'status', 'location', 'created_at')
    list_filter = ('status',)
    inlines = [ReceiptItemInline]

class DeliveryItemInline(admin.TabularInline):
    model = DeliveryItem
    extra = 1

@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(admin.ModelAdmin):
    list_display = ('reference', 'customer', 'status', 'location', 'created_at')
    list_filter = ('status',)
    inlines = [DeliveryItemInline]

@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = ('reference', 'product', 'from_location', 'to_location', 'quantity', 'status')
    list_filter = ('status',)

@admin.register(Adjustment)
class AdjustmentAdmin(admin.ModelAdmin):
    list_display = ('reference', 'product', 'location', 'system_quantity', 'counted_quantity', 'difference')

@admin.register(StockLedger)
class StockLedgerAdmin(admin.ModelAdmin):
    list_display = ('product', 'operation_type', 'quantity_change', 'location', 'reference', 'timestamp')
    list_filter = ('operation_type',)

@admin.register(StockAlert)
class StockAlertAdmin(admin.ModelAdmin):
    list_display = ('product', 'current_stock', 'reorder_level', 'is_resolved', 'created_at')
    list_filter = ('is_resolved',)
