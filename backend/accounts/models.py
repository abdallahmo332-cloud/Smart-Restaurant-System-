from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("البريد الإلكتروني مطلوب")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", User.Role.CUSTOMER)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.SYSTEM_ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("superuser لازم يكون is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("superuser لازم يكون is_superuser=True")

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        RESTAURANT_MANAGER = "RESTAURANT_MANAGER", "Restaurant Manager"
        SYSTEM_ADMIN = "SYSTEM_ADMIN", "System Admin"
        CHARITY = "CHARITY", "Charity"

    username = None

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    location = models.CharField(max_length=255)

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"


# =====================================================
# Restaurant Manager Requests
# =====================================================

class ManagerAccountRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    restaurant_name = models.CharField(max_length=255)
    restaurant_address = models.CharField(max_length=255)
    restaurant_phone = models.CharField(max_length=20)

    manager_name = models.CharField(max_length=150)
    manager_email = models.EmailField()
    manager_phone = models.CharField(max_length=20)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    restaurant_image = models.ImageField(
        upload_to="restaurant_requests/",
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Request: {self.restaurant_name} / {self.manager_email}"


# =====================================================
# Charity Requests
# =====================================================

class CharityAccountRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    charity_name = models.CharField(max_length=255)
    charity_address = models.CharField(max_length=255)
    charity_phone = models.CharField(max_length=20)

    manager_name = models.CharField(max_length=150)
    manager_email = models.EmailField()
    manager_phone = models.CharField(max_length=20)

    charity_image = models.ImageField(
        upload_to="charity_requests/",
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.charity_name} - {self.manager_email}"


# =====================================================
# Charity Model
# =====================================================

class Charity(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)

    image = models.ImageField(
        upload_to="charities/",
        null=True,
        blank=True
    )

    manager = models.OneToOneField(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        limit_choices_to={"role": User.Role.CHARITY},
        related_name="charity",
    )

    def __str__(self):
        return self.name


# =====================================================
# Restaurant
# =====================================================

class Restaurant(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    type = models.CharField(max_length=50, blank=True)

    image = models.ImageField(
        upload_to="restaurants/",
        null=True,
        blank=True
    )

    manager = models.OneToOneField(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        limit_choices_to={"role": User.Role.RESTAURANT_MANAGER},
        related_name="restaurant",
    )

    def __str__(self):
        return self.name


# =====================================================
# Menu Items
# =====================================================

class MenuItem(models.Model):
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="menu_items"
    )

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    image = models.ImageField(
        upload_to="menu_items/",
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"


# =====================================================
# Reservations
# =====================================================

class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reservations"
    )

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="reservations"
    )

    date = models.DateField()
    time = models.TimeField()
    number_of_people = models.PositiveIntegerField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.restaurant.name}"


# =====================================================
# Notifications
# =====================================================

class Notification(models.Model):
    class Type(models.TextChoices):
        NEW_RESERVATION = "new_reservation", "New Reservation"
        RESERVATION_STATUS = "reservation_status", "Reservation Status"
        NEW_ORDER = "new_order", "New Order"
        ORDER_STATUS = "order_status", "Order Status"
        ORDER_EDITED = "order_edited", "Order Edited"
        SURPLUS_CREATED = "surplus_created", "Surplus Created"
        SURPLUS_CLAIMED = "surplus_claimed", "Surplus Claimed"

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)

    notif_type = models.CharField(max_length=50, choices=Type.choices)

    reservation = models.ForeignKey(
        "Reservation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications"
    )

    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications"
    )

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


# =====================================================
# Payment
# =====================================================

class Payment(models.Model):
    class Method(models.TextChoices):
        CARD = "card", "Card"
        CASH_AT_RESTAURANT = "cash_at_restaurant", "Cash at restaurant"

    class Status(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PAID = "paid", "Paid"
        PENDING_CASH = "pending_cash", "Pending cash"
        FAILED = "failed", "Failed"

    order = models.OneToOneField(
        "Order",
        on_delete=models.CASCADE,
        related_name="payment"
    )

    method = models.CharField(max_length=30, choices=Method.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNPAID)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    card_last4 = models.CharField(max_length=4, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# =====================================================
# Orders
# =====================================================

class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="orders")
    reservation = models.OneToOneField("Reservation", on_delete=models.CASCADE, related_name="order")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)


# =====================================================
# Surplus Food
# =====================================================

class SurplusFoodOffer(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        CLAIMED = "claimed", "Claimed"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="surplus_offers",
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_surplus_offers",
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit = models.CharField(max_length=50, default="portion")

    pickup_time = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)

    image = models.ImageField(
        upload_to="surplus_food/",
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )

    claimed_by = models.ForeignKey(
        Charity,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="claimed_offers",
    )

    claimed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.restaurant.name}"


# =====================================================
# Recommendation Tracking
# =====================================================

class UserInteraction(models.Model):
    class EventType(models.TextChoices):
        VIEW = "view", "View"
        CLICK = "click", "Click"
        FAVORITE = "favorite", "Favorite"
        ORDER = "order", "Order"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="interactions")
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, null=True, blank=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True)

    event_type = models.CharField(max_length=20, choices=EventType.choices)
    weight = models.FloatField(default=1.0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)