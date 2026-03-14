from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate

from products.models import Product, ProductCategory
from warehouses.models import Warehouse, StockByLocation
from operations.models import (
    Receipt, DeliveryOrder, Transfer, Adjustment, StockLedger, StockAlert
)


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Total stock across all locations
        total_stock = StockByLocation.objects.aggregate(total=Sum('quantity'))['total'] or 0

        # Product counts
        total_products = Product.objects.count()

        # Low stock: products whose total stock <= reorder_level
        low_stock_count = 0
        out_of_stock_count = 0
        for p in Product.objects.prefetch_related('stock_levels').all():
            total = sum(s.quantity for s in p.stock_levels.all())
            if total == 0:
                out_of_stock_count += 1
            elif total <= p.reorder_level:
                low_stock_count += 1

        pending_receipts = Receipt.objects.exclude(status__in=['done', 'cancelled']).count()
        pending_deliveries = DeliveryOrder.objects.exclude(status__in=['done', 'cancelled']).count()
        pending_transfers = Transfer.objects.exclude(status__in=['done', 'cancelled']).count()
        active_alerts = StockAlert.objects.filter(is_resolved=False).count()

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
        # Stock distribution by category
        categories = ProductCategory.objects.all()
        category_distribution = []
        for cat in categories:
            total = StockByLocation.objects.filter(
                product__category=cat
            ).aggregate(total=Sum('quantity'))['total'] or 0
            category_distribution.append({'name': cat.name, 'value': total})

        # Stock movement history (last 30 days)
        from django.utils import timezone
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        movements = (
            StockLedger.objects
            .filter(timestamp__gte=thirty_days_ago)
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
        warehouse_comparison = []
        for wh in warehouses:
            total = StockByLocation.objects.filter(
                location__warehouse=wh
            ).aggregate(total=Sum('quantity'))['total'] or 0
            warehouse_comparison.append({'name': wh.name, 'stock': total})

        return Response({
            'category_distribution': category_distribution,
            'movement_history': movement_history,
            'warehouse_comparison': warehouse_comparison,
        })
