export type Locale = 'ko' | 'en' | 'ja' | 'zh' | 'fr' | 'es'

export interface Translations {
  // Header
  nav: {
    howItWorks: string
    pricing: string
    faq: string
    cta: string
    philosophy: string
    curations: string
    membership: string
  }

  // Hero
  hero: {
    tag: string
    headline1: string
    headline2: string
    headline3: string
    sub: string
    highlight: string
    ctaPrimary: string
    ctaSecondary: string
    socialProof: string
    trust: {
      outfitImages: string
      capsuleWardrobe: string
      generationTime: string
      cities: string
      price: string
    }
    badge: string
    heading1: string
    heading2: string
    cta: string
    estLabel: string
    scrollLabel: string
    editionLabel: string
  }

  // How It Works
  how: {
    label: string
    title: string
    steps: Array<{ num: string; title: string; desc: string }>
  }

  // Form Section
  form: {
    label: string
    title: string
    sub: string
    cityLabel: string
    cityPlaceholder: string
    cityAdd: string
    cityMax: string
    cityNights: string
    cityMaxNote: string
    monthLabel: string
    months: string[]
    photoLabel: string
    photoOptional: string
    photoSub: string
    photoDrop: string
    photoFormats: string
    photoDragOver: string
    photoUploaded: string
    photoChange: string
    photoPrivacy: string
    photoFaceRec: string
    previewTitle: string
    previewCaption: string
    imageGen: string
    capsuleWardrobe: string
    dailyPlan: string
    shareGallery: string
    included: string
    totalLabel: string
    totalDays: string
    totalCities: string
    moreCities: string
    checkoutBtn: string
    checkoutSub: string
    priceNote: string
    processing: string
    cityRequired: string
  }

  // Sample Output
  sample: {
    label: string
    title: string
    sub: string
    moods: string[]
    wardrobeTitle: string
  }

  // Capsule
  capsule: {
    label: string
    title: string
    sub: string
    note: string
  }

  // Pricing
  pricing: {
    label: string
    title: string
    sub: string
    badge: string
    price: string
    period: string
    features: string[]
    cta: string
    guarantee: string
  }

  // FAQ
  faq: {
    label: string
    title: string
    items: Array<{ q: string; a: string }>
  }

  // Partner
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

  // Landing page: Weather section
  weather: {
    forecastLabel: string
    windyLabel: string
    windNote: string
    sectionLabel: string
    heading1: string
    heading2: string
    bodyText: string
    windyDayEdit: string
    thermalTitle: string
    thermalDesc: string
    humidityTitle: string
    humidityDesc: string
  }

  // Landing page: Blueprint section
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

  // Landing page: Guide section
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

  // Landing page: Testimonial
  testimonial: {
    quote: string
    author: string
    detail: string
  }

  // Landing page: CTA section
  cta: {
    heading1: string
    heading2: string
    sub: string
    button: string
    note: string
  }

  // Footer
  footer: {
    tagline: string
    serviceTitle: string
    supportTitle: string
    legalTitle: string
    howItWorks: string
    startNow: string
    sampleView: string
    faq: string
    refund: string
    contact: string
    terms: string
    privacy: string
    links: { privacy: string; terms: string; contact: string }
    copyright: string
    trustBadges: string[]
    journal: string
    methodology: string
    pricing: string
    login: string
    instagram: string
  }

  // Result page
  result: {
    processing: {
      label: string
      title: string
      sub: string
      completed: string
      total: string
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
    homeLink: string
    error: {
      title: string
      sub: string
      home: string
    }
  }

  // Share Modal
  share: {
    title: string
    sub: string
    editableLabel: string
    previewSub: string
    previewText: string
    nativeShare: string
    saveImage: string
    saving: string
    copyLink: string
    copied: string
    referralTitle: string
    referralSub: string
    referralBtn: string
    viralCopies: (cities: string, month: string, city0: string) => string[]
    nativeShareTitle: (cities: string) => string
  }

  // Toast
  toast: {
    cityAdded: string
    cityRemoved: string
    cityMax: string
    cityRequired: string
    imageOnly: string
    imageTooLarge: string
    photoUploaded: string
    galleryLink: string
  }

  // Checkout Modal
  checkout: {
    title: string
    subtitle: string
    doneTitle: string
    doneSubtitle: string
    progressLabel: string
    steps: string[]
    stepIcons: string[]
    phases: string[]
    trustBadges: string[]
    galleryBtn: string
    processing: string
    success: string
  }
}
