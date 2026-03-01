import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Travel Capsule AI — AI Travel Outfit Styling'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1A1410 0%, #2d241c 50%, #1A1410 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle top border accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #b8552e, #D4AF37, #b8552e)',
          }}
        />

        {/* Decorative line */}
        <div
          style={{
            width: 80,
            height: 2,
            backgroundColor: '#D4AF37',
            marginBottom: 24,
          }}
        />

        {/* Main title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#FDF8F3',
            letterSpacing: '-1px',
            textAlign: 'center',
            lineHeight: 1.1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span>Travel Capsule</span>
          <span
            style={{
              fontSize: 52,
              fontStyle: 'italic',
              color: '#D4AF37',
              fontWeight: 400,
              marginTop: 4,
            }}
          >
            AI
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#c4a882',
            marginTop: 28,
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          AI-powered outfit styling for every destination
        </div>

        {/* City pills */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 36,
          }}
        >
          {['Paris', 'Tokyo', 'Rome', 'Barcelona', 'London'].map((city) => (
            <div
              key={city}
              style={{
                padding: '8px 20px',
                borderRadius: 20,
                border: '1px solid rgba(212,175,55,0.3)',
                color: '#D4AF37',
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {city}
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: '#9c8c7e',
            fontSize: 16,
          }}
        >
          <span>Weather Analysis</span>
          <span style={{ color: '#D4AF37' }}>|</span>
          <span>City Vibe Matching</span>
          <span style={{ color: '#D4AF37' }}>|</span>
          <span>Capsule Wardrobe</span>
          <span style={{ color: '#D4AF37' }}>|</span>
          <span>From $5/trip</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
