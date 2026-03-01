// ─── Locale types ─────────────────────────────────────────────────────────────

export type Locale = 'en' | 'ko' | 'ja' | 'zh' | 'fr' | 'es'

export interface LocaleInfo {
  label: string
  nativeLabel: string
  flag: string
}

export const LOCALES: Locale[] = ['en', 'ko', 'ja', 'zh', 'fr', 'es']

export const LOCALE_LABELS: Record<Locale, LocaleInfo> = {
  en: { label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  ko: { label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷' },
  ja: { label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
  zh: { label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳' },
  fr: { label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  es: { label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
}

// ─── Translation shape ─────────────────────────────────────────────────────────

export interface Translations {
  nav: {
    philosophy: string
    curations: string
    membership: string
    signIn: string
    cta: string
    // Used by Header.tsx component (separate from landing page nav)
    howItWorks: string
    pricing: string
    faq: string
  }
  hero: {
    badge: string
    heading1: string
    heading2: string
    sub: string
    cta: string
    estLabel: string
    scrollLabel: string
    editionLabel: string
    // Used by HeroSection.tsx component
    tag: string
    headline1: string
    headline2: string
    headline3: string
    highlight: string
    socialProof: string
    ctaPrimary: string
    ctaSecondary: string
    trust: {
      outfitImages: string
      capsuleWardrobe: string
      generationTime: string
      price: string
    }
  }
  weather: {
    sectionLabel: string
    heading1: string
    heading2: string
    forecastLabel: string
    windyLabel: string
    windNote: string
    windyDayEdit: string
    thermalTitle: string
    thermalDesc: string
    humidityTitle: string
    humidityDesc: string
    bodyText: string
  }
  blueprint: {
    sectionLabel: string
    heading: string
    desc: string
    outerLayerLabel: string
    outerLayerName: string
    seeAllItems: string
    curatedFor: string
    totalWeight: string
  }
  guide: {
    sectionLabel: string
    heading1: string
    heading2: string
    bodyText: string
    step1Title: string
    step1Desc: string
    step2Title: string
    step2Desc: string
    step3Title: string
    step3Desc: string
    dayLabel: string
    activityTitle: string
    activityDetail: string
  }
  // ─── How It Works section ────────────────────────────────────────────────────
  how: {
    label: string
    title: string
    steps: Array<{
      num: string
      title: string
      desc: string
    }>
  }
  // ─── Capsule section ─────────────────────────────────────────────────────────
  capsule: {
    label: string
    title: string
    sub: string
    note: string
  }
  // ─── Sample output section ───────────────────────────────────────────────────
  sample: {
    label: string
    title: string
    sub: string
    moods: string[]
  }
  // ─── Pricing section ─────────────────────────────────────────────────────────
  pricing: {
    label: string
    title: string
    sub: string
    badge: string
    period: string
    features: string[]
    cta: string
    guarantee: string
  }
  // ─── FAQ section ────────────────────────────────────────────────────────────
  faq: {
    label: string
    title: string
    items: Array<{ q: string; a: string }>
  }
  // ─── Partner section ─────────────────────────────────────────────────────────
  partner: {
    label: string
    title: string
    sub: string
    nameLabel: string
    namePlaceholder: string
    companyLabel: string
    companyPlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    typeLabel: string
    typePlaceholder: string
    typeOptions: string[]
    messageLabel: string
    messagePlaceholder: string
    submitBtn: string
    submitting: string
    successMsg: string
    errorMsg: string
    networkError: string
  }
  // ─── Form section ────────────────────────────────────────────────────────────
  form: {
    label: string
    title: string
    sub: string
    totalDays: string
    totalCities: string
    moreCities: string
    cityLabel: string
    cityPlaceholder: string
    cityNights: string
    cityAdd: string
    cityMax: string
    monthLabel: string
    months: string[]
    photoLabel: string
    photoOptional: string
    photoDrop: string
    photoDragOver: string
    photoSub: string
    photoFormats: string
    photoFaceRec: string
    photoUploaded: string
    photoChange: string
    photoPrivacy: string
    previewTitle: string
    previewCaption: string
    imageGen: string
    capsuleWardrobe: string
    dailyPlan: string
    shareGallery: string
    included: string
    totalLabel: string
    checkoutBtn: string
    checkoutSub: string
    priceNote: string
    processing: string
  }
  // ─── Toast messages ──────────────────────────────────────────────────────────
  toast: {
    cityMax: string
    cityAdded: string
    imageOnly: string
    imageTooLarge: string
    photoUploaded: string
    cityRequired: string
    galleryLink: string
  }
  // ─── Checkout modal ──────────────────────────────────────────────────────────
  checkout: {
    title: string
    subtitle: string
    doneTitle: string
    doneSubtitle: string
    phases: string[]
    progressLabel: string
    steps: string[]
    stepIcons: string[]
    processing: string
    trustBadges: string[]
    galleryBtn: string
  }
  // ─── Share modal ─────────────────────────────────────────────────────────────
  share: {
    title: string
    sub: string
    previewText: string
    editableLabel: string
    copyLink: string
    copied: string
    nativeShare: string
    saveImage: string
    saving: string
    referralTitle: string
    referralSub: string
    referralBtn: string
    nativeShareTitle: (cities: string) => string
    viralCopies: (cities: string, month: string, city0: string) => string
  }
  // ─── Result page ─────────────────────────────────────────────────────────────
  result: {
    processing: {
      label: string
      title: string
      sub: string
      completed: string
      status: {
        completed: string
        processing: string
        waiting: string
      }
    }
    gallery: {
      label: string
      title: string
      shareBtn: string
      twitterBtn: string
    }
    wardrobe: {
      label: string
      title: string
    }
    dailyPlan: {
      label: string
      title: string
      day: string
    }
    shareCta: {
      title: string
      sub: string
    }
    stickyBar: {
      myStyle: string
      shareBtn: string
    }
    error: {
      title: string
      sub: string
      home: string
    }
    homeLink: string
  }
  testimonial: {
    quote: string
    author: string
    detail: string
  }
  cta: {
    heading1: string
    heading2: string
    sub: string
    button: string
    note: string
  }
  footer: {
    tagline: string
    journal: string
    methodology: string
    pricing: string
    login: string
    instagram: string
    copyright: string
    privacy: string
    terms: string
    // Used by Footer.tsx component
    serviceTitle: string
    howItWorks: string
    startNow: string
    sampleView: string
    supportTitle: string
    faq: string
    refund: string
    contact: string
    legalTitle: string
    trustBadges: string[]
  }
}

// ─── Shared extended sections (used in all locales) ──────────────────────────

const enExtended = {
  how: {
    label: 'Simple Process',
    title: 'Your Perfect Wardrobe in 3 Steps',
    steps: [
      {
        num: '01',
        title: 'Input Destination & Dates',
        desc: 'Tell us where and when. We pull historical weather patterns and live forecasts instantly.',
      },
      {
        num: '02',
        title: 'Define Your Style',
        desc: 'Upload a photo or choose a vibe. Our AI matches functional weather-appropriate gear with your aesthetic.',
      },
      {
        num: '03',
        title: 'Get Your Weather-Proof Plan',
        desc: 'Receive your custom $5 Capsule Plan. Includes fabric recommendations, layers, and a daily outfit guide.',
      },
    ],
  },
  capsule: {
    label: 'The Capsule',
    title: 'Your 10-Item Capsule Wardrobe',
    sub: '10 essential items, 20+ unique outfit combinations. Every piece earns its place.',
    note: 'Each item is selected for maximum versatility across all your destinations.',
  },
  sample: {
    label: 'Sample Output',
    title: 'AI-Generated Outfit Previews',
    sub: 'Real results from our AI styling engine — generated for actual Travel Capsule AI users.',
    moods: [
      'Paris — Rainy Chic',
      'Tokyo — Urban Minimal',
      'Bali — Coastal Ease',
      'Rome — Golden Hour',
      'New York — Street Edge',
      'Barcelona — Sun-Soaked Bold',
    ],
  },
  pricing: {
    label: 'Pricing',
    title: 'One Simple Price',
    sub: 'One trip, one price. No subscription. No hidden fees. Just your perfect packing list.',
    badge: 'Most Popular',
    period: 'per trip',
    features: [
      'AI outfit images (3–4 per city)',
      '10-item capsule wardrobe list',
      'Day-by-day outfit guide',
      'Shareable gallery link',
      'Weather-optimized styling',
    ],
    cta: 'Start My $5 Plan',
    guarantee: '24-hour money-back guarantee if generation fails.',
  },
  faq: {
    label: 'FAQ',
    title: 'Frequently Asked Questions',
    items: [
      {
        q: 'Do I need to upload a photo?',
        a: 'No. Without a photo, we generate outfits using AI fashion models. With your photo, we incorporate face-preservation for a more personal result.',
      },
      {
        q: 'How is my photo handled?',
        a: 'Your photo is used only for image generation and deleted immediately after. We never share or use it for training.',
      },
      {
        q: 'How long does it take?',
        a: 'Typically 2–4 minutes after payment. More cities may take slightly longer.',
      },
      {
        q: 'How many cities can I add?',
        a: 'Up to 5 cities per trip in the current version.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Yes. If the generated images are clearly incorrect, we offer a 100% refund within 24 hours.',
      },
    ],
  },
  partner: {
    label: 'Partners',
    title: 'Partner With Us',
    sub: 'We work with travel agencies, fashion brands, and lifestyle platforms.\nReach out to discuss collaboration.',
    nameLabel: 'Full Name',
    namePlaceholder: 'Your name',
    companyLabel: 'Company',
    companyPlaceholder: 'Your company',
    emailLabel: 'Email',
    emailPlaceholder: 'you@company.com',
    typeLabel: 'Partnership Type',
    typePlaceholder: 'Select a type',
    typeOptions: ['Travel Agency', 'Fashion Brand', 'Lifestyle Platform', 'Media / Press', 'Other'],
    messageLabel: 'Message',
    messagePlaceholder: 'Tell us about the partnership opportunity...',
    submitBtn: 'Send Inquiry',
    submitting: 'Sending...',
    successMsg: "Message sent! We'll be in touch within 2 business days.",
    errorMsg: 'Failed to send. Please try again.',
    networkError: 'Network error. Please check your connection.',
  },
  form: {
    label: 'Plan Your Trip',
    title: 'Where Are You Headed?',
    sub: 'Tell us your destination and travel month. We handle the rest.',
    totalDays: ' days',
    totalCities: ' cities',
    moreCities: 'Add up to',
    cityLabel: 'Cities',
    cityPlaceholder: 'Search city...',
    cityNights: 'nights',
    cityAdd: '+ Add City',
    cityMax: '(max 5)',
    monthLabel: 'Travel Month',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    photoLabel: 'Your Photo',
    photoOptional: 'Optional',
    photoDrop: 'Drop photo here or click to upload',
    photoDragOver: 'Drop to upload',
    photoSub: 'For personalized outfit images',
    photoFormats: 'JPG, PNG · Max 10MB',
    photoFaceRec: 'Used for face-preservation only. Deleted after generation.',
    photoUploaded: 'Photo uploaded',
    photoChange: 'Click to change',
    photoPrivacy: 'Deleted after generation · Never shared',
    previewTitle: 'Your Order Summary',
    previewCaption: 'Everything included in your $5 plan:',
    imageGen: 'AI Outfit Images',
    capsuleWardrobe: 'Capsule Wardrobe List',
    dailyPlan: 'Day-by-Day Outfit Guide',
    shareGallery: 'Shareable Gallery',
    included: 'Included',
    totalLabel: 'Total',
    checkoutBtn: 'Continue to Payment — $5',
    checkoutSub: 'Powered by Polar · Secure checkout',
    priceNote: 'One-time payment · No subscription',
    processing: 'Processing...',
  },
  toast: {
    cityMax: 'Maximum 5 cities allowed.',
    cityAdded: 'City added!',
    imageOnly: 'Please upload an image file.',
    imageTooLarge: 'Image must be under 10MB.',
    photoUploaded: 'Photo uploaded successfully.',
    cityRequired: 'Please add at least one city.',
    galleryLink: 'Your gallery link has been copied!',
  },
  checkout: {
    title: 'Generating Your Capsule',
    subtitle: 'AI is analyzing your destinations and crafting your wardrobe...',
    doneTitle: 'Your Capsule Is Ready!',
    doneSubtitle: 'Redirecting to your personal style gallery...',
    phases: ['Weather Analysis', 'Style Generation', 'Gallery Build'],
    progressLabel: '%',
    steps: [
      'Fetching weather data',
      'Analyzing city vibes',
      'Generating outfit images',
      'Building capsule wardrobe',
      'Preparing your gallery',
    ],
    stepIcons: ['🌤️', '✨', '👗', '🧳', '🎨'],
    processing: 'Processing',
    trustBadges: ['Secure Payment', 'Instant Delivery', 'Money-Back Guarantee'],
    galleryBtn: 'View My Gallery',
  },
  share: {
    title: 'Share Your Style',
    sub: 'Share your AI-curated travel wardrobe',
    previewText: 'Preview your share card',
    editableLabel: 'Edit your caption',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    nativeShare: 'Share',
    saveImage: 'Save Image',
    saving: 'Saving...',
    referralTitle: 'Invite a Friend',
    referralSub: 'Share Travel Capsule AI and help them pack perfectly.',
    referralBtn: 'Invite Friends',
    nativeShareTitle: (cities: string) => `My ${cities} Travel Capsule`,
    viralCopies: (cities: string, month: string, city0: string) =>
      `I just built my AI travel wardrobe for ${cities} in ${month}! Check out my ${city0} outfits — Travel Capsule AI nailed the weather and vibe. ✈️`,
  },
  result: {
    processing: {
      label: 'Generating Your Capsule',
      title: 'Your AI stylist\nis at work.',
      sub: 'We\'re analyzing weather, city vibes, and generating your personalized outfit images.',
      completed: 'looks completed',
      status: {
        completed: 'Done',
        processing: 'Generating...',
        waiting: 'Waiting',
      },
    },
    gallery: {
      label: 'Your Style Gallery',
      title: 'Your Travel Capsule',
      shareBtn: 'Share My Style',
      twitterBtn: 'Post on X',
    },
    wardrobe: {
      label: 'Capsule Wardrobe',
      title: 'Your 10-Item Capsule',
    },
    dailyPlan: {
      label: 'Daily Plan',
      title: 'Day-by-Day Outfit Guide',
      day: 'Day',
    },
    shareCta: {
      title: 'Love Your Capsule?',
      sub: 'Share your AI travel wardrobe and inspire others to pack smarter.',
    },
    stickyBar: {
      myStyle: 'My Travel Style',
      shareBtn: 'Share',
    },
    error: {
      title: 'Something went wrong',
      sub: 'We could not load your trip results. Please try again.',
      home: 'Return Home',
    },
    homeLink: 'Back to Home',
  },
}

// ─── English ───────────────────────────────────────────────────────────────────

const en: Translations = {
  nav: {
    philosophy: 'Philosophy',
    curations: 'Curations',
    membership: 'Membership',
    signIn: 'Sign In',
    cta: 'Begin Journey',
    howItWorks: 'How It Works',
    pricing: 'Pricing',
    faq: 'FAQ',
  },
  hero: {
    badge: 'The Future of Travel Wardrobe',
    heading1: 'The End of',
    heading2: 'Weather Guesswork.',
    sub: 'Stop guessing the weather. Start wearing the right outfits. Bespoke packing lists for Tokyo, Paris, and beyond.',
    cta: 'Curate My Capsule',
    estLabel: 'Est. 2025',
    scrollLabel: 'Scroll to Explore',
    editionLabel: 'Global Edition',
    tag: 'AI Travel Styling · $5/trip',
    headline1: 'The End of',
    headline2: 'Weather Guesswork.',
    headline3: '',
    highlight: 'AI-curated outfits',
    socialProof: 'for every city on your itinerary.',
    ctaPrimary: 'Curate My Capsule — $5',
    ctaSecondary: 'See Sample Output',
    trust: {
      outfitImages: 'AI Outfit Images',
      capsuleWardrobe: 'Capsule Wardrobe',
      generationTime: '~3 Min Delivery',
      price: '$5 / Trip',
    },
  },
  weather: {
    sectionLabel: 'Live Data Styling',
    heading1: 'Precision Weather',
    heading2: 'Mapping.',
    forecastLabel: 'Forecast',
    windyLabel: 'Windy',
    windNote: 'High winds expected. Opt for structured layers and wind-resistant fabrics.',
    windyDayEdit: 'The Windy Day Edit',
    thermalTitle: 'Thermal Comfort',
    thermalDesc: 'Fabric weight adjusted for real-feel temperature.',
    humidityTitle: 'Humidity Control',
    humidityDesc: 'Breathable layers selected for high-moisture days.',
    bodyText:
      "We don't just look at the temperature. Our algorithms analyze hourly humidity, wind speeds, and \"feels like\" metrics to select the perfect fabrics for your comfort.",
  },
  blueprint: {
    sectionLabel: 'The Methodology',
    heading: 'The 10-Item Blueprint',
    desc: 'A curated capsule of 10 essential items that unlock 20+ unique outfits. Minimal packing, maximum style.',
    outerLayerLabel: '01. The Outer Layer',
    outerLayerName: 'Italian Wool Overcoat',
    seeAllItems: 'See all 10 items',
    curatedFor: 'Curated for: 12-Day European Tour',
    totalWeight: 'Total Weight: 7.2kg',
  },
  guide: {
    sectionLabel: 'Daily Guidance',
    heading1: 'Wear-It-Now',
    heading2: 'Daily Guide.',
    bodyText:
      "Wake up and know exactly what to put on. A calendar-style view showing your outfit for each day of the trip, optimized for that day's specific activities and weather.",
    step1Title: 'Input Destination',
    step1Desc: 'Tell us where and when. We pull historical weather patterns and live forecasts.',
    step2Title: 'Define Your Style',
    step2Desc: 'Upload a photo or choose a vibe. AI matches functional gear with your aesthetic.',
    step3Title: 'Get Your Plan',
    step3Desc: 'Receive your custom $5 Capsule Plan. Fabric recs, layers, and daily guide.',
    dayLabel: 'Day 03',
    activityTitle: 'Museum Hopping',
    activityDetail: 'Indoor/Outdoor · 22°C',
  },
  testimonial: {
    quote:
      "I used to pack for 'just in case' and still freeze. Travel Capsule AI predicted the cold snap in Rome and packed me the perfect layers.",
    author: 'Jessica Cole',
    detail: 'Traveled to Italy in November',
  },
  cta: {
    heading1: 'Never Check the',
    heading2: 'Weather App Again.',
    sub: 'Stop stress-packing. Get your personalized packing list and day-by-day outfit guide today.',
    button: 'Start My $5 Plan',
    note: 'One-time payment · No subscription',
  },
  footer: {
    tagline: 'Data-driven styling for the modern traveler. Look effortless, anywhere in the world.',
    journal: 'Journal',
    methodology: 'Methodology',
    pricing: 'Pricing',
    login: 'Login',
    instagram: 'Instagram',
    copyright: '© 2025 Travel Capsule AI. All rights reserved.',
    privacy: 'Privacy',
    terms: 'Terms',
    serviceTitle: 'Service',
    howItWorks: 'How It Works',
    startNow: 'Start Now',
    sampleView: 'See Sample',
    supportTitle: 'Support',
    faq: 'FAQ',
    refund: 'Refund Policy',
    contact: 'Contact Us',
    legalTitle: 'Legal',
    trustBadges: ['Secure Payment', 'Instant Delivery', 'Money-Back Guarantee'],
  },
  ...enExtended,
}

// ─── Korean ────────────────────────────────────────────────────────────────────

const ko: Translations = {
  nav: {
    philosophy: '철학',
    curations: '큐레이션',
    membership: '멤버십',
    signIn: '로그인',
    cta: '여행 시작하기',
    howItWorks: '이용 방법',
    pricing: '가격',
    faq: 'FAQ',
  },
  hero: {
    badge: '당신의 여행을 스타일링하는 AI',
    heading1: '날씨 걱정의 끝,',
    heading2: '완벽한 여행 코디.',
    sub: '날씨를 추측하는 시대는 끝났습니다. AI가 도쿄, 파리, 그 너머를 위한 맞춤 패킹 리스트를 완성합니다.',
    cta: '나만의 캡슐 만들기',
    estLabel: '설립 2025',
    scrollLabel: '스크롤하여 탐색',
    editionLabel: '글로벌 에디션',
    tag: 'AI 여행 스타일링 · $5/트립',
    headline1: '날씨 걱정의 끝,',
    headline2: '완벽한 여행 코디.',
    headline3: '',
    highlight: 'AI 맞춤 코디',
    socialProof: '여행지마다 완벽하게.',
    ctaPrimary: '나만의 캡슐 만들기 — $5',
    ctaSecondary: '샘플 보기',
    trust: {
      outfitImages: 'AI 코디 이미지',
      capsuleWardrobe: '캡슐 워드로브',
      generationTime: '~3분 배송',
      price: '$5 / 트립',
    },
  },
  weather: {
    sectionLabel: '실시간 데이터 스타일링',
    heading1: '정밀 날씨',
    heading2: '맵핑.',
    forecastLabel: '예보',
    windyLabel: '바람',
    windNote: '강한 바람이 예상됩니다. 구조적인 레이어와 방풍 소재를 선택하세요.',
    windyDayEdit: '바람 부는 날의 코디',
    thermalTitle: '체온 최적화',
    thermalDesc: '체감 온도에 맞게 조정된 원단 무게.',
    humidityTitle: '습도 관리',
    humidityDesc: '고습도 환경을 위한 통기성 레이어 선택.',
    bodyText:
      '단순히 온도만 보는 것이 아닙니다. 시간별 습도, 풍속, 체감온도를 분석해 최적의 소재를 추천합니다.',
  },
  blueprint: {
    sectionLabel: '방법론',
    heading: '10가지 아이템으로 완성하는 여행 스타일',
    desc: '10가지 필수 아이템으로 20가지 이상의 코디를 완성합니다. 최소한의 짐, 최대한의 스타일.',
    outerLayerLabel: '01. 아우터 레이어',
    outerLayerName: '이탈리아 울 오버코트',
    seeAllItems: '10가지 아이템 모두 보기',
    curatedFor: '큐레이션: 12일 유럽 여행',
    totalWeight: '총 무게: 7.2kg',
  },
  guide: {
    sectionLabel: '데일리 가이드',
    heading1: '지금 바로 입는',
    heading2: '데일리 가이드.',
    bodyText:
      '매일 아침 무엇을 입을지 정확히 알 수 있습니다. 여행의 각 일정과 날씨에 최적화된 코디를 달력 형식으로 제공합니다.',
    step1Title: '목적지 입력',
    step1Desc: '어디로, 언제 가는지 알려주세요. 과거 날씨 패턴과 실시간 예보를 가져옵니다.',
    step2Title: '스타일 정의',
    step2Desc: '사진을 업로드하거나 분위기를 선택하세요. AI가 기능성과 미적 감각을 매칭합니다.',
    step3Title: '플랜 받기',
    step3Desc: '$5 캡슐 플랜을 받으세요. 소재 추천, 레이어링, 데일리 가이드가 포함됩니다.',
    dayLabel: '3일차',
    activityTitle: '박물관 투어',
    activityDetail: '실내/실외 · 22°C',
  },
  testimonial: {
    quote:
      "항상 '혹시 모르니'로 짐을 싸도 추위에 떨었어요. Travel Capsule AI가 로마의 갑작스러운 한파를 예측하고 완벽한 레이어링을 챙겨줬습니다.",
    author: '제시카 콜',
    detail: '11월 이탈리아 여행',
  },
  cta: {
    heading1: '날씨 앱을',
    heading2: '다시는 확인하지 마세요.',
    sub: '스트레스 없는 패킹. 오늘 바로 맞춤 패킹 리스트와 데일리 코디 가이드를 받으세요.',
    button: '$5 플랜 시작하기',
    note: '일회성 결제 · 구독 없음',
  },
  footer: {
    tagline: '현대 여행자를 위한 데이터 기반 스타일링. 전 세계 어디서나 자연스럽게.',
    journal: '저널',
    methodology: '방법론',
    pricing: '가격',
    login: '로그인',
    instagram: '인스타그램',
    copyright: '© 2025 Travel Capsule AI. 모든 권리 보유.',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    serviceTitle: '서비스',
    howItWorks: '이용 방법',
    startNow: '지금 시작',
    sampleView: '샘플 보기',
    supportTitle: '지원',
    faq: 'FAQ',
    refund: '환불 정책',
    contact: '문의하기',
    legalTitle: '법적 정보',
    trustBadges: ['안전한 결제', '즉시 배송', '환불 보장'],
  },
  ...enExtended,
}

// ─── Japanese ─────────────────────────────────────────────────────────────────

const ja: Translations = {
  nav: {
    philosophy: '哲学',
    curations: 'キュレーション',
    membership: 'メンバーシップ',
    signIn: 'サインイン',
    cta: '旅を始める',
    howItWorks: '使い方',
    pricing: '料金',
    faq: 'FAQ',
  },
  hero: {
    badge: '旅のスタイルを、AIが変える',
    heading1: '天気の心配、',
    heading2: 'もう終わり。',
    sub: '天気を推測する時代は終わりました。AIが東京、パリ、そしてその先のためのパッキングリストを作ります。',
    cta: 'カプセルを作る',
    estLabel: '設立 2025',
    scrollLabel: 'スクロールして探す',
    editionLabel: 'グローバル版',
    tag: 'AIトラベルスタイリング · $5/旅',
    headline1: '天気の心配、',
    headline2: 'もう終わり。',
    headline3: '',
    highlight: 'AIキュレーションコーデ',
    socialProof: '旅程のすべての都市で。',
    ctaPrimary: 'カプセルを作る — $5',
    ctaSecondary: 'サンプルを見る',
    trust: {
      outfitImages: 'AIコーデ画像',
      capsuleWardrobe: 'Capsule Wardrobe',
      generationTime: '最短3分で完成',
      price: '$5 / 旅',
    },
  },
  weather: {
    sectionLabel: 'ライブデータスタイリング',
    heading1: '精密天気',
    heading2: 'マッピング。',
    forecastLabel: '予報',
    windyLabel: '風',
    windNote: '強風が予想されます。構造的なレイヤーと防風素材を選びましょう。',
    windyDayEdit: '風の日のコーディネート',
    thermalTitle: '体感温度の快適さ',
    thermalDesc: '体感温度に合わせた生地の重さ調整。',
    humidityTitle: '湿度コントロール',
    humidityDesc: '高湿度の日のための通気性レイヤー選択。',
    bodyText:
      '気温だけを見るのではありません。時間ごとの湿度、風速、体感温度を分析して最適な素材を推薦します。',
  },
  blueprint: {
    sectionLabel: '方法論',
    heading: '10着で叶える旅スタイル',
    desc: '10のアイテムで20以上のコーディネートを完成させます。最小限の荷物、最大限のスタイル。',
    outerLayerLabel: '01. アウターレイヤー',
    outerLayerName: 'イタリアン・ウールオーバーコート',
    seeAllItems: '10アイテムすべて見る',
    curatedFor: 'キュレーション: 12日間ヨーロッパツアー',
    totalWeight: '総重量: 7.2kg',
  },
  guide: {
    sectionLabel: 'デイリーガイド',
    heading1: '今すぐ着る',
    heading2: 'デイリーガイド。',
    bodyText:
      '毎朝、何を着るかを正確に知ることができます。旅行の各日のスケジュールと天気に最適化されたコーデをカレンダー形式で提供します。',
    step1Title: '目的地を入力',
    step1Desc: 'どこへ、いつ行くかを教えてください。過去の天気パターンとライブ予報を取得します。',
    step2Title: 'スタイルを定義',
    step2Desc: '写真をアップロードするか雰囲気を選んでください。AIが機能性と美的感覚をマッチングします。',
    step3Title: 'プランを受け取る',
    step3Desc: '$5のカプセルプランを受け取ります。素材のレコメンド、レイヤリング、デイリーガイドが含まれます。',
    dayLabel: '3日目',
    activityTitle: 'ミュージアム巡り',
    activityDetail: '室内/屋外 · 22°C',
  },
  testimonial: {
    quote:
      '「念のため」と荷物を詰めても凍えていました。Travel Capsule AIがローマの寒波を予測して、完璧なレイヤリングを提案してくれました。',
    author: 'ジェシカ・コール',
    detail: '11月にイタリアを旅行',
  },
  cta: {
    heading1: '天気アプリを',
    heading2: 'もう開かなくていい。',
    sub: 'ストレスのないパッキング。今日からパーソナライズされたパッキングリストとデイリーコーデガイドを手に入れましょう。',
    button: 'まず$5で試してみる',
    note: '1回限りの支払い・サブスクなし',
  },
  footer: {
    tagline: '現代の旅行者のためのデータ駆動スタイリング。世界中どこでも自然に。',
    journal: 'ジャーナル',
    methodology: '方法論',
    pricing: '価格',
    login: 'ログイン',
    instagram: 'インスタグラム',
    copyright: '© 2025 Travel Capsule AI. All rights reserved.',
    privacy: 'プライバシー',
    terms: '利用規約',
    serviceTitle: 'サービス',
    howItWorks: '使い方',
    startNow: '今すぐ始める',
    sampleView: 'サンプルを見る',
    supportTitle: 'サポート',
    faq: 'FAQ',
    refund: '返金ポリシー',
    contact: 'お問い合わせ',
    legalTitle: '法的情報',
    trustBadges: ['安全な決済', '即時配信', '返金保証'],
  },
  ...enExtended,
}

// ─── Chinese (simplified — stub, falls back to English) ───────────────────────

const zh: Translations = {
  nav: {
    philosophy: '理念',
    curations: '精选',
    membership: '会员',
    signIn: '登录',
    cta: '开始旅程',
    howItWorks: '如何使用',
    pricing: '定价',
    faq: 'FAQ',
  },
  hero: {
    badge: 'AI 为你搭配旅行穿搭',
    heading1: '告别',
    heading2: '天气猜测。',
    sub: '停止猜测天气。开始穿对衣服。为东京、巴黎及更多目的地提供定制打包清单。',
    cta: '创建我的胶囊',
    estLabel: '成立于 2025',
    scrollLabel: '滚动探索',
    editionLabel: '全球版',
    tag: 'AI旅行造型 · $5/行程',
    headline1: '告别',
    headline2: '天气猜测。',
    headline3: '',
    highlight: 'AI精选搭配',
    socialProof: '为您行程中的每个城市。',
    ctaPrimary: '创建我的胶囊 — $5',
    ctaSecondary: '查看示例',
    trust: {
      outfitImages: 'AI穿搭图片',
      capsuleWardrobe: 'Capsule Wardrobe',
      generationTime: '约3分钟交付',
      price: '$5 / 行程',
    },
  },
  weather: {
    sectionLabel: '实时数据造型',
    heading1: '精准解读',
    heading2: '每日天气。',
    forecastLabel: '预报',
    windyLabel: '有风',
    windNote: '预计大风。选择有结构的层次感和防风面料。',
    windyDayEdit: '大风日穿搭',
    thermalTitle: '热舒适度',
    thermalDesc: '根据体感温度调整面料重量。',
    humidityTitle: '湿度控制',
    humidityDesc: '为高湿度天气选择透气层次。',
    bodyText: '我们不只看温度。我们的算法分析每小时湿度、风速和体感温度，为您选择完美面料。',
  },
  blueprint: {
    sectionLabel: '方法论',
    heading: '10件单品，20+套穿搭',
    desc: '10件精选单品解锁20+独特搭配。最少行李，最大风格。',
    outerLayerLabel: '01. 外层',
    outerLayerName: '意大利羊毛大衣',
    seeAllItems: '查看全部10件',
    curatedFor: '精选：12天欧洲之旅',
    totalWeight: '总重量：7.2kg',
  },
  guide: {
    sectionLabel: '每日指南',
    heading1: '即穿',
    heading2: '每日指南。',
    bodyText: '每天早上精确知道穿什么。以日历形式展示旅行每天的穿搭，针对当天活动和天气优化。',
    step1Title: '输入目的地',
    step1Desc: '告诉我们去哪里、什么时候。我们获取历史天气模式和实时预报。',
    step2Title: '定义风格',
    step2Desc: '上传照片或选择氛围。AI将功能性装备与您的美学匹配。',
    step3Title: '获取计划',
    step3Desc: '获得定制$5胶囊计划。面料推荐、层次搭配和每日指南。',
    dayLabel: '第03天',
    activityTitle: '博物馆游览',
    activityDetail: '室内/室外 · 22°C',
  },
  testimonial: {
    quote: '我以前"以防万一"打包却还是受冻。Travel Capsule AI预测了罗马的寒流，为我准备了完美的层次搭配。',
    author: '杰西卡·科尔',
    detail: '11月前往意大利旅行',
  },
  cta: {
    heading1: '再也不用查',
    heading2: '天气应用了。',
    sub: '告别焦虑打包。今天就获取您的个性化打包清单和每日穿搭指南。',
    button: '立即体验 — $5',
    note: '一次性付款 · 无订阅',
  },
  footer: {
    tagline: '为现代旅行者提供数据驱动的造型。在世界任何地方都能从容自如。',
    journal: '日志',
    methodology: '方法论',
    pricing: '定价',
    login: '登录',
    instagram: 'Instagram',
    copyright: '© 2025 Travel Capsule AI. 保留所有权利。',
    privacy: '隐私政策',
    terms: '服务条款',
    serviceTitle: '服务',
    howItWorks: '如何使用',
    startNow: '立即开始',
    sampleView: '查看示例',
    supportTitle: '支持',
    faq: 'FAQ',
    refund: '退款政策',
    contact: '联系我们',
    legalTitle: '法律信息',
    trustBadges: ['安全支付', '即时配送', '退款保证'],
  },
  ...enExtended,
}

// ─── French (stub) ────────────────────────────────────────────────────────────

const fr: Translations = {
  nav: {
    philosophy: 'Philosophie',
    curations: 'Sélections',
    membership: 'Abonnement',
    signIn: 'Connexion',
    cta: 'Commencer',
    howItWorks: 'Comment ça marche',
    pricing: 'Tarifs',
    faq: 'FAQ',
  },
  hero: {
    badge: "Le stylisme de voyage, réinventé par l'AI",
    heading1: 'La fin des',
    heading2: 'suppositions météo.',
    sub: 'Arrêtez de deviner la météo. Commencez à porter les bons vêtements. Listes de bagages sur mesure pour Tokyo, Paris et au-delà.',
    cta: 'Créer ma capsule',
    estLabel: 'Fondé en 2025',
    scrollLabel: 'Défiler pour explorer',
    editionLabel: 'Édition mondiale',
    tag: 'Stylisme IA · 5 $/voyage',
    headline1: 'La fin des',
    headline2: 'suppositions météo.',
    headline3: '',
    highlight: 'tenues IA personnalisées',
    socialProof: 'pour chaque ville de votre itinéraire.',
    ctaPrimary: 'Créer ma capsule — 5 $',
    ctaSecondary: 'Voir un exemple',
    trust: {
      outfitImages: 'Images de tenues IA',
      capsuleWardrobe: 'Capsule Wardrobe',
      generationTime: '~3 min de livraison',
      price: '5 $ / voyage',
    },
  },
  weather: {
    sectionLabel: 'Stylisme par la data',
    heading1: 'Cartographie météo',
    heading2: 'de précision.',
    forecastLabel: 'Prévisions',
    windyLabel: 'Venteux',
    windNote: 'Vents forts attendus. Optez pour des couches structurées et des tissus résistants au vent.',
    windyDayEdit: "La sélection jour de vent",
    thermalTitle: 'Confort thermique',
    thermalDesc: 'Poids du tissu ajusté pour la température ressentie.',
    humidityTitle: "Contrôle de l'humidité",
    humidityDesc: 'Couches respirantes sélectionnées pour les jours humides.',
    bodyText:
      "Nous ne regardons pas seulement la température. Nos algorithmes analysent l'humidité horaire, les vitesses du vent et les métriques \"ressenti\" pour sélectionner les tissus parfaits.",
  },
  blueprint: {
    sectionLabel: 'La méthodologie',
    heading: 'La Capsule en 10 pièces',
    desc: 'Une capsule de 10 essentiels qui débloquent 20+ tenues uniques. Bagages minimaux, style maximal.',
    outerLayerLabel: '01. La couche extérieure',
    outerLayerName: 'Manteau en laine italienne',
    seeAllItems: 'Voir les 10 pièces',
    curatedFor: 'Sélectionné pour : Tour européen 12 jours',
    totalWeight: 'Poids total : 7,2 kg',
  },
  guide: {
    sectionLabel: 'Guide quotidien',
    heading1: 'Guide quotidien',
    heading2: 'à porter maintenant.',
    bodyText:
      "Réveillez-vous et sachez exactement quoi mettre. Une vue calendrier montrant votre tenue pour chaque jour du voyage, optimisée pour les activités et la météo.",
    step1Title: 'Entrer la destination',
    step1Desc: 'Dites-nous où et quand. Nous récupérons les données météo historiques et les prévisions en direct.',
    step2Title: 'Définir votre style',
    step2Desc: 'Téléchargez une photo ou choisissez une ambiance. L\'IA associe l\'équipement fonctionnel à votre esthétique.',
    step3Title: 'Obtenir votre plan',
    step3Desc: 'Recevez votre plan capsule personnalisé à 5 $. Recommandations de tissus, couches et guide quotidien.',
    dayLabel: 'Jour 03',
    activityTitle: 'Visite de musées',
    activityDetail: 'Intérieur/Extérieur · 22°C',
  },
  testimonial: {
    quote:
      "J'avais l'habitude de faire ma valise 'au cas où' et d'avoir quand même froid. Travel Capsule AI a prédit la vague de froid à Rome et m'a préparé les couches parfaites.",
    author: 'Jessica Cole',
    detail: "Voyagé en Italie en novembre",
  },
  cta: {
    heading1: "Ne vérifiez plus jamais",
    heading2: "l'application météo.",
    sub: 'Fini le stress des valises. Obtenez votre liste de bagages personnalisée et votre guide tenue jour par jour.',
    button: 'Créer ma Capsule — 5 $',
    note: 'Paiement unique · Sans abonnement',
  },
  footer: {
    tagline: 'Stylisme piloté par les données pour le voyageur moderne. Soyez impeccable, partout dans le monde.',
    journal: 'Journal',
    methodology: 'Méthodologie',
    pricing: 'Tarifs',
    login: 'Connexion',
    instagram: 'Instagram',
    copyright: '© 2025 Travel Capsule AI. Tous droits réservés.',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    serviceTitle: 'Service',
    howItWorks: 'Comment ça marche',
    startNow: 'Commencer',
    sampleView: 'Voir un exemple',
    supportTitle: 'Assistance',
    faq: 'FAQ',
    refund: 'Politique de remboursement',
    contact: 'Nous contacter',
    legalTitle: 'Mentions légales',
    trustBadges: ['Paiement sécurisé', 'Livraison instantanée', 'Garantie remboursement'],
  },
  ...enExtended,
}

// ─── Spanish (stub) ───────────────────────────────────────────────────────────

const es: Translations = {
  nav: {
    philosophy: 'Filosofía',
    curations: 'Selecciones',
    membership: 'Membresía',
    signIn: 'Iniciar sesión',
    cta: 'Comenzar viaje',
    howItWorks: 'Cómo funciona',
    pricing: 'Precios',
    faq: 'FAQ',
  },
  hero: {
    badge: 'Tu estilo de viaje, creado por AI',
    heading1: 'El fin de',
    heading2: 'adivinar el tiempo.',
    sub: 'Deja de adivinar el tiempo. Empieza a vestir correctamente. Listas de equipaje a medida para Tokio, París y más allá.',
    cta: 'Crear mi cápsula',
    estLabel: 'Fundado en 2025',
    scrollLabel: 'Desplázate para explorar',
    editionLabel: 'Edición global',
    tag: 'Estilismo IA · $5/viaje',
    headline1: 'El fin de',
    headline2: 'adivinar el tiempo.',
    headline3: '',
    highlight: 'conjuntos IA personalizados',
    socialProof: 'para cada ciudad de tu itinerario.',
    ctaPrimary: 'Crear mi cápsula — $5',
    ctaSecondary: 'Ver ejemplo',
    trust: {
      outfitImages: 'Imágenes de conjuntos IA',
      capsuleWardrobe: 'Capsule Wardrobe',
      generationTime: '~3 min de entrega',
      price: '$5 / viaje',
    },
  },
  weather: {
    sectionLabel: 'Estilismo con data real',
    heading1: 'Mapeo meteorológico',
    heading2: 'de precisión.',
    forecastLabel: 'Pronóstico',
    windyLabel: 'Ventoso',
    windNote: 'Se esperan vientos fuertes. Opta por capas estructuradas y tejidos resistentes al viento.',
    windyDayEdit: 'La selección para días de viento',
    thermalTitle: 'Confort térmico',
    thermalDesc: 'Peso del tejido ajustado para la temperatura real.',
    humidityTitle: 'Control de humedad',
    humidityDesc: 'Capas transpirables seleccionadas para días de alta humedad.',
    bodyText:
      'No solo miramos la temperatura. Nuestros algoritmos analizan la humedad horaria, velocidades del viento y métricas de "sensación térmica" para seleccionar los tejidos perfectos.',
  },
  blueprint: {
    sectionLabel: 'La metodología',
    heading: 'Tu Capsule: 10 prendas, 20+ looks',
    desc: 'Una cápsula de 10 esenciales que desbloquean 20+ conjuntos únicos. Equipaje mínimo, estilo máximo.',
    outerLayerLabel: '01. La capa exterior',
    outerLayerName: 'Abrigo de lana italiana',
    seeAllItems: 'Ver las 10 prendas',
    curatedFor: 'Seleccionado para: Tour europeo de 12 días',
    totalWeight: 'Peso total: 7,2 kg',
  },
  guide: {
    sectionLabel: 'Guía diaria',
    heading1: 'Guía diaria',
    heading2: 'para vestir ahora.',
    bodyText:
      'Despiértate y sabe exactamente qué ponerte. Una vista de calendario mostrando tu conjunto para cada día del viaje, optimizado para las actividades y el tiempo.',
    step1Title: 'Ingresa el destino',
    step1Desc: 'Dinos dónde y cuándo. Obtenemos patrones meteorológicos históricos y pronósticos en vivo.',
    step2Title: 'Define tu estilo',
    step2Desc: 'Sube una foto o elige un ambiente. La IA combina equipo funcional con tu estética.',
    step3Title: 'Obtén tu plan',
    step3Desc: 'Recibe tu plan cápsula personalizado de $5. Recomendaciones de tejidos, capas y guía diaria.',
    dayLabel: 'Día 03',
    activityTitle: 'Visita a museos',
    activityDetail: 'Interior/Exterior · 22°C',
  },
  testimonial: {
    quote:
      "Solía hacer la maleta 'por si acaso' y aun así pasaba frío. Travel Capsule AI predijo la ola de frío en Roma y me preparó las capas perfectas.",
    author: 'Jessica Cole',
    detail: 'Viajó a Italia en noviembre',
  },
  cta: {
    heading1: 'Nunca más consultes',
    heading2: 'la app del tiempo.',
    sub: 'Deja de hacer maletas con estrés. Obtén tu lista de equipaje personalizada y guía de conjuntos día a día hoy.',
    button: 'Crear mi Capsule — $5',
    note: 'Pago único · Sin suscripción',
  },
  footer: {
    tagline: 'Estilismo basado en datos para el viajero moderno. Luce sin esfuerzo, en cualquier parte del mundo.',
    journal: 'Diario',
    methodology: 'Metodología',
    pricing: 'Precios',
    login: 'Iniciar sesión',
    instagram: 'Instagram',
    copyright: '© 2025 Travel Capsule AI. Todos los derechos reservados.',
    privacy: 'Privacidad',
    terms: 'Términos',
    serviceTitle: 'Servicio',
    howItWorks: 'Cómo funciona',
    startNow: 'Empezar ahora',
    sampleView: 'Ver ejemplo',
    supportTitle: 'Soporte',
    faq: 'FAQ',
    refund: 'Política de reembolso',
    contact: 'Contáctanos',
    legalTitle: 'Legal',
    trustBadges: ['Pago seguro', 'Entrega instantánea', 'Garantía de reembolso'],
  },
  ...enExtended,
}

// ─── Registry & helpers ────────────────────────────────────────────────────────

const translations: Record<Locale, Translations> = { en, ko, ja, zh, fr, es }

export function getTranslations(locale: Locale): Translations {
  return translations[locale] ?? translations.en
}

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const saved = localStorage.getItem('tc-locale') as Locale | null
  if (saved && saved in translations) return saved
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('ko')) return 'ko'
  if (lang.startsWith('ja')) return 'ja'
  if (lang.startsWith('zh')) return 'zh'
  if (lang.startsWith('fr')) return 'fr'
  if (lang.startsWith('es')) return 'es'
  return 'en'
}

export function saveLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tc-locale', locale)
  }
}
