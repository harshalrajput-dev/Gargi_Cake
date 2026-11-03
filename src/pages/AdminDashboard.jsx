import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  db,
  deleteDoc,
  doc,
  getDocs,
  logoutAdmin,
  updateDoc,
} from "../services/firebase.js";
import "../styles/admin.css";

function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function detailRow(label, value) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <p>
      <b>{label} :</b> {value}
    </p>
  );
}

function getStatusClass(statusLabel) {
  if (statusLabel === "Delivered") return "status-delivered";
  if (statusLabel === "WhatsApp Opened") return "status-whatsapp";
  if (statusLabel === "Confirmed") return "status-confirmed";
  return "status-pending";
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const snapshot = await getDocs(collection(db, "orders"));
      const loadedOrders = [];
      snapshot.forEach((orderDoc) => {
        loadedOrders.push({ id: orderDoc.id, ...orderDoc.data() });
      });
      setOrders(loadedOrders);
    } catch (loadError) {
      console.error(loadError);
      setError("Could not load orders. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const searchKeyword = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      if (!searchKeyword) return true;

      const name = (order.name || "").toLowerCase();
      const mobile = (order.mobile || "").toString();
      const cake = (order.cake || "").toLowerCase();

      return (
        name.includes(searchKeyword) ||
        mobile.includes(searchKeyword) ||
        cake.includes(searchKeyword)
      );
    });
  }, [orders, keyword]);

  const stats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let delivered = 0;
    let totalAmount = 0;
    let todayAmount = 0;
    const today = new Date().toDateString();

    filteredOrders.forEach((order) => {
      const amount =
        parseInt((order.price || "0").toString().replace(/[^\d]/g, ""), 10) ||
        0;
      const statusLabel = order.status || "Pending";
      const isDelivered = statusLabel === "Delivered";
      const isWhatsApp = statusLabel === "WhatsApp Opened";

      if (!isWhatsApp) {
        totalAmount += amount;

        const createdAt =
          order.createdAt && typeof order.createdAt.toDate === "function"
            ? order.createdAt.toDate()
            : null;

        if (createdAt && createdAt.toDateString() === today) {
          todayAmount += amount;
        }
      }

      total += 1;
      if (isDelivered) delivered += 1;
      else pending += 1;
    });

    return { total, pending, delivered, totalAmount, todayAmount };
  }, [filteredOrders]);

  const confirmOrder = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status: "Confirmed",
        confirmed: true,
      });
      alert("✅ Order Confirmed Successfully");
      loadOrders();
    } catch (updateError) {
      console.error(updateError);
      alert("❌ Confirmation Failed");
    }
  };

  const markDelivered = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status: "Delivered",
        confirmed: true,
      });
      alert("✅ Order Delivered Successfully");
      loadOrders();
    } catch (updateError) {
      console.error(updateError);
      alert("❌ Status Update Failed");
    }
  };

  const deleteOrder = async (id) => {
    const ok = window.confirm(
      "Are you sure you want to delete this order?"
    );
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "orders", id));
      alert("🗑️ Order Deleted Successfully");
      loadOrders();
    } catch (deleteError) {
      console.error(deleteError);
      alert("❌ Delete Failed");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      navigate("/login", { replace: true });
    } catch (logoutError) {
      console.error(logoutError);
      alert(logoutError.message);
    }
  };

  return (
    <div className="admin-page">
      <header className="header admin-header">
        <h1>🍰 Gargi Cake Admin Panel</h1>
        <button type="button" className="btn logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="container">
        <div className="top-box">
          <div className="card">
            <h2>Total Orders</h2>
            <h1>{stats.total}</h1>
          </div>

          <div className="card">
            <h2>Pending Orders</h2>
            <h1>{stats.pending}</h1>
          </div>

          <div className="card">
            <h2>Delivered Orders</h2>
            <h1>{stats.delivered}</h1>
          </div>

          <div className="card">
            <h2>Today&apos;s Revenue</h2>
            <h1>₹{stats.todayAmount}</h1>
          </div>

          <div className="card">
            <h2>Total Revenue</h2>
            <h1>₹{stats.totalAmount}</h1>
          </div>
        </div>

        <div className="search-box">
          <input
            type="text"
            id="searchOrder"
            placeholder="🔍 Search Customer, Mobile or Cake..."
            autoComplete="off"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>

        <div id="ordersContainer">
          {loading && <div className="loading">Loading Orders...</div>}

          {!loading && error && <div className="loading">{error}</div>}

          {!loading && !error && filteredOrders.length === 0 && (
            <div className="loading">No orders found.</div>
          )}

          {!loading &&
            !error &&
            filteredOrders.map((order) => {
              const amount =
                parseInt(
                  (order.price || "0").toString().replace(/[^\d]/g, ""),
                  10
                ) || 0;
              const statusLabel = order.status || "Pending";
              const isWhatsApp = statusLabel === "WhatsApp Opened";
              const contactMobile = digitsOnly(order.mobile);

              return (
                <div className="order-card" key={order.id}>
                  <div className="order-card-head">
                    <h2>{order.cake || "Cake Order"}</h2>
                    <span
                      className={`status-badge ${getStatusClass(statusLabel)}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {detailRow("Customer", order.name)}
                  {detailRow("Mobile", order.mobile)}
                  {detailRow("Email", order.email)}
                  {detailRow("Area", order.areaLabel || order.area)}
                  {detailRow("Address", order.address)}
                  {detailRow("Weight", order.weightLabel || order.weight)}
                  {detailRow("Flavour", order.flavourLabel || order.flavour)}
                  {detailRow(
                    "Cake Type",
                    order.cakeTypeLabel || order.cakeType
                  )}
                  {detailRow("Design", order.designLabel || order.design)}
                  {detailRow("Quantity", order.quantity)}
                  {detailRow("Message on Cake", order.cakeMessage)}
                  {detailRow("Special Instructions", order.instructions)}
                  {detailRow("Delivery Date", order.deliveryDate)}
                  {detailRow(
                    "Delivery Time",
                    order.deliveryTimeLabel || order.deliveryTime
                  )}

                  <p>
                    <b>Price :</b> ₹{amount}
                  </p>

                  {isWhatsApp && (
                    <p className="order-note">
                      Customer opened WhatsApp. This order is not confirmed
                      until the bakery verifies it.
                    </p>
                  )}

                  <div className="btn-group">
                    {isWhatsApp && (
                      <button
                        type="button"
                        className="btn confirm"
                        onClick={() => confirmOrder(order.id)}
                      >
                        ✅ Confirm Order
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn delivered"
                      onClick={() => markDelivered(order.id)}
                    >
                      ✅ Delivered
                    </button>

                    <button
                      type="button"
                      className="btn delete"
                      onClick={() => deleteOrder(order.id)}
                    >
                      🗑 Delete
                    </button>

                    <button
                      type="button"
                      className="btn whatsapp"
                      onClick={() =>
                        window.open(
                          `https://wa.me/91${contactMobile}`,
                          "_blank",
                          "noopener"
                        )
                      }
                    >
                      💬 WhatsApp
                    </button>

                    <button
                      type="button"
                      className="btn call"
                      onClick={() => {
                        window.location.href = `tel:${contactMobile}`;
                      }}
                    >
                      📞 Call
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
