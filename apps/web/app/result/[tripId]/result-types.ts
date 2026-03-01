// ─── Result Page Shared Types & Constants ─────────────────────────────────────

export interface GenerationJob {
  id: string
  city: string
  mood: string
  image_url: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface WardrobeItem {
  emoji: string
  name: string
  cities: string
  category?: string
  image_url?: string
  description?: string
  material?: string
}

export interface DailyPlan {
  day: number
  date?: string
  city: string
  outfit: string
  activities: string[]
}

export interface Trip {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  cities: { name: string; days: number }[]
  month: string
  generation_jobs: GenerationJob[]
  wardrobe_items?: WardrobeItem[]
  daily_plan?: DailyPlan[]
  created_at: string
  upgrade_token?: string | null
  plan?: 'standard' | 'pro' | 'annual'
  face_url?: string | null
  vibe_description?: string
  user_name?: string
  trips_remaining?: number
}

export interface ViewProps {
  trip: Trip
  tripId: string
  onShare: (url?: string | null) => void
}

// ─── Demo Images ──────────────────────────────────────────────────────────────

export const DEMO_OUTFIT_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAUkfJti7ncs3Fl2rfEcDXfgUzCOk19d5TmPElax6hp9uCN2ASSMW1GlpG4Y7Qjj1cmkrbcpPV2Q2GdGcLh0Ds3B95gGlIG3xpjZhQubc4vhKwrmIgzEeXceo4N0fOH_UBoSOfrMjpqYdLhHQbVl0KuL5NuJUBJRWIRVxg095dY3SQXbyKWZ4HBM1F6_81emm4gY_kbwhVjpSpH6HjsI4UxGoFTQz4dssuSE22WBdHGbmgIWlDoZ3oGeRVGYZWwVp2Wzbh_p7CwjQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAu15YAjFFK3tRmrnKHndUgC_QjkTTUkBlh4b6pg9ZV6v0uvwEPAdfIAuo5571YnV4IpkvU0YUN2QlB_B3I02Cv3z6H4x16Y3YPlWamtHd80VBWpMdxFTkjIy9oZAccBquOs5bgnNKP-RR9M4OnkPJQ2wP1z5glM4fcjM3IH1loz6ehtSpRnb-HmWh1cr0WjsRwgO4Okw1pD3VkhP5lVpRKlgaS3JZ-MTNVhtLn0_R4F7KVum7FRHPcaWXhubWbPAGIeIq07OEchQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAPiPONgmq89OGeIiLNBXwWqxlWnHBTBq2eHGGuIgQzHIq9la1irZg2kbL7v_Q_LGSuaImezkm_rdpipofdsn80CrxcEELE2rOvIZU4hUTmkcTsEm8SuTnGyt2HpDdO_mw4L5CrRWbRqXtC-uNs7vTcF0AGn6en2t8QTB8yVEZh_ekW-T6Qbl201cT9iq5gQgsY0cLXNtf1WLhgDiSWkww_dYLgEttnovDm4hspBJvvikgal9UFVXdCdt9vAiyzDj6-yRl8_iDIow',
]

