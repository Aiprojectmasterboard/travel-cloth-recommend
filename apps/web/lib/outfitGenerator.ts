// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  gender: 'male' | 'female' | 'non-binary'
  height: number  // cm
  weight: number  // kg
  aesthetics: string[]
}

export interface CityInput {
  city: string
  country: string
  month: number
  days: number
}

export interface GeneratedItem {
  name: string
  imageUrl: string
  category: string
  size?: string
}

export interface GeneratedOutfit {
  id: string
  day: number
  label: string
  imageUrl: string
  items: GeneratedItem[]
  styleTag: string
}

export interface CityOutfitSet {
  city: string
  outfits: GeneratedOutfit[]
  capsuleItems: GeneratedItem[]
}

export interface PackingItem {
  name: string
  category: string
  quantity: number
  imageUrl?: string
}

// ─── Image pools ──────────────────────────────────────────────────────────────

const FEMALE_OUTFITS: Record<string, string[]> = {
  paris: [
    'https://images.unsplash.com/photo-1617114191726-c6f0e0eba2ba?w=600',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600',
    'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=600',
  ],
  rome: [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600',
    'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600',
    'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=600',
  ],
  barcelona: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    'https://images.unsplash.com/photo-1614093302611-8efc50da1963?w=600',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600',
    'https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600',
  ],
  tokyo: [
    'https://images.unsplash.com/photo-1536243301902-18fc23ea5b3d?w=600',
    'https://images.unsplash.com/photo-1609342122563-a43ac8917a3a?w=600',
    'https://images.unsplash.com/photo-1503341960582-b45751874cf0?w=600',
    'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?w=600',
  ],
  _default: [
    'https://images.unsplash.com/photo-1533026795897-5bb93fa969d4?w=600',
    'https://images.unsplash.com/photo-1551803091-e20673f15770?w=600',
    'https://images.unsplash.com/photo-1617593850374-4a22faa35a5d?w=600',
    'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600',
  ],
}

const MALE_OUTFITS: Record<string, string[]> = {
  paris: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
    'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=600',
    'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600',
    'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=600',
  ],
  _default: [
    'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600',
    'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600',
    'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=600',
    'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=600',
  ],
}

const ITEM_IMAGES: Record<string, string> = {
  trench: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=300',
  blazer: 'https://images.unsplash.com/photo-1594938298603-c8148c4b2e6b?w=300',
  cashmere: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300',
  silkBlouse: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=300',
  trousers: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300',
  denim: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300',
  boots: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300',
  loafers: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300',
  sneakers: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300',
  espadrilles: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=300',
  breton: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
  scarf: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300',
  bag: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300',
  tote: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
  earrings: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=300',
  sunglasses: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=300',
  watch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
  hat: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=300',
  belt: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
}

// ─── City templates ───────────────────────────────────────────────────────────

interface OutfitTemplate {
  label: string
  styleTag: string
  items: Array<{ key: string; name: string; category: string; description: string }>
}

