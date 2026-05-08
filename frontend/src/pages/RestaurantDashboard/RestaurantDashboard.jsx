// src/pages/RestaurantDashboard/RestaurantDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import API from "../../services/api";

const POLL_MS = 10000;
const TOAST_MS = 1800;

const ENDPOINTS = {
  profile: "manager/restaurant/profile/",
  menu: "manager/menu-items/",
  menuItem: (id) => `manager/menu-items/${id}/`,

  reservations: "manager/reservations/",
  reservationDecision: (id) => `manager/reservations/${id}/decision/`,

  orders: "manager/orders/",
  orderDecision: (id) => `manager/orders/${id}/decision/`,

  notifications: "notifications/",
  notifRead: (id) => `notifications/${id}/read/`,

  surplus: "manager/surplus-food/",
  surplusItem: (id) => `manager/surplus-food/${id}/`,
};

export default function RestaurantDashboard({ onLogout }) {
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [surplusFoods, setSurplusFoods] = useState([]);

  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [activeSection, setActiveSection] = useState("reservations");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showBulkAddMenu, setShowBulkAddMenu] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const [toasts, setToasts] = useState([]);

  const [editDraft, setEditDraft] = useState({
    name: "",
    address: "",
    phone: "",
    type: "",
    image: null,
    imagePreview: "",
  });

  const makeEmptyRow = () => ({
    name: "",
    type: "",
    price: "",
    image: null,
    imagePreview: "",
  });

  const [bulkDraft, setBulkDraft] = useState(
    Array.from({ length: 15 }, makeEmptyRow)
  );

  const [surplusForm, setSurplusForm] = useState({
    type: "",
    quantity: "",
  });

  const lastNotifId = useRef(null);

  const pushToast = (message) => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [{ id, message }, ...prev].slice(0, 4));

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_MS);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const selectedReservation =
    reservations.find((r) => String(r.id) === String(selectedReservationId)) ||
    null;

  const selectedOrder =
    orders.find((o) => String(o.id) === String(selectedOrderId)) || null;

  const fetchProfile = async () => {
    try {
      const res = await API.get(ENDPOINTS.profile);
      setRestaurant(res.data);
    } catch {}
  };

  const fetchMenu = async () => {
    try {
      const res = await API.get(ENDPOINTS.menu);
      setMenuItems(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  const fetchReservations = async () => {
    try {
      const res = await API.get(ENDPOINTS.reservations);
      setReservations(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get(ENDPOINTS.orders);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  const fetchSurplus = async () => {
    try {
      const res = await API.get(ENDPOINTS.surplus);
      setSurplusFoods(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await API.get(ENDPOINTS.notifications);
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {}
    setLoadingNotifs(false);
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchProfile(),
      fetchMenu(),
      fetchReservations(),
      fetchOrders(),
      fetchSurplus(),
      fetchNotifications(),
    ]);
  };

  useEffect(() => {
    refreshAll();

    const timer = setInterval(async () => {
      await Promise.all([fetchReservations(), fetchOrders(), fetchSurplus()]);

      try {
        const res = await API.get(ENDPOINTS.notifications);
        const list = Array.isArray(res.data) ? res.data : [];

        if (list.length) {
          const newest = list[0];

          if (lastNotifId.current === null) {
            lastNotifId.current = newest.id;
          } else if (newest.id !== lastNotifId.current) {
            lastNotifId.current = newest.id;
            pushToast(newest.title || "New notification");
          }
        }

        setNotifications(list);
      } catch {}
    }, POLL_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markNotifRead = async (id) => {
    try {
      await API.post(ENDPOINTS.notifRead(id));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const handleReservationDecision = async (action) => {
    if (!selectedReservation) return;

    try {
      await API.post(ENDPOINTS.reservationDecision(selectedReservation.id), {
        action,
      });

      pushToast(action === "accept" ? "Reservation accepted" : "Reservation rejected");
      fetchReservations();
    } catch (err) {
      pushToast(err?.response?.data?.detail || "Failed");
    }
  };

  const handleOrderDecision = async (action) => {
    if (!selectedOrder) return;

    try {
      await API.post(ENDPOINTS.orderDecision(selectedOrder.id), {
        action,
      });

      pushToast(action === "accept" ? "Order accepted" : "Order rejected");
      fetchOrders();
    } catch (err) {
      pushToast(err?.response?.data?.detail || "Failed");
    }
  };

  const openEditModal = () => {
    if (!restaurant) return;

    setEditDraft({
      name: restaurant.name || "",
      address: restaurant.address || "",
      phone: restaurant.phone || "",
      type: restaurant.type || "",
      image: null,
      imagePreview: restaurant.image || "",
    });

    setShowEditInfo(true);
  };

  const handleEditImage = (file) => {
    if (!file) return;

    setEditDraft((p) => ({
      ...p,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleSaveRestaurantInfo = async (e) => {
    e.preventDefault();

    try {
      const fd = new FormData();
      fd.append("name", editDraft.name);
      fd.append("address", editDraft.address);
      fd.append("phone", editDraft.phone);
      fd.append("type", editDraft.type);

      if (editDraft.image) fd.append("image", editDraft.image);

      const res = await API.patch(ENDPOINTS.profile, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setRestaurant(res.data);
      setShowEditInfo(false);
      pushToast("Restaurant info saved");
    } catch {
      pushToast("Save failed");
    }
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm("Delete item?")) return;

    try {
      await API.delete(ENDPOINTS.menuItem(id));
      fetchMenu();
      pushToast("Deleted");
    } catch {
      pushToast("Delete failed");
    }
  };

  const updateBulkField = (index, key, value) => {
    setBulkDraft((prev) => {
      const copy = [...prev];
      copy[index][key] = value;
      return copy;
    });
  };

  const handleBulkImage = (index, file) => {
    if (!file) return;

    setBulkDraft((prev) => {
      const copy = [...prev];
      copy[index].image = file;
      copy[index].imagePreview = URL.createObjectURL(file);
      return copy;
    });
  };

  const handleAdd15MenuItems = async (e) => {
    e.preventDefault();

    try {
      for (const row of bulkDraft) {
        if (!row.name.trim()) continue;

        const fd = new FormData();
        fd.append("name", row.name);
        fd.append("type", row.type);
        fd.append("price", row.price || "0");

        if (row.image) fd.append("image", row.image);

        await API.post(ENDPOINTS.menu, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setShowBulkAddMenu(false);
      fetchMenu();
      pushToast("Menu items added");
    } catch {
      pushToast("Failed");
    }
  };

  const handleCreateSurplus = async (e) => {
    e.preventDefault();

    if (!surplusForm.type.trim()) {
      pushToast("Type required");
      return;
    }

    if (!surplusForm.quantity) {
      pushToast("Quantity required");
      return;
    }

    try {
      await API.post(ENDPOINTS.surplus, {
        title: surplusForm.type,
        quantity: surplusForm.quantity,
      });

      setSurplusForm({
        type: "",
        quantity: "",
      });

      fetchSurplus();
      pushToast("Donation created");
    } catch (err) {
      pushToast(err?.response?.data?.detail || "Failed");
    }
  };

  const handleDeleteSurplus = async (id) => {
    if (!window.confirm("Delete donation?")) return;

    try {
      await API.delete(ENDPOINTS.surplusItem(id));
      fetchSurplus();
      pushToast("Deleted");
    } catch {
      pushToast("Failed");
    }
  };

  return (
    <div className="min-h-screen text-[#3b2a1f] bg-[#f4e6c7]">
      <div className="fixed top-4 right-4 z-[60] space-y-2 w-[340px] max-w-[90vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-[#b67a4f]/25 bg-white/80 backdrop-blur-xl shadow-xl p-3 text-sm font-bold"
          >
            {t.message}
          </div>
        ))}
      </div>

      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#e74c3c]/25 blur-3xl" />
        <div className="absolute top-10 right-0 h-96 w-96 rounded-full bg-[#b67a4f]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-white/30 blur-3xl" />
      </div>

      <div className="sticky top-0 z-30 border-b border-[#b67a4f]/20 bg-[#f4e6c7]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl border border-[#b67a4f]/25 bg-white/50 px-3 py-2"
              title="Menu"
            >
              ☰
            </button>

            <div>
              <div className="text-lg font-extrabold text-[#a5453a]">
                {restaurant?.name || "Restaurant"}
              </div>
              <div className="text-xs text-[#3b2a1f]/70">Dashboard</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshAll}
              className="rounded-xl border border-[#b67a4f]/25 bg-white/50 px-4 py-2 font-bold"
            >
              Refresh
            </button>

            <button
              onClick={onLogout}
              className="rounded-xl bg-[#e74c3c] px-4 py-2 font-bold text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-40 ${drawerOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/40 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />

        <div
          className={`absolute left-0 top-0 h-full w-80 max-w-[85%] border-r border-[#b67a4f]/20 bg-[#f4e6c7]/95 backdrop-blur-xl shadow-2xl transition-transform ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-xl text-[#a5453a]">Menu</div>
              <button onClick={() => setDrawerOpen(false)}>✕</button>
            </div>

            <div className="mt-6 space-y-2">
              <NavButton
                active={activeSection === "reservations"}
                title="Reservations"
                onClick={() => {
                  setActiveSection("reservations");
                  setDrawerOpen(false);
                }}
              />
              <NavButton
                active={activeSection === "orders"}
                title="Orders"
                onClick={() => {
                  setActiveSection("orders");
                  setDrawerOpen(false);
                }}
              />
              <NavButton
                active={activeSection === "info"}
                title="Restaurant Info"
                onClick={() => {
                  setActiveSection("info");
                  setDrawerOpen(false);
                }}
              />
              <NavButton
                active={activeSection === "menu"}
                title="Menu Items"
                onClick={() => {
                  setActiveSection("menu");
                  setDrawerOpen(false);
                }}
              />
              <NavButton
                active={activeSection === "surplus"}
                title="Surplus Food"
                onClick={() => {
                  setActiveSection("surplus");
                  setDrawerOpen(false);
                }}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-[#b67a4f]/20 bg-white/55 p-4">
              <div className="font-bold mb-2">
                Notifications ({unreadCount})
              </div>

              {loadingNotifs ? (
                <div>Loading...</div>
              ) : notifications.length === 0 ? (
                <div>No notifications</div>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 6).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markNotifRead(n.id)}
                      className={`w-full rounded-xl border p-2 text-left ${
                        n.is_read
                          ? "bg-white/50"
                          : "bg-red-100 border-red-300"
                      }`}
                    >
                      <div className="font-bold">{n.title}</div>
                      <div className="text-xs">{n.message}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8">
        {activeSection === "reservations" && (
          <SectionCard title="Reservations">
            {reservations.map((r) => (
              <RowCard
                key={r.id}
                active={String(selectedReservationId) === String(r.id)}
                onClick={() => setSelectedReservationId(r.id)}
              >
                <div>
                  <div className="font-bold">{r.customer_email}</div>
                  <div className="text-sm">
                    {r.date} - {r.time}
                  </div>
                </div>

                <div>{r.status}</div>
              </RowCard>
            ))}

            {selectedReservation && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleReservationDecision("reject")}
                  className="rounded-xl bg-red-500 text-white py-3"
                >
                  Reject
                </button>

                <button
                  onClick={() => handleReservationDecision("accept")}
                  className="rounded-xl bg-green-600 text-white py-3"
                >
                  Accept
                </button>
              </div>
            )}
          </SectionCard>
        )}

        {activeSection === "orders" && (
          <SectionCard title="Orders">
            {orders.map((o) => (
              <RowCard
                key={o.id}
                active={String(selectedOrderId) === String(o.id)}
                onClick={() => setSelectedOrderId(o.id)}
              >
                <div>
                  <div className="font-bold">Order #{o.id}</div>
                  <div className="text-sm">Items: {o.items?.length || 0}</div>
                </div>

                <div>{o.status}</div>
              </RowCard>
            ))}

            {selectedOrder && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleOrderDecision("reject")}
                  className="rounded-xl bg-red-500 text-white py-3"
                >
                  Reject
                </button>

                <button
                  onClick={() => handleOrderDecision("accept")}
                  className="rounded-xl bg-green-600 text-white py-3"
                >
                  Accept
                </button>
              </div>
            )}
          </SectionCard>
        )}

        {activeSection === "info" && (
          <SectionCard title="Restaurant Info">
            <div className="grid md:grid-cols-2 gap-4">
              <InfoCard title="Name" value={restaurant?.name} />
              <InfoCard title="Address" value={restaurant?.address} />
              <InfoCard title="Phone" value={restaurant?.phone} />
              <InfoCard title="Type" value={restaurant?.type} />
            </div>

            <button
              onClick={openEditModal}
              className="mt-4 rounded-xl bg-[#e74c3c] text-white px-5 py-3"
            >
              Edit
            </button>
          </SectionCard>
        )}

        {activeSection === "menu" && (
          <SectionCard title="Menu Items">
            <button
              onClick={() => setShowBulkAddMenu(true)}
              className="mb-4 rounded-xl bg-[#e74c3c] text-white px-5 py-3"
            >
              Add Items
            </button>

            {menuItems.map((item) => (
              <RowCard key={item.id}>
                <div>
                  <div className="font-bold">{item.name}</div>
                  <div className="text-sm">{item.type}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div>${item.price}</div>

                  <button
                    onClick={() => handleDeleteMenuItem(item.id)}
                    className="rounded-xl px-3 py-2 bg-red-100"
                  >
                    🗑
                  </button>
                </div>
              </RowCard>
            ))}
          </SectionCard>
        )}

        {activeSection === "surplus" && (
          <SectionCard title="Surplus Food">
            <form
              onSubmit={handleCreateSurplus}
              className="grid md:grid-cols-3 gap-4 mb-6"
            >
              <Field
                label="Food Type"
                value={surplusForm.type}
                onChange={(v) =>
                  setSurplusForm((p) => ({ ...p, type: v }))
                }
              />

              <Field
                label="Quantity"
                type="number"
                value={surplusForm.quantity}
                onChange={(v) =>
                  setSurplusForm((p) => ({ ...p, quantity: v }))
                }
              />

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-green-600 text-white py-3"
                >
                  Add Donation
                </button>
              </div>
            </form>

            {surplusFoods.map((item) => (
              <RowCard key={item.id}>
                <div>
                  <div className="font-bold">{item.title}</div>
                  <div className="text-sm">Quantity: {item.quantity}</div>
                </div>

                <button
                  onClick={() => handleDeleteSurplus(item.id)}
                  className="rounded-xl px-3 py-2 bg-red-100"
                >
                  Delete
                </button>
              </RowCard>
            ))}
          </SectionCard>
        )}
      </div>

      {showEditInfo && (
        <Modal title="Edit Restaurant" onClose={() => setShowEditInfo(false)}>
          <form onSubmit={handleSaveRestaurantInfo} className="space-y-4">
            <Field
              label="Name"
              value={editDraft.name}
              onChange={(v) => setEditDraft((p) => ({ ...p, name: v }))}
            />

            <Field
              label="Address"
              value={editDraft.address}
              onChange={(v) => setEditDraft((p) => ({ ...p, address: v }))}
            />

            <Field
              label="Phone"
              value={editDraft.phone}
              onChange={(v) => setEditDraft((p) => ({ ...p, phone: v }))}
            />

            <Field
              label="Type"
              value={editDraft.type}
              onChange={(v) => setEditDraft((p) => ({ ...p, type: v }))}
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleEditImage(e.target.files?.[0])}
            />

            <button className="w-full rounded-xl bg-green-600 text-white py-3">
              Save
            </button>
          </form>
        </Modal>
      )}

      {showBulkAddMenu && (
        <Modal title="Add Menu Items" onClose={() => setShowBulkAddMenu(false)}>
          <form
            onSubmit={handleAdd15MenuItems}
            className="space-y-4 max-h-[75vh] overflow-auto"
          >
            {bulkDraft.map((row, i) => (
              <div key={i} className="rounded-2xl border p-4 bg-white/60">
                <div className="grid md:grid-cols-3 gap-3">
                  <Field
                    label="Name"
                    value={row.name}
                    onChange={(v) => updateBulkField(i, "name", v)}
                  />

                  <Field
                    label="Type"
                    value={row.type}
                    onChange={(v) => updateBulkField(i, "type", v)}
                  />

                  <Field
                    label="Price"
                    type="number"
                    value={row.price}
                    onChange={(v) => updateBulkField(i, "price", v)}
                  />
                </div>

                <input
                  className="mt-3"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleBulkImage(i, e.target.files?.[0])}
                />
              </div>
            ))}

            <button className="w-full rounded-xl bg-[#e74c3c] text-white py-3">
              Add
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function NavButton({ active, title, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left ${
        active
          ? "border-[#e74c3c]/45 bg-[#e74c3c]/10"
          : "border-[#b67a4f]/20 bg-white/55"
      }`}
    >
      <div className="font-bold">{title}</div>
    </button>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#b67a4f]/20 bg-white/55 p-6 shadow-xl">
      <div className="text-2xl font-extrabold text-[#a5453a] mb-5">{title}</div>
      {children}
    </div>
  );
}

function RowCard({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 mb-3 flex items-center justify-between text-left ${
        active
          ? "border-[#e74c3c]/60 bg-[#e74c3c]/10"
          : "border-[#b67a4f]/20 bg-white/55"
      }`}
    >
      {children}
    </button>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-[#b67a4f]/20 bg-white/55 p-4">
      <div className="text-sm opacity-70">{title}</div>
      <div className="font-bold mt-1">{value || "—"}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm mb-2">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#b67a4f]/25 bg-white/70 px-4 py-3"
      />
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
      <div className="w-full max-w-3xl rounded-3xl border border-[#b67a4f]/20 bg-[#f4e6c7]/95 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="text-xl font-bold text-[#a5453a]">{title}</div>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}