export const DEMO_CAPSULE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBuDZpw2j1UzGEniy99oLu1dMw8C9pt47t2QTBwGzBqUO_XRCxc7I9tum9gsl3Nwd_sChNDDdALN3nc69GmJlKZZJlEL-TUuCRx0ftUO-VCWwAGqvxcfF9STmKkV9XOwkjEHjpXm880G02H_RZ-VpWkl0wxIq0upTAXu5FSFnKMOjENTyVw2D4WyT79WCZk0bhSr6Dke4weNfyafNMEDuOShal8omWnIFgj7FQH5HphD__CVCRc412NmGpT3k-jnJNQazGQf-mTKA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrzUDy49psS8F5LDzffltmsyM3lJPC-jMI0P93Ftm1ApLbO8nGA0DGWC-PNgS-BbO5NAVmXd7zw3-Qi4PV1lXmWUBItV4SCnN2g9apscIPH45uv-hkBkhgh-IKFhncdI7DisiayLI2f9CU-IwLVLEqowlaZfEJn7KmRSqOM6fLxJx2BDLBmdEHe5cybaadkW6XqeVp4RNNpFgijkhuB1yXdm7Y8FxYaI1RvCDfsHZhh94JbApFULX3M1cx8E6H2P_k6TWuDt0T0A',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA0x1D60f5ErF5Jk6cFoWsgvDAK2Vb14Axm3UnC05hmaGWTaNIsd7DnFU5K02ZBq8jnOMk4W3x7NyteJ-3ejV1_aU4QAUoIY7uxjOG7bH6q1h_2WEAZoPikB5VeR4_-MW3cBvp2_Z0eat0GiB8chyqwlTZUomAnkMB5GneSPk34BpsZVt2JFooQ3onYImLq45t881S2CeUDs6OOk1-Jr372j4ynsueI5QZ_9xMyo9rM_151WWeftMxDVB5XipQ-xv5bDw10dnE40w',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAR87ZxegUPUJJnp9F01VL-_HOAT0Vn-CP-gNffgmHBGlJi63ELC9MqNhrlbvbUO613z1Df-lYJdIWAE507RwLEq9UDjJ9pd4Mxg1_nx4rlw2lkcrQC1DJuKWFUm8yGNi6drRevq6Kxjp97z0bzwmkRIFXMkEoSP5-U6aofIZHFTzVBf57Jg6zWdseA8GhMNaHPirCO62FNFcPj7XvhzHWfCs3TucoUozkBkD_jGcHPKliPgTCSp5HzHnXg43-WqPAvPzlY1W4j5A',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCjiar1RSTcMTXjwc2xX5oukbh6iJ4Sg2tS5kxC741mabKosXVRzJfF8SxvB67YStWc-EVLWesOZI3iR38v8oI-K1qYDh3ECLi150mhQI5rAjI9MSuwgHkfuzug8cN3Gl8xp6gxyGQtCn2Sl2NELCDviWaoRo8LyV9nxwRifihzyFgkX7y5i3SbFJZBTsdctqWu91Arr6IyrfSjdILugo8lHEg6E3C4I7wE2kdfYz13pf8jWdVmrKJuswhBrGViDGj8gI2BiONsPg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCmQIJKYrBC4RMHxxOqC7byLE0jXcMdldgl4lnglKhoyt7RLr7VFUP-DgMsiZdHkZIac2FV8zQgnNNY1HBsLX_iDr1NYq4mXUvOylVi-qMd392pa_yRdD5YTb_01rU5tiyPUUufdBNAEe8FmTXsDrlwtEDPhKNze8Z8LDQSNseBLh-pxiQyJSAGagEBJRDmFbHwgICzlTUw93OeQ7F4YpXPqLbR1MEh97mthThsQcnfl_fBclxnEJeBkjreyeqxD6VqIyRI-Pukyw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDLbZmKMHRseFwsYcffoHcvvUcnvo8ncLnYjnW6JpzewsaJoHb3JegJ24ZzYsGf-IMyANaCuv9OZPR_8JCTmt5pr-AF57qlw4G8TAI9Loj1_cPmVxKtOvY23-EovaeCTDHSB_DR7Tx_jB-SnklGvYh5hCoariDzFrc3WPHPE0L08yIYF0AFvIDqNr5hIjraLGlZqzJ0eDK00j0xFMZbJ7cg2N1bpUIM6wtUUwVBN__vW9PS5J_lDNU0PJ63gEWHdXkGu2mmxbf0qw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCiNuv6-6Mr613PqsCBF82iPIkUuVOXf4NfFmsv1mF1pkVhzQADelEo-kswgYBG5BxEzSA2nbpo-2Dv1XLl2b1p_C47xpXp1cQqoJbTurIDJbE1B7tCRPOrEU2QFnVuDzYpTTmgzQE0dzvF6uzswLVG8LulsZYt2FO46bWaThqB0PTm_LjPv98SUWR9qqzrDDxnAVIB7pr6I2s_-3ghWN_uHNg9iP9QaV2j3ayk-ruA25mz0zfZSwXseo7GRotTDIHZ6GxLTQqvRQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA3VACVMKt1VLyiS6LQFplRcRhsEqv-F7TQCfLrifm2prCZQ0zQrXdANosGI5_H8uGwLnf-E8DUYUq1WNKCiWe3xf8x7_KKftALjn--t8nZJ7fcDtezCKhC30l75-dFauuOzxkoOiqSjfjCyVRkM7uDJ7VP5zLm9DepX4fMBIDRTsTdDtT2M9__hsbSVlFKdMyz52xRpLJHEIOg_fln6GgYI7DMZzf-GgQoUjIlzCrYxPXz8ylcG_ixkIqqsdbcZ4lkSzgX6EmV6Q',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDuy6UZnX8r4LwBcUQeYMU25MZO0HRF4RnBqF4bwbLiOOa-YeQNoBGYCHCDugoqlv1sZhg-9LQFF36WNTDAQEs9yFSV3YzMh3VM70TVdsldMjKNtbx4k98pQS2r8QHVHIZW-fVGI9JwLchU_tKwEd-bkLL_l1hcAy52yKu6E1w0MtBTnDqh-Squ_8re1WUTCRkRnhfjH3C5p8MRXYbiCYt3KOfzdoQd1p173I9qyXyHKQ8J3jTVQIhZgqd7DJ4-dheDcDrQCms6mA',
]

