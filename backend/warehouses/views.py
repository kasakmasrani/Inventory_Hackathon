from rest_framework import viewsets, filters, permissions
from .models import Warehouse, WarehouseLocation, StockByLocation
from .serializers import WarehouseSerializer, WarehouseLocationSerializer, StockByLocationSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.prefetch_related('locations__stock_items')
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class WarehouseLocationViewSet(viewsets.ModelViewSet):
    queryset = WarehouseLocation.objects.select_related('warehouse').prefetch_related('stock_items')
    serializer_class = WarehouseLocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        warehouse = self.request.query_params.get('warehouse')
        if warehouse:
            qs = qs.filter(warehouse_id=warehouse)
        return qs


class StockByLocationViewSet(viewsets.ModelViewSet):
    queryset = StockByLocation.objects.select_related('product', 'location__warehouse')
    serializer_class = StockByLocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        product = self.request.query_params.get('product')
        location = self.request.query_params.get('location')
        warehouse = self.request.query_params.get('warehouse')
        if product:
            qs = qs.filter(product_id=product)
        if location:
            qs = qs.filter(location_id=location)
        if warehouse:
            qs = qs.filter(location__warehouse_id=warehouse)
        return qs
