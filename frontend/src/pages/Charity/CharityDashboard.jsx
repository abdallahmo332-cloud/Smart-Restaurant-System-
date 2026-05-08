// src/pages/Charity/CharityDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import {
  FaStore,
  FaSearch,
  FaFilter,
  FaClock,
  FaUsers,
  FaCheckCircle,
  FaSignOutAlt,
  FaUtensils,
  FaHandHoldingHeart,
  FaClipboardList,
  FaSync,
} from "react-icons/fa";

function normalizeText(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function mediaUrl(path) {
  if (!path) return "";
  if (String(path).startsWith("http")) return path;
  return `http://localhost:8000${path}`;
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">
            {value}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  const color =
    toast.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div
      className={`fixed left-4 top-4 z-[9999] rounded-2xl border px-5 py-3 shadow-xl ${color}`}
    >
      <div className="flex items-start gap-4">
        <div>
          <div className="font-extrabold">{toast.title}</div>
          <div className="text-sm mt-1">{toast.message}</div>
        </div>

        <button onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

export default function CharityDashboard({ onLogout }) {
  const [offers, setOffers] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const [loading, setLoading] = useState({
    offers: false,
    claim: false,
    my: false,
  });

  const [error, setError] = useState("");

  const [toast, setToast] = useState(null);

  const pushToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchOffers = async () => {
    setLoading((p) => ({ ...p, offers: true }));
    setError("");

    try {
      const res = await API.get("charity/surplus-food/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setOffers(list);
    } catch (err) {
      setError(err?.response?.data?.detail || "فشل تحميل الطعام الفائض");
    } finally {
      setLoading((p) => ({ ...p, offers: false }));
    }
  };

  const fetchMyRequests = async () => {
    setLoading((p) => ({ ...p, my: true }));

    try {
      const res = await API.get("charity/surplus-food/my/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setMyRequests(list);
    } catch {
      //
    } finally {
      setLoading((p) => ({ ...p, my: false }));
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchOffers(), fetchMyRequests()]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const claimOffer = async (id) => {
    setLoading((p) => ({ ...p, claim: true }));

    try {
      await API.post(`charity/surplus-food/${id}/claim/`);
      pushToast("success", "تم الطلب", "تم حجز الطعام الفائض بنجاح");
      refreshAll();
    } catch (err) {
      pushToast(
        "error",
        "فشل الطلب",
        err?.response?.data?.detail || "تعذر تنفيذ العملية"
      );
    } finally {
      setLoading((p) => ({ ...p, claim: false }));
    }
  };

  const restaurantTypes = useMemo(() => {
    const types = offers.map((x) => x.restaurant_type).filter(Boolean);
    return ["all", ...Array.from(new Set(types))];
  }, [offers]);

  const filteredOffers = useMemo(() => {
    const txt = normalizeText(searchText);

    return offers.filter((item) => {
      const matchesSearch =
        !txt ||
        normalizeText(item.restaurant_name).includes(txt) ||
        normalizeText(item.title).includes(txt) ||
        normalizeText(item.description).includes(txt);

      const matchesType =
        selectedType === "all" || item.restaurant_type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [offers, searchText, selectedType]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mx-auto max-w-7xl">
        {/* Top */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              لوحة الجمعية الخيرية
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              استلام الطعام الفائض من المطاعم بشكل مباشر
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshAll}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                <FaSync />
                تحديث
              </span>
            </button>

            <button
              onClick={onLogout}
              className="rounded-2xl bg-slate-900 px-4 py-3 font-bold text-white hover:bg-slate-800"
            >
              <span className="inline-flex items-center gap-2">
                <FaSignOutAlt />
                خروج
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 font-bold">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Stat label="العروض المتاحة" value={offers.length} icon={<FaStore />} />
          <Stat
            label="نتائج البحث"
            value={filteredOffers.length}
            icon={<FaSearch />}
          />
          <Stat
            label="طلباتي"
            value={myRequests.length}
            icon={<FaClipboardList />}
          />
          <Stat
            label="تم الاستلام"
            value={myRequests.length}
            icon={<FaCheckCircle />}
          />
        </div>

        {/* Search */}
        <Card className="p-5 mb-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <FaSearch />
              </span>

              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="ابحث عن مطعم أو صنف..."
                className="w-full rounded-2xl border border-slate-200 py-3 pr-11 pl-4 outline-none"
              />
            </div>

            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <FaFilter />
              </span>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-3 pr-11 pl-4 outline-none"
              >
                {restaurantTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "كل الأنواع" : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Available Offers */}
        <Card className="p-5">
          <h2 className="text-2xl font-extrabold text-slate-900">
            الطعام الفائض المتاح
          </h2>

          {loading.offers ? (
            <div className="py-10 text-center text-slate-500">جاري التحميل...</div>
          ) : filteredOffers.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              لا يوجد عروض حالياً
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredOffers.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={
                        mediaUrl(item.image || item.restaurant_image) ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
                      }
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <div className="text-lg font-extrabold text-slate-900">
                      {item.title}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {item.restaurant_name}
                    </div>

                    <div className="mt-3 text-sm text-slate-600">
                      {item.description}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-2">
                        الكمية: {item.quantity} {item.unit}
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-2">
                        <span className="inline-flex items-center gap-2">
                          <FaClock />
                          {item.pickup_time || "--"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => claimOffer(item.id)}
                      disabled={loading.claim}
                      className="mt-4 w-full rounded-2xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaHandHoldingHeart />
                        طلب الاستلام
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Requests */}
        <Card className="p-5 mt-6">
          <h2 className="text-2xl font-extrabold text-slate-900">طلباتي</h2>

          {loading.my ? (
            <div className="py-8 text-center text-slate-500">جاري التحميل...</div>
          ) : myRequests.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              لم تقم بطلب أي عرض بعد
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {myRequests.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="font-extrabold text-slate-900">
                    {item.title}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {item.restaurant_name}
                  </div>

                  <div className="mt-3 text-sm text-slate-600">
                    الكمية: {item.quantity} {item.unit}
                  </div>

                  <div className="mt-3 inline-block rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}