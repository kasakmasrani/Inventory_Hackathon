from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Product, ProductCategory
from .serializers import ProductSerializer, ProductCategorySerializer


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').prefetch_related('stock_levels')
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product_name', 'sku_code']
    ordering_fields = ['product_name', 'created_at', 'sku_code']

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)
        return qs

    @action(detail=False, methods=['get'], url_path='by-sku/(?P<sku>[^/.]+)')
    def by_sku(self, request, sku=None):
        try:
            product = Product.objects.get(sku_code=sku)
            return Response(ProductSerializer(product).data)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Return products whose total stock is at or below reorder level."""
        products = []
        for p in Product.objects.prefetch_related('stock_levels').all():
            total = sum(s.quantity for s in p.stock_levels.all())
            if total <= p.reorder_level:
                products.append(p)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
