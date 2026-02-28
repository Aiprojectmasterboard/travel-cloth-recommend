'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Hero image swatches (outfit previews) ────────────────────────────────────
const SWATCH_URLS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD9ShrrJ4OOU7WzA26que31WjZ1ygW_NvWksZDsP6zlh4bvT6Eamdw4n9izPYTbOkU3ElxQFPM9GEhyh6dlhAGn-SW9QEt6p5gCWU4XfPd1YQQqhgI-DpBdledRbCR5W24rzaP8ZN9RWLls2PrJZU5LQXLd5LhaIRxIDJvYsfplCK6ZJ4Kqc2OBBOcqEVCIPCRgc-8WH-wxLJnnQj9sFHMhjP_DL7M24hS51b9O7lDiSZycu_uLoyoaOXEkErFpl3A_y0zhPHOA9Q',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCIEJ8u49u_wGXOS-9cTzPrIBt2nl2MDn3F7-l_xJJJoC1uU7-D8O3NWe-m6K_5KS325ZZqULzZnDM7Vy7Flzyn9_I3rdAtkon9IryfPIzZ8WYd_jHU5sM7n-ICg2_NhVkMyPhGvVaFmiRw5JnBS76CGfiAYXc_lOEQX9F3vh4un53FKN_J6cIVPmBArBFO8llLjX_9i7Q4L5PENdP0XYi2LRN4DFOJoeALoilhETqvT7ZFfyGCxMRD6fVXRGIWXZqX913IHrxgnw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD83cYkGnuIaZmKO95hrBepvPyQI8gJbh1XUBgI2XPkkEIKii1tndwfut6_P7MbWbcyNJ4RbAl8SRVKFLDHV0L8cQXHtq4LKCJxvSIaeWyeHG9XVK3gp0ZFzoaqvtiFHECSFzHrHrZR3ZTHwPLUUCOOGL_cAGj3O2BhkI_qwdbzX_oS-Ho_1M1DG6KvCCDGzMucey0kMDafythY1Q6gH-Yiyiko0Ulte1o3xvhiyjzoL9-NMxzr8hP-IjwXYLIwNuwyUKHBzKPScA',
]

