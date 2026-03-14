from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Q
from django.db.models.functions import TruncDate

from products.models import Product, ProductCategory
from warehouses.models import Warehouse, StockByLocation
from operations.models import (
    Receipt, DeliveryOrder, Transfer, Adjustment, StockLedger, StockAlert
)


def _csv_values(raw):
    if not raw:
        return []
    return [v.strip() for v in raw.split(',') if v.strip()]


def _operation_types_for_doc_types(doc_types):
    mapping = {
        'receipts': ['receipt'],
        'delivery': ['delivery'],
        'deliveries': ['delivery'],
        'internal': ['transfer_in', 'transfer_out'],
        'transfers': ['transfer_in', 'transfer_out'],
        'adjustments': ['adjustment'],
    }
    op_types = []
    for doc_type in doc_types:
        op_types.extend(mapping.get(doc_type, []))
    return op_types


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        statuses = _csv_values(request.query_params.get('status'))
        doc_types = _csv_values(request.query_params.get('doc_type'))
        warehouse = request.query_params.get('warehouse')
        location = request.query_params.get('location')
        category = request.query_params.get('category')
        product = request.query_params.get('product')

        stock_qs = StockByLocation.objects.select_related('product', 'location__warehouse')
        if warehouse:
            stock_qs = stock_qs.filter(location__warehouse_id=warehouse)
        if location:
            stock_qs = stock_qs.filter(location_id=location)
        if category:
            stock_qs = stock_qs.filter(product__category_id=category)
        if product:
            stock_qs = stock_qs.filter(product_id=product)

        products_qs = Product.objects.all()
        if category:
            products_qs = products_qs.filter(category_id=category)
        if product:
            products_qs = products_qs.filter(id=product)

        # Total stock across all locations
        total_stock = stock_qs.aggregate(total=Sum('quantity'))['total'] or 0

        # Product counts
        total_products = products_qs.count()

        # Low stock: products whose total stock <= reorder_level
        low_stock_count = 0
        out_of_stock_count = 0
        for p in products_qs.prefetch_related('stock_levels').all():
            stock_items = p.stock_levels.all()
            if warehouse:
                stock_items = stock_items.filter(location__warehouse_id=warehouse)
            if location:
                stock_items = stock_items.filter(location_id=location)
            total = sum(s.quantity for s in stock_items)
            if total == 0:
                out_of_stock_count += 1
            elif total <= p.reorder_level:
                low_stock_count += 1

        receipts_qs = Receipt.objects.all()
        deliveries_qs = DeliveryOrder.objects.all()
        transfers_qs = Transfer.objects.all()
        alerts_qs = StockAlert.objects.filter(is_resolved=False)

        if warehouse:
            receipts_qs = receipts_qs.filter(location__warehouse_id=warehouse)
            deliveries_qs = deliveries_qs.filter(location__warehouse_id=warehouse)
            transfers_qs = transfers_qs.filter(
                Q(from_location__warehouse_id=warehouse) | Q(to_location__warehouse_id=warehouse)
            )
            alerts_qs = alerts_qs.filter(location__warehouse_id=warehouse)
        if location:
            receipts_qs = receipts_qs.filter(location_id=location)
            deliveries_qs = deliveries_qs.filter(location_id=location)
            transfers_qs = transfers_qs.filter(Q(from_location_id=location) | Q(to_location_id=location))
            alerts_qs = alerts_qs.filter(location_id=location)
        if category:
            receipts_qs = receipts_qs.filter(items__product__category_id=category).distinct()
            deliveries_qs = deliveries_qs.filter(items__product__category_id=category).distinct()
            transfers_qs = transfers_qs.filter(product__category_id=category)
            alerts_qs = alerts_qs.filter(product__category_id=category)
        if product:
            receipts_qs = receipts_qs.filter(items__product_id=product).distinct()
            deliveries_qs = deliveries_qs.filter(items__product_id=product).distinct()
            transfers_qs = transfers_qs.filter(product_id=product)
            alerts_qs = alerts_qs.filter(product_id=product)

        if statuses:
            receipts_qs = receipts_qs.filter(status__in=statuses)
            deliveries_qs = deliveries_qs.filter(status__in=statuses)
            transfers_qs = transfers_qs.filter(status__in=statuses)
            pending_receipts = receipts_qs.count()
            pending_deliveries = deliveries_qs.count()
            pending_transfers = transfers_qs.count()
        else:
            pending_receipts = receipts_qs.exclude(status__in=['done', 'cancelled']).count()
            pending_deliveries = deliveries_qs.exclude(status__in=['done', 'cancelled']).count()
            pending_transfers = transfers_qs.exclude(status__in=['done', 'cancelled']).count()

        if doc_types:
            pending_receipts = pending_receipts if 'receipts' in doc_types else 0
            pending_deliveries = pending_deliveries if ('delivery' in doc_types or 'deliveries' in doc_types) else 0
            pending_transfers = pending_transfers if ('internal' in doc_types or 'transfers' in doc_types) else 0

        active_alerts = alerts_qs.count()

        return Response({
            'total_products': total_products,
            'total_stock': total_stock,
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'pending_receipts': pending_receipts,
            'pending_deliveries': pending_deliveries,
            'pending_transfers': pending_transfers,
            'active_alerts': active_alerts,
        })


class DashboardChartsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        doc_types = _csv_values(request.query_params.get('doc_type'))
        warehouse = request.query_params.get('warehouse')
        location = request.query_params.get('location')
        category = request.query_params.get('category')
        product = request.query_params.get('product')

        stock_qs = StockByLocation.objects.select_related('product', 'location__warehouse')
        if warehouse:
            stock_qs = stock_qs.filter(location__warehouse_id=warehouse)
        if location:
            stock_qs = stock_qs.filter(location_id=location)
        if category:
            stock_qs = stock_qs.filter(product__category_id=category)
        if product:
            stock_qs = stock_qs.filter(product_id=product)

        # Stock distribution by category
        categories = ProductCategory.objects.all()
        if category:
            categories = categories.filter(id=category)
        category_distribution = []
        for cat in categories:
            total = stock_qs.filter(product__category=cat).aggregate(total=Sum('quantity'))['total'] or 0
            category_distribution.append({'name': cat.name, 'value': total})

        # Stock movement history (last 30 days)
        from django.utils import timezone
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        ledger_qs = StockLedger.objects.filter(timestamp__gte=thirty_days_ago)
        if warehouse:
            ledger_qs = ledger_qs.filter(location__warehouse_id=warehouse)
        if location:
            ledger_qs = ledger_qs.filter(location_id=location)
        if category:
            ledger_qs = ledger_qs.filter(product__category_id=category)
        if product:
            ledger_qs = ledger_qs.filter(product_id=product)

        if doc_types:
            operation_types = _operation_types_for_doc_types(doc_types)
            if operation_types:
                ledger_qs = ledger_qs.filter(operation_type__in=operation_types)

        movements = (
            ledger_qs
            .annotate(date=TruncDate('timestamp'))
            .values('date')
            .annotate(
                inbound=Sum('quantity_change', filter=Q(quantity_change__gt=0)),
                outbound=Sum('quantity_change', filter=Q(quantity_change__lt=0)),
            )
            .order_by('date')
        )
        movement_history = [
            {
                'date': m['date'].isoformat(),
                'inbound': m['inbound'] or 0,
                'outbound': abs(m['outbound'] or 0),
            }
            for m in movements
        ]

        # Warehouse stock comparison
        warehouses = Warehouse.objects.all()
        if warehouse:
            warehouses = warehouses.filter(id=warehouse)
        if location:
            warehouses = warehouses.filter(locations__id=location).distinct()
        warehouse_comparison = []
        for wh in warehouses:
            wh_stock_qs = stock_qs.filter(location__warehouse=wh)
            total = wh_stock_qs.aggregate(total=Sum('quantity'))['total'] or 0
            warehouse_comparison.append({'name': wh.name, 'stock': total})

        return Response({
            'category_distribution': category_distribution,
            'movement_history': movement_history,
            'warehouse_comparison': warehouse_comparison,
        })
