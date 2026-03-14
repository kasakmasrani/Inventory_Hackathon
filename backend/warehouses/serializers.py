from rest_framework import serializers
from .models import Warehouse, WarehouseLocation, StockByLocation


class StockByLocationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    sku_code = serializers.CharField(source='product.sku_code', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    warehouse_name = serializers.CharField(source='location.warehouse.name', read_only=True)

    class Meta:
        model = StockByLocation
        fields = '__all__'


class WarehouseLocationSerializer(serializers.ModelSerializer):
    stock_items = StockByLocationSerializer(many=True, read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = WarehouseLocation
        fields = '__all__'


class WarehouseSerializer(serializers.ModelSerializer):
    locations = WarehouseLocationSerializer(many=True, read_only=True)
    location_count = serializers.IntegerField(source='locations.count', read_only=True)

    class Meta:
        model = Warehouse
        fields = '__all__'