const HOW_STEPS = [
  {
    num: 1,
    title: 'Input Destination & Dates',
    desc: 'Tell us where and when. We pull historical weather patterns and live forecasts instantly.',
    imgSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6f0S5T3RkI_vezlXlsM2_bT41GzM1oJ3dg98Xk5ziqvIKu-BV68KoTkfifQWQpM5n-SpjDyCyTVOxUTZ_cdsJuWT-DrF0vd46Q5ExVXSAt3Wy3EHLXoMyAbkdA5UoG4HbxrYVYOByhxjx37V9jKNfCLwkiV5pyyTALLBtWquQ6oTD6A8QrB1GlRVypV6d1FP8fkQIrvnJqaNoXyeWa4lxrHnvhQwHLq0TiSFGtnXV668oX9j5kWmJGBce-_NHICJdE0clL_K-gg',
    imgAlt: 'Map and passport on a wooden table',
  },
  {
    num: 2,
    title: 'Define Your Style',
    desc: 'Upload a photo or choose a vibe. Our AI matches functional weather-appropriate gear with your aesthetic.',
    imgSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVgLE7HkxzmGnc9OcfTE9pbnnYDfqtlY-dBIaErM6Z--KS1mKndaYZNtERNIfo98ZKAaVh9PZzdm6xUYEBPDZn4rB49uUvVHp71IXruGrWP0dInHSDss2kMLhvf6ipCcZTOLsn_JyQMkuWPe1QWdD-nJay3uf802ZOrRNAdVRnG3jIvzVCQEvz20gyDiYRGJoCO3XksQVo87-xDeRL5mGScwMVyWEiTm7fbz4ywj5NnDVRet8SxVzndPUjXS_0CkvcK7btVQK4LQ',
    imgAlt: 'Minimalist wardrobe rack with neutral clothes',
  },
  {
    num: 3,
    title: 'Get Your Weather-Proof Plan',
    desc: 'Receive your custom $5 Capsule Plan. Includes fabric recommendations, layers, and a daily outfit guide.',
    imgSrc: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOFBJFClSO-ynGsZjEkFkyyYIVqApfcFxPXncpK7yZaD9kGFsECX_Qx3xpy5S9KL0tTcbGCenzoO0jW5h_0KAMja5VVijC9AnN0EYyqw2ELDJs34Tf2gL010f_ALW4XeNfpfeXloJsb10i0qnmzhtQyGIbjnruOGvltu-u5e-FqpdwM-Le5BIPgQ0ybIrRVxY1NClzwPX9ooig-cWpL6Xm9GgK9N32IyLuNIZBI4cpz4yuEhmPLymIRCQGP5uDxDsUGAcjGQOFQ',
    imgAlt: 'Phone showing digital travel itinerary',
  },
]

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="font-sans antialiased text-secondary bg-cream">

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 w-full bg-cream/95 backdrop-blur-sm border-b border-sand transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-secondary no-underline">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
            <span className="text-xl font-bold tracking-tight font-playfair">Travel Capsule AI</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              ['How it Works', '#how'],
              ['Features', '#features'],
              ['Pricing', '#pricing'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium text-secondary/70 hover:text-primary transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right group */}
          <div className="flex items-center gap-4">
            <Link
              href="/trip"
              className="hidden sm:block text-sm font-medium text-secondary hover:text-primary transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/trip"
              className="bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2.5 px-5 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Start My $5 Plan
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative bg-secondary overflow-hidden grain-overlay min-h-[600px] flex items-center">
        {/* Background gradient */}
        <div
          className="absolute inset-0 z-0 opacity-40 mix-blend-overlay bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDLd9DZv_EJ5HlE3mDIpf1MfbOSHrVj5TVLhfe8er0ZB7grR5KseSly8P25jgFlkyizxh-zR2jZHrmHhd5o_g4eqVgcwPAD0KNc8Z1hlZAdJ6YP0dV7kLGuf15P_22EL1gtbn6H4lVIJFt_wkEPjc35weqFBU7Vd5dV7P2jBksJKz-QtuJsTxSSzVXGvSVKMIzqYGmgO8oS-Pmp67WwGWc3kiqKwLiOH5UAmnOFbd5pLHbfnCR1ZWXiohZZuMoha5RwQt4cYRxh-g')",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full flex flex-col md:flex-row items-center gap-12">
          {/* Left column */}
          <div className="flex-1 text-center md:text-left space-y-8">
            <div className="inline-block px-3 py-1 border border-white/20 rounded-full bg-white/5 backdrop-blur-md">
              <span className="text-xs font-medium text-white/90 uppercase tracking-widest">
                Stop Guessing. Start Wearing.
              </span>
            </div>

            <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] text-cream">
              The End of Travel
              <br />
              <em className="italic text-gold">Weather Guesswork.</em>
            </h1>

            <p className="text-lg text-white/80 max-w-lg mx-auto md:mx-0 font-light leading-relaxed">
              Know exactly what to wear, from Tokyo to Paris. Our AI analyzes real-time weather data to build your perfect packing list.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <Link
                href="/trip"
                className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white text-base font-bold h-14 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Get Your Capsule →
              </Link>
              <Link
                href="/trip"
                className="inline-flex items-center justify-center bg-transparent border border-white/30 hover:border-white text-white text-base font-medium h-14 px-8 rounded-lg transition-all w-full sm:w-auto"
              >
                See Weather Demo
              </Link>
            </div>

            <div className="pt-4 flex items-center justify-center md:justify-start gap-6 text-white/60 text-sm">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>100% Personalized</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>Instant Delivery</span>
              </div>
            </div>
          </div>

          {/* Right column — hero image card */}
          <div className="flex-1 w-full max-w-md md:max-w-none relative hidden md:block">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY4iM-UKOOoNp7JbAp7VH7j6qkuiyH3DXSIqJquUW9lplquOHwW7uqH4nM5XE0v-dU8UstunI5v2qmCVCZbK0xa4i2c_knMy0faAYiSbM4pTPHDn6KNLlZAZD--04lgHgxoTGWV6PLpYnB-4dYBnLN6TBz9--erPrdoNgqFCshotMsHEuMkQFx0NvGJAnL9aheS3abN0N8xlkLHZWcxwq8mM-ByR2XZl_X8-uXRE8iek6W_tALUYG1boBFA9KaWzADyxfIBuHSBA"
                alt="Stylish traveler with luggage"
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
              />
              {/* Overlay card */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white text-sm font-bold">Paris, France</p>
                      <p className="text-white/70 text-xs">Oct 12 – Oct 19 · Rain Likely</p>
                    </div>
                    <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                      98% Match
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {SWATCH_URLS.map((src, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <div
                        key={i}
                        className="h-12 w-12 rounded bg-white/20 bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url('${src}')` }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-cream" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Smart Travel Features</p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-secondary">
              Data-Driven Style Decisions
            </h2>
            <p className="text-secondary/70 max-w-2xl mx-auto text-lg">
              We analyze millions of data points so you don&apos;t have to check the weather app 50 times.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"/>
                  </svg>
                ),
                title: 'Precision Weather Mapping',
                desc: 'We analyze hourly humidity, wind speeds, and "feels-like" temperatures to select the perfect fabrics for your comfort.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
                  </svg>
                ),
                title: 'The 10-Item Blueprint',
                desc: 'A visual grid of just 10 items that create 20+ outfits perfectly suited for that specific weather forecast.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                  </svg>
                ),
                title: 'Wear-It-Now Daily Guide',
                desc: 'Wake up and know exactly what to put on. A calendar-style view showing your outfit for each day of the trip.',
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="group p-8 rounded-2xl bg-white border border-sand hover:border-primary/30 transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  {icon}
                </div>
                <h3 className="font-playfair text-2xl font-bold text-secondary mb-3">{title}</h3>
                <p className="text-secondary/70 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-sand" id="how">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="space-y-4 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Simple Process</p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold text-secondary">
                Your Perfect Wardrobe in 3 Steps
              </h2>
            </div>
            <Link
              href="/trip"
              className="hidden md:inline-flex items-center font-bold text-primary hover:text-primary/80 transition-colors gap-2 group"
            >
              View sample itinerary
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_STEPS.map((step) => (
              <div key={step.num} className="flex flex-col">
                <div className="relative aspect-video rounded-xl overflow-hidden mb-6 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={step.imgSrc}
                    alt={step.imgAlt}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 h-8 w-8 rounded-full bg-white flex items-center justify-center font-bold text-secondary shadow-sm text-sm">
                    {step.num}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">{step.title}</h3>
                <p className="text-secondary/70 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 md:hidden">
            <Link href="/trip" className="inline-flex items-center font-bold text-primary gap-2">
              View sample itinerary
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonial ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white border-y border-sand">
        <div className="max-w-4xl mx-auto text-center">
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-6" aria-label="5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="w-6 h-6 text-gold fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            ))}
          </div>

          <h3 className="font-playfair text-3xl md:text-4xl font-medium leading-tight text-secondary mb-8">
            &ldquo;I used to pack for &lsquo;just in case&rsquo; and still freeze.
            Travel Capsule AI predicted the cold snap in Rome and packed me the perfect layers.&rdquo;
          </h3>

          <div className="flex items-center justify-center gap-4">
            <div
              className="h-12 w-12 rounded-full bg-gray-200 bg-cover bg-center flex-shrink-0"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB0D81XEFN0TIVlmH2VG-zj6QlVHE5ISh3ue5NiitXIcf8L-_BRnnzM6uxr09dFWMb-adB0IsuCWj41ll-afQBIEFjHvIlK266qZ5lhwqcuxW3la5kH8HM8m_rTTpH3GFool7Bu_orRrDG1D4QyLxyasyxG44RtNQfT-wezh1qZgqHD98z0u7awVUtib7vFOxUieYl8uDzQ55ucNTda-B2i0tVKz3_iQTAINBubq8lNpNZRDIreb7qo3U4jT5E3gEKZWKKOZuZvtA')",
              }}
              aria-hidden="true"
            />
            <div className="text-left">
              <p className="font-bold text-secondary">Jessica Cole</p>
              <p className="text-sm text-secondary/60">Traveled to Italy in November</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-secondary relative overflow-hidden" id="pricing">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-playfair text-4xl md:text-6xl font-bold text-cream mb-6">
            Never Check the Weather
            <br />
            App Again.
          </h2>
          <p className="text-white/80 text-lg md:text-xl mb-10 font-light">
            Stop stress-packing. Get your personalized packing list and day-by-day outfit guide today.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/trip"
              className="inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white text-lg font-bold h-16 px-12 rounded-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105 w-full sm:w-auto"
            >
              Start My $5 Plan
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 6h-2.18c.07-.44.18-.88.18-1.35C18 2.54 15.96.5 13.5.5c-1.3 0-2.45.52-3.3 1.37L9 3l-1.2-1.13C6.95 1.02 5.8.5 4.5.5 2.04.5 0 2.54 0 4.65c0 .47.11.91.18 1.35H-0v2h20V6zM20 9H0v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9z"/>
              </svg>
            </Link>
            <p className="text-white/40 text-sm">No subscription required. One-time payment.</p>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-white py-12 px-6 border-t border-sand">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-secondary no-underline">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
            <span className="text-lg font-bold font-playfair">Travel Capsule AI</span>
          </Link>

          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-secondary/70">
            {[
              ['About Us', '/'],
              ['Privacy Policy', '/'],
              ['Terms of Service', '/'],
              ['Contact', '/'],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="hover:text-primary transition-colors">
                {label}
              </Link>
            ))}
          </div>

          <p className="text-sm text-secondary/40">© 2026 Travel Capsule AI.</p>
        </div>
      </footer>

    </div>
  )
}
