from django.urls import path

from .views import (
    RegisterView,
    LoginView,

    ManagerAccountRequestCreateView,
    ManagerAccountRequestListView,
    ManagerAccountRequestApproveView,
    ManagerAccountRequestRejectView,

    CharityAccountRequestCreateView,
    CharityAccountRequestListView,
    CharityAccountRequestApproveView,
    CharityAccountRequestRejectView,

    AdminCreateUserView,
    AdminDeleteUserView,

    AdminCharityListCreateView,
    AdminDeleteCharityView,

    AdminCreateRestaurantView,
    AdminDeleteRestaurantView,

    ManagerRestaurantProfileView,
    ManagerMenuItemListCreateView,
    ManagerMenuItemDetailView,

    PublicRestaurantListView,
    PublicRestaurantDetailView,
    RestaurantTypeListView,

    ReservationCreateView,
    MyReservationsListView,
    ReservationUpdateCancelView,

    ManagerReservationsListView,
    ManagerReservationDecisionView,

    MyNotificationsListView,
    NotificationMarkReadView,

    OrderCreateView,
    MyOrdersListView,
    ManagerOrdersListView,
    ManagerOrderDecisionView,
    OrderItemsUpdateView,
    OrderCancelView,
    PayOrderView,

    ManagerSurplusFoodListCreateView,
    ManagerSurplusFoodDetailView,
    CharitySurplusFoodListView,
    CharityMySurplusFoodListView,
    CharitySurplusFoodClaimView,

    MealRecommendationView,
    ChatbotView,
)

urlpatterns = [
    # ================= AUTH =================
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", LoginView.as_view()),

    # ================= MANAGER REQUESTS =================
    path("manager/account-request/", ManagerAccountRequestCreateView.as_view()),
    path("admin/manager/requests/", ManagerAccountRequestListView.as_view()),
    path("admin/manager/requests/<int:pk>/approve/", ManagerAccountRequestApproveView.as_view()),
    path("admin/manager/requests/<int:pk>/reject/", ManagerAccountRequestRejectView.as_view()),

    # ================= CHARITY REQUESTS =================
    path("charity/account-request/", CharityAccountRequestCreateView.as_view()),
    path("admin/charity/requests/", CharityAccountRequestListView.as_view()),
    path("admin/charity/requests/<int:pk>/approve/", CharityAccountRequestApproveView.as_view()),
    path("admin/charity/requests/<int:pk>/reject/", CharityAccountRequestRejectView.as_view()),

    # ================= USERS =================
    path("admin/users/", AdminCreateUserView.as_view()),
    path("admin/users/<int:pk>/", AdminDeleteUserView.as_view()),

    # ================= CHARITIES =================
    path("admin/charities/", AdminCharityListCreateView.as_view()),
    path("admin/charities/<int:pk>/", AdminDeleteCharityView.as_view()),

    # ================= RESTAURANTS =================
    path("admin/restaurants/", AdminCreateRestaurantView.as_view()),
    path("admin/restaurants/<int:pk>/", AdminDeleteRestaurantView.as_view()),

    # ================= MANAGER PROFILE =================
    path("manager/restaurant/profile/", ManagerRestaurantProfileView.as_view()),
    path("manager/menu-items/", ManagerMenuItemListCreateView.as_view()),
    path("manager/menu-items/<int:pk>/", ManagerMenuItemDetailView.as_view()),

    # ================= PUBLIC RESTAURANTS =================
    path("restaurants/", PublicRestaurantListView.as_view()),
    path("restaurants/types/", RestaurantTypeListView.as_view()),
    path("restaurants/<int:pk>/", PublicRestaurantDetailView.as_view()),

    # ================= RESERVATIONS =================
    path("reservations/", ReservationCreateView.as_view()),
    path("reservations/my/", MyReservationsListView.as_view()),
    path("reservations/<int:pk>/", ReservationUpdateCancelView.as_view()),

    path("manager/reservations/", ManagerReservationsListView.as_view()),
    path("manager/reservations/<int:pk>/decision/", ManagerReservationDecisionView.as_view()),

    # ================= NOTIFICATIONS =================
    path("notifications/", MyNotificationsListView.as_view()),
    path("notifications/<int:pk>/read/", NotificationMarkReadView.as_view()),

    # ================= ORDERS =================
    path("orders/", OrderCreateView.as_view()),
    path("orders/my/", MyOrdersListView.as_view()),
    path("orders/<int:pk>/items/", OrderItemsUpdateView.as_view()),
    path("orders/<int:pk>/cancel/", OrderCancelView.as_view()),
    path("orders/<int:order_id>/pay/", PayOrderView.as_view()),

    path("manager/orders/", ManagerOrdersListView.as_view()),
    path("manager/orders/<int:pk>/decision/", ManagerOrderDecisionView.as_view()),

    # ================= SURPLUS FOOD =================
    path("manager/surplus-food/", ManagerSurplusFoodListCreateView.as_view()),
    path("manager/surplus-food/<int:pk>/", ManagerSurplusFoodDetailView.as_view()),

    path("charity/surplus-food/", CharitySurplusFoodListView.as_view()),
    path("charity/surplus-food/my/", CharityMySurplusFoodListView.as_view()),
    path("charity/surplus-food/<int:pk>/claim/", CharitySurplusFoodClaimView.as_view()),

    # ================= AI =================
    path("recommendations/meals/", MealRecommendationView.as_view()),
    path("chatbot/", ChatbotView.as_view()),
]