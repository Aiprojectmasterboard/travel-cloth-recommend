export type Locale = 'ko' | 'en' | 'ja' | 'zh' | 'fr' | 'es'

export interface Translations {
  // Header
  nav: {
    howItWorks: string
    pricing: string
    faq: string
    cta: string
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
