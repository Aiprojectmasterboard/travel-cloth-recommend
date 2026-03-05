import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { OnboardingLayout } from "../components/travel-capsule/OnboardingLayout";
import { ProgressBar, BtnPrimary, BtnSecondary, Icon } from "../components/travel-capsule";
import { CityRow } from "../components/travel-capsule/CityRow";
import { useOnboarding, CityEntry } from "../context/OnboardingContext";
import { IMAGES } from "../constants/images";
import bagImg from "../../assets/36d7b5af63872a88256d99de04037e3a04cbed5f.png";
import citiesData from "../../../../packages/city-vibes-db/cities.json";

// ---------------------------------------------------------------------------
// Fallback image for cities without a dedicated IMAGES entry
// ---------------------------------------------------------------------------
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

// ---------------------------------------------------------------------------
// Map IMAGES keys (lowercase city name) to their URLs
// ---------------------------------------------------------------------------
const CITY_IMAGE_MAP: Record<string, string> = {
  paris: IMAGES.paris,
  tokyo: IMAGES.tokyo,
  barcelona: IMAGES.barcelona,
  milan: IMAGES.milan,
};

function getCityImage(cityName: string): string {
  const key = cityName.toLowerCase().replace(/\s+/g, "");
  return CITY_IMAGE_MAP[key] ?? FALLBACK_IMAGE;
}

// ---------------------------------------------------------------------------
// Build the 90-city options list from the JSON data
// ---------------------------------------------------------------------------
interface CityOption {
  city: string;
  country: string;
  imageUrl: string;
  lat: number;
  lon: number;
}

const CITY_OPTIONS: CityOption[] = citiesData.map((c) => ({
  city: c.city,
  country: c.country,
  imageUrl: getCityImage(c.city),
  lat: c.lat,
  lon: c.lon,
}));

// ---------------------------------------------------------------------------
// Korean alias map — allows searching cities by their Korean name
// ---------------------------------------------------------------------------
const KOREAN_ALIASES: Record<string, string> = {
  // --- Original 30 cities ---
  서울: "Seoul",
  도쿄: "Tokyo",
  파리: "Paris",
  바르셀로나: "Barcelona",
  로마: "Rome",
  런던: "London",
  부산: "Busan",
  대전: "Daejeon",
  뉴욕: "New York",
  밀라노: "Milan",
  교토: "Kyoto",
  발리: "Bali",
  방콕: "Bangkok",
  시드니: "Sydney",
  두바이: "Dubai",
  이스탄불: "Istanbul",
  프라하: "Prague",
  코펜하겐: "Copenhagen",
  베를린: "Berlin",
  아테네: "Athens",
  비엔나: "Vienna",
  암스테르담: "Amsterdam",
  리스본: "Lisbon",
  취리히: "Zurich",
  싱가포르: "Singapore",
  멕시코시티: "Mexico City",
  부에노스아이레스: "Buenos Aires",
  카이로: "Cairo",
  레이캬비크: "Reykjavik",
  마라케시: "Marrakech",
  호치민: "Ho Chi Minh City",
  뭄바이: "Mumbai",
  케이프타운: "Cape Town",
  // --- Asia ---
  오사카: "Osaka",
  하노이: "Hanoi",
  타이베이: "Taipei",
  타이페이: "Taipei",
  홍콩: "Hong Kong",
  상하이: "Shanghai",
  베이징: "Beijing",
  쿠알라룸푸르: "Kuala Lumpur",
  마닐라: "Manila",
  자카르타: "Jakarta",
  델리: "Delhi",
  자이푸르: "Jaipur",
  카트만두: "Kathmandu",
  콜롬보: "Colombo",
  텔아비브: "Tel Aviv",
  도하: "Doha",
  아부다비: "Abu Dhabi",
  암만: "Amman",
  치앙마이: "Chiang Mai",
  프놈펜: "Phnom Penh",
  씨엠립: "Siem Reap",
  페트라: "Petra",
  몰디브: "Maldives",
  푸켓: "Phuket",
  // --- Africa ---
  나이로비: "Nairobi",
  라고스: "Lagos",
  아크라: "Accra",
  다르에스살람: "Dar es Salaam",
  카사블랑카: "Casablanca",
  요하네스버그: "Johannesburg",
  잔지바르: "Zanzibar",
  // --- Oceania ---
  멜버른: "Melbourne",
  오클랜드: "Auckland",
  퀸스타운: "Queenstown",
  피지: "Fiji",
  // --- Americas ---
  토론토: "Toronto",
  밴쿠버: "Vancouver",
  로스앤젤레스: "Los Angeles",
  엘에이: "Los Angeles",
  샌프란시스코: "San Francisco",
  마이애미: "Miami",
  시카고: "Chicago",
  아바나: "Havana",
  리마: "Lima",
  보고타: "Bogota",
  리우데자네이루: "Rio de Janeiro",
  상파울루: "Sao Paulo",
  카르타헤나: "Cartagena",
  쿠스코: "Cusco",
  // --- Europe ---
  마드리드: "Madrid",
  피렌체: "Florence",
  산토리니: "Santorini",
  두브로브니크: "Dubrovnik",
  부다페스트: "Budapest",
  에든버러: "Edinburgh",
  스톡홀름: "Stockholm",
  헬싱키: "Helsinki",
  모스크바: "Moscow",
  바르샤바: "Warsaw",
  세비야: "Seville",
  니스: "Nice",
};

