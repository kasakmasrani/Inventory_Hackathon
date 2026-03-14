from django.db import models


class ProductCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Product Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    UNIT_CHOICES = [
        ('pcs', 'Pieces'), ('kg', 'Kilograms'), ('ltr', 'Litres'),
        ('m', 'Meters'), ('box', 'Boxes'), ('set', 'Sets'),
    ]
    product_name = models.CharField(max_length=200)
    sku_code = models.CharField(max_length=50, unique=True)
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, related_name='products')
    unit_of_measure = models.CharField(max_length=10, choices=UNIT_CHOICES, default='pcs')
    initial_stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product_name} ({self.sku_code})"
