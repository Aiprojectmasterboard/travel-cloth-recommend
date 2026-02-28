'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

// ─── Image URLs (from code.html reference) ────────────────────────────────────

const IMG = {
  heroBg:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAgSj2pbRT-G9AC9wXIrTmJ_qtjAPln9lte-m5GQCnNY6BeghvVcuAJxbR0yqFWzd45CrW5iHOfir4FwSaQ3522IPMXSwFZ2p2oxvDoQqEyqKLll-Rp4QTVpu31VPLlHB7LWARwMp6cnqlHFH0gymv1isYq66pmSOLSULDiA3t7Szh0rUtZKIaTJtwyigj2H0Sd8JQnsCMFl9t9H9Ii6A_PVWgB-KXu4aqOggSdUr776NRy1BYaWi7p1sGLkN7xhZNZjVsj2sF7DQ',
  trenchCoat:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC0QW1uFIdIn5ymdXnw8rO7HWM1yPQErCAHjBF68T8juoSdWGJwqL0FFaG2JJB2j8Jqu2_NkfgzeUj4gQfmOaxk44r9Uldr7TozIuSaKkfAjZFH6va8iZi4Uf5CvvMYwUHpnVPhu5sSOUGsQnePtJ5V8HiUjTvKN3_D7RK1E9oiPDReDv-9LTKUlM4RcqdSO4s_fg3GZLp6B6KLjj7GJqkr-iq1FUfxYiPfk_mf_0fNx9tASiwNv9J0OAi_M1VNPQ8_jQzsa_LjPA',
  cashmereCard:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCeJuGrlw7axZ0sA0w1EOrNpmTOu0U9Py1lxw1ypIkl_Z7KgEDPtzuOXsUxyOxsX7hV-yj4p3SAYoD5rkxjbXvlergO_tdNN9XZy4cXHSkaEtQJhhe-R_xfxw8gFnbyaF_uLxj4A-xT_egimrQghs6VYiS8szzHCjvRg27A33eYiSOXzByHkY83ROmPyBJEcKYIe8L7u7NaRHVTGtDoChHpEMjuRZhMdbX65EETd348QUhu4a8C6CnutMjb3h5khhE7Pebqn96ynw',
  leatherBag:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDdYUdg2gHbupVuXKm1B8gS0Y9n3Nec70OcsYcKvgWJMXiRLgyoqlcFOoG7HHWKEh1uiNAhBWFAZj18DQtrmz7ua1Vx5giyqzoC7ih2xDP5zyvJ3at6uG1hcroTmI5tjQuV4XD8duyt1OEurM5YYTUKs-NyKuQoggR4v20_puOLpaXwwDDDFDSSv_cP4Hvk0ZtqrHd8ZWCb0DSRd4dEanjKa-zfHaqKV5rwlD2dGtNL1qWxQf8mUgqGEKQ-B1fdkMgjbKSJTV0dqg',
  woolCoat:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCemfaGwdXs2NhShpMv2CMVvtqCTDz2A0UwhvVyFxTr6WqjQwzck75V_uX2RblhR6ANusfEJyy6SRtncFKZfTvq_ActlA7G7DS0dYA_liv1v21bXt_HtxlY404h2aF_uIDahsSamyhtUAbG9V58uyvg4ZGAedl3bwrk16IpCG2tOmuTkuHdfNxxzyvqAFAaOI8IZW-w3UI5C6F3Mr-FHMBGQntOcFATx_u7iMJeEMK6IQL1nmoyadgt-OJ-NxU7s3wE_7BsQH1IgQ',
  cashmereKnit:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfwHU5olSEv1NR80ElRhrLBKGhY93BBkEoMWAsjYb1dRCDLI5yJqrIdwbf3ECegNs9TurPi86DBBn-sQoc_4sQZVHhD0fsOwXe2zF4oGZGhBsERriPg13pwIs__ilG9S_-noGqj2nYFzo8gs3Jussvcnc6shtSrGP1dhITC78axKu5jK6EtW-jy8ZQS9SplC6z2LZ2KUn30m4hO8GXM5PgTl0DPJxM766q8y5MdEDZ6PUjXTynIIE5J_cJGLA2v7orMtlrZib8WA',
  trousers:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDD9oWWIcIjP-aznFWBd-q3H4He0d0w8UUxDz-qwyEN46tdme1JJ2ExGbRQeMTJWRElXG7ZUdSyyBOxBfst1_FcY2vz3LvXNI9TKEaMWPGihyVoG8GVLlHfFxsc7l5SLl_ZO0C-18l_r_l_iN5f8Ysu-0D0spAwtXyrZ8tsa8O23fjZ1Ebq5GPvHCJpF99-n7AXQpcpPbGRmLc7MuT3Hweum_XQbnsHUuLE7c07AjL_Y7BCpV9Ov3OrpfecBEPsm20UdbPT_u1gGQ',
  dress:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCY_Z4dVFsqmNG1_NsZRtO1BJH9AhfUhsJF6C4hF4ujNxjazt9_sv0X2koa6W8QROK6vQocJN9FCSUJEpt1Zfrq08AzqFE4xF_mX1X7Ue24hiucdsnspxVw7qAT1FnshghKmpKX3wmhrQshBjr3z2Ca9yLHtP_78L_pLU5TMg7NSNzRcUqn8vFvTzapdUL7h8_FKLJTanJf-lAXWa2jM-vizdCd6qSP1WOQDUoQ_9SDdVHB4JgToWmiA_hCN_sZXTxpM848g7Aspw',
  scarf:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB4qAubSHHgBljVm6DOKfqUsoXmdhT6I3-_Kh9PUSOTnxUk-Dmxk6yLOY42ZyyhN1QkPbWr-a_G2pBEh4Vz5DAiPwoutivyQoZm_Wi8zp_YKvjLEF3H9GKClYyYRXcZB-UDBcAm0GugMobPO2c3seNq6DUzwrYfVSwKsHBdeV7ppPAa1SRbxAlONcJYDqXBikK3GTyflJPdfxgMSj7Qippsu2hyJ3tg39gNFEDPHdja-jwz1uHQGjIkabhQ4yo_4-zPvlhsxgJI7Q',
  flatLay:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD-togGWB0KZ4ohk08kywsWm96PHZZUAEaDWcDR0wy-aGNGVxOWIasrCcCOa3DowAnQPcpVwiKq2tLPMhUu8d7GD25zaOb5yH1qKx3QrnHLBVGiP27hG2nFIrZf91OkwV4SV_iVGHBFlLmyjulH5216pMSQTRuw8SmYJuK6eO_nzk3AnmwGWTMvF7qQGOWURPwHxg1y8vfe1hvdCFuJ2uYly3tA3EZo9XUugtF1yNRA9CrpkWqHxasE0s8NVb1X2Rioo_m4xd_XAw',
  activityItem1:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAceC7ONHZRBP8g3rRB-ipmtUsVdIBIUQykf2Izln-Iwe5lMyCSwK40VL30VVw12Vqv77VEs0mZj3yzonrG1hPoihAdad4xyfK5oi-Yf0bUUWp6uOd2tJp09g_aT3rZ3qfEBmLS4AFPVoJQk6RdJCDLHLMGh2-0f8SSc7bsCjOIUKU6C78Q7cr6dKJDQ-TUOO_pZasf9QZY-tqUgUPXefk6JBnVvWoSotSrzmJLtCiPNdkO_kgPqpTlmaxDAYFos9ARg_wBf8Px_Q',
  activityItem2:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBMPmLbVV5AtzdfyvTb_q8jgkC0nFC8WxjVnf3GcGq0xOrqSABYVfxYnzAOuQm0xchHAbbcuGEMlgKY8GacNilLlA653_e8RaKQXaTA8ZOpZ6JmbJf3QiXkUYUKxyYkg9r8GRL8egq_Qd4yULsS0dO7p623cWjpJ-4Qm-Lg933gyFhS2mhafcZGmygG0cVBelxfE-4rvm6LB2AZ1XJGIXvFcP6thwDr7ULfphhHydhJDW0e0ZQXCOIP8Rr4wjvralzoUgfRW0hTxg',
  activityItem3:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD-vr6TZ9j8yg4tIOWkU46hGzFd_FSnMI98JlCAIzR7W5T_Bc1NJjEM7dwz_NpOeHekNl6xlz7kRP88WVXnONHJpHiqCTEmXCZp3lavkZUENRm9nM3bo57Lf2jwdFvrNrMQOeB817E_wMXzlvuH4znIw5KmugvMHw0RQIEdhoHfnK0q8ZerR-EBDrAAlFPplKVNP2MCcb7V8Eedvtg93xNB68gikRX4gbZaYaUJlgJ54NOnLL5Kha7IlXKweRxMGWaxED24rZ6Epg',
  ctaBgTexture:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCnBuyvhTfzkbN4sb5n0o1vP4I_D1OW-yxVuXmyTR7gUPXZSnR2Zvzjtpuy7S_tmkImkCKVyH6vq1q00yFZl_GPYU_f9oFZLvNhbWC5dpV1LH8qv8e4VM1qIW9vgCVNQ0419tyFFu49Gr46Na7d1hJGHivy1MAE3Fu7epiT9bVETQwEGUcPYyKUyzAvEymNIVjjW2Vj5cyUm1fUyTXWWt_a8-a1ItHi4zhqdpD3QnkBjZd8N1mc2nSZkUbxckBwcnliSoS0vG3xYw',
}

