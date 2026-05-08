from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import (
    User,
    ManagerAccountRequest,
    CharityAccountRequest,
    Charity,
    Restaurant,
    MenuItem,
    Reservation,
    Notification,
    Payment,
    Order,
    OrderItem,
    SurplusFoodOffer,
)


# =====================================================
# Register
# =====================================================

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "confirm_password",
            "full_name",
            "phone",
            "location",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("كلمتا المرور غير متطابقتين")
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


# =====================================================
# Login
# =====================================================

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(email=email, password=password)

        if not user:
            raise serializers.ValidationError("البريد الإلكتروني أو كلمة المرور غير صحيحة")

        if not user.is_active:
            raise serializers.ValidationError("هذا الحساب غير مفعل")

        attrs["user"] = user
        return attrs


# =====================================================
# Restaurant Manager Requests
# =====================================================

class ManagerAccountRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagerAccountRequest
        fields = [
            "id",
            "restaurant_name",
            "restaurant_address",
            "restaurant_phone",
            "manager_name",
            "manager_email",
            "manager_phone",
            "restaurant_image",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def validate_manager_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("يوجد حساب بنفس البريد الإلكتروني.")
        return value


# =====================================================
# Charity Requests
# =====================================================

class CharityAccountRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CharityAccountRequest
        fields = [
            "id",
            "charity_name",
            "charity_address",
            "charity_phone",
            "manager_name",
            "manager_email",
            "manager_phone",
            "charity_image",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def validate_manager_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("يوجد حساب بنفس البريد الإلكتروني.")
        return value


# =====================================================
# Admin Create User
# =====================================================

class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "full_name",
            "phone",
            "location",
            "role",
        ]
        read_only_fields = ["id"]

    def validate_role(self, value):
        if value != User.Role.CUSTOMER:
            raise serializers.ValidationError("يمكن إنشاء زبائن فقط من هذه الواجهة.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data["role"] = User.Role.CUSTOMER

        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


# =====================================================
# Charity Serializer
# =====================================================

class CharitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Charity
        fields = [
            "id",
            "name",
            "address",
            "phone",
            "image",
            "manager",
        ]
        read_only_fields = ["id"]


# =====================================================
# Restaurant Serializer
# =====================================================

class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = [
            "id",
            "name",
            "address",
            "phone",
            "type",
            "image",
            "manager",
        ]
        read_only_fields = ["id"]


class ManagerRestaurantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = [
            "id",
            "name",
            "address",
            "phone",
            "type",
            "image",
        ]
        read_only_fields = ["id"]


# =====================================================
# Menu
# =====================================================

class MenuItemSerializer(serializers.ModelSerializer):
    restaurant = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "restaurant",
            "name",
            "type",
            "price",
            "image",
        ]
        read_only_fields = ["id", "restaurant"]


# =====================================================
# Public Views
# =====================================================

class PublicRestaurantListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ["id", "name", "address", "type", "image"]


class PublicMenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ["id", "name", "type", "price", "image"]


class PublicRestaurantDetailSerializer(serializers.ModelSerializer):
    menu_items = PublicMenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            "id",
            "name",
            "address",
            "phone",
            "type",
            "image",
            "menu_items",
        ]


# =====================================================
# Reservations
# =====================================================

class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            "id",
            "restaurant",
            "date",
            "time",
            "number_of_people",
        ]
        read_only_fields = ["id"]


class ReservationListSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source="restaurant.name", read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "restaurant_name",
            "date",
            "time",
            "number_of_people",
            "status",
            "created_at",
        ]


class ReservationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            "date",
            "time",
            "number_of_people",
        ]


class ManagerReservationListSerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(source="user.email", read_only=True)
    restaurant_name = serializers.CharField(source="restaurant.name", read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "restaurant_name",
            "customer_email",
            "date",
            "time",
            "number_of_people",
            "status",
            "created_at",
        ]


# =====================================================
# Notifications
# =====================================================

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "notif_type",
            "reservation",
            "order",
            "is_read",
            "created_at",
        ]


# =====================================================
# Payment
# =====================================================

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "method",
            "status",
            "amount",
            "card_last4",
            "created_at",
        ]
        read_only_fields = ["status", "card_last4", "created_at"]


