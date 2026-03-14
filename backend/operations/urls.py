from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReceiptViewSet, DeliveryOrderViewSet, TransferViewSet,
    AdjustmentViewSet, StockLedgerViewSet, StockAlertViewSet
)

router = DefaultRouter()
router.register('receipts', ReceiptViewSet, basename='receipt')
router.register('deliveries', DeliveryOrderViewSet, basename='delivery')
router.register('transfers', TransferViewSet, basename='transfer')
router.register('adjustments', AdjustmentViewSet, basename='adjustment')
router.register('ledger', StockLedgerViewSet, basename='ledger')
router.register('alerts', StockAlertViewSet, basename='alert')

urlpatterns = [
    path('', include(router.urls)),
]
