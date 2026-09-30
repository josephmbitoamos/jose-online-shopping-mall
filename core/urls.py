from django.contrib import admin
from django.urls import path, include
from .views import frontend_page

urlpatterns = [

    # Django Admin
    path('admin/', admin.site.urls),

    # Djoser authentication
    path('auth/', include('djoser.urls')),

    # Djoser JWT authentication
    path('auth/', include('djoser.urls.jwt')),

    # Djoser user endpoints
    path('', include('djoser.urls')),

    # Shop
    path('shop/', include('shop.urls')),

    # Reviews
    path('reviews/', include('reviews.urls')),

    # Payments
    path('payments/', include('payments.urls')),

    # Frontend pages
    path(
        'frontend/<str:filename>',
        frontend_page,
        name='frontend-page'
    ),
]