// Build a reverse map so we can also look up Korean → English quickly
const KOREAN_TO_ENGLISH_LOWER = Object.entries(KOREAN_ALIASES).reduce<
  Record<string, string>
>((acc, [ko, en]) => {
  acc[ko.toLowerCase()] = en.toLowerCase();
  return acc;
}, {});

// ---------------------------------------------------------------------------
// Resolve a Korean search term to its English equivalent (if any)
// ---------------------------------------------------------------------------
function resolveKoreanAlias(term: string): string | null {
  const lower = term.toLowerCase();
  // Exact match first
  if (KOREAN_TO_ENGLISH_LOWER[lower]) return KOREAN_TO_ENGLISH_LOWER[lower];
  // Partial match — find Korean keys that start with the typed text
  for (const [ko, en] of Object.entries(KOREAN_TO_ENGLISH_LOWER)) {
    if (ko.startsWith(lower)) return en;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function OnboardingStep1() {
  const navigate = useNavigate();
  const { data, setData } = useOnboarding();
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");

  // ---- Filtering logic: city name, country name, Korean aliases ----------
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return CITY_OPTIONS;

    const aliasMatch = resolveKoreanAlias(term);

    return CITY_OPTIONS.filter((c) => {
      // Already selected? Exclude.
      if (data.cities.find((dc) => dc.city === c.city)) return false;

      const cityLower = c.city.toLowerCase();
      const countryLower = c.country.toLowerCase();

      // Match by city or country name
      if (cityLower.includes(term) || countryLower.includes(term)) return true;

      // Match by Korean alias resolution
      if (aliasMatch && cityLower.includes(aliasMatch)) return true;

      return false;
    });
  }, [search, data.cities]);

  // ---- Determine whether to show "Add custom city" option ----------------
  const trimmedSearch = search.trim();
  const showCustomOption = useMemo(() => {
    if (trimmedSearch.length < 2) return false;
    // If there's an exact match (case-insensitive) in the options, don't show custom
    const exactMatch = CITY_OPTIONS.some(
      (c) => c.city.toLowerCase() === trimmedSearch.toLowerCase()
    );
    if (exactMatch) return false;
    // If already added to itinerary
    if (data.cities.some((c) => c.city.toLowerCase() === trimmedSearch.toLowerCase()))
      return false;
    // Show when no results match OR the typed text doesn't exactly match any result
    return filtered.length === 0 || !filtered.some(
      (c) => c.city.toLowerCase() === trimmedSearch.toLowerCase()
    );
  }, [filtered, trimmedSearch, data.cities]);

  // ---- Add a city from the suggestions list ------------------------------
  const addCity = (option: CityOption) => {
    const entry: CityEntry = {
      id: crypto.randomUUID(),
      city: option.city,
      country: option.country,
      imageUrl: option.imageUrl,
      fromDate: "",
      toDate: "",
      lat: option.lat,
      lon: option.lon,
    };
    setData((prev) => ({ ...prev, cities: [...prev.cities, entry] }));
    setSearch("");
    setShowSuggestions(false);
  };

  // ---- Add a custom city typed by the user -------------------------------
  const addCustomCity = () => {
    if (trimmedSearch.length < 2) return;
    const entry: CityEntry = {
      id: crypto.randomUUID(),
      city: trimmedSearch,
      country: "",
      imageUrl: FALLBACK_IMAGE,
      fromDate: "",
      toDate: "",
    };
    setData((prev) => ({ ...prev, cities: [...prev.cities, entry] }));
    setSearch("");
    setShowSuggestions(false);
  };

  // ---- Handle Enter key in the search input ------------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length === 1 && !showCustomOption) {
        // Only one matching city — add it directly
        addCity(filtered[0]);
      } else if (showCustomOption && filtered.length === 0) {
        // No matches at all — add as custom
        addCustomCity();
      }
    }
  };

  const removeCity = (id: string) => {
    setData((prev) => ({ ...prev, cities: prev.cities.filter((c) => c.id !== id) }));
  };

  const updateCityDate = (id: string, field: "fromDate" | "toDate", value: string) => {
    setData((prev) => ({
      ...prev,
      cities: prev.cities.map((c) => {
        if (c.id !== id) return c;
        if (field === "fromDate") {
          // If new fromDate is after existing toDate, reset toDate
          const updated = { ...c, fromDate: value };
          if (c.toDate && value > c.toDate) updated.toDate = "";
          return updated;
        }
        // toDate — always accept the value; the min attribute on the input
        // already prevents selecting dates before fromDate in the native picker.
        // Silently rejecting caused mobile date pickers to "bounce back".
        return { ...c, toDate: value };
      }),
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
            onKeyDown={handleKeyDown}
            className="w-full h-[48px] pl-12 pr-4 bg-white border border-[#E8DDD4] rounded-[12px] text-[16px] text-[#292524] placeholder:text-[#57534e]/50 focus:border-[#C4613A] focus:outline-none focus:ring-1 focus:ring-[#C4613A]/20 transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (filtered.length > 0 || showCustomOption) && (
          <div
            className="absolute z-20 w-full mt-2 bg-white border border-[#E8DDD4] rounded-xl overflow-hidden max-h-[280px] overflow-y-auto"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}
          >
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

            {/* Custom city option */}
            {showCustomOption && (
              <button
                onClick={addCustomCity}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FDF8F3] transition-colors text-left cursor-pointer border-t border-[#E8DDD4]"
              >
                <div className="w-8 h-8 rounded-md bg-[#F5EFE6] flex items-center justify-center">
                  <Icon name="add" size={18} className="text-[#C4613A]" />
                </div>
                <span className="text-[14px] text-[#C4613A]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                  Add '{trimmedSearch}' as custom destination
                </span>
              </button>
            )}
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

      {/* Validation error */}
      {error && (
        <p className="mt-4 text-[13px] text-red-500 flex items-center gap-1.5" style={{ fontFamily: "var(--font-body)" }}>
          <Icon name="error" size={16} className="text-red-500" />
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <BtnSecondary size="sm" onClick={() => navigate("/")}>Back</BtnSecondary>
        <BtnPrimary size="sm" onClick={() => {
          if (data.cities.length === 0) {
            setError("Please add at least one destination to continue.");
            return;
          }
          setError("");
          navigate("/onboarding/2");
        }}>
          <span className="flex items-center gap-2">
            <span className="hidden sm:inline">Continue to Style Profile</span>
            <span className="sm:hidden">Continue</span>
            <Icon name="arrow_forward" size={16} className="text-white" />
          </span>
        </BtnPrimary>
      </div>
    </OnboardingLayout>
  );
}
