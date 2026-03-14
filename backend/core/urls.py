from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/products/', include('products.urls')),
    path('api/warehouses/', include('warehouses.urls')),
    path('api/operations/', include('operations.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]
