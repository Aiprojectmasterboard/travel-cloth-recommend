# Travel Capsule AI — CLAUDE.md

> Claude Code가 이 파일을 먼저 읽고 프로젝트 컨텍스트를 파악합니다.
> 코딩 시작 전 반드시 전체 읽기.

---

## 제품 개요

**TravelCapsule.com** — AI 여행 스타일링 서비스 (글로벌 런칭 타겟)

사용자가 도시 + 여행 월 + 사진(선택) 입력 →
AI가 날씨·도시 바이브 분석 → 무드 네이밍 → 티저 이미지 생성 →
결제 후 전체 코디 이미지 + 캡슐 워드로브 + 데일리 플랜 제공

**핵심 원칙:** Free는 충분히 가치 있게 느껴지되, 진짜 payoff는 결제 후에만 공개.

---

## 가격 플랜 (확정)

| 플랜 | 가격 | 내용 | 원가 | 제한 |
|------|------|------|------|------|
| Standard | $5 | 이미지 1장 선명 + 3장 블러 해제, 캡슐 리스트, 데일리 플랜 | ~$0.10/trip | 없음 |
| Pro | $12 | 전 도시 4~6장 실제 생성, 고화질, 1회 재생성 | ~$0.30/trip | 없음 |
| Annual | $29/년 | Pro 혜택 전체 + 연 12회 제한 | 최대 $3.60/년 | 서버사이드 12회 체크 필수 |

> Annual 12회 초과 시 → 429 반환 + 업그레이드 유도. 프론트 단독 검증 절대 금지.

---

## Free → Paid 퍼널 플로우

```
[입력] 도시(최대 5개) + 여행 월 + 사진(선택)
    ↓ Cloudflare Turnstile 검증
[FREE 1] 날씨 리포트 카드 (도시별, Open-Meteo, 캐싱)
[FREE 2] 시티 바이브 카드 (무드 네이밍: "Paris — Rainy Chic")
[FREE 3] 캡슐 카운트 추정기 (숫자 + 3원칙만, 풀 리스트 비공개)
[FREE 4] 티저 이미지 2×2 (실제 생성 1장 + CSS 블러 변형 3장)
    ↓
[이메일 캡처] "무드 카드 이메일 전송" 마이크로 컨버전
    ↓
[페이월] $5 / $12 / $29 플랜 선택 (PaywallModal)
    ↓
[결제] Polar (HMAC 웹훅 검증)
    ↓
[Post-결제 업셀] Standard → Pro $7 추가 (3분 타이머 UpgradeModal)
    ↓
[결과] 전체 갤러리 + 공유 링크 (UTM 포함 바이럴 루프)
```

---

## 기술 스택 (변경 금지)

| 영역 | 기술 |
|------|------|
| Frontend | Next.js App Router → Cloudflare Pages |
| API | Cloudflare Workers (Hono) |
| DB | Supabase (Postgres + RLS) |
| Storage | Cloudflare R2 |
| 결제 | Polar (MoR) — Stripe 사용 금지 |
| 이미지 생성 | NanoBanana API |
| AI (Style/Capsule/Vibe) | Claude API (claude-sonnet-4-6) |
| 기후 데이터 | Open-Meteo (무료, 가입 불필요) |
| 도시 검색 | Google Places API |
| 이메일 | Resend |
| 봇 차단 | Cloudflare Turnstile |

---

## 프로젝트 폴더 구조

