from django.db import models
from products.models import Product


class Warehouse(models.Model):
    name = models.CharField(max_length=200, unique=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class WarehouseLocation(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='locations')
    name = models.CharField(max_length=100)  # e.g. Rack A, Rack B, Production Floor
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ('warehouse', 'name')
        ordering = ['warehouse', 'name']

    def __str__(self):
        return f"{self.warehouse.name} → {self.name}"


class StockByLocation(models.Model):
    """Tracks quantity of each product at each warehouse location."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_levels')
    location = models.ForeignKey(WarehouseLocation, on_delete=models.CASCADE, related_name='stock_items')
    quantity = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'location')

    def __str__(self):
        return f"{self.product.sku_code} @ {self.location}: {self.quantity}"
