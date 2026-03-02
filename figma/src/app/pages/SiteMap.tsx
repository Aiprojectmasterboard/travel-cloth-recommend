import React from "react";
import { useNavigate } from "react-router";
import { Icon } from "../components/travel-capsule";

const PAGES = [
  {
    section: "Public",
    routes: [
      { path: "/", label: "Landing Page", desc: "Hero, features, editorial sections", icon: "home" },
    ],
  },
  {
    section: "Onboarding Flow",
    routes: [
      { path: "/onboarding/1", label: "Step 1 — Destinations", desc: "City search, date selection", icon: "flight_takeoff" },
      { path: "/onboarding/2", label: "Step 2 — Body Profile", desc: "Gender, height, weight, size", icon: "person" },
      { path: "/onboarding/3", label: "Step 3 — Aesthetic & Photo", desc: "Style selection, photo upload", icon: "palette" },
      { path: "/onboarding/4", label: "Step 4 — Preferences", desc: "Budget, packing style, priorities", icon: "tune" },
    ],
  },
  {
    section: "Preview & Checkout",
    routes: [
      { path: "/preview", label: "Preview & Pricing", desc: "AI preview, plan comparison, Polar checkout", icon: "preview" },
      { path: "/checkout/success?plan=standard", label: "Checkout Success", desc: "Payment verification, redirect", icon: "check_circle" },
    ],
  },
  {
    section: "Dashboards",
    routes: [
      { path: "/dashboard/standard", label: "Standard Dashboard ($5)", desc: "1 city, 4 outfits, packing list", icon: "dashboard" },
      { path: "/dashboard/pro", label: "Pro Dashboard ($12)", desc: "Multi-city, weather, activities", icon: "star" },
      { path: "/dashboard/annual", label: "Annual Dashboard ($29/yr)", desc: "Style DNA, VIP, trip history", icon: "workspace_premium" },
    ],
  },
  {
    section: "Examples (Public Showcase)",
    routes: [
      { path: "/examples/pro", label: "Pro Example", desc: "Showcase: 170cm/50kg supermodel, Paris·Rome·Barcelona", icon: "visibility" },
      { path: "/examples/annual", label: "Annual Example", desc: "Showcase: Tokyo capsule, Style DNA, past trips", icon: "visibility" },
    ],
  },
];

export function SiteMap() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDF8F3] py-12 px-6">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Icon name="luggage" size={32} className="text-[#C4613A]" />
          <h1
            className="text-[#292524] italic"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}
          >
            Travel Capsule AI
          </h1>
        </div>
        <p
          className="text-[15px] text-[#57534e] mb-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          All pages &amp; screens — click any item to navigate.
        </p>
        <p
          className="text-[11px] text-[#57534e]/60 uppercase tracking-[0.12em] mb-10"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {PAGES.reduce((sum, s) => sum + s.routes.length, 0)} pages &middot; React + Tailwind &middot; Polar Checkout
        </p>

        {/* Sections */}
        {PAGES.map((section) => (
          <div key={section.section} className="mb-10">
            <h2
              className="text-[11px] uppercase tracking-[0.15em] text-[#C4613A] mb-4"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              {section.section}
            </h2>
            <div className="flex flex-col gap-2">
              {section.routes.map((route) => (
                <button
                  key={route.path}
                  onClick={() => navigate(route.path)}
                  className="group w-full flex items-center gap-4 p-4 bg-white border border-[#E8DDD4]/60 rounded-xl hover:border-[#C4613A]/30 hover:shadow-sm transition-all text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#C4613A]/8 flex items-center justify-center shrink-0 group-hover:bg-[#C4613A]/15 transition-colors">
                    <Icon name={route.icon} size={20} className="text-[#C4613A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[15px] text-[#292524] block group-hover:text-[#C4613A] transition-colors"
                      style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                    >
                      {route.label}
                    </span>
                    <span
                      className="text-[12px] text-[#57534e]/70 block mt-0.5"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {route.desc}
                    </span>
                  </div>
                  <code
                    className="hidden sm:block text-[10px] text-[#57534e]/40 bg-[#FDF8F3] px-2 py-1 rounded shrink-0"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {route.path}
                  </code>
                  <Icon name="arrow_forward" size={16} className="text-[#57534e]/30 group-hover:text-[#C4613A] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Footer info */}
        <div className="mt-12 pt-6 border-t border-[#EFE8DF]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Design System", value: "Cream + Terracotta" },
              { label: "Languages", value: "6 (i18n)" },
              { label: "Payment", value: "Polar API" },
              { label: "Plans", value: "3 tiers" },
            ].map((item) => (
              <div key={item.label}>
                <span
                  className="text-[9px] uppercase tracking-[0.12em] text-[#C4613A] block mb-1"
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
                >
                  {item.label}
                </span>
                <span
                  className="text-[14px] text-[#292524]"
                  style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}