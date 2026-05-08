// src/pages/UserHome/UserHome.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import API, { getRecommendations, sendChatMessage } from "../../services/api";

const ENDPOINTS = {
  restaurants: "restaurants/",
  restaurantDetail: (id) => `restaurants/${id}/`,
  restaurantTypes: "restaurants/types/",

  myReservations: "reservations/my/",
  createReservation: "reservations/",
  reservationUpdateCancel: (id) => `reservations/${id}/`,

  myNotifications: "notifications/",
  markNotifRead: (id) => `notifications/${id}/read/`,

  createOrder: "orders/",
  myOrders: "orders/my/",
  payOrder: (orderId) => `orders/${orderId}/pay/`,
};

function normalizeText(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isNumericLike(v) {
  if (v === null || v === undefined) return false;
  const n = Number(v);
  return !Number.isNaN(n) && Number.isFinite(n);
}

function statusClass(status) {
  const s = String(status || "pending").toLowerCase();
  if (s === "accepted") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "rejected") return "bg-rose-100 text-rose-800 border-rose-200";
  if (s === "cancelled") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-amber-100 text-amber-900 border-amber-200";
}

function absoluteMedia(path) {
  if (!path) return path;
  if (String(path).startsWith("http")) return path;
  const root = (API?.defaults?.baseURL || "http://127.0.0.1:8000/api/").replace(/\/api\/?$/, "");
  return `${root}${path.startsWith("/") ? "" : "/"}${path}`;
}

function makeTableMap(restaurant) {
  const seed = Number(restaurant?.id || 1);
  const tables = [];
  for (let i = 1; i <= 12; i += 1) {
    const isReserved = ((seed + i) % 4 === 0) || ((seed + i) % 7 === 0);
    const seats = i % 4 === 0 ? 4 : i % 3 === 0 ? 6 : 2;
    tables.push({
      id: `${restaurant?.id || "r"}-${i}`,
      number: i,
      seats,
      zone: i <= 4 ? "واجهة" : i <= 8 ? "وسط" : "مميز",
      status: isReserved ? "reserved" : "available",
    });
  }
  return tables;
}

function getOrderForReservation(reservationId, ordersList) {
  const list = ordersList || [];
  return (
    list.find((o) => {
      const rid =
        o?.reservation ||
        o?.reservation_id ||
        o?.reservationId ||
        o?.reservation?.id ||
        null;
      return String(rid) === String(reservationId);
    }) || null
  );
}

function makeChatWelcome(roleText = "customer") {
  return {
    role: "assistant",
    text: `مرحبًا بك 👋 أنا مساعد النظام الذكي. يمكنني مساعدتك في الحجز، الطلب، التوصيات، أو أسئلة المطاعم. (دورك الحالي: ${roleText})`,
  };
}

