from django.urls import path
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    CartView,
    AddToCartView,
    RemoveFromCartView,
    UpdateCartItemView,
    OrderCreateView,
    OrderListView,
    OrderDetailView,
)

urlpatterns = [
    # Categories
    path('categories/', CategoryListView.as_view(), name='categories'),

    # Products
    path('products/', ProductListView.as_view(), name='products'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),

    # Cart
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/add/', AddToCartView.as_view(), name='cart-add'),
    path('cart/remove/<int:product_id>/', RemoveFromCartView.as_view(), name='cart-remove'),
    path('cart/update/', UpdateCartItemView.as_view(), name='cart-update'),

    # Orders
    path('orders/', OrderListView.as_view(), name='orders'),
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