export default function HomePage() {
  const { t } = useLanguage()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="font-sans antialiased text-secondary bg-cream">

      {/* ─── HEADER ──────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 w-full bg-cream/95 backdrop-blur-sm border-b border-sand transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 no-underline"
            aria-label="Travel Capsule AI home"
          >
            <span
              className="material-symbols-outlined text-primary text-2xl select-none"
              aria-hidden="true"
            >
              all_inclusive
            </span>
            <span className="text-sm font-bold tracking-widest uppercase font-playfair text-secondary">
              Travel Capsule AI
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            <a
              href="#weather"
              className="text-xs font-medium tracking-widest uppercase text-secondary/70 hover:text-primary transition-colors"
            >
              {t.nav.philosophy}
            </a>
            <a
              href="#blueprint"
              className="text-xs font-medium tracking-widest uppercase text-secondary/70 hover:text-primary transition-colors"
            >
              {t.nav.curations}
            </a>
            <a
              href="#guide"
              className="text-xs font-medium tracking-widest uppercase text-secondary/70 hover:text-primary transition-colors"
            >
              {t.nav.membership}
            </a>
          </nav>

          {/* Right group */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:block">
              <LanguageSwitcher variant="dropdown" />
            </div>
            <Link
              href="/auth/login"
              className="hidden sm:block text-xs font-medium tracking-widest uppercase text-secondary/70 hover:text-primary transition-colors"
            >
              {t.nav.signIn}
            </Link>
            <Link
              href="/trip"
              className="bg-primary hover:bg-primary/90 text-cream text-xs font-bold tracking-widest uppercase py-3 px-5 transition-all"
              aria-label={t.nav.cta}
            >
              {t.nav.cta}
            </Link>
          </div>

        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col"
        aria-label="Hero"
      >
        {/* Full-screen background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG.heroBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover brightness-[0.85]"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-secondary/20 to-secondary/70"
          aria-hidden="true"
        />

        {/* Centered content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
          {/* Badge */}
          <div className="mb-8">
            <span className="inline-block border border-cream/40 text-cream/90 text-xs font-medium tracking-widest uppercase px-4 py-2">
              {t.hero.badge}
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-playfair text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight text-cream mb-6">
            {t.hero.heading1}
            <br />
            <em className="italic text-cream/90">{t.hero.heading2}</em>
          </h1>

          {/* Subtitle */}
          <p className="text-cream/80 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-light">
            {t.hero.sub}
          </p>

          {/* CTA */}
          <Link
            href="/trip"
            className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-cream text-sm font-bold tracking-widest uppercase py-4 px-10 transition-all shadow-lg hover:shadow-xl"
          >
            {t.hero.cta} →
          </Link>
        </div>

        {/* Bottom bar */}
        <div className="relative z-10 border-t border-cream/20 py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-8 text-cream/50 text-xs tracking-widest uppercase">
            <span>{t.hero.estLabel}</span>
            <span className="w-px h-3 bg-cream/30" aria-hidden="true" />
            <span>{t.hero.scrollLabel}</span>
            <span className="w-px h-3 bg-cream/30" aria-hidden="true" />
            <span>{t.hero.editionLabel}</span>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: PRECISION WEATHER MAPPING ────────────────────────────── */}
      <section className="py-20 px-6 bg-cream" id="weather" aria-label="Precision Weather Mapping">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — image composition */}
          <div className="relative">
            {/* Main gray container with trench coat */}
            <div className="relative bg-[#E8E4DF] rounded-none overflow-hidden aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.trenchCoat}
                alt="Trench coat styled outfit"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating weather card — top right */}
            <div className="absolute top-6 -right-4 md:top-8 md:-right-6 bg-white shadow-xl p-4 min-w-[160px] z-10">
              <p className="text-xs font-semibold text-secondary/50 uppercase tracking-widest mb-1">
                {t.weather.forecastLabel}
              </p>
              <p className="text-sm font-bold text-secondary">Paris, FR</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-light text-secondary font-playfair">18°</span>
                <span className="text-xs text-primary font-medium">{t.weather.windyLabel}</span>
              </div>
              <p className="text-xs text-secondary/60 mt-2 leading-snug">{t.weather.windNote}</p>
            </div>

            {/* Bottom-left polaroid: cashmere */}
            <div
              className="absolute -bottom-6 left-4 md:-bottom-8 md:left-0 bg-white shadow-lg p-2 z-10"
              style={{ transform: 'rotate(-4deg)', width: 96 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.cashmereCard}
                alt="Cashmere accessory"
                className="w-full aspect-square object-cover"
              />
              <p className="text-[9px] text-secondary/50 mt-1 text-center">Cashmere</p>
            </div>

            {/* Bottom-right polaroid: leather bag */}
            <div
              className="absolute -bottom-2 left-24 md:-bottom-4 md:left-28 bg-white shadow-lg p-2 z-10"
              style={{ transform: 'rotate(3deg)', width: 88 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.leatherBag}
                alt="Leather bag accessory"
                className="w-full aspect-square object-cover"
              />
              <p className="text-[9px] text-secondary/50 mt-1 text-center">Leather</p>
            </div>
          </div>

          {/* Right — editorial text */}
          <div className="flex flex-col gap-6 lg:pl-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary">
              {t.weather.sectionLabel}
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-secondary leading-tight">
              {t.weather.heading1}
              <br />
              <em className="italic">{t.weather.heading2}</em>
            </h2>
            <p className="text-secondary/70 leading-relaxed">{t.weather.bodyText}</p>

            {/* Wind alert banner */}
            <div className="border-l-2 border-primary pl-4 py-1">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                {t.weather.windyDayEdit}
              </p>
              <p className="text-sm text-secondary/70">{t.weather.windNote}</p>
            </div>

            {/* 2-col feature grid */}
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div>
                <p className="font-bold text-secondary mb-1 text-sm">{t.weather.thermalTitle}</p>
                <p className="text-secondary/60 text-sm leading-snug">{t.weather.thermalDesc}</p>
              </div>
              <div>
                <p className="font-bold text-secondary mb-1 text-sm">{t.weather.humidityTitle}</p>
                <p className="text-secondary/60 text-sm leading-snug">{t.weather.humidityDesc}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 3: THE 10-ITEM BLUEPRINT ───────────────────────────────── */}
      <section className="py-20 px-6 bg-sand" id="blueprint" aria-label="The 10-Item Blueprint">
        <div className="max-w-7xl mx-auto">

          {/* Header — right-aligned */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="md:max-w-sm">
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                {t.blueprint.sectionLabel}
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold text-secondary leading-tight">
                {t.blueprint.heading}
              </h2>
            </div>
            <p className="text-secondary/60 max-w-xs text-sm leading-relaxed md:text-right">
              {t.blueprint.desc}
            </p>
          </div>

          {/* Masonry-style grid — 5 images + 1 CTA tile */}
          <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[520px] md:h-[600px]">

            {/* Wool coat — tall left */}
            <div className="col-span-1 row-span-2 relative overflow-hidden bg-secondary group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.woolCoat}
                alt="Wool overcoat"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-secondary/80 to-transparent p-4">
                <p className="text-cream/60 text-[10px] uppercase tracking-widest">{t.blueprint.outerLayerLabel}</p>
                <p className="text-cream text-sm font-semibold">{t.blueprint.outerLayerName}</p>
              </div>
            </div>

            {/* Cashmere knit — top center */}
            <div className="col-span-1 row-span-1 relative overflow-hidden bg-secondary group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.cashmereKnit}
                alt="Cashmere knit"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Trousers — top right */}
            <div className="col-span-1 row-span-1 relative overflow-hidden bg-secondary group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.trousers}
                alt="Tailored trousers"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Dress — bottom center */}
            <div className="col-span-1 row-span-1 relative overflow-hidden bg-secondary group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.dress}
                alt="Versatile dress"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Scarf — middle right */}
            <div className="col-span-1 row-span-1 relative overflow-hidden bg-secondary group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.scarf}
                alt="Silk scarf"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* "See all items" dark tile — overlaid top of scarf row via absolute... use extra tile */}
            {/* We achieve this with a 6th grid cell */}
          </div>

          {/* "See all 10 items" dark tile below grid on mobile / as overlay concept */}
          <Link
            href="/trip"
            className="mt-3 flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/90 text-cream text-xs font-bold tracking-widest uppercase py-5 transition-all group"
            aria-label={t.blueprint.seeAllItems}
          >
            <span
              className="material-symbols-outlined text-base text-cream/60 group-hover:text-cream transition-colors"
              aria-hidden="true"
            >
              lock
            </span>
            {t.blueprint.seeAllItems}
          </Link>

          {/* Footer bar */}
          <div className="mt-6 flex items-center justify-between text-xs text-secondary/50 uppercase tracking-widest border-t border-secondary/10 pt-4">
            <span>{t.blueprint.curatedFor}</span>
            <span>{t.blueprint.totalWeight}</span>
          </div>

        </div>
      </section>

      {/* ─── SECTION 4: WEAR-IT-NOW DAILY GUIDE ──────────────────────────────── */}
      <section className="py-20 px-6 bg-cream" id="guide" aria-label="Daily Guide">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — numbered steps */}
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-4">
                {t.guide.sectionLabel}
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold text-secondary leading-tight">
                {t.guide.heading1}
                <br />
                <em className="italic">{t.guide.heading2}</em>
              </h2>
            </div>
            <p className="text-secondary/70 leading-relaxed">{t.guide.bodyText}</p>

            {/* Steps */}
            {[
              { num: '01', title: t.guide.step1Title, desc: t.guide.step1Desc },
              { num: '02', title: t.guide.step2Title, desc: t.guide.step2Desc },
              { num: '03', title: t.guide.step3Title, desc: t.guide.step3Desc },
            ].map(({ num, title, desc }) => (
              <div key={num} className="flex gap-6 items-start">
                <span className="font-playfair text-5xl font-bold text-secondary/10 leading-none shrink-0 select-none">
                  {num}
                </span>
                <div className="pt-2">
                  <p className="font-bold text-secondary mb-1">{title}</p>
                  <p className="text-secondary/60 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — flat-lay photo + floating activity card */}
          <div className="relative">
            {/* Grayscale → color on hover flat-lay */}
            <div className="group relative overflow-hidden aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.flatLay}
                alt="Flat-lay outfit for museum day"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </div>

            {/* Floating activity card — bottom left */}
            <div className="absolute -bottom-6 -left-4 md:-bottom-8 md:-left-6 bg-white shadow-xl p-5 z-10 min-w-[200px]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1">
                {t.guide.dayLabel}
              </p>
              <p className="font-bold text-secondary text-sm">{t.guide.activityTitle}</p>
              <p className="text-xs text-secondary/50 mt-0.5">{t.guide.activityDetail}</p>
              <div className="flex gap-2 mt-3">
                {[IMG.activityItem1, IMG.activityItem2, IMG.activityItem3].map((src, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={i}
                    src={src}
                    alt=""
                    aria-hidden="true"
                    className="w-8 h-8 rounded-full object-cover border-2 border-white"
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 5: TESTIMONIAL ──────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white border-y border-sand" aria-label="Testimonial">
        <div className="max-w-3xl mx-auto relative">
          {/* Decorative quotation mark */}
          <span
            className="absolute -top-4 -left-2 font-playfair text-8xl text-primary/20 leading-none select-none"
            aria-hidden="true"
          >
            &ldquo;
          </span>

          <blockquote className="relative z-10 pt-8">
            <p className="font-playfair text-2xl md:text-3xl text-secondary leading-relaxed mb-8 italic">
              {t.testimonial.quote}
            </p>
            <footer className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sand shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-secondary text-sm">{t.testimonial.author}</p>
                <p className="text-secondary/50 text-xs">{t.testimonial.detail}</p>
              </div>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ─── SECTION 6: CTA ──────────────────────────────────────────────────── */}
      <section
        className="relative py-28 px-6 bg-secondary overflow-hidden"
        aria-label="Call to action"
      >
        {/* Background texture */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG.ctaBgTexture}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20"
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="font-playfair text-5xl md:text-6xl font-bold text-cream leading-tight mb-6">
            {t.cta.heading1}
            <br />
            <em className="italic">{t.cta.heading2}</em>
          </h2>
          <p className="text-cream/70 text-base md:text-lg mb-10 leading-relaxed">{t.cta.sub}</p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/trip"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-cream text-sm font-bold tracking-widest uppercase py-4 px-12 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 w-full sm:w-auto"
            >
              {t.cta.button}
            </Link>
            <p className="text-cream/40 text-xs tracking-widest uppercase">{t.cta.note}</p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-sand" aria-label="Site footer">
        {/* Main footer row */}
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start justify-between gap-8">

          {/* Left — logo + tagline */}
          <div className="flex flex-col gap-3 max-w-xs">
            <Link
              href="/"
              className="flex items-center gap-2 no-underline"
              aria-label="Travel Capsule AI home"
            >
              <span
                className="material-symbols-outlined text-primary text-xl select-none"
                aria-hidden="true"
              >
                all_inclusive
              </span>
              <span className="text-sm font-bold tracking-widest uppercase font-playfair text-secondary">
                Travel Capsule AI
              </span>
            </Link>
            <p className="text-secondary/50 text-xs leading-relaxed">{t.footer.tagline}</p>
          </div>

          {/* Right — nav links */}
          <nav
            className="flex flex-wrap gap-x-8 gap-y-3"
            aria-label="Footer navigation"
          >
            {[
              { label: t.footer.journal, href: '/' },
              { label: t.footer.methodology, href: '/' },
              { label: t.footer.pricing, href: '/trip' },
              { label: t.footer.login, href: '/trip' },
              { label: t.footer.instagram, href: '/' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-medium tracking-widest uppercase text-secondary/50 hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-sand">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-secondary/40">{t.footer.copyright}</p>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xs text-secondary/40 hover:text-primary transition-colors">
                {t.footer.privacy}
              </Link>
              <Link href="/" className="text-xs text-secondary/40 hover:text-primary transition-colors">
                {t.footer.terms}
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
