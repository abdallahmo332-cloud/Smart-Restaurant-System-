from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

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

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ManagerAccountRequestSerializer,
    CharityAccountRequestSerializer,
    AdminCreateUserSerializer,
    CharitySerializer,
    RestaurantSerializer,
    ManagerRestaurantProfileSerializer,
    MenuItemSerializer,
    PublicRestaurantListSerializer,
    PublicRestaurantDetailSerializer,
    ReservationCreateSerializer,
    ReservationListSerializer,
    ReservationUpdateSerializer,
    ManagerReservationListSerializer,
    NotificationSerializer,
    PaymentSerializer,
    OrderCreateSerializer,
    OrderListSerializer,
    ChatbotSerializer,
    RecommendationRequestSerializer,
    SurplusFoodOfferSerializer,
)

from .permissions import IsSystemAdmin, IsRestaurantManager
from .services.chatbot_service import ChatbotService
from .services.recommendation_service import RecommendationService
from .payment_service import PaymentService
from .payment_strategies import CardPaymentStrategy, CashAtRestaurantStrategy


# =====================================================
# AUTH
# =====================================================

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "token": token.key,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "phone": user.phone,
                    "location": user.location,
                    "role": user.role,
                },
            },
            status=status.HTTP_200_OK,
        )


# =====================================================
# MANAGER REQUESTS
# =====================================================

class ManagerAccountRequestCreateView(generics.CreateAPIView):
    queryset = ManagerAccountRequest.objects.all()
    serializer_class = ManagerAccountRequestSerializer
    permission_classes = [permissions.AllowAny]


class ManagerAccountRequestListView(generics.ListAPIView):
    queryset = ManagerAccountRequest.objects.all().order_by("-created_at")
    serializer_class = ManagerAccountRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]


class ManagerAccountRequestApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]

    def post(self, request, pk):
        req = get_object_or_404(
            ManagerAccountRequest,
            pk=pk,
            status=ManagerAccountRequest.Status.PENDING,
        )

        password = request.data.get("password")
        if not password:
            return Response({"detail": "password required"}, status=400)

        if User.objects.filter(email=req.manager_email).exists():
            return Response({"detail": "email already used"}, status=400)

        manager = User.objects.create_user(
            email=req.manager_email,
            password=password,
            full_name=req.manager_name,
            phone=req.manager_phone,
            location=req.restaurant_address,
            role=User.Role.RESTAURANT_MANAGER,
        )

        Restaurant.objects.create(
            name=req.restaurant_name,
            address=req.restaurant_address,
            phone=req.restaurant_phone,
            manager=manager,
            image=req.restaurant_image,
        )

        req.status = ManagerAccountRequest.Status.APPROVED
        req.save()

        return Response({"detail": "approved"})


class ManagerAccountRequestRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]

    def post(self, request, pk):
        req = get_object_or_404(
            ManagerAccountRequest,
            pk=pk,
            status=ManagerAccountRequest.Status.PENDING,
        )

        req.status = ManagerAccountRequest.Status.REJECTED
        req.save()

        return Response({"detail": "rejected"})


# =====================================================
# CHARITY REQUESTS
# =====================================================

class CharityAccountRequestCreateView(generics.CreateAPIView):
    queryset = CharityAccountRequest.objects.all()
    serializer_class = CharityAccountRequestSerializer
    permission_classes = [permissions.AllowAny]


class CharityAccountRequestListView(generics.ListAPIView):
    queryset = CharityAccountRequest.objects.all().order_by("-created_at")
    serializer_class = CharityAccountRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]


class CharityAccountRequestApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]

    def post(self, request, pk):
        req = get_object_or_404(
            CharityAccountRequest,
            pk=pk,
            status=CharityAccountRequest.Status.PENDING,
        )

        password = request.data.get("password")
        if not password:
            return Response({"detail": "password required"}, status=400)

        if User.objects.filter(email=req.manager_email).exists():
            return Response({"detail": "email already used"}, status=400)

        manager = User.objects.create_user(
            email=req.manager_email,
            password=password,
            full_name=req.manager_name,
            phone=req.manager_phone,
            location=req.charity_address,
            role=User.Role.CHARITY,
        )

        Charity.objects.create(
            name=req.charity_name,
            address=req.charity_address,
            phone=req.charity_phone,
            manager=manager,
            image=req.charity_image,
        )

        req.status = CharityAccountRequest.Status.APPROVED
        req.save()

        try:
            send_mail(
                "Charity Request Approved",
                f"Your charity request for {req.charity_name} has been approved.",
                settings.DEFAULT_FROM_EMAIL,
                [manager.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({"detail": "approved"})


class CharityAccountRequestRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]

    def post(self, request, pk):
        req = get_object_or_404(
            CharityAccountRequest,
            pk=pk,
            status=CharityAccountRequest.Status.PENDING,
        )

        req.status = CharityAccountRequest.Status.REJECTED
        req.save()

        return Response({"detail": "rejected"})


# =====================================================
# ADMIN USERS
# =====================================================

class AdminCreateUserView(generics.ListCreateAPIView):
    serializer_class = AdminCreateUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]

    def get_queryset(self):
        return User.objects.filter(role=User.Role.CUSTOMER).order_by("-id")


class AdminDeleteUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)

        if user == request.user:
            return Response({"detail": "cannot delete yourself"}, status=400)

        if user.role != User.Role.CUSTOMER:
            return Response({"detail": "customers only"}, status=400)

        user.delete()
        return Response(status=204)


# =====================================================
# ADMIN CHARITIES
# =====================================================

class AdminCharityListCreateView(generics.ListCreateAPIView):
    queryset = Charity.objects.all().order_by("-id")
    serializer_class = CharitySerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]


class AdminDeleteCharityView(generics.DestroyAPIView):
    queryset = Charity.objects.all()
    serializer_class = CharitySerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]

    def perform_destroy(self, instance):
        manager = instance.manager
        instance.delete()
        if manager:
            manager.delete()


# =====================================================
# ADMIN RESTAURANTS
# =====================================================

class AdminCreateRestaurantView(generics.ListCreateAPIView):
    queryset = Restaurant.objects.all().order_by("-id")
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]


class AdminDeleteRestaurantView(generics.DestroyAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]

    def perform_destroy(self, instance):
        manager = instance.manager
        instance.delete()
        if manager:
            manager.delete()


# =====================================================
# MANAGER PROFILE
# =====================================================

class ManagerRestaurantProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ManagerRestaurantProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self):
        return get_object_or_404(Restaurant, manager=self.request.user)


class ManagerMenuItemListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return MenuItem.objects.filter(
            restaurant__manager=self.request.user
        ).order_by("-id")

    def perform_create(self, serializer):
        restaurant = get_object_or_404(Restaurant, manager=self.request.user)
        serializer.save(restaurant=restaurant)


class ManagerMenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return MenuItem.objects.filter(
            restaurant__manager=self.request.user
        ).order_by("-id")


# =====================================================
# PUBLIC RESTAURANTS
# =====================================================

class PublicRestaurantListView(generics.ListAPIView):
    serializer_class = PublicRestaurantListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Restaurant.objects.all()

        restaurant_type = self.request.query_params.get("type")
        if restaurant_type:
            qs = qs.filter(type__iexact=restaurant_type)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)

        return qs.order_by("-id")


class PublicRestaurantDetailView(generics.RetrieveAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = PublicRestaurantDetailSerializer
    permission_classes = [permissions.AllowAny]


class RestaurantTypeListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        data = Restaurant.objects.values_list("type", flat=True).distinct()
        return Response([x for x in data if x])


# =====================================================
# RESERVATIONS
# =====================================================

class ReservationCreateView(generics.CreateAPIView):
    serializer_class = ReservationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        reservation = serializer.save(user=self.request.user)

        if reservation.restaurant.manager:
            Notification.objects.create(
                recipient=reservation.restaurant.manager,
                title="New Reservation",
                message=f"Reservation from {reservation.user.email}",
                notif_type=Notification.Type.NEW_RESERVATION,
                reservation=reservation,
            )


class MyReservationsListView(generics.ListAPIView):
    serializer_class = ReservationListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reservation.objects.filter(
            user=self.request.user
        ).order_by("-created_at")


class ReservationUpdateCancelView(generics.RetrieveUpdateAPIView):
    serializer_class = ReservationUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reservation.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        reservation = self.get_object()

        if request.data.get("cancel") is True:
            reservation.status = Reservation.Status.CANCELLED
            reservation.save()
            return Response({"detail": "cancelled"})

        return super().patch(request, *args, **kwargs)


class ManagerReservationsListView(generics.ListAPIView):
    serializer_class = ManagerReservationListSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def get_queryset(self):
        return Reservation.objects.filter(
            restaurant__manager=self.request.user
        ).order_by("-created_at")


class ManagerReservationDecisionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def post(self, request, pk):
        reservation = get_object_or_404(
            Reservation,
            pk=pk,
            restaurant__manager=request.user
        )

        action = request.data.get("action")

        if action == "accept":
            reservation.status = Reservation.Status.ACCEPTED
        else:
            reservation.status = Reservation.Status.REJECTED

        reservation.save()

        Notification.objects.create(
            recipient=reservation.user,
            title="Reservation Updated",
            message=f"Status: {reservation.status}",
            notif_type=Notification.Type.RESERVATION_STATUS,
            reservation=reservation,
        )

        return Response({"detail": "updated"})


# =====================================================
# NOTIFICATIONS
# =====================================================

class MyNotificationsListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by("-created_at")


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        notif = get_object_or_404(Notification, pk=pk, recipient=request.user)
        notif.is_read = True
        notif.save()
        return Response({"detail": "read"})


# =====================================================
# ORDERS
# =====================================================

class OrderCreateView(generics.CreateAPIView):
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class MyOrdersListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).order_by("-created_at")


class ManagerOrdersListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def get_queryset(self):
        return Order.objects.filter(
            restaurant__manager=self.request.user
        ).order_by("-created_at")


class ManagerOrderDecisionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def post(self, request, pk):
        order = get_object_or_404(
            Order,
            pk=pk,
            restaurant__manager=request.user
        )

        action = request.data.get("action")

        if action == "accept":
            order.status = Order.Status.ACCEPTED
        else:
            order.status = Order.Status.REJECTED

        order.save()

        Notification.objects.create(
            recipient=order.user,
            title="Order Updated",
            message=f"Status: {order.status}",
            notif_type=Notification.Type.ORDER_STATUS,
            order=order,
        )

        return Response({"detail": "updated"})


class OrderItemsUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        return Response({"detail": "ok"})


class OrderCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        order.status = Order.Status.CANCELLED
        order.save()
        return Response({"detail": "cancelled"})


class PayOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        return Response({"detail": "paid"})

# =====================================================
# SURPLUS FOOD
# =====================================================

class IsCharityUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == User.Role.CHARITY
        )


class ManagerSurplusFoodListCreateView(generics.ListCreateAPIView):
    serializer_class = SurplusFoodOfferSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return SurplusFoodOffer.objects.filter(
            restaurant__manager=self.request.user
        ).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        restaurant = get_object_or_404(Restaurant, manager=request.user)

        title = request.data.get("title", "").strip()
        quantity = request.data.get("quantity")

        if not title:
            return Response({"detail": "title required"}, status=400)

        if not quantity:
            return Response({"detail": "quantity required"}, status=400)

        offer = SurplusFoodOffer.objects.create(
            restaurant=restaurant,
            created_by=request.user,
            title=title,
            description=title,
            quantity=quantity,
            unit="portion",
            pickup_time=timezone.now() + timedelta(hours=1),
            expires_at=timezone.now() + timedelta(days=1),
            notes="",
            status=SurplusFoodOffer.Status.AVAILABLE,
        )

        charity_users = User.objects.filter(
            role=User.Role.CHARITY,
            charity__isnull=False,
        )

        for charity_user in charity_users:
            Notification.objects.create(
                recipient=charity_user,
                title="New Surplus Food",
                message=f"{restaurant.name} added new surplus food.",
                notif_type=Notification.Type.SURPLUS_CREATED,
            )

        return Response(
            SurplusFoodOfferSerializer(offer).data,
            status=status.HTTP_201_CREATED,
        )


class ManagerSurplusFoodDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SurplusFoodOfferSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def get_queryset(self):
        return SurplusFoodOffer.objects.filter(
            restaurant__manager=self.request.user
        ).order_by("-created_at")


class CharitySurplusFoodListView(generics.ListAPIView):
    serializer_class = SurplusFoodOfferSerializer
    permission_classes = [permissions.IsAuthenticated, IsCharityUser]

    def get_queryset(self):
        return SurplusFoodOffer.objects.filter(
            status=SurplusFoodOffer.Status.AVAILABLE
        ).order_by("-created_at")


class CharityMySurplusFoodListView(generics.ListAPIView):
    serializer_class = SurplusFoodOfferSerializer
    permission_classes = [permissions.IsAuthenticated, IsCharityUser]

    def get_queryset(self):
        charity = get_object_or_404(Charity, manager=self.request.user)
        return SurplusFoodOffer.objects.filter(
            claimed_by=charity
        ).order_by("-claimed_at")


class CharitySurplusFoodClaimView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCharityUser]

    def post(self, request, pk):
        offer = get_object_or_404(SurplusFoodOffer, pk=pk)

        if offer.status != SurplusFoodOffer.Status.AVAILABLE:
            return Response({"detail": "not available"}, status=400)

        charity = get_object_or_404(Charity, manager=request.user)

        offer.status = SurplusFoodOffer.Status.CLAIMED
        offer.claimed_by = charity
        offer.claimed_at = timezone.now()
        offer.save()

        if offer.restaurant.manager:
            Notification.objects.create(
                recipient=offer.restaurant.manager,
                title="Claimed",
                message=f"{charity.name} claimed {offer.title}",
                notif_type=Notification.Type.SURPLUS_CLAIMED,
            )

        return Response(SurplusFoodOfferSerializer(offer).data)


# =====================================================
# AI
# =====================================================

class MealRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RecommendationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        limit = serializer.validated_data["limit"]
        restaurant_id = serializer.validated_data.get("restaurant_id")

        service = RecommendationService()
        scored_items = service.recommend_for_user(
            user=request.user,
            limit=limit,
            restaurant_id=restaurant_id,
        )

        results = []
        for score, item in scored_items:
            results.append(
                {
                    "id": item.id,
                    "name": item.name,
                    "type": item.type,
                    "price": str(item.price),
                    "image": item.image.url if item.image else None,
                    "restaurant": {
                        "id": item.restaurant.id,
                        "name": item.restaurant.name,
                        "type": item.restaurant.type,
                    },
                    "score": round(float(score), 4),
                }
            )

        return Response(
            {
                "user_id": request.user.id,
                "count": len(results),
                "results": results,
            }
        )


class ChatbotView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChatbotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]

        context_text = f"""
User Name: {request.user.full_name}
Email: {request.user.email}
Role: {request.user.role}
"""

        answer = ChatbotService.ask(
            message=message,
            context_text=context_text,
        )

        return Response(
            {
                "question": message,
                "answer": answer,
            }
        )