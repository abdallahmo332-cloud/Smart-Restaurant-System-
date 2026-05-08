// src/pages/AdminDashboard/AdminDashboard.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import {
  FaTrashAlt,
  FaPlus,
  FaUser,
  FaStore,
  FaSyncAlt,
  FaCheck,
  FaHandsHelping,
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:8000/api";

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function formatManager(manager) {
  if (!manager) return "—";
  if (typeof manager === "object") {
    return manager.email || manager.full_name || manager.name || String(manager.id || "—");
  }
  return String(manager);
}

/* ================== UI Components ================== */

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function ActionBtn({ children, className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl" lang="ar">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h3 className="text-2xl font-extrabold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 font-bold hover:bg-slate-50"
            title="إغلاق"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 p-6">
          {footer}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "PENDING").toUpperCase();

  const cls =
    s === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : s === "REJECTED"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${cls}`}>
      {s}
    </span>
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

function EmptyState({ children }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{children}</div>;
}

/* ================== Main Component ================== */

export default function AdminDashboard() {
  const token = localStorage.getItem("token");

  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: token ? { Authorization: `Token ${token}` } : {},
    });
  }, [token]);

  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [charities, setCharities] = useState([]);
  const [requests, setRequests] = useState([]);
  const [charityRequests, setCharityRequests] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingCharities, setLoadingCharities] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingCharityRequests, setLoadingCharityRequests] = useState(false);

  const [errorUsers, setErrorUsers] = useState("");
  const [errorRestaurants, setErrorRestaurants] = useState("");
  const [errorCharities, setErrorCharities] = useState("");
  const [errorRequests, setErrorRequests] = useState("");
  const [errorCharityRequests, setErrorCharityRequests] = useState("");

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const [showUserModal, setShowUserModal] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);
  const [showCharityModal, setShowCharityModal] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvePassword, setApprovePassword] = useState("");
  const [savingApprove, setSavingApprove] = useState(false);

  const [showCharityApproveModal, setShowCharityApproveModal] = useState(false);
  const [selectedCharityRequest, setSelectedCharityRequest] = useState(null);
  const [charityApprovePassword, setCharityApprovePassword] = useState("");
  const [savingCharityApprove, setSavingCharityApprove] = useState(false);

  const [savingUser, setSavingUser] = useState(false);
  const [savingRest, setSavingRest] = useState(false);
  const [savingCharity, setSavingCharity] = useState(false);

  const [userDraft, setUserDraft] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    location: "",
  });

  const [restDraft, setRestDraft] = useState({
    restaurant_name: "",
    restaurant_address: "",
    restaurant_phone: "",
    manager_email: "",
    manager_full_name: "",
    manager_password: "",
  });

  const [charityDraft, setCharityDraft] = useState({
    charity_name: "",
    charity_address: "",
    charity_phone: "",
    manager_email: "",
    manager_full_name: "",
    manager_password: "",
    image: null,
    imagePreview: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setErrorUsers("");
    try {
      const res = await api.get("/admin/users/");
      setUsers(normalizeListResponse(res.data));
    } catch (err) {
      setErrorUsers(err?.response?.data?.detail || "فشل تحميل المستخدمين");
    } finally {
      setLoadingUsers(false);
    }
  }, [api]);

  const fetchRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    setErrorRestaurants("");
    try {
      const res = await api.get("/admin/restaurants/");
      setRestaurants(normalizeListResponse(res.data));
    } catch (err) {
      setErrorRestaurants(err?.response?.data?.detail || "فشل تحميل المطاعم");
    } finally {
      setLoadingRestaurants(false);
    }
  }, [api]);

  const fetchCharities = useCallback(async () => {
    setLoadingCharities(true);
    setErrorCharities("");
    try {
      const res = await api.get("/admin/charities/");
      setCharities(normalizeListResponse(res.data));
    } catch (err) {
      setErrorCharities(err?.response?.data?.detail || "فشل تحميل الجمعيات الخيرية");
    } finally {
      setLoadingCharities(false);
    }
  }, [api]);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    setErrorRequests("");
    try {
      const res = await api.get("/admin/manager/requests/");
      setRequests(normalizeListResponse(res.data));
    } catch (err) {
      setErrorRequests(err?.response?.data?.detail || "فشل تحميل طلبات المطاعم");
    } finally {
      setLoadingRequests(false);
    }
  }, [api]);

  const fetchCharityRequests = useCallback(async () => {
    setLoadingCharityRequests(true);
    setErrorCharityRequests("");
    try {
      const res = await api.get("/admin/charity/requests/");
      setCharityRequests(normalizeListResponse(res.data));
    } catch (err) {
      setErrorCharityRequests(err?.response?.data?.detail || "فشل تحميل طلبات الجمعيات الخيرية");
    } finally {
      setLoadingCharityRequests(false);
    }
  }, [api]);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      fetchUsers(),
      fetchRestaurants(),
      fetchCharities(),
      fetchRequests(),
      fetchCharityRequests(),
    ]);
  }, [fetchUsers, fetchRestaurants, fetchCharities, fetchRequests, fetchCharityRequests]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const openAddUser = () => {
    setUserDraft({ email: "", password: "", full_name: "", phone: "", location: "" });
    setShowUserModal(true);
  };

  const handleAddUser = async () => {
    setSavingUser(true);
    try {
      await api.post("/admin/users/", {
        ...userDraft,
        role: "CUSTOMER",
      });

      showToast("success", "تم إضافة المستخدم");
      setShowUserModal(false);
      await fetchUsers();
    } catch (err) {
      showToast("error", err?.response?.data?.detail || "فشل إضافة المستخدم");
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("حذف المستخدم؟")) return;
    try {
      await api.delete(`/admin/users/${id}/`);
      showToast("success", "تم حذف المستخدم");
      await fetchUsers();
    } catch (err) {
      showToast("error", err?.response?.data?.detail || "فشل حذف المستخدم");
    }
  };

  const openAddRestaurant = () => {
    setRestDraft({
      restaurant_name: "",
      restaurant_address: "",
      restaurant_phone: "",
      manager_email: "",
      manager_full_name: "",
      manager_password: "",
    });
    setShowRestModal(true);
  };

  const handleAddRestaurant = async () => {
    setSavingRest(true);
    try {
      const payload = {
        restaurant_name: restDraft.restaurant_name.trim(),
        restaurant_address: restDraft.restaurant_address.trim(),
        restaurant_phone: restDraft.restaurant_phone.trim(),
        manager_email: restDraft.manager_email.trim(),
        manager_full_name: restDraft.manager_full_name.trim(),
        manager_password: restDraft.manager_password,
      };

      await api.post("/admin/restaurants/", payload);

      showToast("success", "تم إضافة المطعم");
      setShowRestModal(false);
      await fetchRestaurants();
    } catch (err) {
      showToast("error", err?.response?.data?.detail || "فشل إضافة المطعم");
    } finally {
      setSavingRest(false);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm("حذف المطعم؟ سيتم حذف المدير أيضًا.")) return;
    try {
      await api.delete(`/admin/restaurants/${id}/`);
      showToast("success", "تم حذف المطعم");
      await fetchRestaurants();
    } catch (err) {
      showToast("error", err?.response?.data?.detail || "فشل حذف المطعم");
    }
  };

  const openAddCharity = () => {
    setCharityDraft({
      charity_name: "",
      charity_address: "",
      charity_phone: "",
      manager_email: "",
      manager_full_name: "",
      manager_password: "",
      image: null,
      imagePreview: "",
    });
    setShowCharityModal(true);
  };

  const handleCharityImage = (file) => {
    if (!file) return;
    setCharityDraft((p) => ({
      ...p,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleAddCharity = async () => {
    setSavingCharity(true);
    try {
      const fd = new FormData();
      fd.append("name", charityDraft.charity_name.trim());
      fd.append("address", charityDraft.charity_address.trim());
      fd.append("phone", charityDraft.charity_phone.trim());
      fd.append("charity_name", charityDraft.charity_name.trim());
      fd.append("charity_address", charityDraft.charity_address.trim());
      fd.append("charity_phone", charityDraft.charity_phone.trim());
      fd.append("manager_email", charityDraft.manager_email.trim());
      fd.append("manager_full_name", charityDraft.manager_full_name.trim());
      fd.append("manager_password", charityDraft.manager_password);
      if (charityDraft.image) fd.append("image", charityDraft.image);

      await api.post("/admin/charities/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("success", "تم إضافة الجمعية الخيرية");
      setShowCharityModal(false);
      await fetchCharities();
    } catch (err) {
      showToast("error", err?.response?.data?.detail || "فشل إضافة الجمعية الخيرية");
    } finally {
      setSavingCharity(false);
    }
  };

  const handleDeleteCharity = async (id) => {
    if (!window.confirm("حذف الجمعية؟")) return;
    try {
      await api.delete(`/admin/charities/${id}/`);
      showToast("success", "تم حذف الجمعية");
      await fetchCharities();
    } catch (err) {
      showToast("error", err?.response?.data?.detail || "فشل حذف الجمعية");
    }
  };

  const openApprove = (req) => {
    setSelectedRequest(req);
    setApprovePassword("");
    setShowApproveModal(true);
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    if (!approvePassword.trim()) {
      showToast("error", "كلمة المرور مطلوبة");
      return;
    }

    setSavingApprove(true);
    try {
      await api.post(`/admin/manager/requests/${selectedRequest.id}/approve/`, {
        password: approvePassword,
      });

      showToast("success", "تمت الموافقة على طلب المطعم");
      setShowApproveModal(false);
      setSelectedRequest(null);
      await Promise.allSettled([fetchRequests(), fetchRestaurants()]);
    } catch (err) {
      showToast("error", err?.response?.data?.detail || "فشلت الموافقة");
    } finally {
      setSavingApprove(false);
    }
  };

  const handleRejectRequest = async (req) => {
    if (!window.confirm("رفض الطلب؟")) return;
    try {
      await api.post(`/admin/manager/requests/${req.id}/reject/`);
      showToast("success", "تم رفض الطلب");
      await fetchRequests();
    } catch (err) {
      showToast("error", err?.response?.data?.detail || "فشل رفض الطلب");
    }
  };

  const openCharityApprove = (req) => {
    setSelectedCharityRequest(req);
    setCharityApprovePassword("");
    setShowCharityApproveModal(true);
  };

  const handleApproveCharityRequest = async () => {
    if (!selectedCharityRequest) return;
    if (!charityApprovePassword.trim()) {
      showToast("error", "كلمة المرور مطلوبة");
      return;
    }

    setSavingCharityApprove(true);
    try {
      await api.post(`/admin/charity/requests/${selectedCharityRequest.id}/approve/`, {
        password: charityApprovePassword,
      });

      showToast("success", "تم قبول الجمعية الخيرية");
      setShowCharityApproveModal(false);
      setSelectedCharityRequest(null);
      await fetchCharityRequests();
    } catch (err) {
      showToast("error", err?.response?.data?.detail || "فشل قبول الجمعية");
    } finally {
      setSavingCharityApprove(false);
    }
  };

  const handleRejectCharityRequest = async (req) => {
    if (!window.confirm("رفض الطلب؟")) return;
    try {
      await api.post(`/admin/charity/requests/${req.id}/reject/`);
      showToast("success", "تم رفض الجمعية");
      await fetchCharityRequests();
    } catch (err) {
      showToast("error", err?.response?.data?.detail || "فشل رفض الطلب");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4 md:p-8" dir="rtl" lang="ar">
      <div className="mx-auto max-w-7xl">
        {toast && (
          <div className="fixed left-4 top-4 z-[9999] md:left-6 md:top-6">
            <div
              className={`rounded-2xl border px-5 py-3 font-bold shadow-xl ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : toast.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              {toast.message}
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">لوحة تحكم مدير النظام</h1>
            <p className="mt-2 text-slate-500">إدارة المستخدمين + المطاعم + الجمعيات + طلبات إنشاء الحسابات</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ActionBtn onClick={refreshAll} className="border border-slate-200 bg-white hover:bg-slate-50">
              <FaSyncAlt /> تحديث
            </ActionBtn>

            <span className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
              لوحة الأدمن الداخلية
            </span>
          </div>
        </div>

        <Card className="mb-8 p-6">
          <SectionHeader
            title="طلبات إنشاء جمعية خيرية"
            subtitle="الموافقة والرفض من هنا، والحقول مأخوذة مباشرة من الباك"
            action={
              <button
                onClick={fetchCharityRequests}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50"
              >
                تحديث
              </button>
            }
          />

          {errorCharityRequests && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
              {errorCharityRequests}
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right">
              <thead className="bg-slate-50">
                <tr className="text-slate-700">
                  <th className="p-4 font-extrabold">ID</th>
                  <th className="p-4 font-extrabold">الجمعية</th>
                  <th className="p-4 font-extrabold">العنوان</th>
                  <th className="p-4 font-extrabold">الهاتف</th>
                  <th className="p-4 font-extrabold">المدير</th>
                  <th className="p-4 font-extrabold">الحالة</th>
                  <th className="p-4 font-extrabold">إجراء</th>
                </tr>
              </thead>

              <tbody>
                {loadingCharityRequests ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={7}>
                      جاري تحميل الطلبات...
                    </td>
                  </tr>
                ) : charityRequests.length === 0 ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={7}>
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  charityRequests.map((req) => (
                    <tr key={req.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="p-4 font-bold text-slate-700">{req.id}</td>
                      <td className="p-4 font-bold text-slate-900">{req.charity_name || "—"}</td>
                      <td className="p-4 text-slate-700">{req.charity_address || "—"}</td>
                      <td className="p-4 text-slate-700">{req.charity_phone || "—"}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{req.manager_name || req.manager_full_name || "—"}</div>
                        <div className="text-sm text-slate-500">{req.manager_email || "—"}</div>
                        <div className="text-sm text-slate-500">{req.manager_phone || "—"}</div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={req.status || "PENDING"} />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openCharityApprove(req)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 font-bold text-emerald-700 hover:bg-emerald-100"
                          >
                            <FaCheck /> موافقة
                          </button>

                          <button
                            onClick={() => handleRejectCharityRequest(req)}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 font-bold text-rose-700 hover:bg-rose-100"
                          >
                            ✕ رفض
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="mb-8 p-6">
          <SectionHeader
            title="طلبات إنشاء حساب مطعم"
            subtitle="الموافقة والرفض من هنا"
            action={
              <button
                onClick={fetchRequests}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50"
              >
                تحديث
              </button>
            }
          />

          {errorRequests && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
              {errorRequests}
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right">
              <thead className="bg-slate-50">
                <tr className="text-slate-700">
                  <th className="p-4 font-extrabold">ID</th>
                  <th className="p-4 font-extrabold">المطعم</th>
                  <th className="p-4 font-extrabold">العنوان</th>
                  <th className="p-4 font-extrabold">الهاتف</th>
                  <th className="p-4 font-extrabold">المدير</th>
                  <th className="p-4 font-extrabold">الحالة</th>
                  <th className="p-4 font-extrabold">إجراء</th>
                </tr>
              </thead>

              <tbody>
                {loadingRequests ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={7}>
                      جاري تحميل الطلبات...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={7}>
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="p-4 font-bold text-slate-700">{req.id}</td>
                      <td className="p-4 font-bold text-slate-900">{req.restaurant_name || "—"}</td>
                      <td className="p-4 text-slate-700">{req.restaurant_address || "—"}</td>
                      <td className="p-4 text-slate-700">{req.restaurant_phone || "—"}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{req.manager_name || req.manager_full_name || "—"}</div>
                        <div className="text-sm text-slate-500">{req.manager_email || "—"}</div>
                        <div className="text-sm text-slate-500">{req.manager_phone || "—"}</div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={req.status || "PENDING"} />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openApprove(req)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 font-bold text-emerald-700 hover:bg-emerald-100"
                          >
                            <FaCheck /> موافقة
                          </button>

                          <button
                            onClick={() => handleRejectRequest(req)}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 font-bold text-rose-700 hover:bg-rose-100"
                          >
                            ✕ رفض
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Tabs selectedIndex={activeTabIndex} onSelect={setActiveTabIndex}>
            <TabList className="flex gap-2 border-b border-slate-200 bg-slate-50 p-2">
              <Tab className="flex-1 cursor-pointer select-none outline-none" selectedClassName="">
                <div className="rounded-2xl py-4 text-center text-lg font-extrabold text-slate-700 transition hover:bg-white hover:shadow-sm">
                  <span className="inline-flex items-center justify-center gap-2">
                    <FaUser /> المستخدمين
                  </span>
                </div>
              </Tab>

              <Tab className="flex-1 cursor-pointer select-none outline-none" selectedClassName="">
                <div className="rounded-2xl py-4 text-center text-lg font-extrabold text-slate-700 transition hover:bg-white hover:shadow-sm">
                  <span className="inline-flex items-center justify-center gap-2">
                    <FaStore /> المطاعم
                  </span>
                </div>
              </Tab>

              <Tab className="flex-1 cursor-pointer select-none outline-none" selectedClassName="">
                <div className="rounded-2xl py-4 text-center text-lg font-extrabold text-slate-700 transition hover:bg-white hover:shadow-sm">
                  <span className="inline-flex items-center justify-center gap-2">
                    <FaHandsHelping /> الجمعيات
                  </span>
                </div>
              </Tab>
            </TabList>

            <TabPanel className="p-6 md:p-8">
              <SectionHeader
                title="المستخدمين"
                subtitle="إضافة وحذف حسابات الزبائن"
                action={
                  <ActionBtn onClick={openAddUser} className="bg-slate-900 text-white hover:bg-slate-800">
                    <FaPlus /> إضافة مستخدم
                  </ActionBtn>
                }
              />

              {errorUsers && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  {errorUsers}
                </div>
              )}

              <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-700">
                      <th className="p-4 font-extrabold">ID</th>
                      <th className="p-4 font-extrabold">البريد</th>
                      <th className="p-4 font-extrabold">الاسم</th>
                      <th className="p-4 font-extrabold">الهاتف</th>
                      <th className="p-4 font-extrabold">الموقع</th>
                      <th className="p-4 font-extrabold">الدور</th>
                      <th className="p-4 font-extrabold">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td className="p-6 text-slate-500" colSpan={7}>
                          جاري تحميل المستخدمين...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td className="p-6 text-slate-500" colSpan={7}>
                          لا يوجد مستخدمين
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                          <td className="p-4 font-bold text-slate-700">{u.id}</td>
                          <td className="p-4 text-slate-700">{u.email}</td>
                          <td className="p-4 text-slate-700">{u.full_name}</td>
                          <td className="p-4 text-slate-700">{u.phone || "—"}</td>
                          <td className="p-4 text-slate-700">{u.location || "—"}</td>
                          <td className="p-4 text-slate-700">{u.role || "—"}</td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 font-bold text-rose-700 hover:bg-rose-100"
                            >
                              <FaTrashAlt /> حذف
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabPanel>

            <TabPanel className="p-6 md:p-8">
              <SectionHeader
                title="المطاعم"
                subtitle="إضافة وحذف المطاعم والمديرين"
                action={
                  <div className="flex flex-wrap gap-2">
                    <ActionBtn
                      onClick={openAddRestaurant}
                      className="bg-slate-900 text-white hover:bg-slate-800"
                    >
                      <FaPlus /> إضافة مطعم
                    </ActionBtn>
                  </div>
                }
              />

              {errorRestaurants && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  {errorRestaurants}
                </div>
              )}

              <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-700">
                      <th className="p-4 font-extrabold">ID</th>
                      <th className="p-4 font-extrabold">اسم المطعم</th>
                      <th className="p-4 font-extrabold">العنوان</th>
                      <th className="p-4 font-extrabold">الهاتف</th>
                      <th className="p-4 font-extrabold">المدير</th>
                      <th className="p-4 font-extrabold">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRestaurants ? (
                      <tr>
                        <td className="p-6 text-slate-500" colSpan={6}>
                          جاري تحميل المطاعم...
                        </td>
                      </tr>
                    ) : restaurants.length === 0 ? (
                      <tr>
                        <td className="p-6 text-slate-500" colSpan={6}>
                          لا يوجد مطاعم
                        </td>
                      </tr>
                    ) : (
                      restaurants.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                          <td className="p-4 font-bold text-slate-700">{r.id}</td>
                          <td className="p-4 text-slate-700">{r.name}</td>
                          <td className="p-4 text-slate-700">{r.address || "—"}</td>
                          <td className="p-4 text-slate-700">{r.phone || "—"}</td>
                          <td className="p-4 text-slate-700">{formatManager(r.manager)}</td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => handleDeleteRestaurant(r.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 font-bold text-rose-700 hover:bg-rose-100"
                            >
                              <FaTrashAlt /> حذف
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabPanel>

            <TabPanel className="p-6 md:p-8">
              <SectionHeader
                title="الجمعيات الخيرية"
                subtitle="إضافة وحذف الجمعيات مع تفاصيل المدير"
                action={
                  <div className="flex flex-wrap gap-2">
                    <ActionBtn
                      onClick={openAddCharity}
                      className="bg-slate-900 text-white hover:bg-slate-800"
                    >
                      <FaPlus /> إضافة جمعية
                    </ActionBtn>
                  </div>
                }
              />

              {errorCharities && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  {errorCharities}
                </div>
              )}

              <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-700">
                      <th className="p-4 font-extrabold">ID</th>
                      <th className="p-4 font-extrabold">اسم الجمعية</th>
                      <th className="p-4 font-extrabold">العنوان</th>
                      <th className="p-4 font-extrabold">الهاتف</th>
                      <th className="p-4 font-extrabold">المدير</th>
                      <th className="p-4 font-extrabold">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCharities ? (
                      <tr>
                        <td className="p-6 text-slate-500" colSpan={6}>
                          جاري تحميل الجمعيات...
                        </td>
                      </tr>
                    ) : charities.length === 0 ? (
                      <tr>
                        <td className="p-6 text-slate-500" colSpan={6}>
                          لا يوجد جمعيات
                        </td>
                      </tr>
                    ) : (
                      charities.map((c) => (
                        <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                          <td className="p-4 font-bold text-slate-700">{c.id}</td>
                          <td className="p-4 text-slate-700">{c.name}</td>
                          <td className="p-4 text-slate-700">{c.address || "—"}</td>
                          <td className="p-4 text-slate-700">{c.phone || "—"}</td>
                          <td className="p-4 text-slate-700">{formatManager(c.manager)}</td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => handleDeleteCharity(c.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 font-bold text-rose-700 hover:bg-rose-100"
                            >
                              <FaTrashAlt /> حذف
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabPanel>
          </Tabs>
        </Card>

        <Modal
          open={showUserModal}
          title="إضافة مستخدم جديد"
          onClose={() => setShowUserModal(false)}
          footer={
            <>
              <ActionBtn
                onClick={() => setShowUserModal(false)}
                className="border border-slate-200 bg-white hover:bg-slate-50"
              >
                إلغاء
              </ActionBtn>
              <ActionBtn
                onClick={handleAddUser}
                disabled={savingUser}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {savingUser ? "جاري الحفظ..." : "حفظ"}
              </ActionBtn>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="البريد الإلكتروني"
              type="email"
              value={userDraft.email}
              onChange={(v) => setUserDraft((p) => ({ ...p, email: v }))}
            />
            <Input
              label="كلمة المرور"
              type="password"
              value={userDraft.password}
              onChange={(v) => setUserDraft((p) => ({ ...p, password: v }))}
            />
            <Input
              label="الاسم الكامل"
              value={userDraft.full_name}
              onChange={(v) => setUserDraft((p) => ({ ...p, full_name: v }))}
            />
            <Input
              label="رقم الهاتف"
              value={userDraft.phone}
              onChange={(v) => setUserDraft((p) => ({ ...p, phone: v }))}
            />
            <div className="md:col-span-2">
              <Input
                label="الموقع"
                value={userDraft.location}
                onChange={(v) => setUserDraft((p) => ({ ...p, location: v }))}
              />
            </div>
          </div>
        </Modal>

        <Modal
          open={showRestModal}
          title="إضافة مطعم + إنشاء مدير مطعم"
          onClose={() => setShowRestModal(false)}
          footer={
            <>
              <ActionBtn
                onClick={() => setShowRestModal(false)}
                className="border border-slate-200 bg-white hover:bg-slate-50"
              >
                إلغاء
              </ActionBtn>
              <ActionBtn
                onClick={handleAddRestaurant}
                disabled={savingRest}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {savingRest ? "جاري الحفظ..." : "حفظ"}
              </ActionBtn>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="اسم المطعم"
              value={restDraft.restaurant_name}
              onChange={(v) => setRestDraft((p) => ({ ...p, restaurant_name: v }))}
            />
            <Input
              label="هاتف المطعم"
              value={restDraft.restaurant_phone}
              onChange={(v) => setRestDraft((p) => ({ ...p, restaurant_phone: v }))}
            />
            <div className="md:col-span-2">
              <Input
                label="عنوان المطعم"
                value={restDraft.restaurant_address}
                onChange={(v) => setRestDraft((p) => ({ ...p, restaurant_address: v }))}
              />
            </div>
            <div className="md:col-span-2 rounded-2xl bg-slate-50 p-4">
              <h4 className="text-lg font-extrabold text-slate-900">بيانات مدير المطعم</h4>
              <p className="mt-1 text-sm text-slate-500">هذه الحقول مطلوبة لإنشاء الحساب</p>
            </div>
            <Input
              label="إيميل المدير"
              type="email"
              value={restDraft.manager_email}
              onChange={(v) => setRestDraft((p) => ({ ...p, manager_email: v }))}
            />
            <Input
              label="اسم المدير"
              value={restDraft.manager_full_name}
              onChange={(v) => setRestDraft((p) => ({ ...p, manager_full_name: v }))}
            />
            <div className="md:col-span-2">
              <Input
                label="كلمة مرور المدير"
                type="password"
                value={restDraft.manager_password}
                onChange={(v) => setRestDraft((p) => ({ ...p, manager_password: v }))}
              />
            </div>
          </div>
        </Modal>

        <Modal
          open={showCharityModal}
          title="إضافة جمعية خيرية + إنشاء مدير جمعية"
          onClose={() => setShowCharityModal(false)}
          footer={
            <>
              <ActionBtn
                onClick={() => setShowCharityModal(false)}
                className="border border-slate-200 bg-white hover:bg-slate-50"
              >
                إلغاء
              </ActionBtn>
              <ActionBtn
                onClick={handleAddCharity}
                disabled={savingCharity}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {savingCharity ? "جاري الحفظ..." : "حفظ"}
              </ActionBtn>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="اسم الجمعية"
              value={charityDraft.charity_name}
              onChange={(v) => setCharityDraft((p) => ({ ...p, charity_name: v }))}
            />
            <Input
              label="هاتف الجمعية"
              value={charityDraft.charity_phone}
              onChange={(v) => setCharityDraft((p) => ({ ...p, charity_phone: v }))}
            />
            <div className="md:col-span-2">
              <Input
                label="عنوان الجمعية"
                value={charityDraft.charity_address}
                onChange={(v) => setCharityDraft((p) => ({ ...p, charity_address: v }))}
              />
            </div>

            <div className="md:col-span-2 rounded-2xl bg-slate-50 p-4">
              <h4 className="text-lg font-extrabold text-slate-900">بيانات مدير الجمعية</h4>
              <p className="mt-1 text-sm text-slate-500">هذه الحقول مطلوبة لإنشاء الحساب</p>
            </div>

            <Input
              label="إيميل المدير"
              type="email"
              value={charityDraft.manager_email}
              onChange={(v) => setCharityDraft((p) => ({ ...p, manager_email: v }))}
            />
            <Input
              label="اسم المدير"
              value={charityDraft.manager_full_name}
              onChange={(v) => setCharityDraft((p) => ({ ...p, manager_full_name: v }))}
            />
            <div className="md:col-span-2">
              <Input
                label="كلمة مرور المدير"
                type="password"
                value={charityDraft.manager_password}
                onChange={(v) => setCharityDraft((p) => ({ ...p, manager_password: v }))}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-bold text-slate-700">صورة الجمعية</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCharityImage(e.target.files?.[0])}
                className="block w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3"
              />
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {charityDraft.imagePreview ? (
                  <img
                    src={charityDraft.imagePreview}
                    alt="charity preview"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-40 place-items-center text-sm text-slate-400">
                    لا توجد صورة
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          open={showApproveModal}
          title="موافقة على طلب إنشاء حساب مطعم"
          onClose={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
          footer={
            <>
              <ActionBtn
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                }}
                className="border border-slate-200 bg-white hover:bg-slate-50"
              >
                إلغاء
              </ActionBtn>
              <ActionBtn
                onClick={handleApproveRequest}
                disabled={savingApprove || !approvePassword.trim()}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {savingApprove ? "جاري الموافقة..." : "موافقة"}
              </ActionBtn>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-bold text-slate-900">المطعم: {selectedRequest?.restaurant_name || "—"}</div>
              <div className="mt-1 text-sm text-slate-500">المدير: {selectedRequest?.manager_email || "—"}</div>
            </div>

            <Input
              label="كلمة مرور مدير المطعم"
              type="password"
              value={approvePassword}
              onChange={setApprovePassword}
              placeholder="اكتب كلمة مرور قوية"
            />
          </div>
        </Modal>

        <Modal
          open={showCharityApproveModal}
          title="قبول طلب جمعية خيرية"
          onClose={() => {
            setShowCharityApproveModal(false);
            setSelectedCharityRequest(null);
          }}
          footer={
            <>
              <ActionBtn
                onClick={() => {
                  setShowCharityApproveModal(false);
                  setSelectedCharityRequest(null);
                }}
                className="border border-slate-200 bg-white hover:bg-slate-50"
              >
                إلغاء
              </ActionBtn>
              <ActionBtn
                onClick={handleApproveCharityRequest}
                disabled={savingCharityApprove || !charityApprovePassword.trim()}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {savingCharityApprove ? "جاري الموافقة..." : "موافقة"}
              </ActionBtn>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-bold text-slate-900">الجمعية: {selectedCharityRequest?.charity_name || "—"}</div>
              <div className="mt-1 text-sm text-slate-500">المدير: {selectedCharityRequest?.manager_email || "—"}</div>
            </div>

            <Input
              label="كلمة مرور المدير"
              type="password"
              value={charityApprovePassword}
              onChange={setCharityApprovePassword}
              placeholder="اكتب كلمة مرور قوية"
            />
          </div>
        </Modal>
      </div>
    </div>
  );
}