import React, { useState } from "react";
import { useNavigate } from "react-router";
import { OnboardingLayout } from "../components/travel-capsule/OnboardingLayout";
import { ProgressBar, BtnPrimary, BtnSecondary, Icon } from "../components/travel-capsule";
import { CityRow } from "../components/travel-capsule/CityRow";
import { useOnboarding, CityEntry } from "../context/OnboardingContext";
import { IMAGES } from "../constants/images";
import bagImg from "../../assets/36d7b5af63872a88256d99de04037e3a04cbed5f.png";

const CITY_OPTIONS = [
  { city: "Paris", country: "France", imageUrl: IMAGES.paris },
  { city: "Tokyo", country: "Japan", imageUrl: IMAGES.tokyo },
  { city: "Barcelona", country: "Spain", imageUrl: IMAGES.barcelona },
  { city: "Milan", country: "Italy", imageUrl: IMAGES.milan },
];

export function OnboardingStep1() {
  const navigate = useNavigate();
  const { data, setData } = useOnboarding();
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = CITY_OPTIONS.filter(
    (c) =>
      c.city.toLowerCase().includes(search.toLowerCase()) &&
      !data.cities.find((dc) => dc.city === c.city)
  );

  const addCity = (option: typeof CITY_OPTIONS[0]) => {
    const entry: CityEntry = {
      id: crypto.randomUUID(),
      city: option.city,
      country: option.country,
      imageUrl: option.imageUrl,
      fromDate: "",
      toDate: "",
    };
    setData((prev) => ({ ...prev, cities: [...prev.cities, entry] }));
    setSearch("");
    setShowSuggestions(false);
  };

  const removeCity = (id: string) => {
    setData((prev) => ({ ...prev, cities: prev.cities.filter((c) => c.id !== id) }));
  };

  const updateCityDate = (id: string, field: "fromDate" | "toDate", value: string) => {
    setData((prev) => ({
      ...prev,
      cities: prev.cities.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  };

  return (
    <OnboardingLayout
      imageUrl={bagImg}
      quote="The world is a book, and those who do not travel read only one page."
      attribution="St. Augustine"
    >
      <ProgressBar currentStep={1} sublabel="Setting the scene" />

      <div className="mt-10">
        <h1 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          Where are you <em>heading?</em>
        </h1>
        <p className="mt-4 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          Tell us your destinations so we can tailor your capsule wardrobe to each city's climate and culture.
        </p>
      </div>

      {/* City search */}
      <div className="mt-8 relative">
        <div className="relative">
          <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#57534e]/50" />
          <input
            type="text"
            placeholder="Search cities..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full h-[48px] pl-12 pr-4 bg-white border border-[#E8DDD4] rounded-[12px] text-[16px] text-[#292524] placeholder:text-[#57534e]/50 focus:border-[#C4613A] focus:outline-none focus:ring-1 focus:ring-[#C4613A]/20 transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>

        {/* Suggestions */}
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-[#E8DDD4] rounded-xl overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
            {filtered.map((option) => (
              <button
                key={option.city}
                onClick={() => addCity(option)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FDF8F3] transition-colors text-left cursor-pointer"
              >
                <img src={option.imageUrl} alt={option.city} className="w-8 h-8 rounded-md object-cover" />
                <div>
                  <span className="text-[14px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{option.city}</span>
                  <span className="text-[12px] text-[#57534e] ml-2" style={{ fontFamily: "var(--font-body)" }}>{option.country}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Add destination button */}
        <button
          onClick={() => setShowSuggestions(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-[#C4613A] text-[14px] hover:text-[#A84A25] transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
        >
          Add Destination
          <Icon name="arrow_forward" size={16} className="text-[#C4613A]" />
        </button>
      </div>

      {/* Current Itinerary */}
      {data.cities.length > 0 && (
        <div className="mt-8">
          <label
            className="text-[11px] uppercase tracking-[0.12em] text-[#57534e] block mb-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Current Itinerary
          </label>
          <div className="space-y-3">
            {data.cities.map((city) => (
              <CityRow
                key={city.id}
                city={city.city}
                country={city.country}
                imageUrl={city.imageUrl}
                fromDate={city.fromDate}
                toDate={city.toDate}
                onFromChange={(v) => updateCityDate(city.id, "fromDate", v)}
                onToChange={(v) => updateCityDate(city.id, "toDate", v)}
                onDelete={() => removeCity(city.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <BtnSecondary size="sm" onClick={() => navigate("/")}>Back</BtnSecondary>
        <BtnPrimary size="sm" onClick={() => navigate("/onboarding/2")}>
          <span className="flex items-center gap-2">
            Continue to Style Profile
            <Icon name="arrow_forward" size={16} className="text-white" />
          </span>
        </BtnPrimary>
      </div>
    </OnboardingLayout>
  );
}