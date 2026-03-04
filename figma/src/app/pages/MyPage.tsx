import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Icon, BtnPrimary, PlanBadge } from "../components/travel-capsule";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";
import { WORKER_URL } from "../lib/api";
import { jsPDF } from "jspdf";

/* ─── API Response Types ──────────────────────────────────────────────── */

interface TripCity {
  name: string;
  country: string;
  lat?: number;
  lon?: number;
  days?: number;
}

interface Trip {
  id: string;
  cities: TripCity[];
  month: number;
  status: string;
  created_at: string;
  vibe_data?: {
    mood_name?: string;
    mood_label?: string;
    vibe_tags?: string[];
    avoid_note?: string;
  } | null;
  weather_data?: {
    city?: string;
    temperature_day_avg?: number;
    temperature_night_avg?: number;
    precipitation_prob?: number;
    climate_band?: string;
  }[] | null;
  capsule_free?: {
    count?: number;
    principles?: string[];
  } | null;
  share_url?: string;
}

interface Order {
  id: string;
  trip_id: string;
  plan: "standard" | "pro" | "annual";
  amount: number;
  created_at: string;
}

interface TripImage {
  trip_id: string;
  city: string;
  image_url: string;
  job_type: string;
}

interface UserTripsResponse {
  trips: Trip[];
  orders: Order[];
  images: TripImage[];
}

/* ─── Month Names ──────────────────────────────────────────────────── */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ─── Status Badge ──────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    processing: "bg-amber-100 text-amber-700",
    expired: "bg-gray-100 text-gray-500",
  };
  const cls = colors[status] || "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.08em] ${cls}`} style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
      {status}
    </span>
  );
}

/* ─── Delete Confirmation Modal ──────────────────────────────────────── */