export const EMOJI_CATEGORY: Record<string, string> = {
  '\u{1F9E5}': 'Outerwear', '\u{1F455}': 'Essential', '\u{1F456}': 'Bottoms', '\u{1F457}': 'Evening',
  '\u{1F45F}': 'Footwear', '\u{1F460}': 'Footwear', '\u{1F461}': 'Footwear', '\u{1F462}': 'Footwear',
  '\u{1F45C}': 'Accessory', '\u{1F45D}': 'Accessory', '\u{1F392}': 'Accessory',
  '\u{1F9E3}': 'Accessory', '\u{1F9E4}': 'Accessory', '\u{1F9E2}': 'Accessory',
}

export const TIME_SLOTS = ['Morning', 'Evening', 'Afternoon', 'Morning', 'Evening', 'Afternoon']

export const WEATHER_SLOTS = [
  { temp: '14\u00B0C', condition: 'Breeze', icon: 'air' },
  { temp: '16\u00B0C', condition: 'Clear', icon: 'nightlight' },
  { temp: '18\u00B0C', condition: 'Sunny', icon: 'wb_sunny' },
  { temp: '15\u00B0C', condition: 'Cloudy', icon: 'cloud' },
  { temp: '12\u00B0C', condition: 'Rainy', icon: 'rainy' },
  { temp: '20\u00B0C', condition: 'Sunny', icon: 'wb_sunny' },
]

export const CITY_FLAGS: Record<string, string> = {
  Paris: '\u{1F1EB}\u{1F1F7}', London: '\u{1F1EC}\u{1F1E7}', Tokyo: '\u{1F1EF}\u{1F1F5}',
  Rome: '\u{1F1EE}\u{1F1F9}', Barcelona: '\u{1F1EA}\u{1F1F8}', Amsterdam: '\u{1F1F3}\u{1F1F1}',
  Seoul: '\u{1F1F0}\u{1F1F7}', Bali: '\u{1F1EE}\u{1F1E9}', 'New York': '\u{1F1FA}\u{1F1F8}',
  Milan: '\u{1F1EE}\u{1F1F9}', Vienna: '\u{1F1E6}\u{1F1F9}', Prague: '\u{1F1E8}\u{1F1FF}',
  Bangkok: '\u{1F1F9}\u{1F1ED}', Sydney: '\u{1F1E6}\u{1F1FA}', Lisbon: '\u{1F1F5}\u{1F1F9}',
}

export function getCityFlag(city: string): string {
  return CITY_FLAGS[city] ?? '\u{1F30D}'
}