```
travel-capsule-ai/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                  ← 랜딩 페이지
│   │   │   ├── trip/page.tsx             ← 여행 폼 (3단계)
│   │   │   ├── preview/[tripId]/page.tsx ← Free 리워드 + 페이월
│   │   │   ├── result/[tripId]/page.tsx  ← 결제 후 결과
│   │   │   └── share/[tripId]/page.tsx   ← 공유 페이지
│   │   ├── components/
│   │   │   ├── ui/                       ← 기본 컴포넌트
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── ImageCard.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── WeatherWidget.tsx
│   │   │   └── funnel/                   ← 퍼널 전용 컴포넌트
│   │   │       ├── ProgressChecklist.tsx
│   │   │       ├── WeatherCard.tsx
│   │   │       ├── VibeCard.tsx
│   │   │       ├── CapsuleEstimator.tsx
│   │   │       ├── TeaserGrid.tsx
│   │   │       ├── EmailCapture.tsx
│   │   │       ├── PaywallModal.tsx
│   │   │       └── UpgradeModal.tsx
│   │   └── lib/
│   │       ├── supabase.ts
│   │       ├── api.ts
│   │       └── turnstile.ts
│   └── worker/
│       ├── src/
│       │   ├── index.ts                  ← Hono 라우터
│       │   └── agents/
│       │       ├── orchestrator.ts
│       │       ├── weatherAgent.ts
│       │       ├── vibeAgent.ts
│       │       ├── teaserAgent.ts
│       │       ├── styleAgent.ts
│       │       ├── imageGenAgent.ts
│       │       ├── capsuleAgent.ts
│       │       ├── fulfillmentAgent.ts
│       │       └── growthAgent.ts
│       └── wrangler.toml
├── packages/
│   ├── types/index.ts
│   └── city-vibes-db/cities.json
├── supabase/
│   └── migrations/001_initial_schema.sql
├── .env.local          ← 로컬 전용, gitignore 필수
├── .env.example        ← 변수명만, GitHub 커밋 OK
├── .gitignore
└── CLAUDE.md
```

---

## Agent 아키텍처

```
User
 └─ Orchestrator
      ├─ [FREE] weatherAgent   → Open-Meteo API (캐싱)
      ├─ [FREE] vibeAgent      → Claude API (무드 네이밍)
      ├─ [FREE] teaserAgent    → NanoBanana API (1장만 생성)
      ├─ [FREE] capsuleAgent   → Claude API (카운트+원칙만)
      ├─ [PRO]  styleAgent     → Claude API (프롬프트 생성)
      ├─ [PRO]  imageGenAgent  → NanoBanana API (4~6장)
      ├─ [ALL]  capsuleAgent   → Claude API (full: 결제 후)
      ├─ [ALL]  fulfillmentAgent → R2 + Resend
      └─ [ALL]  growthAgent    → 공유 링크 + UTM
```

**비용 핵심 규칙:**
- teaserAgent: NanoBanana 1장만 실제 생성. 나머지 3장은 CSS blur+tint overlay (프론트 처리)
- weatherAgent: city+month 키로 24시간 캐싱 (weather_cache 테이블)
- Annual 플랜: usage_records로 연간 12회 서버사이드 카운팅

---

## DB 스키마

```
trips            -- id, session_id, cities(JSONB), month, face_url, status, expires_at
orders           -- id, polar_order_id(UNIQUE), trip_id, plan(PlanType), amount, upgrade_from, status
generation_jobs  -- id, trip_id, city, job_type("teaser"/"full"), prompt, status, image_url, attempts
capsule_results  -- id, trip_id, items(JSONB), daily_plan(JSONB)
city_vibes       -- id, city, country, lat, lon, vibe_cluster, style_keywords(JSONB), mood_name
weather_cache    -- id, city, month(UNIQUE with city), data(JSONB), cached_at
email_captures   -- id, trip_id, email, captured_at
usage_records    -- id, user_email, plan("annual"), trip_count, period_start, period_end
```

---

## API 엔드포인트

```
GET  /api/health
POST /api/preview          ← Turnstile 검증 필수, IP+세션 일일 5회 제한
POST /api/preview/email    ← 이메일 캡처 + Resend 무드 카드 발송
POST /api/payment/checkout ← Polar checkout (plan: "standard"|"pro"|"annual")
POST /api/payment/webhook  ← HMAC-SHA256 검증 필수
POST /api/payment/upgrade  ← Standard → Pro 업그레이드 (upgrade_token 검증)
GET  /api/result/:tripId
GET  /api/share/:tripId
```

