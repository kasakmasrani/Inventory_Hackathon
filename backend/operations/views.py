from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from warehouses.models import StockByLocation
from .models import (
    Receipt, ReceiptItem, DeliveryOrder, DeliveryItem,
    Transfer, Adjustment, StockLedger, StockAlert
)
from .serializers import (
    ReceiptSerializer, ReceiptCreateSerializer,
    DeliveryOrderSerializer, DeliveryCreateSerializer,
    TransferSerializer, AdjustmentSerializer,
    StockLedgerSerializer, StockAlertSerializer
)


def _check_and_create_alerts(product, location):
    """Create a stock alert if stock is at or below reorder level."""
    try:
        stock = StockByLocation.objects.get(product=product, location=location)
        total = stock.quantity
    except StockByLocation.DoesNotExist:
        total = 0

    if total <= product.reorder_level:
        StockAlert.objects.create(
            product=product,
            location=location,
            current_stock=total,
            reorder_level=product.reorder_level 
        )


def _create_ledger_entry(product, op_type, qty_change, location, reference, user):
    StockLedger.objects.create(
        product=product,
        operation_type=op_type,
        quantity_change=qty_change,
        location=location,
        reference=reference,
        created_by=user
    )


class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.prefetch_related('items__product').select_related('location', 'created_by')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ReceiptCreateSerializer
        return ReceiptSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        s = self.request.query_params.get('status')
        if s:
            qs = qs.filter(status=s)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def validate_receipt(self, request, pk=None):
        """Validate a receipt → increase stock for all items."""
        receipt = self.get_object()
        if receipt.status == 'done':
            return Response({'error': 'Already validated'}, status=400)

        with transaction.atomic():
            for item in receipt.items.all():
                stock, _ = StockByLocation.objects.get_or_create(
                    product=item.product, location=receipt.location,
                    defaults={'quantity': 0}
                )
                stock.quantity += item.quantity
                stock.save()
                _create_ledger_entry(
                    item.product, 'receipt', item.quantity,
                    receipt.location, receipt.reference, request.user
                )
                _check_and_create_alerts(item.product, receipt.location)

            receipt.status = 'done'
            receipt.validated_at = timezone.now()
            receipt.save()

        return Response(ReceiptSerializer(receipt).data)


class DeliveryOrderViewSet(viewsets.ModelViewSet):
    queryset = DeliveryOrder.objects.prefetch_related('items__product').select_related('location', 'created_by')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return DeliveryCreateSerializer
        return DeliveryOrderSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        s = self.request.query_params.get('status')
        if s:
            qs = qs.filter(status=s)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def pick(self, request, pk=None):
        order = self.get_object()
        if order.status not in ('draft', 'waiting'):
            return Response({'error': 'Cannot pick in current status'}, status=400)
        order.status = 'picking'
        order.save()
        return Response(DeliveryOrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def pack(self, request, pk=None):
        order = self.get_object()
        if order.status != 'picking':
            return Response({'error': 'Must be in picking status'}, status=400)
        order.status = 'packing'
        order.save()
        return Response(DeliveryOrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def validate_delivery(self, request, pk=None):
        """Validate delivery → decrease stock for all items."""
        order = self.get_object()
        if order.status == 'done':
            return Response({'error': 'Already validated'}, status=400)

        with transaction.atomic():
            for item in order.items.all():
                try:
                    stock = StockByLocation.objects.get(
                        product=item.product, location=order.location
                    )
                except StockByLocation.DoesNotExist:
                    return Response(
                        {'error': f'No stock for {item.product.sku_code} at this location'},
                        status=400
                    )
                if stock.quantity < item.quantity:
                    return Response(
                        {'error': f'Insufficient stock for {item.product.sku_code}'},
                        status=400
                    )
                stock.quantity -= item.quantity
                stock.save()
                _create_ledger_entry(
                    item.product, 'delivery', -item.quantity,
                    order.location, order.reference, request.user
                )
                _check_and_create_alerts(item.product, order.location)

            order.status = 'done'
            order.validated_at = timezone.now()
            order.save()

        return Response(DeliveryOrderSerializer(order).data)


class TransferViewSet(viewsets.ModelViewSet):
    queryset = Transfer.objects.select_related('product', 'from_location', 'to_location', 'created_by')
    serializer_class = TransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        s = self.request.query_params.get('status')
        if s:
            qs = qs.filter(status=s)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def complete_transfer(self, request, pk=None):
        """Complete transfer → move stock between locations."""
        transfer = self.get_object()
        if transfer.status == 'done':
            return Response({'error': 'Already completed'}, status=400)

        with transaction.atomic():
            # Decrease from source
            from_stock, _ = StockByLocation.objects.get_or_create(
                product=transfer.product, location=transfer.from_location,
                defaults={'quantity': 0}
            )
            if from_stock.quantity < transfer.quantity:
                return Response({'error': 'Insufficient stock at source'}, status=400)
            from_stock.quantity -= transfer.quantity
            from_stock.save()

            # Increase at destination
            to_stock, _ = StockByLocation.objects.get_or_create(
                product=transfer.product, location=transfer.to_location,
                defaults={'quantity': 0}
            )
            to_stock.quantity += transfer.quantity
            to_stock.save()

            _create_ledger_entry(
                transfer.product, 'transfer_out', -transfer.quantity,
                transfer.from_location, transfer.reference, request.user
            )
            _create_ledger_entry(
                transfer.product, 'transfer_in', transfer.quantity,
                transfer.to_location, transfer.reference, request.user
            )
            _check_and_create_alerts(transfer.product, transfer.from_location)

            transfer.status = 'done'
            transfer.save()

        return Response(TransferSerializer(transfer).data)


class AdjustmentViewSet(viewsets.ModelViewSet):
    queryset = Adjustment.objects.select_related('product', 'location', 'created_by')
    serializer_class = AdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        location = serializer.validated_data['location']
        counted = serializer.validated_data['counted_quantity']

        stock, _ = StockByLocation.objects.get_or_create(
            product=product, location=location, defaults={'quantity': 0}
        )
        system_qty = stock.quantity
        diff = counted - system_qty

        with transaction.atomic():
            adjustment = serializer.save(
                created_by=self.request.user,
                system_quantity=system_qty,
                difference=diff
            )
            stock.quantity = counted
            stock.save()
            _create_ledger_entry(
                product, 'adjustment', diff,
                location, adjustment.reference, self.request.user
            )
            _check_and_create_alerts(product, location)


class StockLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockLedger.objects.select_related('product', 'location', 'created_by')
    serializer_class = StockLedgerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__product_name', 'product__sku_code', 'reference']
    ordering_fields = ['timestamp']

    def get_queryset(self):
        qs = super().get_queryset()
        op = self.request.query_params.get('operation_type')
        product = self.request.query_params.get('product')
        warehouse = self.request.query_params.get('warehouse')
        if op:
            qs = qs.filter(operation_type=op)
        if product:
            qs = qs.filter(product_id=product)
        if warehouse:
            qs = qs.filter(location__warehouse_id=warehouse)
        return qs


class StockAlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockAlert.objects.select_related('product', 'location')
    serializer_class = StockAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        resolved = self.request.query_params.get('resolved')
        if resolved is not None:
            qs = qs.filter(is_resolved=resolved.lower() == 'true')
        return qs

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.is_resolved = True
        alert.save()
        return Response(StockAlertSerializer(alert).data)