const TEMPLATES: Record<string, OutfitTemplate[]> = {
  paris: [
    { label: 'Museum Chic', styleTag: 'Cultural Sophistication', items: [
      { key: 'trench', name: 'Trench Coat', category: 'Outerwear', description: 'Classic belted trench' },
      { key: 'silkBlouse', name: 'Silk Blouse', category: 'Top', description: 'Lightweight and elegant' },
      { key: 'trousers', name: 'Tailored Trousers', category: 'Bottom', description: 'High-waist straight cut' },
      { key: 'loafers', name: 'Leather Loafers', category: 'Shoes', description: 'Timeless slip-ons' },
    ]},
    { label: 'Café Morning', styleTag: 'Parisian Casual', items: [
      { key: 'breton', name: 'Breton Stripe', category: 'Top', description: 'Iconic marinière' },
      { key: 'denim', name: 'Slim Denim', category: 'Bottom', description: 'Dark indigo wash' },
      { key: 'scarf', name: 'Silk Scarf', category: 'Accessory', description: 'Neck or handle detail' },
      { key: 'espadrilles', name: 'Espadrilles', category: 'Shoes', description: 'Summer ease' },
    ]},
    { label: 'Evening Dinner', styleTag: 'Evening Elegance', items: [
      { key: 'blazer', name: 'Structured Blazer', category: 'Outerwear', description: 'Sharp and refined' },
      { key: 'silkBlouse', name: 'Silk Top', category: 'Top', description: 'Fluid drape' },
      { key: 'trousers', name: 'Wide Leg Trousers', category: 'Bottom', description: 'Dramatic silhouette' },
      { key: 'boots', name: 'Ankle Boots', category: 'Shoes', description: 'Pointed toe' },
    ]},
    { label: 'Gallery Walk', styleTag: 'Artful Eclecticism', items: [
      { key: 'cashmere', name: 'Cashmere Knit', category: 'Top', description: 'Relaxed turtleneck' },
      { key: 'denim', name: 'Wide Leg Jeans', category: 'Bottom', description: 'Vintage silhouette' },
      { key: 'bag', name: 'Structured Bag', category: 'Accessory', description: 'Gold hardware' },
      { key: 'boots', name: 'Chelsea Boots', category: 'Shoes', description: 'Everyday sophistication' },
    ]},
  ],
  tokyo: [
    { label: 'Urban Minimal', styleTag: 'Clean Contemporary', items: [
      { key: 'blazer', name: 'Oversized Blazer', category: 'Outerwear', description: 'Relaxed silhouette' },
      { key: 'breton', name: 'Graphic Tee', category: 'Top', description: 'Minimal print' },
      { key: 'trousers', name: 'Cropped Trousers', category: 'Bottom', description: 'Ankle-length' },
      { key: 'sneakers', name: 'Leather Sneakers', category: 'Shoes', description: 'Clean white' },
    ]},
    { label: 'Street Edge', styleTag: 'Tokyo Street Style', items: [
      { key: 'cashmere', name: 'Hoodie Layer', category: 'Top', description: 'Oversized comfort' },
      { key: 'denim', name: 'Cargo Pants', category: 'Bottom', description: 'Utility pockets' },
      { key: 'sneakers', name: 'Platform Sneakers', category: 'Shoes', description: 'Height boost' },
      { key: 'bag', name: 'Mini Backpack', category: 'Accessory', description: 'Practical chic' },
    ]},
    { label: 'Harajuku Pop', styleTag: 'Playful Urban', items: [
      { key: 'breton', name: 'Color-Block Top', category: 'Top', description: 'Vibrant contrast' },
      { key: 'denim', name: 'Mini Skirt', category: 'Bottom', description: 'Bold statement' },
      { key: 'boots', name: 'Platform Boots', category: 'Shoes', description: 'Statement footwear' },
      { key: 'tote', name: 'Printed Tote', category: 'Accessory', description: 'Fun print' },
    ]},
    { label: 'Tea Ceremony', styleTag: 'Refined Minimalism', items: [
      { key: 'cashmere', name: 'Linen Shirt', category: 'Top', description: 'Natural drape' },
      { key: 'trousers', name: 'Tapered Trousers', category: 'Bottom', description: 'Clean lines' },
      { key: 'loafers', name: 'Suede Loafers', category: 'Shoes', description: 'Quiet luxury' },
      { key: 'scarf', name: 'Linen Scarf', category: 'Accessory', description: 'Subtle texture' },
    ]},
  ],
  _default: [
    { label: 'Day 1', styleTag: 'Versatile Chic', items: [
      { key: 'trench', name: 'Light Jacket', category: 'Outerwear', description: 'Versatile layer' },
      { key: 'breton', name: 'Classic Tee', category: 'Top', description: 'Essential base' },
      { key: 'denim', name: 'Denim Jeans', category: 'Bottom', description: 'Classic cut' },
      { key: 'sneakers', name: 'Sneakers', category: 'Shoes', description: 'All-day comfort' },
    ]},
    { label: 'Day 2', styleTag: 'Smart Casual', items: [
      { key: 'blazer', name: 'Blazer', category: 'Outerwear', description: 'Polished layer' },
      { key: 'silkBlouse', name: 'Blouse', category: 'Top', description: 'Feminine detail' },
      { key: 'trousers', name: 'Trousers', category: 'Bottom', description: 'Tailored fit' },
      { key: 'boots', name: 'Boots', category: 'Shoes', description: 'Ankle height' },
    ]},
    { label: 'Day 3', styleTag: 'Relaxed Luxe', items: [
      { key: 'cashmere', name: 'Knit Top', category: 'Top', description: 'Soft touch' },
      { key: 'denim', name: 'Wide Leg Pants', category: 'Bottom', description: 'Comfortable' },
      { key: 'loafers', name: 'Loafers', category: 'Shoes', description: 'Easy elegance' },
      { key: 'bag', name: 'Crossbody Bag', category: 'Accessory', description: 'Hands-free' },
    ]},
    { label: 'Day 4', styleTag: 'Evening Chic', items: [
      { key: 'blazer', name: 'Statement Blazer', category: 'Outerwear', description: 'Dinner-ready' },
      { key: 'silkBlouse', name: 'Silk Top', category: 'Top', description: 'Elegant drape' },
      { key: 'trousers', name: 'Slim Trousers', category: 'Bottom', description: 'Sleek fit' },
      { key: 'boots', name: 'Heeled Boots', category: 'Shoes', description: 'Evening height' },
    ]},
  ],
}

