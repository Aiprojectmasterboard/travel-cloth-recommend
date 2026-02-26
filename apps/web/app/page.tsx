'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import HowItWorksSection from '@/components/HowItWorksSection'
import FormSection from '@/components/FormSection'
import SampleOutputSection from '@/components/SampleOutputSection'
import CapsuleSection from '@/components/CapsuleSection'
import PricingSection from '@/components/PricingSection'
import FaqSection from '@/components/FaqSection'
import PartnerSection from '@/components/PartnerSection'
import Footer from '@/components/Footer'
import CheckoutModal from '@/components/CheckoutModal'
import Toast from '@/components/Toast'

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? ''
const POLAR_CHECKOUT_URL = process.env.NEXT_PUBLIC_POLAR_CHECKOUT_URL ?? '#'

interface City {
  id: number
  name: string
  days: number
}

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Scroll Reveal ───
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('in-view')
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // ─── Toast ───
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2800)
  }, [])

  // ─── Scroll helpers ───
  function scrollToForm() {
    document.getElementById('formSection')?.scrollIntoView({ behavior: 'smooth' })
  }

  function scrollToSample() {
    document.getElementById('sampleSection')?.scrollIntoView({ behavior: 'smooth' })
  }

  // ─── Checkout ───
  async function handleCheckout(cities: City[], month: string) {
    if (POLAR_CHECKOUT_URL && POLAR_CHECKOUT_URL !== '#') {
      const params = new URLSearchParams({
        cities: cities.map(c => `${c.name}:${c.days}`).join(','),
        month,
      })
      window.location.href = `${POLAR_CHECKOUT_URL}?${params.toString()}`
      return
    }
    // Demo mode: show modal animation
    setModalOpen(true)
  }

  function handlePricingCheckout() {
    if (POLAR_CHECKOUT_URL && POLAR_CHECKOUT_URL !== '#') {
      window.location.href = POLAR_CHECKOUT_URL
      return
    }
    setModalOpen(true)
  }

  return (
    <>
      <Header />
      <main>
        <HeroSection
          onScrollToForm={scrollToForm}
          onScrollToSample={scrollToSample}
        />
        <HowItWorksSection />
        <FormSection onCheckout={handleCheckout} onToast={showToast} />
        <SampleOutputSection />
        <CapsuleSection />
        <PricingSection onCheckout={handlePricingCheckout} />
        <FaqSection />
        <PartnerSection />
      </main>
      <Footer />
      <CheckoutModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onToast={showToast}
      />
      <Toast message={toastMsg} visible={toastVisible} />
    </>
  )
}