# =====================================================
# Orders
# =====================================================

class OrderItemCreateSerializer(serializers.Serializer):
    menu_item = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    reservation_id = serializers.IntegerField()
    items = OrderItemCreateSerializer(many=True)

    def validate(self, attrs):
        request = self.context["request"]
        reservation_id = attrs["reservation_id"]

        reservation = Reservation.objects.filter(
            id=reservation_id,
            user=request.user
        ).first()

        if not reservation:
            raise serializers.ValidationError("الحجز غير موجود.")

        if reservation.status != Reservation.Status.ACCEPTED:
            raise serializers.ValidationError("لا يمكن الطلب قبل قبول الحجز.")

        if hasattr(reservation, "order"):
            raise serializers.ValidationError("يوجد طلب مسبق.")

        restaurant = reservation.restaurant

        for it in attrs["items"]:
            mi = MenuItem.objects.filter(
                id=it["menu_item"],
                restaurant=restaurant
            ).first()

            if not mi:
                raise serializers.ValidationError("صنف غير تابع لهذا المطعم.")

        attrs["reservation"] = reservation
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        reservation = validated_data["reservation"]
        items_data = validated_data["items"]

        order = Order.objects.create(
            user=request.user,
            restaurant=reservation.restaurant,
            reservation=reservation,
            status=Order.Status.PENDING,
        )

        total = 0

        for it in items_data:
            mi = MenuItem.objects.get(id=it["menu_item"])
            qty = it["quantity"]

            OrderItem.objects.create(
                order=order,
                menu_item=mi,
                quantity=qty,
                unit_price=mi.price
            )

            total += (mi.price * qty)

        order.total_amount = total
        order.save()

        return order



class OrderItemListSerializer(serializers.ModelSerializer):
    menu_item = serializers.IntegerField(source="menu_item.id", read_only=True)
    item_name = serializers.CharField(source="menu_item.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "menu_item",
            "item_name",
            "quantity",
            "unit_price",
        ]


class OrderListSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source="restaurant.name", read_only=True)
    items = OrderItemListSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "restaurant_name",
            "reservation",
            "status",
            "total_amount",
            "created_at",
            "items",
        ]


# =====================================================
# Surplus Food
# =====================================================

class SurplusFoodOfferSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source="restaurant.name", read_only=True)
    restaurant_address = serializers.CharField(source="restaurant.address", read_only=True)
    restaurant_phone = serializers.CharField(source="restaurant.phone", read_only=True)
    restaurant_type = serializers.CharField(source="restaurant.type", read_only=True)
    restaurant_image = serializers.ImageField(source="restaurant.image", read_only=True)

    claimed_by_name = serializers.CharField(source="claimed_by.name", read_only=True)
    claimed_by_address = serializers.CharField(source="claimed_by.address", read_only=True)
    claimed_by_phone = serializers.CharField(source="claimed_by.phone", read_only=True)
    claimed_by_image = serializers.ImageField(source="claimed_by.image", read_only=True)

    class Meta:
        model = SurplusFoodOffer
        fields = [
            "id",
            "restaurant",
            "restaurant_name",
            "restaurant_address",
            "restaurant_phone",
            "restaurant_type",
            "restaurant_image",
            "created_by",
            "title",
            "description",
            "quantity",
            "unit",
            "pickup_time",
            "expires_at",
            "notes",
            "image",
            "status",
            "claimed_by",
            "claimed_by_name",
            "claimed_by_address",
            "claimed_by_phone",
            "claimed_by_image",
            "claimed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "restaurant",
            "created_by",
            "status",
            "claimed_by",
            "claimed_at",
            "created_at",
            "updated_at",
            "restaurant_name",
            "restaurant_address",
            "restaurant_phone",
            "restaurant_type",
            "restaurant_image",
            "claimed_by_name",
            "claimed_by_address",
            "claimed_by_phone",
            "claimed_by_image",
        ]


# =====================================================
# Recommendation
# =====================================================

class RecommendationRequestSerializer(serializers.Serializer):
    limit = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=20,
        default=10
    )

    restaurant_id = serializers.IntegerField(required=False, allow_null=True)
    context = serializers.CharField(required=False, allow_blank=True)


# =====================================================
# Chatbot
# =====================================================

class ChatbotSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)