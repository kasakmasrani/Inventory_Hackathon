from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, WarehouseLocationViewSet, StockByLocationViewSet

router = DefaultRouter()
router.register('locations', WarehouseLocationViewSet, basename='warehouse-location')
router.register('stock', StockByLocationViewSet, basename='stock-by-location')
router.register('', WarehouseViewSet, basename='warehouse')

urlpatterns = [
    path('', include(router.urls)),
]
