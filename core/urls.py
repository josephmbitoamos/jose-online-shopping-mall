from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Djoser endpoints
    path('auth/', include('djoser.urls')),      # User registration, details, etc.
    path('auth/', include('djoser.urls.jwt')),  # JWT token endpoints (login)

    # My endpoints
    path('users/', include('users.urls')),  # remove this if unused
    path('shop/', include('shop.urls')),
    path('reviews/', include('reviews.urls')),
    path('payments/', include('payments.urls')),
]