function FloorPlanView({ tables = [], selectedId, onSelect, restaurantName = "" }) {
  const positions = {
    1: { x: 120, y: 120 },
    2: { x: 255, y: 110 },
    3: { x: 395, y: 130 },
    4: { x: 545, y: 110 },
    5: { x: 700, y: 145 },
    6: { x: 135, y: 250 },
    7: { x: 280, y: 245 },
    8: { x: 430, y: 255 },
    9: { x: 585, y: 245 },
    10: { x: 730, y: 275 },
    11: { x: 210, y: 385 },
    12: { x: 490, y: 385 },
  };

  const getPos = (table) =>
    positions[Number(table.number)] || {
      x: 80 + ((Number(table.number) - 1) % 5) * 140,
      y: 120 + Math.floor((Number(table.number) - 1) / 5) * 130,
    };

  const isSelected = (table) => String(selectedId) === String(table.id);
  const isAvailable = (table) => table.status === "available";

  const fillFor = (table) => {
    if (isSelected(table)) return "#f97316";
    if (isAvailable(table)) return "#22c55e";
    return "#94a3b8";
  };

  const glowFor = (table) => {
    if (isSelected(table)) return "url(#glowSelected)";
    if (isAvailable(table)) return "url(#glowAvailable)";
    return "none";
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-extrabold text-slate-900">مخطط الطاولات</div>
          <div className="text-sm text-slate-500">
            {restaurantName ? `${restaurantName} — ` : ""}اضغط على أي طاولة لعرض التفاصيل
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
            متاحة
          </span>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
            محددة
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
            محجوزة
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        <svg viewBox="0 0 900 520" className="h-[520px] w-full">
          <defs>
            <filter id="glowAvailable" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowSelected" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width="900" height="520" fill="#f8fafc" />

          <rect x="18" y="18" width="864" height="484" rx="28" fill="transparent" stroke="#e2e8f0" strokeWidth="2" />
          <rect x="28" y="28" width="130" height="56" rx="18" fill="#fff7ed" stroke="#fdba74" strokeWidth="2" />
          <text x="93" y="62" textAnchor="middle" fontSize="16" fontWeight="700" fill="#c2410c">
            Entrance
          </text>

          <rect x="710" y="30" width="140" height="70" rx="18" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
          <text x="780" y="63" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1d4ed8">
            Kitchen
          </text>
          <text x="780" y="83" textAnchor="middle" fontSize="12" fill="#3b82f6">
            Service Area
          </text>

          <rect x="40" y="430" width="190" height="50" rx="18" fill="#ecfccb" stroke="#bef264" strokeWidth="2" />
          <text x="135" y="461" textAnchor="middle" fontSize="15" fontWeight="700" fill="#3f6212">
            Service Counter
          </text>

          <rect x="285" y="430" width="320" height="50" rx="18" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
          <text x="445" y="461" textAnchor="middle" fontSize="15" fontWeight="700" fill="#475569">
            Dining Space
          </text>

          {tables.map((table) => {
            const { x, y } = getPos(table);
            const selected = isSelected(table);
            const available = isAvailable(table);
            const fill = fillFor(table);
            const glow = glowFor(table);
            const seats = Number(table.seats || 2);
            const isRect = seats >= 4;

            return (
              <g
                key={table.id}
                transform={`translate(${x}, ${y})`}
                style={{ cursor: "pointer" }}
                onClick={() => onSelect?.(table)}
              >
                {isRect ? (
                  <>
                    <rect
                      x="-38"
                      y="-26"
                      width="76"
                      height="52"
                      rx="16"
                      fill={fill}
                      stroke="#ffffff"
                      strokeWidth="3"
                      filter={glow}
                    />
                    <rect
                      x="-50"
                      y="-6"
                      width="12"
                      height="12"
                      rx="4"
                      fill={selected ? "#fb923c" : available ? "#86efac" : "#cbd5e1"}
                      opacity="0.8"
                    />
                    <rect
                      x="38"
                      y="-6"
                      width="12"
                      height="12"
                      rx="4"
                      fill={selected ? "#fb923c" : available ? "#86efac" : "#cbd5e1"}
                      opacity="0.8"
                    />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fontSize="18"
                      fontWeight="800"
                      fill="white"
                    >
                      {table.number}
                    </text>
                  </>
                ) : (
                  <>
                    <circle
                      cx="0"
                      cy="0"
                      r="28"
                      fill={fill}
                      stroke="#ffffff"
                      strokeWidth="3"
                      filter={glow}
                    />
                    <circle
                      cx="-14"
                      cy="-12"
                      r="4"
                      fill="white"
                      opacity="0.35"
                    />
                    <text
                      x="0"
                      y="6"
                      textAnchor="middle"
                      fontSize="18"
                      fontWeight="800"
                      fill="white"
                    >
                      {table.number}
                    </text>
                  </>
                )}

                <text x="0" y="46" textAnchor="middle" fontSize="11" fill="#64748b">
                  {table.seats} seats • {table.zone}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function UserHome({ onLogout }) {
  const token = localStorage.getItem("token");

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantTypes, setRestaurantTypes] = useState(["all"]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const seenNotifIds = useRef(new Set());

  const [activePage, setActivePage] = useState("home"); // home | bookings | tables | notifications

  const [loading, setLoading] = useState({
    restaurants: false,
    types: false,
    restaurantDetail: false,
    bookings: false,
    createBooking: false,
    updateBooking: false,
    fetchOrders: false,
    createOrder: false,
    payOrder: false,
    recommendations: false,
  });

  const [error, setError] = useState({
    restaurants: "",
    types: "",
    restaurantDetail: "",
    bookings: "",
    createBooking: "",
    updateBooking: "",
    order: "",
    payment: "",
    recommendations: "",
  });

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: "",
    time: "",
    number_of_people: 2,
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    date: "",
    time: "",
    number_of_people: 2,
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderRestaurant, setOrderRestaurant] = useState(null);
  const [orderForBooking, setOrderForBooking] = useState(null);
  const [cart, setCart] = useState({});
  const [lastOrder, setLastOrder] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    method: "card",
    card_number: "",
  });

  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([makeChatWelcome("customer")]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [toasts, setToasts] = useState([]);

  const pushToast = (type, title, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [{ id, type, title, message }, ...prev].slice(0, 5));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const fetchNotifications = async () => {
    if (!token) return;

    try {
      const res = await API.get(ENDPOINTS.myNotifications);
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setNotifications(list);

      const unread = list.filter((n) => n && n.is_read === false);
      const toMark = [];

      for (const n of unread) {
        const idStr = String(n.id);
        if (!seenNotifIds.current.has(idStr)) {
          seenNotifIds.current.add(idStr);
          pushToast("info", n.title || "Notification", n.message || "You have a new notification.");
          toMark.push(n.id);
        }
      }

      if (toMark.length) {
        Promise.allSettled(toMark.map((id) => API.post(ENDPOINTS.markNotifRead(id)))).catch(() => {});
      }
    } catch {
      // silent
    }
  };

  const fetchRestaurants = async () => {
    setLoading((p) => ({ ...p, restaurants: true }));
    setError((p) => ({ ...p, restaurants: "" }));
    try {
      const res = await API.get(ENDPOINTS.restaurants);
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRestaurants(list);
      return list;
    } catch (err) {
      const msg = err?.response?.data?.detail || "فشل تحميل المطاعم";
      setError((p) => ({ ...p, restaurants: msg }));
      return [];
    } finally {
      setLoading((p) => ({ ...p, restaurants: false }));
    }
  };

  const fetchRestaurantTypes = async () => {
    setLoading((p) => ({ ...p, types: true }));
    setError((p) => ({ ...p, types: "" }));
    try {
      const res = await API.get(ENDPOINTS.restaurantTypes);
      const list = Array.isArray(res.data) ? res.data : [];
      setRestaurantTypes(["all", ...list]);
      return list;
    } catch (err) {
      const msg = err?.response?.data?.detail || "فشل تحميل أنواع المطاعم";
      setError((p) => ({ ...p, types: msg }));
      setRestaurantTypes(["all"]);
      return [];
    } finally {
      setLoading((p) => ({ ...p, types: false }));
    }
  };

  const fetchRestaurantDetail = async (id) => {
    setLoading((p) => ({ ...p, restaurantDetail: true }));
    setError((p) => ({ ...p, restaurantDetail: "" }));
    try {
      const res = await API.get(ENDPOINTS.restaurantDetail(id));
      setSelectedRestaurant(res.data);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.detail || "فشل تحميل تفاصيل المطعم";
      setError((p) => ({ ...p, restaurantDetail: msg }));
      return null;
    } finally {
      setLoading((p) => ({ ...p, restaurantDetail: false }));
    }
  };

  const fetchMyBookings = async () => {
    if (!token) {
      setMyBookings([]);
      return [];
    }

    setLoading((p) => ({ ...p, bookings: true }));
    setError((p) => ({ ...p, bookings: "" }));

    try {
      const res = await API.get(ENDPOINTS.myReservations);
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setMyBookings(list);
      return list;
    } catch (err) {
      const msg = err?.response?.data?.detail || "فشل تحميل حجوزاتك";
      setError((p) => ({ ...p, bookings: msg }));
      return [];
    } finally {
      setLoading((p) => ({ ...p, bookings: false }));
    }
  };

  const fetchMyOrders = async () => {
    if (!token) {
      setMyOrders([]);
      return [];
    }

    setLoading((p) => ({ ...p, fetchOrders: true }));
    setError((p) => ({ ...p, order: "" }));

    try {
      const res = await API.get(ENDPOINTS.myOrders);
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setMyOrders(list);
      return list;
    } catch (err) {
      const msg = err?.response?.data?.detail || "فشل تحميل طلباتك";
      setError((p) => ({ ...p, order: msg }));
      return [];
    } finally {
      setLoading((p) => ({ ...p, fetchOrders: false }));
    }
  };

  const fetchRecommendations = async () => {
    if (!token) {
      setRecommendations([]);
      return [];
    }

    setLoading((p) => ({ ...p, recommendations: true }));
    setError((p) => ({ ...p, recommendations: "" }));

    try {
      const res = await getRecommendations({ limit: 6 });
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRecommendations(list);
      return list;
    } catch (err) {
      const msg = err?.response?.data?.detail || "فشل تحميل التوصيات";
      setError((p) => ({ ...p, recommendations: msg }));
      setRecommendations([]);
      return [];
    } finally {
      setLoading((p) => ({ ...p, recommendations: false }));
    }
  };

  const refreshAll = async () => {
    await Promise.allSettled([
      fetchRestaurants(),
      fetchRestaurantTypes(),
      fetchMyBookings(),
      fetchMyOrders(),
      fetchRecommendations(),
    ]);
    fetchNotifications();
  };

  const filteredRestaurants = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return restaurants.filter((r) => {
      const matchesSearch = !text || String(r.name || "").toLowerCase().includes(text);
      const matchesType = selectedType === "all" || String(r.type || "") === selectedType;
      return matchesSearch && matchesType;
    });
  }, [restaurants, searchText, selectedType]);

  const selectedBooking = useMemo(
    () => myBookings.find((b) => String(b.id) === String(selectedBookingId)) || null,
    [myBookings, selectedBookingId]
  );

  const selectedRestaurantTables = useMemo(() => makeTableMap(selectedRestaurant), [selectedRestaurant]);

  useEffect(() => {
    if (!selectedBookingId) {
      setLastOrder(null);
      return;
    }
    const found = getOrderForReservation(selectedBookingId, myOrders);
    setLastOrder(found);
  }, [selectedBookingId, myOrders]);

  useEffect(() => {
    setSelectedTable(null);
  }, [selectedRestaurant?.id]);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const canEditBooking = (booking) => String(booking?.status || "pending").toLowerCase() === "pending";
  const canOrder = (booking) => String(booking?.status || "").toLowerCase() === "accepted";
  const canPayOrder = (o) => {
    const s = String(o?.status || "").toLowerCase();
    return !!o?.id && (s === "accepted" || s === "approved" || s === "confirmed");
  };

  const startBooking = (restaurantObj, table = null) => {
    if (!token) return;

    if (table && table.status !== "available") {
      pushToast("warning", "الطاولة غير متاحة", "اختر طاولة متاحة فقط.");
      return;
    }

    setSelectedRestaurant(restaurantObj);
    setSelectedTable(table);
    setBookingForm({
      date: "",
      time: "",
      number_of_people: 2,
    });
    setShowBookingModal(true);
  };

  const openRestaurant = async (id, nextPage = "home") => {
    setSelectedTable(null);
    await fetchRestaurantDetail(id);
    setActivePage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openTableDetails = (table) => {
    setSelectedTable(table);
    setShowTableModal(true);
  };

  const createBooking = async () => {
    if (!token) return;
    if (!selectedRestaurant?.id) return;
    if (!bookingForm.date || !bookingForm.time) return;

    if (selectedTable && selectedTable.status !== "available") {
      const msg = "هذه الطاولة محجوزة حاليًا، اختر طاولة أخرى.";
      setError((p) => ({ ...p, createBooking: msg }));
      pushToast("warning", "الطاولة غير متاحة", msg);
      return;
    }

    setLoading((p) => ({ ...p, createBooking: true }));
    setError((p) => ({ ...p, createBooking: "" }));

    try {
      const payload = {
        restaurant: selectedRestaurant.id,
        date: bookingForm.date,
        time: bookingForm.time,
        number_of_people: Number(bookingForm.number_of_people || 1),
      };

      await API.post(ENDPOINTS.createReservation, payload);

      setShowBookingModal(false);
      setSelectedTable(null);

      await fetchMyBookings();
      await fetchNotifications();
      setActivePage("bookings");

      pushToast("success", "تم الحجز", "تم إنشاء الحجز بنجاح.");
    } catch (err) {
      const data = err?.response?.data;
      const firstKey = data && typeof data === "object" ? Object.keys(data)[0] : null;
      const msg =
        (firstKey && (Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey])) ||
        data?.detail ||
        "فشل إنشاء الحجز";
      setError((p) => ({ ...p, createBooking: msg }));
      pushToast("danger", "فشل الحجز", msg);
    } finally {
      setLoading((p) => ({ ...p, createBooking: false }));
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!token) return;

    const ok = window.confirm("هل أنت متأكد من إلغاء الحجز؟");
    if (!ok) return;

    try {
      await API.patch(ENDPOINTS.reservationUpdateCancel(bookingId), { cancel: true });
      setSelectedBookingId(null);
      await fetchMyBookings();
      await fetchNotifications();
      pushToast("success", "تم الإلغاء", "تم إلغاء الحجز بنجاح.");
    } catch (err) {
      pushToast("danger", "فشل الإلغاء", err?.response?.data?.detail || "لم يتم إلغاء الحجز");
    }
  };

  const openEditBooking = (booking) => {
    if (!booking) return;

    const status = String(booking.status || "pending").toLowerCase();
    if (status !== "pending") return;

    setSelectedBookingId(booking.id);
    setError((p) => ({ ...p, updateBooking: "" }));
    setEditForm({
      date: booking.date || "",
      time: booking.time || "",
      number_of_people: Number(booking.number_of_people || 1),
    });
    setShowEditModal(true);
  };

  const submitEditBooking = async () => {
    if (!token) return;
    if (!selectedBooking?.id) return;
    if (!editForm.date || !editForm.time) return;

    setLoading((p) => ({ ...p, updateBooking: true }));
    setError((p) => ({ ...p, updateBooking: "" }));

    try {
      const payload = {
        date: editForm.date,
        time: editForm.time,
        number_of_people: Number(editForm.number_of_people || 1),
      };

      await API.patch(ENDPOINTS.reservationUpdateCancel(selectedBooking.id), payload);

      setShowEditModal(false);
      await fetchMyBookings();
      await fetchNotifications();
      pushToast("success", "تم التعديل", "تم تعديل الحجز بنجاح.");
    } catch (err) {
      const msg = err?.response?.data?.detail || "فشل تعديل الحجز";
      setError((p) => ({ ...p, updateBooking: msg }));
      pushToast("danger", "فشل التعديل", msg);
    } finally {
      setLoading((p) => ({ ...p, updateBooking: false }));
    }
  };

  const resolveRestaurantIdFromBooking = async (booking) => {
    const direct =
      booking?.restaurant_id ??
      booking?.restaurantId ??
      booking?.restaurant?.id ??
      booking?.restaurant;

    if (isNumericLike(direct)) return Number(direct);

    const bookingName =
      booking?.restaurant_name ??
      booking?.restaurant?.name ??
      (typeof booking?.restaurant === "string" ? booking.restaurant : null);

    if (!bookingName) return null;

    let list = restaurants;
    if (!Array.isArray(list) || list.length === 0) {
      list = await fetchRestaurants();
    }

    const n1 = normalizeText(bookingName);
    const match = (list || []).find((r) => normalizeText(r?.name) === n1);
    if (match?.id) return Number(match.id);

    const match2 = (list || []).find((r) => normalizeText(r?.name).includes(n1));
    if (match2?.id) return Number(match2.id);

    return null;
  };

  const openOrder = async (booking) => {
    if (!token || !booking) return;
    if (!canOrder(booking)) return;

    setError((p) => ({ ...p, order: "" }));
    setOrderForBooking(booking);
    setCart({});
    setOrderRestaurant(null);

    setLoading((p) => ({ ...p, restaurantDetail: true }));
    try {
      const restaurantId = await resolveRestaurantIdFromBooking(booking);
      if (!restaurantId) {
        pushToast("danger", "خطأ", "تعذر تحديد المطعم لهذا الحجز.");
        return;
      }

      const [rr, ordersList] = await Promise.all([
        API.get(ENDPOINTS.restaurantDetail(restaurantId)),
        fetchMyOrders(),
      ]);

      setOrderRestaurant(rr.data);
      const existing = getOrderForReservation(booking.id, ordersList);
      setLastOrder(existing || null);
      setShowOrderModal(true);
    } catch (err) {
      pushToast("danger", "فشل", err?.response?.data?.detail || "فشل تحميل بيانات الطلب");
    } finally {
      setLoading((p) => ({ ...p, restaurantDetail: false }));
    }
  };

  const incCart = (menuItemId) => {
    setCart((p) => ({ ...p, [menuItemId]: (p[menuItemId] || 0) + 1 }));
  };

  const decCart = (menuItemId) => {
    setCart((p) => {
      const next = { ...p };
      const cur = next[menuItemId] || 0;
      if (cur <= 1) delete next[menuItemId];
      else next[menuItemId] = cur - 1;
      return next;
    });
  };

  const clearCart = () => setCart({});

  const cartItems = useMemo(() => {
    const menu = orderRestaurant?.menu_items || [];
    const ids = Object.keys(cart);
    return ids
      .map((idStr) => {
        const id = Number(idStr);
        const item = menu.find((m) => Number(m.id) === id);
        if (!item) return null;
        return { item, qty: cart[idStr] };
      })
      .filter(Boolean);
  }, [cart, orderRestaurant]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, row) => {
      const price = Number(row.item?.price || 0);
      return sum + price * Number(row.qty || 0);
    }, 0);
  }, [cartItems]);

  const submitOrder = async () => {
    if (!token) return;
    if (!orderForBooking?.id) return;
    if (cartItems.length === 0) return;

    setLoading((p) => ({ ...p, createOrder: true }));
    setError((p) => ({ ...p, order: "" }));

    const payload = {
      reservation_id: orderForBooking.id,
      items: cartItems.map((r) => ({
        menu_item: r.item.id,
        quantity: Number(r.qty || 1),
      })),
    };

    try {
      await API.post(ENDPOINTS.createOrder, payload);

      clearCart();
      const updatedOrders = await fetchMyOrders();
      const created = getOrderForReservation(orderForBooking.id, updatedOrders);
      setLastOrder(created || null);

      await fetchNotifications();
      pushToast("success", "تم إنشاء الطلب", "تم إرسال الطلب بنجاح.");
    } catch (err) {
      const data = err?.response?.data;
      const firstKey = data && typeof data === "object" ? Object.keys(data)[0] : null;
      const msg =
        (firstKey && (Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey])) ||
        data?.detail ||
        "فشل إنشاء الطلب";
      setError((p) => ({ ...p, order: msg }));
      pushToast("danger", "فشل الطلب", msg);
    } finally {
      setLoading((p) => ({ ...p, createOrder: false }));
    }
  };

  const openPayment = () => {
    if (!token) return;
    if (!lastOrder?.id) return;
    if (!canPayOrder(lastOrder)) return;

    setError((p) => ({ ...p, payment: "" }));
    setPaymentForm({ method: "card", card_number: "" });
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!token || !lastOrder?.id) return;

    setLoading((p) => ({ ...p, payOrder: true }));
    setError((p) => ({ ...p, payment: "" }));

    try {
      const body =
        paymentForm.method === "card"
          ? { method: "card", card_number: String(paymentForm.card_number || "").trim() }
          : { method: "cash_at_restaurant" };

      await API.post(ENDPOINTS.payOrder(lastOrder.id), body);

      setShowPaymentModal(false);
      await fetchMyOrders();
      await fetchNotifications();
      pushToast("success", "تم الدفع", "تمت عملية الدفع بنجاح.");
    } catch (err) {
      const msg = err?.response?.data?.detail || "فشل الدفع";
      setError((p) => ({ ...p, payment: msg }));
      pushToast("danger", "فشل الدفع", msg);
    } finally {
      setLoading((p) => ({ ...p, payOrder: false }));
    }
  };

  const tableMap = selectedRestaurant ? selectedRestaurantTables : [];

  const sendChat = async () => {
    const message = String(chatInput || "").trim();
    if (!message) return;

    setChatMessages((prev) => [...prev, { role: "user", text: message }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await sendChatMessage(message);
      const answer = res?.data?.answer || res?.data?.response || res?.data?.message || "تم.";
      setChatMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err) {
      const msg = err?.response?.data?.detail || "تعذر الوصول إلى المساعد الذكي الآن.";
      setChatMessages((prev) => [...prev, { role: "assistant", text: msg }]);
      pushToast("danger", "Chatbot", msg);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-rose-600">Smart Restaurant System</div>
            <div className="truncate text-xs text-slate-500">حجز • طلب • توصيات ذكية • Chat</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NavPill active={activePage === "home"} onClick={() => setActivePage("home")}>
              الرئيسية
            </NavPill>

            <NavPill active={activePage === "tables"} onClick={() => setActivePage("tables")}>
              الطاولات
            </NavPill>

            <NavPill active={activePage === "bookings"} onClick={() => setActivePage("bookings")}>
              حجوزاتي
              <span className="ml-2 rounded-full bg-white px-2 py-[2px] text-xs font-extrabold text-slate-700">
                {myBookings.length}
              </span>
            </NavPill>

            <NavPill
              active={activePage === "notifications"}
              onClick={() => {
                fetchNotifications();
                setActivePage("notifications");
              }}
            >
              الإشعارات
              <span className="ml-2 rounded-full bg-white px-2 py-[2px] text-xs font-extrabold text-slate-700">
                {notifications.length}
              </span>
            </NavPill>

            <button
              onClick={() => setShowChat(true)}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 font-extrabold text-rose-700 transition hover:bg-rose-100"
            >
              المساعد
            </button>

            <button
              onClick={refreshAll}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-extrabold transition hover:bg-slate-100"
            >
              تحديث
            </button>

            <button
              onClick={onLogout}
              className="rounded-2xl bg-rose-600 px-4 py-2.5 font-extrabold text-white transition hover:bg-rose-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {selectedRestaurant && (
          <Card className="mb-6 p-5">
            <div className="flex flex-col gap-5 lg:flex-row">
              <div className="lg:w-[42%]">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  <img
                    src={
                      selectedRestaurant.image
                        ? absoluteMedia(selectedRestaurant.image)
                        : "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop"
                    }
                    alt={selectedRestaurant.name}
                    className="h-64 w-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-3xl font-extrabold text-slate-900">{selectedRestaurant.name}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {selectedRestaurant.type ? `نوع المطعم: ${selectedRestaurant.type}` : "—"}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRestaurant(null)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-extrabold transition hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <MiniStat title="العنوان" value={selectedRestaurant.address || "—"} />
                  <MiniStat title="الهاتف" value={selectedRestaurant.phone || "—"} />
                  <MiniStat title="عدد عناصر المنيو" value={`${(selectedRestaurant.menu_items || []).length}`} />
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-sm font-extrabold text-slate-900">Menu</div>
                  {(selectedRestaurant.menu_items || []).length === 0 ? (
                    <div className="text-sm text-slate-500">لا يوجد منيو حالياً</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {selectedRestaurant.menu_items.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                        >
                          <div className="h-12 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            {m.image ? (
                              <img
                                src={absoluteMedia(m.image)}
                                alt={m.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs text-slate-400">
                                —
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-extrabold">{m.name}</div>
                            <div className="text-xs text-slate-500">
                              {m.type} • ${m.price}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => startBooking(selectedRestaurant)}
                    className="rounded-2xl bg-rose-600 px-4 py-3 font-extrabold text-white transition hover:bg-rose-700"
                    disabled={!token}
                  >
                    احجز الآن
                  </button>

                  <button
                    onClick={() => setActivePage("tables")}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-extrabold transition hover:bg-slate-100"
                  >
                    عرض الطاولات
                  </button>

                  <button
                    onClick={() => setShowChat(true)}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-extrabold text-rose-700 transition hover:bg-rose-100"
                  >
                    اسأل المساعد
                  </button>
                </div>

                {loading.restaurantDetail && (
                  <div className="mt-4 text-sm text-slate-500">جاري تحميل التفاصيل...</div>
                )}
                {error.restaurantDetail && (
                  <div className="mt-4 text-sm font-extrabold text-rose-600">{error.restaurantDetail}</div>
                )}
              </div>
            </div>
          </Card>
        )}

        {activePage === "home" && (
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900">مرحبًا بك 👋</div>
                  <div className="mt-1 text-sm text-slate-500">
                    تصفح المطاعم، شاهد التوصيات الذكية، وابدأ الحجز مباشرة.
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActivePage("tables")}
                    className="rounded-2xl bg-slate-900 px-4 py-3 font-extrabold text-white transition hover:bg-slate-800"
                  >
                    استعرض الطاولات
                  </button>
                  <button
                    onClick={() => setShowChat(true)}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-extrabold text-rose-700 transition hover:bg-rose-100"
                  >
                    افتح Chat
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                <MiniStat title="المطاعم" value={`${restaurants.length}`} />
                <MiniStat title="الحجوزات" value={`${myBookings.length}`} />
                <MiniStat title="الطلبات" value={`${myOrders.length}`} />
                <MiniStat title="التوصيات" value={`${recommendations.length}`} />
              </div>
            </Card>

            <Card className="p-5">
              <SectionHeader
                title="اقتراحات ذكية"
                subtitle="توصيات مبنية على الطلبات السابقة والتشابه بين الوجبات"
                action={
                  <button
                    onClick={fetchRecommendations}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-extrabold transition hover:bg-slate-100"
                  >
                    تحديث التوصيات
                  </button>
                }
              />

              {error.recommendations && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  {error.recommendations}
                </div>
              )}

              <div className="mt-5">
                {loading.recommendations ? (
                  <div className="text-sm text-slate-500">جاري تحميل التوصيات...</div>
                ) : recommendations.length === 0 ? (
                  <div className="text-sm text-slate-500">لا توجد توصيات حالياً.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {recommendations.map((item) => (
                      <RecommendationCard
                        key={item.id}
                        item={item}
                        onOpenRestaurant={(restaurantId) => {
                          if (restaurantId) openRestaurant(restaurantId, "home");
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <SectionHeader
                title="استكشاف المطاعم"
                subtitle="ابحث، فلتر، وافتح تفاصيل أي مطعم"
                action={<div className="text-sm text-slate-500">النتائج: {filteredRestaurants.length}</div>}
              />

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="relative md:col-span-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600">
                    <SearchIcon />
                  </span>
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="ابحث باسم المطعم..."
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3 outline-none transition focus:ring-4 focus:ring-rose-100"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600">
                    <FilterIcon />
                  </span>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3 outline-none transition focus:ring-4 focus:ring-rose-100"
                  >
                    {restaurantTypes.map((t) => (
                      <option key={t} value={t}>
                        {t === "all" ? "كل الأنواع" : t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading.restaurants ? (
                  <div className="text-sm text-slate-500">جاري تحميل المطاعم...</div>
                ) : filteredRestaurants.length === 0 ? (
                  <div className="text-sm text-slate-500">لا يوجد مطاعم</div>
                ) : (
                  filteredRestaurants.map((r) => (
                    <RestaurantCard
                      key={r.id}
                      restaurant={r}
                      selected={String(selectedRestaurant?.id) === String(r.id)}
                      onClick={() => openRestaurant(r.id, "home")}
                      buttonLabel="عرض التفاصيل"
                    />
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {activePage === "tables" && (
          <div className="space-y-6">
            <Card className="p-5">
              <SectionHeader
                title="الحجز البصري للطاولات"
                subtitle="اختر مطعمًا ثم اضغط على الطاولة لمشاهدة حالتها والحجز مباشرة"
                action={
                  <button
                    onClick={() => setActivePage("home")}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-extrabold transition hover:bg-slate-100"
                  >
                    رجوع
                  </button>
                }
              />

              {!selectedRestaurant ? (
                <div className="mt-5">
                  <div className="mb-3 text-sm font-bold text-slate-700">
                    اختر مطعمًا لعرض مخطط الطاولات:
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {restaurants.length === 0 ? (
                      <div className="text-sm text-slate-500">لا يوجد مطاعم لعرضها.</div>
                    ) : (
                      restaurants.slice(0, 9).map((r) => (
                        <RestaurantCard
                          key={r.id}
                          restaurant={r}
                          compact
                          onClick={() => openRestaurant(r.id, "tables")}
                          buttonLabel="عرض الطاولات"
                        />
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xl font-extrabold text-slate-900">{selectedRestaurant.name}</div>
                          <div className="text-sm text-slate-500">
                            {selectedRestaurant.type || "—"} • {selectedRestaurant.address || "—"}
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedRestaurant(null)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-extrabold transition hover:bg-slate-100"
                        >
                          تغيير المطعم
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <MiniStat title="الهاتف" value={selectedRestaurant.phone || "—"} />
                        <MiniStat title="الطاولات" value={`${tableMap.length}`} />
                        <MiniStat
                          title="المتاحة"
                          value={`${tableMap.filter((t) => t.status === "available").length}`}
                        />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-900 p-4 text-white">
                      <div className="text-lg font-extrabold">طريقة الاستخدام</div>
                      <div className="mt-2 text-sm text-slate-300">
                        اضغط على أي طاولة لمشاهدة تفاصيلها. إذا كانت متاحة تستطيع فتح نافذة الحجز مباشرة.
                      </div>
                      <button
                        onClick={() => setShowChat(true)}
                        className="mt-4 rounded-2xl bg-white px-4 py-3 font-extrabold text-slate-900 transition hover:bg-slate-100"
                      >
                        اسأل المساعد عن الحجز
                      </button>
                    </div>
                  </div>

                  <FloorPlanView
                    tables={tableMap}
                    selectedId={selectedTable?.id}
                    onSelect={(table) => openTableDetails(table)}
                    restaurantName={selectedRestaurant.name}
                  />
                </div>
              )}
            </Card>
          </div>
        )}

        {activePage === "notifications" && (
          <div className="space-y-6">
            <Card className="p-5">
              <SectionHeader
                title="الإشعارات"
                subtitle="جميع الإشعارات الخاصة بك"
                action={
                  <button
                    onClick={fetchNotifications}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-extrabold transition hover:bg-slate-100"
                  >
                    تحديث
                  </button>
                }
              />

              <div className="mt-5 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-slate-500">لا يوجد إشعارات حالياً.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="font-extrabold text-slate-900">
                        {n.title || "إشعار"}
                      </div>

                      <div className="mt-2 text-sm text-slate-600">
                        {n.message}
                      </div>

                      {n.created_at && (
                        <div className="mt-3 text-xs text-slate-400">
                          {n.created_at}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {activePage === "bookings" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <SectionHeader
                title="حجوزاتي"
                subtitle="عرض وإدارة الحجوزات الحالية"
                action={
                  <button
                    onClick={() => {
                      setActivePage("home");
                      setSelectedBookingId(null);
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-extrabold transition hover:bg-slate-100"
                  >
                    رجوع
                  </button>
                }
              />

              <div className="mt-5 space-y-3">
                {loading.bookings ? (
                  <div className="text-sm text-slate-500">جاري تحميل الحجوزات...</div>
                ) : myBookings.length === 0 ? (
                  <div className="text-slate-500">لا يوجد حجوزات حالياً.</div>
                ) : (
                  myBookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBookingId(b.id)}
                      className={`w-full rounded-3xl border p-4 text-left transition hover:bg-slate-50 ${
                        String(selectedBookingId) === String(b.id)
                          ? "border-rose-200 bg-rose-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-extrabold text-slate-900">{b.restaurant_name || "Restaurant"}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {b.date} • {b.time} • {b.number_of_people} أشخاص
                          </div>
                        </div>

                        <div className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusClass(b.status)}`}>
                          {(b.status || "pending").toUpperCase()}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <SectionHeader title="تفاصيل الحجز" subtitle="اختر حجزًا من القائمة لعرض التفاصيل" />
              {!selectedBooking ? (
                <div className="mt-6 text-slate-500">لا يوجد حجز محدد.</div>
              ) : (
                <div className="mt-5 space-y-4">
                  <InfoRow label="Booking ID" value={String(selectedBooking.id)} />
                  <InfoRow label="Restaurant" value={selectedBooking.restaurant_name || "—"} />
                  <InfoRow label="Date" value={selectedBooking.date || "—"} />
                  <InfoRow label="Time" value={selectedBooking.time || "—"} />
                  <InfoRow label="People" value={`${selectedBooking.number_of_people || 0}`} />
                  <InfoRow label="Created" value={selectedBooking.created_at || "—"} />

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-slate-500">Status</div>
                      <div className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusClass(selectedBooking.status)}`}>
                        {(selectedBooking.status || "pending").toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-1">
                    {canEditBooking(selectedBooking) && (
                      <button
                        onClick={() => openEditBooking(selectedBooking)}
                        className="rounded-2xl border border-slate-200 bg-white py-3 font-extrabold transition hover:bg-slate-100"
                      >
                        تعديل الحجز
                      </button>
                    )}

                    <button
                      onClick={() => cancelBooking(selectedBooking.id)}
                      className="rounded-2xl bg-slate-900 py-3 font-extrabold text-white transition hover:bg-slate-800"
                    >
                      إلغاء الحجز
                    </button>

                    {canOrder(selectedBooking) && (
                      <>
                        <button
                          onClick={() => openOrder(selectedBooking)}
                          className="rounded-2xl bg-rose-600 py-3 font-extrabold text-white transition hover:bg-rose-700"
                        >
                          طلب طعام
                        </button>

                        <button
                          onClick={openPayment}
                          className="rounded-2xl border border-slate-200 bg-white py-3 font-extrabold transition hover:bg-slate-100 disabled:opacity-60"
                          disabled={!canPayOrder(lastOrder)}
                          title={!canPayOrder(lastOrder) ? "بانتظار موافقة المطعم على الطلب" : "الدفع"}
                        >
                          الدفع {lastOrder?.id ? `(#${lastOrder.id})` : ""}
                        </button>

                        {lastOrder?.id && !canPayOrder(lastOrder) && (
                          <div className="text-xs text-slate-500">
                            حالة الطلب: {String(lastOrder.status || "").toUpperCase()} — بانتظار موافقة المطعم
                          </div>
                        )}
                      </>
                    )}

                    {!canOrder(selectedBooking) && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                        يمكن طلب الطعام فقط بعد قبول الحجز من المطعم.
                      </div>
                    )}

                    {error.order && <div className="text-sm font-extrabold text-rose-600">{error.order}</div>}
                    {error.payment && <div className="text-sm font-extrabold text-rose-600">{error.payment}</div>}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>

      {showBookingModal && selectedRestaurant && (
        <Modal title={`حجز في ${selectedRestaurant.name}`} onClose={() => setShowBookingModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createBooking();
            }}
            className="space-y-4"
          >
            {selectedTable && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-extrabold text-slate-900">الطاولة المختارة</div>
                <div className="mt-1">
                  #{selectedTable.number} • {selectedTable.seats} مقاعد • {selectedTable.zone} •{" "}
                  {selectedTable.status === "available" ? "متاحة" : "محجوزة"}
                </div>
              </div>
            )}

            {error.createBooking && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700 font-extrabold">
                {error.createBooking}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="التاريخ"
                type="date"
                value={bookingForm.date}
                onChange={(v) => setBookingForm((p) => ({ ...p, date: v }))}
              />
              <Field
                label="الوقت"
                type="time"
                value={bookingForm.time}
                onChange={(v) => setBookingForm((p) => ({ ...p, time: v }))}
              />
            </div>

            <Field
              label="عدد الأشخاص"
              type="number"
              value={String(bookingForm.number_of_people)}
              onChange={(v) => setBookingForm((p) => ({ ...p, number_of_people: v }))}
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="rounded-2xl border border-slate-200 bg-white py-3 font-extrabold transition hover:bg-slate-100"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading.createBooking}
                className="rounded-2xl bg-rose-600 py-3 font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {loading.createBooking ? "جاري الإرسال..." : "تأكيد الحجز"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEditModal && selectedBooking && (
        <Modal title={`تعديل حجز #${selectedBooking.id}`} onClose={() => setShowEditModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitEditBooking();
            }}
            className="space-y-4"
          >
            {error.updateBooking && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700 font-extrabold">
                {error.updateBooking}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="التاريخ"
                type="date"
                value={editForm.date}
                onChange={(v) => setEditForm((p) => ({ ...p, date: v }))}
              />
              <Field
                label="الوقت"
                type="time"
                value={editForm.time}
                onChange={(v) => setEditForm((p) => ({ ...p, time: v }))}
              />
            </div>

            <Field
              label="عدد الأشخاص"
              type="number"
              value={String(editForm.number_of_people)}
              onChange={(v) => setEditForm((p) => ({ ...p, number_of_people: v }))}
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-2xl border border-slate-200 bg-white py-3 font-extrabold transition hover:bg-slate-100"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading.updateBooking}
                className="rounded-2xl bg-slate-900 py-3 font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading.updateBooking ? "جاري الحفظ..." : "حفظ التعديل"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showTableModal && selectedTable && (
        <Modal title={`تفاصيل الطاولة #${selectedTable.number}`} onClose={() => setShowTableModal(false)}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">الحالة</div>
              <div className="mt-1 text-lg font-extrabold">
                {selectedTable.status === "available" ? "متاحة" : "محجوزة"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MiniStat title="المقاعد" value={`${selectedTable.seats}`} />
              <MiniStat title="المنطقة" value={selectedTable.zone} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              هذه الواجهة بصرية حاليًا، وتسمح لك بالحجز مباشرة إذا كانت الطاولة متاحة.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="rounded-2xl border border-slate-200 bg-white py-3 font-extrabold transition hover:bg-slate-100"
              >
                إغلاق
              </button>

              <button
                type="button"
                disabled={selectedTable.status !== "available"}
                onClick={() => {
                  setShowTableModal(false);
                  startBooking(selectedRestaurant, selectedTable);
                }}
                className="rounded-2xl bg-rose-600 py-3 font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                احجز هذه الطاولة
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showOrderModal && orderRestaurant && orderForBooking && (
        <Modal
          title={`طلب طعام — ${orderRestaurant.name} (حجز #${orderForBooking.id})`}
          onClose={() => setShowOrderModal(false)}
        >
          <div className="space-y-4">
            {error.order && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700 font-extrabold">
                {error.order}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(orderRestaurant.menu_items || []).map((m) => {
                const qty = cart[String(m.id)] || 0;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        {m.image ? (
                          <img src={absoluteMedia(m.image)} alt={m.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs text-slate-400">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-extrabold">{m.name}</div>
                        <div className="truncate text-xs text-slate-500">
                          {m.type} • ${m.price}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decCart(m.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-extrabold transition hover:bg-slate-100"
                      >
                        −
                      </button>
                      <div className="w-10 text-center font-extrabold">{qty}</div>
                      <button
                        onClick={() => incCart(m.id)}
                        className="rounded-xl bg-rose-600 px-3 py-2 font-extrabold text-white transition hover:bg-rose-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-slate-900">السلة</div>
                <div className="text-sm text-slate-500">
                  الإجمالي:{" "}
                  <span className="font-extrabold text-slate-900">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {cartItems.length === 0 ? (
                <div className="mt-2 text-sm text-slate-500">السلة فارغة</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {cartItems.map(({ item, qty }) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <div className="font-extrabold">
                        {item.name} <span className="text-slate-500">x{qty}</span>
                      </div>
                      <div className="text-sm font-extrabold">
                        ${(Number(item.price || 0) * Number(qty || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-2xl border border-slate-200 bg-white py-3 font-extrabold transition hover:bg-slate-100"
                >
                  تفريغ السلة
                </button>

                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={loading.createOrder || !!getOrderForReservation(orderForBooking.id, myOrders)}
                  className="rounded-2xl bg-rose-600 py-3 font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60"
                  title={getOrderForReservation(orderForBooking.id, myOrders) ? "يوجد طلب مسبق لهذا الحجز" : ""}
                >
                  {loading.createOrder ? "جاري الإرسال..." : getOrderForReservation(orderForBooking.id, myOrders) ? "تم إنشاء الطلب مسبقًا" : "إرسال الطلب"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="rounded-2xl border border-slate-200 bg-white py-3 font-extrabold transition hover:bg-slate-100"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={openPayment}
                disabled={!canPayOrder(lastOrder)}
                className="rounded-2xl bg-slate-900 py-3 font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                الدفع
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showPaymentModal && (
        <Modal title="الدفع" onClose={() => setShowPaymentModal(false)}>
          <div className="space-y-4">
            {error.payment && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 font-extrabold text-rose-700">
                {error.payment}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-extrabold text-slate-900">تفاصيل الدفع</div>
              <div className="mt-2 text-sm text-slate-500">
                {lastOrder?.id ? (
                  <>
                    Order ID:{" "}
                    <span className="font-extrabold text-slate-900">
                      #{lastOrder.id}
                    </span>
                  </>
                ) : (
                  "لا يوجد Order جاهز للدفع."
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="text-sm font-extrabold text-slate-800">
                طريقة الدفع
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-600">
                    Method
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:ring-4 focus:ring-rose-100"
                  >
                    <option value="card">Card</option>
                    <option value="cash_at_restaurant">Cash at restaurant</option>
                  </select>
                </div>

                {paymentForm.method === "card" && (
                  <Field
                    label="Card Number (12+ digits)"
                    value={paymentForm.card_number}
                    onChange={(v) => setPaymentForm((p) => ({ ...p, card_number: v }))}
                    type="text"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="rounded-2xl border border-slate-200 bg-white py-3 font-extrabold transition hover:bg-slate-100"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={submitPayment}
                disabled={
                  loading.payOrder ||
                  !lastOrder?.id ||
                  (paymentForm.method === "card" &&
                    (!String(paymentForm.card_number || "").trim() ||
                      !/^\d{12,}$/.test(String(paymentForm.card_number || "").trim())))
                }
                className="rounded-2xl bg-rose-600 py-3 font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {loading.payOrder ? "جاري الدفع..." : "إتمام الدفع"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ChatWidget
        open={showChat}
        onOpen={() => setShowChat(true)}
        onClose={() => setShowChat(false)}
        messages={chatMessages}
        input={chatInput}
        setInput={setChatInput}
        loading={chatLoading}
        onSend={sendChat}
      />

      <div className="fixed right-4 top-20 z-[60] w-[92%] max-w-sm space-y-3">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            toast={t}
            onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================
   Small Components
========================= */

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
      <div>
        <div className="text-2xl font-extrabold text-slate-900">{title}</div>
        {subtitle && <div className="mt-1 text-sm text-slate-500">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function NavPill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-2.5 font-extrabold transition ${
        active
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function MiniStat({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold text-slate-500">{title}</div>
      <div className="mt-1 truncate font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="max-w-[70%] text-right font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-600">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:ring-4 focus:ring-rose-100"
      />
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div className="text-xl font-extrabold text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-extrabold transition hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  const tone = (() => {
    if (toast.type === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
    if (toast.type === "danger") return "border-rose-200 bg-rose-50 text-rose-900";
    if (toast.type === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
    return "border-slate-200 bg-white text-slate-800";
  })();

  return (
    <div className={`rounded-3xl border p-4 shadow-xl ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-extrabold">{toast.title}</div>
          <div className="mt-1 text-sm opacity-85">{toast.message}</div>
        </div>

        <button
          onClick={onClose}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 font-extrabold transition hover:bg-slate-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RestaurantCard({ restaurant, onClick, compact = false, selected = false, buttonLabel = "عرض التفاصيل" }) {
  const image = restaurant.image
    ? absoluteMedia(restaurant.image)
    : "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=1200&auto=format&fit=crop";

  return (
    <button
      onClick={onClick}
      className={`overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition hover:shadow-md ${
        selected ? "border-rose-200 ring-2 ring-rose-100" : "border-slate-200"
      }`}
    >
      <div className={compact ? "h-36 w-full overflow-hidden" : "h-44 w-full overflow-hidden"}>
        <img src={image} alt={restaurant.name} className="h-full w-full object-cover" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-extrabold text-slate-900">{restaurant.name}</div>
            <div className="mt-1 text-sm text-slate-500">
              {restaurant.type || "—"} {restaurant.address ? `• ${restaurant.address}` : ""}
            </div>
          </div>

          <span className="rounded-2xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white">
            {buttonLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

function RecommendationCard({ item, onOpenRestaurant }) {
  const restaurant = item.restaurant || {};
  const hasRestaurant = !!restaurant.id;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-extrabold text-slate-900">{item.name}</div>
          <div className="mt-1 text-sm text-slate-500">
            {restaurant.name || "—"} {restaurant.type ? `• ${restaurant.type}` : ""}
          </div>
        </div>

        <div className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700">
          {Number(item.score || 0).toFixed(2)}
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-600">
        النوع: <span className="font-bold text-slate-900">{item.type || "—"}</span>
      </div>
      <div className="mt-1 text-sm text-slate-600">
        السعر: <span className="font-bold text-slate-900">${item.price}</span>
      </div>

      <button
        disabled={!hasRestaurant}
        onClick={() => onOpenRestaurant && onOpenRestaurant(restaurant.id)}
        className="mt-4 w-full rounded-2xl bg-slate-900 py-3 font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        الذهاب للمطعم
      </button>
    </div>
  );
}

function TableCard({ table, onClick }) {
  const isAvailable = table.status === "available";
  const tone = isAvailable
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <button
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left transition hover:shadow-md ${tone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold">طاولة #{table.number}</div>
          <div className="mt-1 text-sm opacity-80">
            {table.seats} مقاعد • {table.zone}
          </div>
        </div>

        <span className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold shadow-sm">
          {isAvailable ? "متاحة" : "محجوزة"}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/50 bg-white/50 px-3 py-2 text-xs font-bold">
        اضغط لعرض التفاصيل
      </div>
    </button>
  );
}

function ChatWidget({ open, onOpen, onClose, messages, input, setInput, loading, onSend }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  return (
    <>
      {!open && (
        <button
          onClick={onOpen}
          className="fixed bottom-4 right-4 z-[70] rounded-full bg-rose-600 px-5 py-4 font-extrabold text-white shadow-2xl transition hover:bg-rose-700"
        >
          Chat
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-[70] w-[92vw] max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div>
              <div className="font-extrabold text-slate-900">المساعد الذكي</div>
              <div className="text-xs text-slate-500">أسئلة الحجز، الطلب، المطاعم</div>
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 font-extrabold transition hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[380px] space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((m, idx) => (
              <div
                key={`${idx}-${m.role}`}
                className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                  m.role === "user"
                    ? "ml-auto bg-slate-900 text-white"
                    : "mr-auto border border-slate-200 bg-white text-slate-800"
                }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading) onSend();
                  }
                }}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:ring-4 focus:ring-rose-100"
              />
              <button
                onClick={onSend}
                disabled={loading}
                className="rounded-2xl bg-rose-600 px-4 py-3 font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {loading ? "..." : "إرسال"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}