---

## 환경변수 전체 목록

| 변수명 | 위치 | 비고 |
|--------|------|------|
| ANTHROPIC_API_KEY | Workers Secret | |
| NANOBANANA_API_KEY | Workers Secret | |
| POLAR_ACCESS_TOKEN | Workers Secret | |
| POLAR_WEBHOOK_SECRET | Workers Secret | HMAC 검증용 |
| POLAR_PRODUCT_ID_STANDARD | Workers Plain | |
| POLAR_PRODUCT_ID_PRO | Workers Plain | |
| POLAR_PRODUCT_ID_ANNUAL | Workers Plain | |
| SUPABASE_URL | Workers Plain | |
| SUPABASE_SERVICE_ROLE_KEY | Workers Secret | Worker에서만 사용 |
| NEXT_PUBLIC_SUPABASE_URL | Pages Env | |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Pages Env | |
| R2_ACCOUNT_ID | Workers Plain | |
| R2_ACCESS_KEY_ID | Workers Secret | |
| R2_SECRET_ACCESS_KEY | Workers Secret | |
| R2_BUCKET_NAME | Workers Plain | |
| R2_PUBLIC_URL | Workers Plain + Pages Env | CDN URL |
| RESEND_API_KEY | Workers Secret | |
| GOOGLE_PLACES_API_KEY | Workers Secret | |
| CLOUDFLARE_TURNSTILE_SECRET_KEY | Workers Secret | 서버 검증용 |
| NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY | Pages Env | 위젯 렌더용 |

---

## 코드에서 환경변수 읽는 방법

### Workers (Hono) — 반드시 c.env 사용
```typescript
// ❌ 절대 금지
process.env.ANTHROPIC_API_KEY

// ✅ 올바른 방법
type Bindings = {
  ANTHROPIC_API_KEY: string
  NANOBANANA_API_KEY: string
  // ... 전체 변수
}
const app = new Hono<{ Bindings: Bindings }>()
app.post('/api/preview', async (c) => {
  const key = c.env.ANTHROPIC_API_KEY
})

// Agent 함수에 env 전달
export async function vibeAgent(input: VibeInput, env: Bindings) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
}
```

### Next.js (클라이언트) — NEXT_PUBLIC_ 만
```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL      // ✅ 브라우저 OK
process.env.SUPABASE_SERVICE_ROLE_KEY     // ❌ 절대 클라이언트 노출 금지
```

---

## 디자인 시스템 (Stitch 확정)

### 컬러 (tailwind.config.ts)
```
primary:     #b8552e  ← CTA, 강조
secondary:   #1A1410  ← 텍스트, 다크 배경
cream:       #FDF8F3  ← 메인 배경
sand:        #F5EFE6  ← 보조 배경
gold:        #D4AF37  ← 별점, 이탤릭 강조
weatherBlue: #E0F2FE  ← 날씨 UI
```

### 타이포그래피
```
serif: Playfair Display   ← 헤딩, 이탤릭 (editorial-text 클래스)
sans:  Plus Jakarta Sans  ← 바디, UI
아이콘: Material Symbols Outlined
```

### 섹션별 배경 패턴
```
Header:      bg-cream/95 backdrop-blur-sm border-b border-sand
Hero:        bg-secondary grain-overlay
Features:    bg-cream
HowItWorks:  bg-sand
Testimonial: bg-white border-y border-sand
CTA 섹션:   bg-secondary
Footer:      bg-white border-t border-sand
```