// ─── Size recommendation ───────────────────────────────────────────────────────

function getClothingSize(height: number, weight: number): string {
  const bmi = weight / ((height / 100) ** 2)
  if (bmi < 18.5) return 'XS'
  if (bmi < 22) return 'S'
  if (bmi < 25) return 'M'
  if (bmi < 28) return 'L'
  return 'XL'
}

function getShoeSize(height: number): string {
  if (height < 155) return '36'
  if (height < 162) return '37'
  if (height < 168) return '38'
  if (height < 174) return '39'
  if (height < 180) return '40'
  return '41'
}

// ─── Main functions ────────────────────────────────────────────────────────────

export function buildProfile(
  gender: string,
  height: number,
  weight: number,
  aesthetics: string[],
): UserProfile {
  const g = gender === 'male' ? 'male' : gender === 'non-binary' ? 'non-binary' : 'female'
  return { gender: g, height, weight, aesthetics }
}

export function generateCityOutfits(
  profile: UserProfile,
  city: CityInput,
  count = 4,
): CityOutfitSet {
  const cityKey = city.city.toLowerCase().replace(/\s+/g, '_')
  const pool = profile.gender === 'male' ? MALE_OUTFITS : FEMALE_OUTFITS
  const images = pool[cityKey] ?? pool._default ?? []
  const templates = TEMPLATES[cityKey] ?? TEMPLATES._default ?? []

  const clothingSize = getClothingSize(profile.height, profile.weight)
  const shoeSize = getShoeSize(profile.height)

  const outfits: GeneratedOutfit[] = Array.from({ length: Math.min(count, templates.length) }, (_, i) => {
    const tpl = templates[i]!
    return {
      id: `${cityKey}-outfit-${i + 1}`,
      day: i + 1,
      label: tpl.label,
      imageUrl: images[i % images.length] ?? images[0] ?? '',
      styleTag: tpl.styleTag,
      items: tpl.items.map(item => ({
        name: item.name,
        imageUrl: ITEM_IMAGES[item.key] ?? ITEM_IMAGES.trench!,
        category: item.category,
        size: item.category === 'Shoes' ? shoeSize : clothingSize,
      })),
    }
  })

  // Collect unique capsule items
  const seen = new Set<string>()
  const capsuleItems: GeneratedItem[] = []
  for (const outfit of outfits) {
    for (const item of outfit.items) {
      if (!seen.has(item.name)) {
        seen.add(item.name)
        capsuleItems.push(item)
      }
    }
  }

  return { city: city.city, outfits, capsuleItems }
}

export function derivePacking(allOutfits: CityOutfitSet[]): PackingItem[] {
  const counts = new Map<string, { item: GeneratedItem; count: number }>()
  for (const citySet of allOutfits) {
    for (const outfit of citySet.outfits) {
      for (const item of outfit.items) {
        const existing = counts.get(item.name)
        if (existing) {
          existing.count++
        } else {
          counts.set(item.name, { item, count: 1 })
        }
      }
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .map(({ item, count }) => ({
      name: item.name,
      category: item.category,
      quantity: Math.ceil(count / 2),
      imageUrl: item.imageUrl,
    }))
}
