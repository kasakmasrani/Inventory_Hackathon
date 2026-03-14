from django.db import models
from django.conf import settings
from products.models import Product
from warehouses.models import WarehouseLocation


class Receipt(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'), ('waiting', 'Waiting'), ('ready', 'Ready'),
        ('done', 'Done'), ('cancelled', 'Cancelled'),
    ]
    reference = models.CharField(max_length=50, unique=True)
    supplier = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    location = models.ForeignKey(WarehouseLocation, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    validated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.reference


class ReceiptItem(models.Model):
    receipt = models.ForeignKey(Receipt, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.product.sku_code} x {self.quantity}"


class DeliveryOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'), ('picking', 'Picking'), ('packing', 'Packing'),
        ('ready', 'Ready'), ('done', 'Done'), ('cancelled', 'Cancelled'),
    ]
    reference = models.CharField(max_length=50, unique=True)
    customer = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    location = models.ForeignKey(WarehouseLocation, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    validated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.reference


class DeliveryItem(models.Model):
    delivery = models.ForeignKey(DeliveryOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.product.sku_code} x {self.quantity}"


class Transfer(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'), ('in_transit', 'In Transit'),
        ('done', 'Done'), ('cancelled', 'Cancelled'),
    ]
    reference = models.CharField(max_length=50, unique=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    from_location = models.ForeignKey(WarehouseLocation, on_delete=models.CASCADE, related_name='transfers_out')
    to_location = models.ForeignKey(WarehouseLocation, on_delete=models.CASCADE, related_name='transfers_in')
    quantity = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reference}: {self.product.sku_code} ({self.from_location} → {self.to_location})"


class Adjustment(models.Model):
    REASON_CHOICES = [
        ('damaged', 'Damaged'), ('lost', 'Lost'), ('found', 'Found'),
        ('count', 'Physical Count'), ('other', 'Other'),
    ]
    reference = models.CharField(max_length=50, unique=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    location = models.ForeignKey(WarehouseLocation, on_delete=models.CASCADE)
    system_quantity = models.IntegerField()
    counted_quantity = models.IntegerField()
    difference = models.IntegerField()
    reason = models.CharField(max_length=20, choices=REASON_CHOICES, default='count')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reference}: {self.product.sku_code} diff={self.difference}"


class StockLedger(models.Model):
    OPERATION_CHOICES = [
        ('receipt', 'Receipt'), ('delivery', 'Delivery'),
        ('transfer_in', 'Transfer In'), ('transfer_out', 'Transfer Out'),
        ('adjustment', 'Adjustment'),
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ledger_entries')
    operation_type = models.CharField(max_length=20, choices=OPERATION_CHOICES)
    quantity_change = models.IntegerField()
    location = models.ForeignKey(WarehouseLocation, on_delete=models.SET_NULL, null=True)
    reference = models.CharField(max_length=50)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.operation_type} {self.product.sku_code}: {self.quantity_change:+d}"


class StockAlert(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='alerts')
    location = models.ForeignKey(WarehouseLocation, on_delete=models.SET_NULL, null=True)
    current_stock = models.IntegerField()
    reorder_level = models.IntegerField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"ALERT: {self.product.sku_code} stock={self.current_stock} (reorder={self.reorder_level})"
