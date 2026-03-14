from rest_framework import serializers
from .models import (
    Receipt, ReceiptItem, DeliveryOrder, DeliveryItem,
    Transfer, Adjustment, StockLedger, StockAlert
)


class ReceiptItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    sku_code = serializers.CharField(source='product.sku_code', read_only=True)

    class Meta:
        model = ReceiptItem
        fields = '__all__'


class ReceiptSerializer(serializers.ModelSerializer):
    items = ReceiptItemSerializer(many=True, read_only=True)
    location_name = serializers.CharField(source='location.__str__', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Receipt
        fields = '__all__'
        read_only_fields = ('created_by', 'validated_at')


class ReceiptCreateSerializer(serializers.ModelSerializer):
    items = ReceiptItemSerializer(many=True)

    class Meta:
        model = Receipt
        fields = ('reference', 'supplier', 'location', 'notes', 'items')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        receipt = Receipt.objects.create(**validated_data)
        for item_data in items_data:
            ReceiptItem.objects.create(receipt=receipt, **item_data)
        return receipt


class DeliveryItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    sku_code = serializers.CharField(source='product.sku_code', read_only=True)

    class Meta:
        model = DeliveryItem
        fields = '__all__'


class DeliveryOrderSerializer(serializers.ModelSerializer):
    items = DeliveryItemSerializer(many=True, read_only=True)
    location_name = serializers.CharField(source='location.__str__', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = DeliveryOrder
        fields = '__all__'
        read_only_fields = ('created_by', 'validated_at')


class DeliveryCreateSerializer(serializers.ModelSerializer):
    items = DeliveryItemSerializer(many=True)

    class Meta:
        model = DeliveryOrder
        fields = ('reference', 'customer', 'location', 'notes', 'items')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        delivery = DeliveryOrder.objects.create(**validated_data)
        for item_data in items_data:
            DeliveryItem.objects.create(delivery=delivery, **item_data)
        return delivery


class TransferSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    from_location_name = serializers.CharField(source='from_location.__str__', read_only=True)
    to_location_name = serializers.CharField(source='to_location.__str__', read_only=True)

    class Meta:
        model = Transfer
        fields = '__all__'
        read_only_fields = ('created_by',)


class AdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    location_name = serializers.CharField(source='location.__str__', read_only=True)

    class Meta:
        model = Adjustment
        fields = '__all__'
        read_only_fields = ('created_by', 'difference')


class StockLedgerSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    sku_code = serializers.CharField(source='product.sku_code', read_only=True)
    location_name = serializers.CharField(source='location.__str__', read_only=True)

    class Meta:
        model = StockLedger
        fields = '__all__'


class StockAlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    sku_code = serializers.CharField(source='product.sku_code', read_only=True)

    class Meta:
        model = StockAlert
        fields = '__all__'