function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
  loading,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  t: (key: string) => string;
}) {
  const [typed, setTyped] = useState("");
  const { displayFont, bodyFont } = useLang();

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[420px] max-w-[90vw] bg-white rounded-2xl p-8" style={{ boxShadow: "0 24px 48px rgba(0,0,0,.15)" }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#EFE8DF] transition-colors cursor-pointer"
        >
          <Icon name="close" size={20} className="text-[#57534e]" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Icon name="warning" size={22} className="text-red-600" />
          </div>
          <h3 className="text-[24px] text-[#292524] not-italic" style={{ fontFamily: displayFont }}>
            {t("mypage.deleteAccount")}
          </h3>
        </div>

        <p className="text-[14px] text-[#57534e] mb-6 leading-relaxed" style={{ fontFamily: bodyFont }}>
          {t("mypage.deleteWarning")}
        </p>

        <label className="block text-[12px] uppercase tracking-[0.08em] text-[#57534e] mb-2" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
          {t("mypage.typeDelete")}
        </label>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="DELETE"
          className="w-full h-[44px] px-4 bg-[#FDF8F3] border border-[#E8DDD4] rounded-xl text-[14px] text-[#292524] placeholder:text-[#57534e]/30 focus:border-red-400 focus:outline-none transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-[44px] bg-white border border-[#E8DDD4] text-[#57534e] text-[13px] uppercase tracking-[0.06em] rounded-xl hover:bg-[#FDF8F3] transition-colors cursor-pointer"
            style={{ fontFamily: bodyFont, fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={typed !== "DELETE" || loading}
            className="flex-1 h-[44px] bg-red-600 text-white text-[13px] uppercase tracking-[0.06em] rounded-xl hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: bodyFont, fontWeight: 600 }}
          >
            {loading ? "Deleting..." : t("mypage.confirmDelete")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PDF Generation ──────────────────────────────────────────────────── */

function generateTripPdf(trip: Trip, order?: Order) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const cityNames = trip.cities.map((c) => c.name).join(", ");
  const dateStr = new Date(trip.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(`Travel Capsule — ${cityNames}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 113, 108);
  doc.text(dateStr, pageWidth / 2, y, { align: "center" });
  y += 16;

  // Divider
  doc.setDrawColor(196, 97, 58);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 12;

  // Section 1: Trip Overview
  doc.setTextColor(26, 20, 16);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Trip Overview", 20, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(87, 83, 78);

  trip.cities.forEach((c) => {
    const days = c.days ? ` (${c.days} days)` : "";
    doc.text(`• ${c.name}, ${c.country}${days}`, 24, y);
    y += 6;
  });
  y += 2;

  doc.text(`Travel Month: ${MONTH_NAMES[trip.month - 1] || trip.month}`, 24, y);
  y += 6;

  if (order) {
    const planLabel = order.plan.charAt(0).toUpperCase() + order.plan.slice(1);
    doc.text(`Plan: ${planLabel} ($${order.amount})`, 24, y);
    y += 6;
  }
  y += 8;

  // Section 2: Weather Summary
  if (trip.weather_data && trip.weather_data.length > 0) {
    doc.setTextColor(26, 20, 16);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("Weather Summary", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(87, 83, 78);

    trip.weather_data.forEach((w) => {
      const city = w.city || "Unknown";
      const dayTemp = w.temperature_day_avg != null ? `${Math.round(w.temperature_day_avg)}` : "—";
      const nightTemp = w.temperature_night_avg != null ? `${Math.round(w.temperature_night_avg)}` : "—";
      const rain = w.precipitation_prob != null ? `${Math.round(w.precipitation_prob * 100)}%` : "—";
      const climate = w.climate_band || "—";

      doc.text(`${city}: ${dayTemp}°C day / ${nightTemp}°C night | Rain: ${rain} | ${climate}`, 24, y);
      y += 6;
    });
    y += 8;
  }

  // Section 3: City Vibes
  if (trip.vibe_data) {
    doc.setTextColor(26, 20, 16);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("City Vibes", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(87, 83, 78);

    if (trip.vibe_data.mood_label) {
      doc.text(`Mood: ${trip.vibe_data.mood_label}`, 24, y);
      y += 6;
    }
    if (trip.vibe_data.vibe_tags && trip.vibe_data.vibe_tags.length > 0) {
      doc.text(`Tags: ${trip.vibe_data.vibe_tags.join(", ")}`, 24, y);
      y += 6;
    }
    if (trip.vibe_data.avoid_note) {
      const wrapped = doc.splitTextToSize(`Styling Tip: ${trip.vibe_data.avoid_note}`, pageWidth - 48);
      doc.text(wrapped, 24, y);
      y += wrapped.length * 6;
    }
    y += 8;
  }

  // Section 4: Capsule Wardrobe
  if (trip.capsule_free) {
    doc.setTextColor(26, 20, 16);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("Capsule Wardrobe", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(87, 83, 78);

    if (trip.capsule_free.count) {
      doc.text(`Estimated Items: ${trip.capsule_free.count} pieces`, 24, y);
      y += 6;
    }
    if (trip.capsule_free.principles && trip.capsule_free.principles.length > 0) {
      doc.text("Packing Principles:", 24, y);
      y += 6;
      trip.capsule_free.principles.forEach((p) => {
        const wrapped = doc.splitTextToSize(`• ${p}`, pageWidth - 48);
        doc.text(wrapped, 28, y);
        y += wrapped.length * 6;
      });
    }
    y += 8;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(196, 97, 58);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
  doc.setFontSize(9);
  doc.setTextColor(120, 113, 108);
  doc.text("Generated by TravelCapsule.com", pageWidth / 2, pageHeight - 14, { align: "center" });

  // Download
  const slugCity = trip.cities[0]?.name.toLowerCase().replace(/\s+/g, "-") || "trip";
  const slugDate = new Date(trip.created_at).toISOString().slice(0, 10);
  doc.save(`travel-capsule-${slugCity}-${slugDate}.pdf`);
}

/* ─── Main Component ──────────────────────────────────────────────────── */

export function MyPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, purchasedPlan, authLoading } = useAuth();
  const { t, displayFont, bodyFont } = useLang();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [images, setImages] = useState<TripImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  /* ── Fetch Trips ────────────────────────────────────────────────── */
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${WORKER_URL}/api/user/trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // If 404 or no trips endpoint, just show empty
        if (res.status === 404) {
          setTrips([]);
          setOrders([]);
          setImages([]);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch trips: ${res.status}`);
      }

      const data: UserTripsResponse = await res.json();
      setTrips(data.trips || []);
      setOrders(data.orders || []);
      setImages(data.images || []);
    } catch (err) {
      console.error("[MyPage] fetch trips error:", err);
      setError(err instanceof Error ? err.message : "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchTrips();
  }, [isLoggedIn, fetchTrips]);

  /* ── Delete Account ────────────────────────────────────────────── */
  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("No session");

      const res = await fetch(`${WORKER_URL}/api/account/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Delete failed: ${text}`);
      }

      setShowDeleteModal(false);
      await logout();
      navigate("/");
    } catch (err) {
      console.error("[MyPage] delete account error:", err);
      setToast(err instanceof Error ? err.message : "Delete failed");
      setTimeout(() => setToast(""), 4000);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Change Password ───────────────────────────────────────────── */
  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/mypage`,
      });
      if (resetError) throw resetError;
      setPasswordResetSent(true);
      setToast("Password reset link sent to your email.");
      setTimeout(() => setToast(""), 5000);
    } catch (err) {
      console.error("[MyPage] password reset error:", err);
      setToast("Failed to send password reset email.");
      setTimeout(() => setToast(""), 4000);
    }
  };

  /* ── Helpers ────────────────────────────────────────────────────── */
  const getOrderForTrip = (tripId: string): Order | undefined =>
    orders.find((o) => o.trip_id === tripId);

  const getImagesForTrip = (tripId: string): TripImage[] =>
    images.filter((img) => img.trip_id === tripId);

  const planLabel = purchasedPlan
    ? purchasedPlan.charAt(0).toUpperCase() + purchasedPlan.slice(1)
    : "Free";

  const createdAt = user?.id
    ? (() => {
        // Supabase user created_at not directly available from User interface,
        // but we can show the current plan instead
        return null;
      })()
    : null;

  /* ── Loading / Auth Gate ─────────────────────────────────────────── */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#C4613A] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FDF8F3]">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
          <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <Icon name="luggage" size={22} className="text-[#C4613A]" />
              <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: displayFont, fontWeight: 700 }}>Travel Capsule AI</span>
            </div>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F5EFE6] flex items-center justify-center mb-6">
            <Icon name="lock" size={36} className="text-[#57534e]" />
          </div>
          <h2 className="text-[28px] text-[#292524] not-italic mb-3" style={{ fontFamily: displayFont }}>
            {t("mypage.title")}
          </h2>
          <p className="text-[15px] text-[#57534e] mb-8 max-w-[400px]" style={{ fontFamily: bodyFont }}>
            {t("auth.signInSubtitle")}
          </p>
          <BtnPrimary onClick={() => navigate("/")}>{t("auth.signIn")}</BtnPrimary>
        </div>
      </div>
    );
  }

  /* ─── Main Page ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-[#1A1410] text-white rounded-xl text-[13px] shadow-lg" style={{ fontFamily: bodyFont }}>
          {toast}
        </div>
      )}

      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
        t={t}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: displayFont, fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <div className="flex items-center gap-3">
            <PlanBadge label={`${planLabel} Plan`} />
            <button
              onClick={() => navigate("/onboarding/1")}
              className="h-[36px] px-4 bg-[#C4613A] text-white rounded-full text-[12px] uppercase tracking-[0.08em] hover:bg-[#A84A25] transition-colors cursor-pointer flex items-center gap-2"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
            >
              <Icon name="add" size={16} className="text-white" />
              <span className="hidden sm:inline">{t("dashboard.planTrip")}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto px-6 py-8 sm:py-12" style={{ maxWidth: "var(--max-w)" }}>
        {/* Page Title */}
        <h1 className="text-[#292524] italic mb-10" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontFamily: displayFont, lineHeight: 1.1 }}>
          {t("mypage.title")}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ─── Left Column: Profile + Account ───────────────────── */}
          <div className="lg:col-span-4 space-y-6">

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-[#F5EFE6] p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
              <div className="flex items-center gap-4 mb-5">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#F5EFE6]" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#C4613A] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[22px]" style={{ fontFamily: bodyFont, fontWeight: 700 }}>{user?.initials}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-[18px] text-[#292524] truncate not-italic" style={{ fontFamily: displayFont, fontWeight: 600 }}>
                    {user?.name}
                  </h3>
                  <p className="text-[13px] text-[#57534e] truncate" style={{ fontFamily: bodyFont }}>
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.08em] ${
                  purchasedPlan === "annual" ? "bg-[#D4AF37]/15 text-[#B8941E]" :
                  purchasedPlan === "pro" ? "bg-[#C4613A]/10 text-[#C4613A]" :
                  purchasedPlan === "standard" ? "bg-[#C4613A]/10 text-[#C4613A]" :
                  "bg-[#F5EFE6] text-[#57534e]"
                }`} style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  <Icon name={purchasedPlan ? "verified" : "person"} size={14} filled />
                  {planLabel}
                </span>
              </div>

              <div className="border-t border-[#F5EFE6] pt-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Icon name="trip_origin" size={16} className="text-[#57534e]" />
                  <span className="text-[13px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
                    {trips.length} {trips.length === 1 ? "trip" : "trips"} created
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="paid" size={16} className="text-[#57534e]" />
                  <span className="text-[13px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
                    {orders.length} {orders.length === 1 ? "order" : "orders"}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Settings Card */}
            <div className="bg-white rounded-2xl border border-[#F5EFE6] p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
              <h3 className="text-[18px] text-[#292524] not-italic mb-5" style={{ fontFamily: displayFont }}>
                {t("mypage.accountSettings")}
              </h3>

              <div className="space-y-3">
                {/* Change Password */}
                <button
                  onClick={handleChangePassword}
                  disabled={passwordResetSent}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#FDF8F3] transition-colors cursor-pointer text-left disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#F5EFE6] flex items-center justify-center flex-shrink-0">
                    <Icon name="lock_reset" size={18} className="text-[#57534e]" />
                  </div>
                  <div>
                    <span className="text-[14px] text-[#292524] block" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                      {t("mypage.changePassword")}
                    </span>
                    {passwordResetSent && (
                      <span className="text-[11px] text-green-600" style={{ fontFamily: bodyFont }}>
                        Reset email sent
                      </span>
                    )}
                  </div>
                  <Icon name="chevron_right" size={18} className="text-[#57534e] ml-auto" />
                </button>

                {/* Log Out */}
                <button
                  onClick={async () => { await logout(); navigate("/"); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#FDF8F3] transition-colors cursor-pointer text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#F5EFE6] flex items-center justify-center flex-shrink-0">
                    <Icon name="logout" size={18} className="text-[#57534e]" />
                  </div>
                  <span className="text-[14px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                    {t("mypage.logout")}
                  </span>
                  <Icon name="chevron_right" size={18} className="text-[#57534e] ml-auto" />
                </button>

                {/* Divider */}
                <div className="border-t border-[#F5EFE6] my-1" />

                {/* Delete Account */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors cursor-pointer text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="delete_forever" size={18} className="text-red-600" />
                  </div>
                  <span className="text-[14px] text-red-600" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                    {t("mypage.deleteAccount")}
                  </span>
                  <Icon name="chevron_right" size={18} className="text-red-400 ml-auto" />
                </button>
              </div>
            </div>
          </div>

          {/* ─── Right Column: Trip History ────────────────────────── */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[24px] text-[#292524] not-italic" style={{ fontFamily: displayFont }}>
                {t("mypage.tripHistory")}
              </h2>
              <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                {trips.length} {trips.length === 1 ? "trip" : "trips"}
              </span>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-7 h-7 border-2 border-[#C4613A] border-t-transparent rounded-full" />
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-[13px] text-red-700 flex items-center gap-2" style={{ fontFamily: bodyFont }}>
                <Icon name="error" size={18} className="text-red-500" />
                {error}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && trips.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#F5EFE6] p-10 flex flex-col items-center text-center" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                <div className="w-24 h-24 rounded-full bg-[#F5EFE6] flex items-center justify-center mb-6">
                  <Icon name="luggage" size={40} className="text-[#C4613A]" />
                </div>
                <h3 className="text-[20px] text-[#292524] not-italic mb-2" style={{ fontFamily: displayFont }}>
                  {t("mypage.noTrips")}
                </h3>
                <p className="text-[14px] text-[#57534e] mb-8 max-w-[360px]" style={{ fontFamily: bodyFont }}>
                  Plan your first AI-powered capsule wardrobe and start traveling with confidence.
                </p>
                <BtnPrimary onClick={() => navigate("/onboarding/1")}>
                  <span className="flex items-center gap-2">
                    {t("mypage.startTrip")}
                    <Icon name="arrow_forward" size={16} className="text-white" />
                  </span>
                </BtnPrimary>
              </div>
            )}

            {/* Trip Cards */}
            {!loading && !error && trips.length > 0 && (
              <div className="space-y-4">
                {trips.map((trip) => {
                  const order = getOrderForTrip(trip.id);
                  const tripImages = getImagesForTrip(trip.id);
                  const thumbnail = tripImages[0]?.image_url;
                  const cityNames = trip.cities.map((c) => c.name).join(", ");
                  const countryNames = [...new Set(trip.cities.map((c) => c.country))].join(", ");
                  const monthName = MONTH_NAMES[trip.month - 1] || `Month ${trip.month}`;
                  const moodName = trip.vibe_data?.mood_name || trip.vibe_data?.mood_label;
                  const createdDate = new Date(trip.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={trip.id}
                      className="bg-white rounded-2xl border border-[#F5EFE6] overflow-hidden hover:border-[#C4613A]/20 transition-colors"
                      style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Thumbnail */}
                        {thumbnail && (
                          <div className="sm:w-[140px] h-[140px] sm:h-auto flex-shrink-0 overflow-hidden">
                            <img
                              src={thumbnail}
                              alt={cityNames}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h4 className="text-[18px] text-[#292524] not-italic" style={{ fontFamily: displayFont, fontWeight: 600 }}>
                                {cityNames}
                              </h4>
                              <p className="text-[12px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
                                {countryNames}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <StatusBadge status={trip.status} />
                              {order && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.08em] ${
                                  order.plan === "annual" ? "bg-[#D4AF37]/15 text-[#B8941E]" :
                                  order.plan === "pro" ? "bg-[#C4613A]/10 text-[#C4613A]" :
                                  "bg-[#C4613A]/10 text-[#C4613A]"
                                }`} style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                                  {order.plan}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#57534e] mb-4" style={{ fontFamily: bodyFont }}>
                            <span className="flex items-center gap-1">
                              <Icon name="calendar_month" size={14} className="text-[#C4613A]" />
                              {monthName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="schedule" size={14} className="text-[#C4613A]" />
                              {createdDate}
                            </span>
                            {moodName && (
                              <span className="flex items-center gap-1 italic text-[#D4AF37]">
                                <Icon name="auto_awesome" size={14} className="text-[#D4AF37]" filled />
                                {moodName}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {trip.status === "completed" && (
                              <button
                                onClick={() => {
                                  const plan = order?.plan || purchasedPlan || "standard";
                                  navigate(`/dashboard/${plan}`);
                                }}
                                className="h-[32px] px-4 bg-[#C4613A] text-white rounded-lg text-[11px] uppercase tracking-[0.06em] hover:bg-[#A84A25] transition-colors cursor-pointer flex items-center gap-1.5"
                                style={{ fontFamily: bodyFont, fontWeight: 600 }}
                              >
                                <Icon name="visibility" size={14} className="text-white" />
                                {t("mypage.viewReport")}
                              </button>
                            )}

                            {order && (
                              <button
                                onClick={() => generateTripPdf(trip, order)}
                                className="h-[32px] px-4 bg-white border border-[#E8DDD4] text-[#57534e] rounded-lg text-[11px] uppercase tracking-[0.06em] hover:border-[#C4613A]/30 hover:text-[#C4613A] transition-colors cursor-pointer flex items-center gap-1.5"
                                style={{ fontFamily: bodyFont, fontWeight: 600 }}
                              >
                                <Icon name="picture_as_pdf" size={14} />
                                {t("mypage.downloadPdf")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
