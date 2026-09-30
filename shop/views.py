from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import (
    Category,
    Product,
    Cart,
    CartItem,
    Order,
    OrderItem
)

from .serializers import (
    CategorySerializer,
    ProductSerializer,
    CartSerializer,
    CartItemSerializer,
    OrderSerializer,
    OrderItemSerializer
)


# =====================================================
# CATEGORIES
# =====================================================

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


# =====================================================
# PRODUCTS
# =====================================================

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


# =====================================================
# CART
# =====================================================

class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        cart, _ = Cart.objects.get_or_create(
            user=self.request.user
        )

        return cart


# =====================================================
# ADD TO CART
# =====================================================

class AddToCartView(generics.GenericAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):

        product_id = request.data.get("product_id")

        # -------------------------------------------------
        # Validate quantity
        # -------------------------------------------------

        try:
            quantity = int(
                request.data.get("quantity", 1)
            )

        except (TypeError, ValueError):

            return Response(
                {
                    "detail": "Quantity must be a valid number."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity < 1:

            return Response(
                {
                    "detail": "Quantity must be at least 1."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # Get product
        # -------------------------------------------------

        product = get_object_or_404(
            Product,
            id=product_id
        )

        # -------------------------------------------------
        # Check stock
        # -------------------------------------------------

        if product.stock <= 0:

            return Response(
                {
                    "detail": (
                        f"{product.name} is currently "
                        "out of stock."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # Get user's cart
        # -------------------------------------------------

        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        # -------------------------------------------------
        # Find existing cart item
        # -------------------------------------------------

        cart_item = CartItem.objects.filter(
            cart=cart,
            product=product
        ).first()

        # -------------------------------------------------
        # Calculate new quantity
        # -------------------------------------------------

        if cart_item:

            current_quantity = cart_item.quantity

            new_quantity = (
                current_quantity + quantity
            )

        else:

            current_quantity = 0

            new_quantity = quantity

        # -------------------------------------------------
        # Prevent exceeding available stock
        # -------------------------------------------------

        if new_quantity > product.stock:

            return Response(
                {
                    "detail": (
                        f"Only {product.stock} unit(s) "
                        f"of {product.name} are available."
                    ),
                    "available_stock": product.stock,
                    "current_cart_quantity": current_quantity,
                    "requested_quantity": quantity,
                    "maximum_cart_quantity": product.stock
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # Save cart item
        # -------------------------------------------------

        with transaction.atomic():

            if cart_item:

                cart_item.quantity = new_quantity
                cart_item.save()

            else:

                CartItem.objects.create(
                    cart=cart,
                    product=product,
                    quantity=quantity
                )

        # -------------------------------------------------
        # Return updated cart
        # -------------------------------------------------

        serializer = CartSerializer(cart)

        return Response(
            {
                "message": (
                    f"{product.name} added to cart."
                ),
                "cart": serializer.data
            },
            status=status.HTTP_200_OK
        )


# =====================================================
# REMOVE FROM CART
# =====================================================

class RemoveFromCartView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):

        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        product_id = kwargs.get(
            "product_id"
        )

        item = get_object_or_404(
            CartItem,
            cart=cart,
            product_id=product_id
        )

        item.delete()

        return Response(
            {
                "detail": "Item removed"
            },
            status=status.HTTP_204_NO_CONTENT
        )


# =====================================================
# UPDATE CART ITEM
# =====================================================

class UpdateCartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):

        product_id = request.data.get(
            "product_id"
        )

        # -------------------------------------------------
        # Validate quantity
        # -------------------------------------------------

        try:

            quantity = int(
                request.data.get(
                    "quantity",
                    1
                )
            )

        except (TypeError, ValueError):

            return Response(
                {
                    "detail": (
                        "Quantity must be a valid number."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity < 1:

            return Response(
                {
                    "detail": (
                        "Quantity must be at least 1."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # Get user's cart
        # -------------------------------------------------

        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        # -------------------------------------------------
        # Get cart item
        # -------------------------------------------------

        cart_item = get_object_or_404(
            CartItem,
            cart=cart,
            product_id=product_id
        )

        product = cart_item.product

        # -------------------------------------------------
        # Check product stock
        # -------------------------------------------------

        if product.stock <= 0:

            return Response(
                {
                    "detail": (
                        f"{product.name} is currently "
                        "out of stock."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # Prevent exceeding available stock
        # -------------------------------------------------

        if quantity > product.stock:

            return Response(
                {
                    "detail": (
                        f"Only {product.stock} unit(s) "
                        f"of {product.name} are available."
                    ),
                    "available_stock": product.stock,
                    "requested_quantity": quantity,
                    "maximum_cart_quantity": product.stock
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # Save new quantity
        # -------------------------------------------------

        with transaction.atomic():

            cart_item.quantity = quantity
            cart_item.save()

        # -------------------------------------------------
        # Return updated cart
        # -------------------------------------------------

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_200_OK
        )

# =====================================================
# CREATE ORDER
# =====================================================

class OrderCreateView(generics.CreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):

        # -------------------------------------------------
        # Get user's cart
        # -------------------------------------------------

        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        # -------------------------------------------------
        # Check if cart is empty
        # -------------------------------------------------

        if not cart.items.exists():

            return Response(
                {
                    "detail": "Cart is empty."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # Check stock before creating order
        # -------------------------------------------------

        for item in cart.items.all():

            product = item.product

            if product.stock < item.quantity:

                return Response(
                    {
                        "detail": (
                            f"Only {product.stock} unit(s) "
                            f"of {product.name} are available."
                        ),
                        "product": product.name,
                        "available_stock": product.stock,
                        "requested_quantity": item.quantity
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # -------------------------------------------------
        # Calculate subtotal
        # -------------------------------------------------

        subtotal = cart.total()

        # -------------------------------------------------
        # Delivery fee
        # -------------------------------------------------

        delivery_fee = 200 if subtotal > 0 else 0

        # -------------------------------------------------
        # Final order total
        # -------------------------------------------------

        total_amount = subtotal + delivery_fee

        # -------------------------------------------------
        # Create order and update stock together
        # -------------------------------------------------

        with transaction.atomic():

            order = Order.objects.create(
                user=request.user,
                total_amount=total_amount
            )

            # ---------------------------------------------
            # Create order items
            # ---------------------------------------------

            for item in cart.items.all():

                product = item.product

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=item.quantity,
                    price=product.price
                )

                # -----------------------------------------
                # Reduce product stock
                # -----------------------------------------

                product.stock -= item.quantity
                product.save(update_fields=["stock"])

            # ---------------------------------------------
            # Empty cart
            # ---------------------------------------------

            cart.items.all().delete()

        # -------------------------------------------------
        # Return created order
        # -------------------------------------------------

        serializer = OrderSerializer(order)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


# =====================================================
# ORDER LIST
# =====================================================

class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        return Order.objects.filter(
            user=self.request.user
        )


# =====================================================
# ORDER DETAIL
# =====================================================

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        # Users can only view their own orders
        return Order.objects.filter(
            user=self.request.user
        )