// City filter effects for Pro view (per-city index)
export const CITY_FILTERS = [
  'sepia(0.1)',
  'grayscale(0.2)',
  'saturate(0.8)',
  'sepia(0.05)',
  'grayscale(0.1)',
]

// Month name lookup
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function getMonthName(month: string | number): string {
  const idx = typeof month === 'string' ? parseInt(month, 10) - 1 : Number(month) - 1
  return MONTH_NAMES[idx] ?? 'Oct'
}

// Demo wardrobe items with descriptions
export const DEMO_WARDROBE_ITEMS: WardrobeItem[] = [
  { emoji: '\u{1F9E5}', name: 'Trench Coat', cities: 'All', description: 'Water-resistant, beige', material: 'Cotton blend', image_url: DEMO_CAPSULE_IMAGES[0] },
  { emoji: '\u{1F45F}', name: 'Leather Loafers', cities: 'All', description: 'Black, gold hardware', material: 'Italian leather', image_url: DEMO_CAPSULE_IMAGES[1] },
  { emoji: '\u{1F455}', name: 'White Shirt', cities: 'All', description: 'Crisp oxford cotton', material: 'Cotton', image_url: DEMO_CAPSULE_IMAGES[2] },
  { emoji: '\u{1F456}', name: 'Straight Denim', cities: 'All', description: 'Medium wash, high rise', material: 'Denim', image_url: DEMO_CAPSULE_IMAGES[3] },
  { emoji: '\u{1F9E5}', name: 'Cashmere Knit', cities: 'All', description: 'Camel crew neck', material: 'Cashmere', image_url: DEMO_CAPSULE_IMAGES[4] },
  { emoji: '\u{1F457}', name: 'Silk Dress', cities: 'All', description: 'Midi length, navy', material: 'Silk', image_url: DEMO_CAPSULE_IMAGES[5] },
  { emoji: '\u{1F45C}', name: 'Gold Pendant', cities: 'All', description: 'Minimalist chain', material: '14k Gold', image_url: DEMO_CAPSULE_IMAGES[6] },
  { emoji: '\u{1F45C}', name: 'Leather Bag', cities: 'All', description: 'Crossbody, tan', material: 'Full grain leather', image_url: DEMO_CAPSULE_IMAGES[7] },
  { emoji: '\u{1F9E3}', name: 'Silk Scarf', cities: 'All', description: 'Geometric print', material: 'Silk twill', image_url: DEMO_CAPSULE_IMAGES[8] },
  { emoji: '\u{1F9E5}', name: 'Black Blazer', cities: 'All', description: 'Tailored fit', material: 'Wool blend', image_url: DEMO_CAPSULE_IMAGES[9] },
]

// Demo past trips for Annual view
export const PAST_TRIPS = [
  { title: 'Milan Fashion Week', year: '2025', description: 'September \u2022 Business Chic', days: 5, outfits: 8, imageUrl: DEMO_OUTFIT_IMAGES[0] },
  { title: 'Seoul Exploration', year: '2025', description: 'July \u2022 Urban Streetwear', days: 7, outfits: 12, imageUrl: DEMO_OUTFIT_IMAGES[1] },
  { title: 'Tuscany Retreat', year: '2025', description: 'May \u2022 Romantic Light', days: 10, outfits: 15, imageUrl: DEMO_OUTFIT_IMAGES[2] },
]

// Demo trending items for Annual sidebar
export const TRENDING_ITEMS = [
  { name: 'Silk Scarf', imageUrl: DEMO_CAPSULE_IMAGES[8] },
  { name: 'Loafers', imageUrl: DEMO_CAPSULE_IMAGES[1] },
  { name: 'Structured Tote', imageUrl: DEMO_CAPSULE_IMAGES[7] },
]

// Style DNA segments for Annual view
export const STYLE_DNA_SEGMENTS = [
  { label: 'Minimalist Chic', pct: 65, color: '#C4613A' },
  { label: 'Avant-Garde', pct: 20, color: '#E8D5CD' },
  { label: 'Bohemian Luxe', pct: 15, color: '#1A1410' },
]