### 무드 네이밍 시스템
vibeAgent가 생성. 모든 UI 카피에 적용.
```
"Paris — Rainy Chic"          "Tokyo — Urban Minimal"
"Bali — Coastal Ease"         "New York — Street Edge"
"Barcelona — Sun-Soaked Bold" "London — Understated Layer"
"Rome — Golden Hour"          "Seoul — Clean Contemporary"
```
카피 패턴: "{City} — {MoodName}" (이미지 수 언급 최소화)

---

## 전환 심리 장치

### ProgressChecklist
```
✅ Weather analyzed for {cities}
✅ City vibe matched — {MoodName}   ← italic text-gold 강조
✅ 4 looks generated (1 unlocked)
🔒 Full capsule ({N} items) + Day-by-day plan
```

### TeaserGrid (2×2)
- [0] 선명 이미지 (실제 생성 1장)
- [1][2][3] 동일 이미지 + CSS blur(8px) + tint overlay + lock icon
- 만료 타이머: "Expires in HH:MM:SS" 실시간 카운트다운
- 하단: "3 more looks waiting — Unlock now"

### 업셀
- Standard 결제 직후 UpgradeModal 표시
- "Pro로 업그레이드 — 지금 $7 추가"
- 3분 MM:SS 카운트다운
- upgrade_token: growthAgent 생성, 3분 유효

---

## 보안 규칙 (절대 위반 금지)

1. `.env.local` GitHub 커밋 절대 금지
2. 코드 내 API 키 하드코딩 금지
3. Workers에서 `process.env` 사용 금지
4. `NEXT_PUBLIC_` 변수에 비밀키 절대 금지
5. `SUPABASE_SERVICE_ROLE_KEY` Worker에서만 사용
6. Polar webhook: HMAC-SHA256 검증 없으면 401 반환
7. `/api/preview`: Turnstile 토큰 검증 필수 (SKIP_TURNSTILE=true 로컬 전용)
8. Annual 12회 제한: `usage_records` 서버사이드 검증만 신뢰
9. R2 원본 사진: 이미지 생성 완료 즉시 삭제

---

## Polar 결제 규칙

- 디지털 상품만 판매 (OK)
- Standard/Pro: 일회성 결제, 자동갱신 없음
- Annual: 연간 구독, 갱신 조건 결제 전 명확히 표시
- webhook HMAC-SHA256 서명 검증 필수
- `polar_order_id` UNIQUE 제약으로 중복 방지
- 업그레이드: `upgrade_from` 필드로 추적

---

## Rate Limiting

| 구분 | 제한 | 방법 |
|------|------|------|
| Free 생성 | 하루 5회 (IP + session) | Supabase 또는 Workers KV |
| Turnstile | /api/preview 모든 요청 | CLOUDFLARE_TURNSTILE_SECRET_KEY |
| Annual | 연간 12회 | usage_records.trip_count 서버사이드 |

---

## 공유 루프

```
결과 페이지 → "내 {City} {MoodName} 무드 보기" 공유 링크
    ↓ UTM: utm_source=share&utm_medium=direct&utm_campaign={moodName}
/share/{tripId}
    ↓
TeaserGrid (1선명+3블러) + "나도 만들기" CTA → 신규 유저 유입
```

---

## 완료된 작업

- 랜딩 페이지 디자인 (Stitch 확정)
- 전체 아키텍처 설계
- Free→Paid 퍼널 전략 확정
- 가격 플랜 확정 ($5 / $12 / $29)
- Annual 12회 제한 원가 검증 완료

## 남은 작업 (우선순위 순)

1. supabase/migrations/001_initial_schema.sql (8개 테이블)
2. packages/city-vibes-db/cities.json (30개 도시 + mood_name)
3. apps/worker/src/agents/ (9개 Agent)
4. apps/web/components/funnel/ (8개 퍼널 컴포넌트)
5. apps/web/app/ (랜딩/폼/프리뷰/결과/공유 페이지)
6. Cloudflare Turnstile 연동
7. Polar checkout + webhook
8. R2 Lifecycle Rule (48시간 TTL)
9. 배포 및 도메인 연결
