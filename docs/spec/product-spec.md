# Travel Capsule AI -- Product Specification

> **Version**: 2.0.0
> **Last Updated**: 2026-02-28
> **Status**: Development
> **Domain**: TravelCapsule.com
> **Pricing**: Standard $5 / Pro $12 / Annual $29/yr (12 trips)

---

## Table of Contents

- [제품 개요](#제품-개요)
- [1. 퍼널 7단계 플로우](#1-퍼널-7단계-플로우)
- [2. Free 경험 4가지 상세](#2-free-경험-4가지-상세)
- [3. 가격 플랜 상세](#3-가격-플랜-상세)
- [4. 전환 심리 장치](#4-전환-심리-장치)
- [5. Post-결제 업셀 스펙](#5-post-결제-업셀-스펙)
- [6. 공유 루프 스펙](#6-공유-루프-스펙)
- [7. API 엔드포인트 명세](#7-api-엔드포인트-명세)
- [8. Rate Limit & Abuse Prevention](#8-rate-limit--abuse-prevention)

---

## 제품 개요

**TravelCapsule.com** -- AI 여행 스타일링 서비스.

사용자가 **도시(최대 5개) + 여행 월 + 사진(선택)**을 입력하면, AI가 도시별 날씨와 바이브를 분석하고, 무드 네이밍을 생성하며, 티저 이미지를 먼저 보여준 뒤, 결제 후 전체 코디 이미지 + 캡슐 워드로브 + 데일리 아웃핏 플랜을 제공한다.

### 핵심 원칙

> Free는 충분히 가치 있게 느껴지되, 진짜 payoff는 결제 후에만 공개한다.

### 서비스 파이프라인

```
사용자 입력 (도시 + 여행월 + 사진)
    |
    v  Turnstile 봇 검증
[FREE] 날씨 분석 (Open-Meteo)
    |
    v
[FREE] 도시 바이브 매칭 + 무드 네이밍 (Claude API)
    |
    v
[FREE] 캡슐 카운트 추정 (Claude API)
    |
    v
[FREE] 티저 이미지 생성 (NanoBanana 1장 + CSS blur 3장)
    |
    v  이메일 캡처 (마이크로 컨버전)
    v  페이월 (Standard $5 / Pro $12 / Annual $29)
    |
    v  Polar 결제
[POST-결제] 업셀 UpgradeModal (Standard -> Pro, $7 추가, 3분 타이머)
    |
    v
[PAID] 전체 이미지 생성 + 캡슐 워드로브 + 데일리 플랜
    |
    v
갤러리 링크 발송 (Resend) + 공유 루프 (UTM)
```

### 타겟 사용자

| 세그먼트 | 설명 | 예상 비중 |
|----------|------|-----------|
| 트래블 플래너 | 여행 전 옷 고민에 시간을 쓰는 2030세대 | 40% |
| 캡슐 워드로브 팬 | 짐 최소화, 효율적 패킹을 원하는 여행자 | 25% |
| SNS 패션 공유족 | 여행 코디를 인스타/X에 공유하는 인플루언서 지향층 | 20% |
| 잦은 출장자 | 월 1회 이상 해외 출장, Annual 플랜 타겟 | 15% |

### 기술 스택 (변경 금지)

| 영역 | 기술 |
|------|------|
| Frontend | Next.js App Router -> Cloudflare Pages |
| API | Cloudflare Workers (Hono) |
| DB | Supabase (Postgres + RLS) |
| Storage | Cloudflare R2 |
| 결제 | Polar (MoR) -- Stripe 사용 금지 |
| 이미지 생성 | NanoBanana API |
| AI (Style/Capsule/Vibe) | Claude API (claude-sonnet-4-6) |
| 기후 데이터 | Open-Meteo (무료, 가입 불필요) |
| 도시 검색 | Google Places API |
| 이메일 | Resend |
| 봇 차단 | Cloudflare Turnstile |

### Agent 아키텍처

```
User
 +-- Orchestrator (apps/worker/src/agents/orchestrator.ts)
      |
      +-- [FREE] weatherAgent.ts   -> Open-Meteo API (24h 캐싱)
      +-- [FREE] vibeAgent.ts      -> Claude API (무드 네이밍)
      +-- [FREE] teaserAgent.ts    -> NanoBanana API (1장만 실제 생성)
      +-- [FREE] capsuleAgent.ts   -> Claude API (카운트 + 3원칙만)
      |
      +-- [PAID] styleAgent.ts     -> Claude API (전체 프롬프트 생성)
      +-- [PAID] imageGenAgent.ts  -> NanoBanana API (4~6장 실제 생성)
      +-- [PAID] capsuleAgent.ts   -> Claude API (full: 캡슐 리스트 + 데일리 플랜)
      |
      +-- [ALL]  fulfillmentAgent.ts -> R2 업로드 + Resend 이메일
      +-- [ALL]  growthAgent.ts      -> 공유 링크 + UTM + upgrade_token
```

---

## 1. 퍼널 7단계 플로우

### Stage 1: 입력 (Input)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | 도시(최대 5개, Google Places Autocomplete) + 각 도시 체류 일수 + 여행 월 선택 + 사진 업로드(선택) 입력. Cloudflare Turnstile 위젯 통과. |
| **UI 요소** | - `CitySearchInput`: Google Places Autocomplete, 2글자부터 추천, `(cities)` 타입 필터<br>- `MonthPicker`: 12개월 그리드 (현재 월 기본 선택)<br>- `PhotoUpload`: 드래그앤드롭 + 파일 선택, "Optional -- helps personalize your looks" 라벨<br>- `Turnstile Widget`: 입력 폼 하단, 비침입적 CAPTCHA<br>- 프로그레스 표시: Step 1/3 -> 2/3 -> 3/3<br>- 가격 고지: 폼 상단 "Free preview first, $5 to unlock" 상시 노출 |
| **이탈 위험 포인트** | 1) 도시 검색이 안 되거나 느리면 좌절<br>2) 사진 업로드가 필수로 느껴지면 진입 장벽<br>3) 폼이 복잡하게 보이면 이탈 (특히 모바일)<br>4) Turnstile이 반복 실패하면 이탈 |
| **대응 전략** | 1) Google Places API로 2글자부터 즉시 추천, 한국어/영어 도시명 모두 지원<br>2) 사진 업로드 영역에 "(Optional)" 명확히 표시, 건너뛰기 가능<br>3) 3단계 스텝 방식으로 한 번에 하나만 집중, 모바일 풀스크린 모드<br>4) Turnstile 실패 시 자동 재시도 + "새로고침" 안내 |
| **핵심 KPI** | 폼 시작률 > 30%, 폼 완료율 > 60% |

**데이터 수집 시점:**

```typescript
// POST /api/preview request body
{
  cities: [
    { name: "Paris", country: "France", days: 4, lat: 48.856, lon: 2.352 },
    { name: "Barcelona", country: "Spain", days: 3, lat: 41.385, lon: 2.173 }
  ],
  month: 6,
  faceUrl?: "r2://tmp/{uuid}.jpg",  // 업로드 완료 시에만
  turnstileToken: "cf-turnstile-response-xxx",
  sessionId: "sess_xxx"
}
```

---

### Stage 2: Free 리워드 (Free Reward)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | 입력 제출 후 30~60초 대기. ProgressChecklist가 단계별로 완료 상태 업데이트. 날씨 카드, 바이브 카드, 캡슐 추정기가 순차적으로 표시됨. |
| **UI 요소** | - `ProgressChecklist`: 4단계 체크리스트 (step 1~3 완료, step 4 잠금)<br>- `WeatherCard`: 도시별 날씨 리포트<br>- `VibeCard`: 무드 네이밍 + 컬러 팔레트<br>- `CapsuleEstimator`: 아이템 수 + 레이어링 3원칙<br>- 각 카드 등장 시 fade-in + slide-up 애니메이션 |
| **이탈 위험 포인트** | 1) 대기 시간이 길면 (2분+) 탭 닫기<br>2) 진행 상황이 보이지 않으면 불안<br>3) Free 리워드 품질이 낮으면 결제 의지 소멸 |
| **대응 전략** | 1) 멀티 스텝 프로그레스: "Analyzing weather..." -> "Matching vibe..." -> "Generating looks..." (5초 폴링)<br>2) 각 단계 완료 시 즉시 카드 표시 (전체 완료 대기 X)<br>3) Free 리워드 자체가 가치 있도록 설계 (날씨 인사이트, 무드 네이밍 = 공유 가능 콘텐츠) |
| **핵심 KPI** | 대기 중 이탈률 < 15%, Free 리워드 도달률 > 85% |

**ProgressChecklist 상태 전이:**

```
[1] pending  -> loading -> done   "Weather analyzed for Paris, Barcelona"
[2] pending  -> loading -> done   "City vibe matched -- Rainy Chic"
[3] pending  -> loading -> done   "4 looks generated (1 unlocked)"
[4] locked   -> locked  -> locked "Full capsule (9 items) + Day-by-day plan"
```

---

### Stage 3: 티저 (Teaser)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | 이미지 생성 완료 후 2x2 그리드 확인. 첫 번째 이미지만 선명, 나머지 3장은 블러+틴트. 만료 타이머 확인. |
| **UI 요소** | - `TeaserGrid`: 2x2 그리드 레이아웃<br>&nbsp;&nbsp;- `[0]` 선명 이미지 (실제 NanoBanana 생성 1장) + 워터마크<br>&nbsp;&nbsp;- `[1][2][3]` 동일 이미지 + `filter: blur(8px)` + tint overlay (#000 opacity 0.3) + 🔒 lock 아이콘 중앙 배치<br>- `ExpiresTimer`: "Expires in HH:MM:SS" 실시간 카운트다운 (`trips.expires_at` 기준)<br>- 하단 카피: "3 more looks waiting -- Unlock now" |
| **이탈 위험 포인트** | 1) 첫 이미지 품질이 기대 이하면 결제 의지 소멸<br>2) 블러 이미지가 매력적이지 않으면 궁금하지 않음<br>3) 만료 타이머가 압박으로 느껴지면 반감 |
| **대응 전략** | 1) teaserAgent: 가장 매력적인 무드(golden-hour 등) 프롬프트 최적화<br>2) blur(8px)는 실루엣은 보이되 디테일은 숨기는 최적 수준<br>3) 타이머는 시각적 urgency만, 카피는 부드럽게: "Your looks are reserved" |
| **핵심 KPI** | 티저 조회 -> 페이월 진입 > 50% |

**TeaserGrid CSS 스펙:**

```css
.teaser-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-width: 600px;
}

.teaser-image--blurred {
  filter: blur(8px);
  position: relative;
}

.teaser-image--blurred::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.teaser-watermark {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
}
```

---

### Stage 4: 이메일 캡처 (Email Capture)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | "무드 카드 이메일 전송" CTA 클릭. 이메일 입력 후 제출. 마이크로 컨버전 완료. |
| **UI 요소** | - `EmailCapture` 컴포넌트: TeaserGrid 하단 배치<br>- 헤딩: "Get your {City} mood card in your inbox"<br>- 이메일 입력 필드 + "Send Free" 버튼<br>- 하단 소인: "No spam. Just your travel mood." + 프라이버시 링크<br>- 성공 상태: 체크마크 + "Sent! Check your inbox" |
| **이탈 위험 포인트** | 1) 이메일 입력이 강제로 느껴지면 반감<br>2) 스팸 우려로 이메일 제출 거부<br>3) 이메일 캡처가 페이월 진입을 방해하면 역효과 |
| **대응 전략** | 1) 이메일 캡처는 optional, 건너뛰기 가능 ("Skip" 텍스트 링크)<br>2) "No spam" 문구 명시 + Resend 발송 (신뢰 도메인)<br>3) 이메일 입력 후에도 바로 페이월로 이동 가능, 흐름 차단 X |
| **핵심 KPI** | 이메일 캡처율 > 20% (전체 Free 리워드 도달 사용자 대비) |

**이메일 발송 내용:**

```
Subject: Your {City} Travel Mood -- {MoodName}
Body:
- 무드 카드 이미지 (vibeAgent 결과)
- 날씨 요약 1줄
- "Unlock your full capsule wardrobe" CTA 버튼 -> /preview/{tripId}
```

---

### Stage 5: 페이월 (Paywall)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | PaywallModal 확인. 3개 플랜 비교. 플랜 선택 후 결제 버튼 클릭. Polar 결제 페이지로 리다이렉트. |
| **UI 요소** | - `PaywallModal`: fixed 모달, backdrop-blur 배경<br>- 3-column 플랜 카드 (모바일: 스와이프 캐러셀)<br>- Pro 카드에 "Best Value" 배지<br>- 각 플랜 CTA 버튼 (아래 [3. 가격 플랜 상세](#3-가격-플랜-상세) 참조)<br>- 하단 공통 소인: "No subscription - Secure payment via Polar"<br>- 만료 타이머 재표시: "Your looks expire in HH:MM:SS" |
| **이탈 위험 포인트** | 1) 플랜 차이가 명확하지 않으면 결정 장애<br>2) 결제 페이지 리다이렉트 시 로딩 지연<br>3) 환불 정책이 보이지 않으면 불안<br>4) 모바일에서 3개 플랜 비교가 어려움 |
| **대응 전략** | 1) 플랜별 feature 체크리스트로 차이 시각화<br>2) Polar Custom Checkout 빠른 리다이렉트<br>3) "100% money-back if not satisfied" 문구 CTA 하단에 표시<br>4) 모바일: 스와이프 캐러셀 + Pro 카드 기본 선택 상태 |
| **핵심 KPI** | 페이월 -> 결제 전환율 > 25%, 모바일 전환율 > 20% |

---

### Stage 6: 결제 + 업셀 (Payment + Upsell)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | Polar 결제 완료 -> 콜백. Standard 결제자에게 UpgradeModal 표시. Pro/Annual 결제자는 바로 결과 페이지로 이동. |
| **UI 요소** | - Polar 결제 페이지 (외부): 카드/Apple Pay/Google Pay<br>- 결제 완료 콜백 -> 결과 페이지 리다이렉트<br>- Standard 결제자 전용: `UpgradeModal` (아래 [5. Post-결제 업셀 스펙](#5-post-결제-업셀-스펙) 참조) |
| **이탈 위험 포인트** | 1) 결제 실패 시 재시도 방법 불명확<br>2) 콜백 로딩 중 이탈<br>3) 업셀이 강압적으로 느껴지면 부정적 경험 |
| **대응 전략** | 1) 결제 실패 시 에러 메시지 + "Try Again" 버튼<br>2) 콜백 시 즉시 "Payment confirmed!" 표시 후 결과 로딩<br>3) UpgradeModal은 "No thanks" 한 번 클릭으로 즉시 닫힘, 재표시 없음 |
| **핵심 KPI** | 결제 완료율 > 70%, 업셀 전환율 > 8% |

**결제 흐름 시퀀스:**

```
Client                    Worker                     Polar
  |                          |                         |
  |-- POST /api/payment/checkout -->|                  |
  |                          |-- Create Checkout -->   |
  |                          |<-- checkout_url -----   |
  |<-- { checkout_url } -----|                         |
  |                          |                         |
  |------ Redirect to Polar checkout_url ----------->  |
  |                          |                         |
  |                          |<-- Webhook (order.paid) |
  |                          |-- Verify HMAC-SHA256    |
  |                          |-- INSERT orders         |
  |                          |-- Start pipeline        |
  |                          |-- (Standard? Generate   |
  |                          |    upgrade_token)        |
  |                          |                         |
  |<------ Callback redirect (success_url) ----------- |
  |                          |                         |
  |-- GET /api/result/:tripId -->|                     |
  |<-- { result + upgradeToken? }|                     |
```

---

### Stage 7: 결과 + 공유 (Result + Share)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | 전체 갤러리 확인 (선명 이미지 4~6장 + 캡슐 워드로브 + 데일리 플랜). 공유 링크 생성 후 SNS 공유. |
| **UI 요소** | - 이미지 갤러리: 도시별 탭 or 스크롤 섹션<br>- 캡슐 워드로브 리스트: 아이템명 + 카테고리 + 이유 + versatility score<br>- 데일리 플랜: 날짜별 아웃핏 조합 + 도시 + 활동 노트<br>- 공유 버튼: "Share Your {City} {MoodName} Look" + 링크 복사/인스타/X/카카오 |
| **이탈 위험 포인트** | 1) 결과 품질이 기대에 못 미치면 부정적 리뷰<br>2) 공유 기능이 불편하면 바이럴 루프 실패 |
| **대응 전략** | 1) 이미지 고품질 보장 (imageGenAgent 3회 재시도 + 품질 체크)<br>2) 원클릭 공유: 링크 복사 + SNS별 최적화 카피 자동 생성 (growthAgent)<br>3) OG 메타태그 최적화로 공유 시 프리뷰 매력적으로 |
| **핵심 KPI** | 공유율 > 15%, 공유 링크 클릭 -> 신규 유입 전환 > 10% |

---

## 2. Free 경험 4가지 상세

### 2-a. 날씨 리포트 카드 (WeatherCard)

도시별로 생성되는 기후 정보 카드. weatherAgent가 Open-Meteo API를 호출하여 데이터를 생성한다.

**카드 구성 요소:**

| 요소 | 설명 | 데이터 소스 |
|------|------|-------------|
| 주간 온도 | "Daytime: {temp_max}C" | Open-Meteo `temperature_2m_max` 월평균 |
| 야간 온도 | "Nighttime: {temp_min}C" | Open-Meteo `temperature_2m_min` 월평균 |
| 강수 확률 바 | 수평 프로그레스 바 (0~100%) + 퍼센트 수치 | Open-Meteo `precipitation_probability_mean` |
| 일교차 경고 | 일교차 > 10C 시 경고 배지 표시 | `temp_max - temp_min > 10` |
| 스타일 힌트 | 1~2줄 텍스트. 날씨 기반 의류 조언. | weatherAgent 룰 기반 생성 |

**카드 UI 스펙:**

```
+------------------------------------------+
|  [SunIcon]  Paris in June                |
|                                          |
|  Daytime    24C        [===|====] 35%    |
|  Nighttime  14C         precipitation    |
|                                          |
|  [!] 10C+ day-night gap -- layer up!     |
|                                          |
|  Hint: Light layers work best. A linen   |
|  blazer handles both cafe and evening.   |
+------------------------------------------+
```

**일교차 경고 로직:**

```typescript
const tempGap = temp_max - temp_min;
if (tempGap > 10) {
  return {
    show: true,
    message: `${tempGap}C+ day-night gap -- layer up!`,
    icon: "warning"
  };
}
```

**스타일 힌트 룰:**

| 조건 | 힌트 예시 |
|------|-----------|
| `temp_max > 30` | "Breathable fabrics are essential. Linen and cotton will be your best friends." |
| `temp_max 20~30, precip < 30%` | "Light layers work best. A linen blazer handles both cafe and evening." |
| `temp_max 10~20` | "Layer game is key. A versatile jacket covers all your bases." |
| `temp_max < 10` | "Pack warm but smart. One quality coat plus layers beats three bulky sweaters." |
| `precip > 60%` | "Rain is likely -- waterproof outer layer is non-negotiable." |

**캐싱 정책:**

- 키: `{city}_{month}` (예: `paris_6`)
- TTL: 24시간 (`weather_cache` 테이블의 `cached_at` + 24h)
- 동일 city+month 요청 시 DB 캐시 우선 조회, Open-Meteo API 호출 절약

---

### 2-b. 시티 바이브 카드 (VibeCard)

vibeAgent(Claude API)가 도시+기후 데이터를 기반으로 생성하는 감성 카드. 무드 네이밍은 제품 전체 카피에 사용되는 핵심 브랜딩 요소.

**카드 구성 요소:**

| 요소 | 설명 | 생성 주체 |
|------|------|-----------|
| 무드 네이밍 | `"{City} -- {MoodName}"` 형식 | vibeAgent (Claude API) |
| 바이브 태그 3개 | 해시태그 형태의 분위기 키워드 | vibeAgent |
| 컬러 팔레트 3~5색 | HEX 코드 + 컬러 스와치 원형 표시 | vibeAgent |
| 피해야 할 것 1줄 | "Avoid: {anti-recommendation}" | vibeAgent |

**카드 UI 스펙:**

```
+------------------------------------------+
|                                          |
|  Paris -- Rainy Chic                     |
|  (font-family: Playfair Display, italic) |
|  (color: #D4AF37, text-gold)            |
|                                          |
|  #EffortlessElegance  #CafeTerraces     |
|  #MidnightStrolls                        |
|                                          |
|  [#2C3E50] [#8E7CC3] [#F5E6D3]          |
|  [#C0392B] [#ECF0F1]                     |
|  (컬러 스와치 원형, 24px)               |
|                                          |
|  Avoid: Bright neon athletic wear --     |
|  it clashes with the city's understated  |
|  elegance.                               |
|                                          |
+------------------------------------------+
```

**무드 네이밍 예시 (vibeAgent 출력):**

| 도시 | 무드 네이밍 | 바이브 태그 |
|------|-------------|-------------|
| Paris (June) | Rainy Chic | #EffortlessElegance #CafeTerraces #MidnightStrolls |
| Tokyo (March) | Urban Minimal | #CleanLines #StreetCulture #CherryBlossom |
| Bali (August) | Coastal Ease | #BarefootLuxury #TropicalBreeze #SunsetGold |
| New York (October) | Street Edge | #ConcreteCool #LayerGame #GalleryHopping |
| Barcelona (July) | Sun-Soaked Bold | #MediterraneanHeat #ColorPop #RooftopVibes |
| London (November) | Understated Layer | #QuietLuxury #WoolAndTweed #RainyRefinement |
| Rome (May) | Golden Hour | #DolceVita #WarmNeutrals #PiazzaEvenings |
| Seoul (April) | Clean Contemporary | #K-MinimalChic #PastelTones #CafeHopping |

**무드 네이밍 스타일 규칙:**

- 폰트: Playfair Display, italic
- 색상: `#D4AF37` (gold)
- 형식: 항상 `"{City} -- {MoodName}"` (em dash 사용)
- 길이: MoodName은 2~3 단어 이내

---

### 2-c. 캡슐 카운트 추정기 (CapsuleEstimator)

capsuleAgent(Claude API)가 Free 단계에서 제공하는 경량 결과. 풀 캡슐 리스트는 결제 후에만 공개.

**표시 내용:**

| 요소 | 설명 | 예시 |
|------|------|------|
| 아이템 카운트 | 전체 캡슐에 필요한 의류 수 | "9 items cover your entire trip" |
| 레이어링 3원칙 | 캡슐 구성의 핵심 원칙 3가지 | 아래 참조 |
| 잠금 안내 | 풀 리스트는 결제 후 공개 | "Full list + daily plan -- unlock below" |

**카드 UI 스펙:**

```
+------------------------------------------+
|  [PackageIcon]                           |
|                                          |
|  9 items cover your entire trip          |
|  Paris (4 days) + Barcelona (3 days)     |
|                                          |
|  The 3 Capsule Principles:               |
|  1. Neutral base, bold accent -- mix     |
|     and match without clashing           |
|  2. Each piece works in 3+ outfits --    |
|     maximum versatility per item         |
|  3. Layer for temperature swings --      |
|     one jacket replaces two sweaters     |
|                                          |
|  --------------------------------        |
|  [LockIcon] Full list + daily plan       |
|             Unlock below                 |
+------------------------------------------+
```

**capsuleAgent Free 모드 프롬프트 (간략):**

```
Role: Travel capsule wardrobe advisor (estimate mode).
Input: cities, days, climate data.
Output: { itemCount: number, principles: string[3] }
Do NOT generate the full item list. Only the count and 3 principles.
```

**아이템 카운트 산출 기준:**

| 여행 일수 | 예상 아이템 수 | 비고 |
|-----------|----------------|------|
| 3~5일 | 8~10개 | 1 도시 |
| 6~10일 | 10~12개 | 2~3 도시 |
| 11~14일 | 12~15개 | 3~5 도시 |

---

### 2-d. 티저 이미지 2x2 (TeaserGrid)

NanoBanana API로 **실제 생성하는 이미지는 1장만**. 나머지 3장은 동일 이미지에 CSS blur + tint overlay를 적용하여 비용을 최소화한다. 첫 번째 도시만 대상.

**구성:**

| 슬롯 | 처리 방식 | 표시 상태 |
|-------|-----------|-----------|
| `[0]` 좌상단 | NanoBanana 실제 생성 1장 | 선명 + 워터마크 ("TravelCapsule.com") |
| `[1]` 우상단 | `[0]` 이미지 + CSS `blur(8px)` + `hue-rotate(15deg)` | 블러 + 틴트 + 🔒 아이콘 |
| `[2]` 좌하단 | `[0]` 이미지 + CSS `blur(8px)` + `brightness(1.1) saturate(0.8)` | 블러 + 틴트 + 🔒 아이콘 |
| `[3]` 우하단 | `[0]` 이미지 + CSS `blur(8px)` + `sepia(0.2)` | 블러 + 틴트 + 🔒 아이콘 |

**비용 최적화 효과:**

```
Before (old spec): 4장 실제 생성 = 4x NanoBanana API call
After (new spec):  1장 실제 생성 + 3장 CSS 변형 = 1x NanoBanana API call
Cost savings:      75% per free preview
```

**워터마크 스펙:**

- 텍스트: "TravelCapsule.com"
- 위치: 이미지 우하단 (bottom: 8px, right: 8px)
- 스타일: `font-size: 10px; color: rgba(255, 255, 255, 0.5); pointer-events: none;`
- 선명 이미지 `[0]`에만 적용 (블러 이미지는 blur가 워터마크 역할)

**teaserAgent 프롬프트 최적화:**

```
첫 번째 도시 + 가장 매력적인 시간대 (golden hour 선호) 기준으로 프롬프트 생성.
NanoBanana: 768x1024, style: "editorial fashion photography", negative: "text, watermark, logo"
```

---

## 3. 가격 플랜 상세

### 플랜 비교표

| | Standard | Pro | Annual |
|---|---|---|---|
| **가격** | **$5** (일회성) | **$12** (일회성) | **$29/년** (12회 제한) |
| **월 환산** | - | - | **$2.42/month** |
| **원가** | ~$0.10/trip | ~$0.30/trip | 최대 $3.60/년 |
| **이미지** | 선명 4장 (블러 해제) | 전 도시 4~6장 **실제 생성** | Pro와 동일 |
| **이미지 품질** | 표준 (768x1024) | **고화질** (1024x1536) | 고화질 |
| **재생성** | 불가 | **1회 재생성** 가능 | 1회 재생성 |
| **캡슐 리스트** | O | O | O |
| **데일리 플랜** | O | O | O |
| **결제 방식** | 단일 결제 | 단일 결제 | 연간 구독 |
| **CTA 텍스트** | "Unlock Your {City} Looks" | "Get Pro -- Best Value" | 아래 참조 |
| **CTA 스타일** | `bg-primary text-white` | `bg-primary text-white ring-2 ring-gold` | `bg-secondary text-white` |

### Standard ($5)

```
+------------------------------------------+
|  Standard                                |
|  $5                one-time              |
|                                          |
|  [check] 4 looks unlocked (blur removed) |
|  [check] Complete capsule wardrobe list  |
|  [check] Day-by-day outfit plan          |
|                                          |
|  [ Unlock Your Paris Looks ]             |
|  (bg-primary text-white rounded-full)    |
+------------------------------------------+
```

**Standard 상세:**

- 선명 이미지 4장: 티저 생성된 1장의 블러 해제 + 동일 이미지의 CSS 변형 3장 (실제 추가 생성 없음)
- 캡슐 리스트: capsuleAgent full 모드 실행 (8~12개 아이템 상세)
- 데일리 플랜: 날짜별 아웃핏 조합
- CTA 동적 치환: `{City}`는 첫 번째 도시명으로 치환

### Pro ($12)

```
+------------------------------------------+
|  Pro               [Best Value badge]    |
|  $12               one-time              |
|                                          |
|  [check] All cities, 4-6 looks EACH     |
|  [check] High-resolution images          |
|  [check] 1x regeneration if unsatisfied  |
|  [check] Complete capsule wardrobe list  |
|  [check] Day-by-day outfit plan          |
|                                          |
|  [ Get Pro -- Best Value ]               |
|  (bg-primary text-white ring-2 ring-gold |
|   rounded-full)                          |
+------------------------------------------+
```

**Pro 상세:**

- 전 도시 이미지: 도시별 4~6장 **실제 NanoBanana 생성** (최대 5 도시 x 6장 = 30장)
- 고화질: 1024x1536 해상도
- 1회 재생성: 결과 불만족 시 1회 전체 재생성 가능 (generation_jobs.attempts 리셋)
- "Best Value" 배지: gold 배경 (#D4AF37) + white 텍스트
- CTA에 `ring-2 ring-gold` 외곽선 추가로 시각적 강조

### Annual ($29/년)

```
+------------------------------------------+
|  Annual                                  |
|  $29/year          $2.42/month           |
|                                          |
|  [check] Everything in Pro               |
|  [check] 12 trips per year               |
|  [check] Priority generation queue       |
|                                          |
|  "For the traveler who never stops       |
|   -- $2.42/month"                        |
|                                          |
|  [ Start Annual Plan ]                   |
|  (bg-secondary text-white rounded-full)  |
+------------------------------------------+
```

**Annual 상세:**

- Pro 혜택 전체 포함
- 연간 12회 사용 제한: **서버사이드 `usage_records` 테이블에서 검증 필수**
- 프론트엔드 단독 검증 절대 금지
- 12회 초과 시: HTTP 429 반환 + 에러 메시지
- 갱신 조건: 결제 전 명확히 표시 ("Renews annually. Cancel anytime.")

**Annual 서버사이드 검증 로직:**

```typescript
// apps/worker/src/agents/orchestrator.ts
async function checkAnnualLimit(email: string, env: Bindings): Promise<boolean> {
  const { data } = await supabase
    .from('usage_records')
    .select('trip_count, period_start, period_end')
    .eq('user_email', email)
    .eq('plan', 'annual')
    .gte('period_end', new Date().toISOString())
    .single();

  if (!data) return true; // No record = first use
  return data.trip_count < 12;
}

// 초과 시 응답
// HTTP 429
// { "error": "Annual limit reached", "limit": 12, "used": 12, "renews_at": "2027-02-28T..." }
```

### 공통 소인

모든 플랜 카드 하단에 표시:

```
"No subscription - Secure payment via Polar"
```

- Standard/Pro: 일회성 결제, 자동갱신 없음
- Annual: 연간 구독이므로 "Renews annually. Cancel anytime." 추가 표시

---

## 4. 전환 심리 장치

### 4-1. ProgressChecklist

사용자의 진행 상태를 시각화하여 sunk cost 효과 + 완성 욕구를 자극하는 핵심 전환 장치.

**4단계 체크리스트:**

| 단계 | 텍스트 | 상태 UI | 조건 |
|------|--------|---------|------|
| 1 | `Weather analyzed for {cities}` | `pending` -> `loading` -> `done` | weatherAgent 완료 |
| 2 | `City vibe matched -- {MoodName}` | `pending` -> `loading` -> `done` | vibeAgent 완료 |
| 3 | `4 looks generated (1 unlocked)` | `pending` -> `loading` -> `done` | teaserAgent 완료 |
| 4 | `Full capsule ({N} items) + Day-by-day plan` | `locked` (항상) | 결제 후에만 해제 |

**각 상태별 UI 명세:**

```
[pending]  | [ ] 회색 원 + 회색 텍스트
           | color: #9CA3AF (gray-400)
           | font-weight: normal

[loading]  | [spinner] 회전 애니메이션 + 텍스트 펄스
           | color: #b8552e (primary)
           | animation: pulse 1.5s infinite

[done]     | [checkmark] 체크 아이콘 + 텍스트
           | color: #059669 (emerald-600)
           | font-weight: medium
           | checkmark: Material Symbols "check_circle" filled

[locked]   | [lock] 자물쇠 아이콘 + 텍스트
           | color: #6B7280 (gray-500)
           | background: #F3F4F6 (gray-100) padding
           | icon: Material Symbols "lock" outlined
```

**단계 2 특수 스타일 (MoodName 강조):**

```
"City vibe matched -- "  (normal)
"{MoodName}"             (font-family: Playfair Display, italic, color: #D4AF37)
```

**컴포넌트 Props 인터페이스:**

```typescript
interface ProgressChecklistProps {
  steps: {
    id: number;
    text: string;
    status: 'pending' | 'loading' | 'done' | 'locked';
    highlight?: {
      text: string;           // e.g., "Rainy Chic"
      className: string;      // e.g., "font-serif italic text-gold"
    };
  }[];
}
```

---

### 4-2. 만료 카운트다운

`trips.expires_at` 기준으로 실시간 카운트다운 표시. 시각적 urgency를 생성하되, 실제 만료 시 결과가 삭제되지는 않음 (soft expiry).

**타이머 스펙:**

| 속성 | 값 |
|------|-----|
| 형식 | `Expires in HH:MM:SS` |
| 초기값 | trips 생성 시점 + 24시간 |
| 갱신 간격 | 1초 (setInterval) |
| 표시 위치 | TeaserGrid 상단 + PaywallModal 내부 |
| 색상 | 2시간 이상: `text-gray-500`, 2시간 미만: `text-red-500` + pulse 애니메이션 |
| 만료 시 | "Expired -- generate a new preview" + CTA 버튼 |

**타이머 구현:**

```typescript
function useExpiresTimer(expiresAt: string) {
  const [remaining, setRemaining] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Expired');
        clearInterval(interval);
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemaining(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
      setIsUrgent(diff < 7200000); // 2 hours
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return { remaining, isUrgent };
}
```

---

### 4-3. 업셀 타이밍

Standard 결제 webhook 처리 완료 직후 UpgradeModal을 표시한다. 아래 [5. Post-결제 업셀 스펙](#5-post-결제-업셀-스펙)에서 상세 기술.

**타이밍 시퀀스:**

```
1. Polar webhook (order.paid) 수신
2. HMAC-SHA256 서명 검증
3. orders 테이블 INSERT (plan: "standard")
4. growthAgent: upgrade_token 생성 (HMAC, 3분 유효)
5. 결과 페이지 로드 시 upgrade_token 포함하여 응답
6. 클라이언트: UpgradeModal 즉시 표시
```

---

## 5. Post-결제 업셀 스펙

### 트리거 조건

| 조건 | 값 |
|------|-----|
| 대상 | Standard 결제 완료 사용자만 |
| 시점 | Polar webhook 처리 완료 직후, 결과 페이지 첫 로드 시 |
| 횟수 | 1회만 (UpgradeModal dismiss 후 재표시 없음) |
| Pro/Annual 결제자 | UpgradeModal 미표시, 바로 결과 |

### UpgradeModal UI 스펙

```
+--------------------------------------------------+
|  (backdrop: bg-black/50 backdrop-blur-sm)        |
|                                                  |
|  +--------------------------------------------+ |
|  |                                            | |
|  |  Want the full picture?                    | |
|  |  Upgrade to Pro -- just $7 more            | |
|  |                                            | |
|  |  [check] All cities, 4-6 real looks each   | |
|  |  [check] High-resolution images            | |
|  |  [check] 1x regeneration included          | |
|  |                                            | |
|  |  +--------------------------------------+  | |
|  |  |                                      |  | |
|  |  |  Expires in MM:SS                    |  | |
|  |  |  (countdown, text-red-500 pulse)     |  | |
|  |  |                                      |  | |
|  |  +--------------------------------------+  | |
|  |                                            | |
|  |  [ Upgrade for $7 ]                        | |
|  |  (bg-primary text-white rounded-full       | |
|  |   w-full py-3 font-semibold)               | |
|  |                                            | |
|  |  No thanks                                 | |
|  |  (ghost button, text-gray-400              | |
|  |   text-sm underline)                       | |
|  |                                            | |
|  +--------------------------------------------+ |
|                                                  |
+--------------------------------------------------+
```

### 업셀 카피

| 요소 | 텍스트 |
|------|--------|
| 헤딩 | "Want the full picture?" |
| 서브헤딩 | "Upgrade to Pro -- just $7 more" |
| 혜택 체크리스트 | 1) "All cities, 4-6 real looks each"<br>2) "High-resolution images"<br>3) "1x regeneration included" |
| CTA (primary) | "Upgrade for $7" |
| CTA (dismiss) | "No thanks" |

### 타이머 스펙

| 속성 | 값 |
|------|-----|
| 형식 | `MM:SS` |
| 초기값 | 3분 (03:00) |
| 시각적 urgency | 항상 `text-red-500` + pulse 애니메이션 |
| 실제 만료 | `upgrade_token` 3분 후 무효화 (서버사이드) |
| 만료 시 UI | CTA 비활성화 + "Offer expired" 텍스트 |

### upgrade_token 스펙

| 속성 | 값 |
|------|-----|
| 생성 주체 | growthAgent |
| 알고리즘 | HMAC-SHA256 |
| 페이로드 | `{tripId}:{orderId}:{timestamp}` |
| 시크릿 키 | `POLAR_WEBHOOK_SECRET` 재사용 |
| 유효 시간 | 3분 (180초) |
| 재사용 | 불가 (1회 사용 후 orders.upgrade_from에 기록) |

**토큰 생성:**

```typescript
// apps/worker/src/agents/growthAgent.ts
function generateUpgradeToken(
  tripId: string,
  orderId: string,
  secret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${tripId}:${orderId}:${timestamp}`;
  const signature = hmacSHA256(payload, secret);
  return btoa(`${payload}:${signature}`);
}
```

**토큰 검증:**

```typescript
// POST /api/payment/upgrade
function verifyUpgradeToken(token: string, secret: string): {
  valid: boolean;
  tripId?: string;
  orderId?: string;
} {
  const decoded = atob(token);
  const [tripId, orderId, timestamp, signature] = decoded.split(':');

  // 3분 유효성 검사
  const now = Math.floor(Date.now() / 1000);
  if (now - parseInt(timestamp) > 180) {
    return { valid: false }; // Expired
  }

  // HMAC 검증
  const payload = `${tripId}:${orderId}:${timestamp}`;
  const expected = hmacSHA256(payload, secret);
  if (signature !== expected) {
    return { valid: false }; // Invalid signature
  }

  return { valid: true, tripId, orderId };
}
```

### orders 테이블 추적

| 컬럼 | 용도 |
|------|------|
| `upgrade_from` | 원래 Standard 주문의 `order_id` (UUID). 업그레이드 건에만 값 존재. |
| `plan` | 업그레이드 후 `"pro"`로 변경 |
| `amount` | 추가 결제 금액: 700 (= $7.00) |

**orders 테이블 업그레이드 예시:**

```
-- 원래 Standard 주문
{ id: "order-1", plan: "standard", amount: 500, upgrade_from: null }

-- 업그레이드 주문
{ id: "order-2", plan: "pro", amount: 700, upgrade_from: "order-1", trip_id: (same) }
```

---

## 6. 공유 루프 스펙

### 공유 링크 구조

```
https://travelcapsule.com/share/{tripId}?utm_source=share&utm_medium=direct&utm_campaign={moodName}
```

| 파라미터 | 값 | 예시 |
|----------|-----|------|
| `tripId` | trips.id (UUID) | `a1b2c3d4-...` |
| `utm_source` | 항상 `share` | `share` |
| `utm_medium` | 공유 채널. 기본 `direct`, SNS별 동적 | `direct`, `instagram`, `twitter`, `kakao` |
| `utm_campaign` | vibeAgent 생성 moodName (URL-safe 변환) | `rainy-chic`, `urban-minimal` |

### 공유 페이지 (/share/{tripId})

TeaserGrid와 동일한 구조를 재사용. 비결제 사용자에게도 티저 수준의 콘텐츠를 보여주고, "나도 만들기" CTA로 신규 유입을 유도한다.

**페이지 구성:**

```
+--------------------------------------------------+
|  [TravelCapsule Logo]                            |
|                                                  |
|  {SharedUser}'s Travel Look                      |
|  Paris -- Rainy Chic                             |
|                                                  |
|  +--------------------------------------------+ |
|  |  TeaserGrid (2x2)                          | |
|  |  [0] 선명   [1] blur+tint                  | |
|  |  [2] blur   [3] blur+tint                  | |
|  +--------------------------------------------+ |
|                                                  |
|  "See what AI styled for Paris in June"          |
|                                                  |
|  [ Create My Travel Capsule ]                    |
|  (bg-primary text-white rounded-full w-full)     |
|  -> / (랜딩 페이지 리다이렉트)                   |
|                                                  |
+--------------------------------------------------+
```

### OG 메타태그

```html
<!-- /share/{tripId} -->
<meta property="og:title" content="Paris -- Rainy Chic | TravelCapsule" />
<meta property="og:description" content="AI-styled travel looks for Paris in June. Get yours for $5." />
<meta property="og:image" content="https://assets.travelcapsule.com/{tripId}/teaser-og.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://travelcapsule.com/share/{tripId}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Paris -- Rainy Chic | TravelCapsule" />
<meta name="twitter:description" content="AI-styled travel looks for Paris in June." />
<meta name="twitter:image" content="https://assets.travelcapsule.com/{tripId}/teaser-og.jpg" />
```

**OG 이미지 생성:**

- 소스: 티저 이미지 `[0]` (선명 1장)
- 리사이즈: 1200x630 (OG 표준)
- 오버레이: 무드 네이밍 텍스트 + TravelCapsule 로고
- 저장: R2 `{tripId}/teaser-og.jpg`
- 생성 시점: teaserAgent 완료 직후 (fulfillmentAgent 담당)

### 소셜 카피 3종

growthAgent가 vibeAgent 결과를 기반으로 3개 채널용 카피를 자동 생성한다.

#### Instagram

```
My AI travel stylist just nailed it.

Paris -- Rainy Chic
9 items, 7 days, zero packing stress.

Get yours: {link}

#TravelCapsule #TravelStyle #PackSmart #ParisStyle #CapsuleWardrobe
```

- 형식: 줄바꿈 활용, 해시태그 5~7개
- 필수 해시태그: `#TravelCapsule`
- utm_medium: `instagram`

#### Twitter/X

```
Thread: How AI packed my Paris trip in 9 items

1/ Just tried @TravelCapsule for my June Paris trip. It analyzed the weather (24C days, 14C nights, 35% rain chance) and created a capsule wardrobe.

2/ The vibe? "Rainy Chic" -- think effortless layers, muted tones, linen blazers.

3/ 9 items. 7 days. Every piece works in 3+ outfits. Mind = blown.

Try it: {link}
```

- 형식: 스레드 구조 (3~4 파트)
- 필수 멘션: `@TravelCapsule`
- utm_medium: `twitter`

#### Kakao (카카오톡)

```
나 이번 파리 여행 AI 스타일리스트한테 코디 받았는데 대박이야

"Paris -- Rainy Chic" 무드로 9개 아이템이면 7일 다 커버됨

너도 해봐! {link}
```

- 형식: 친구 대화체
- 한국어 전용
- utm_medium: `kakao`

### 공유 루프 흐름

```
결과 페이지
    |
    v  "Share Your {City} {MoodName} Look" 버튼
    |
    +-> [링크 복사] -> 클립보드 복사 + "Copied!" 토스트
    +-> [Instagram] -> 카피 클립보드 복사 + 인스타 앱 열기 안내
    +-> [Twitter/X] -> intent URL: https://twitter.com/intent/tweet?text={encoded_copy}&url={share_url}
    +-> [카카오톡] -> Kakao JS SDK share (link message)
    |
    v  공유 링크 클릭 (신규 유저)
    |
    v  /share/{tripId} (TeaserGrid + "나도 만들기" CTA)
    |
    v  / (랜딩 페이지) -> 신규 퍼널 시작
```

---

## 7. API 엔드포인트 명세

모든 엔드포인트는 Cloudflare Workers (Hono) 기반. Base URL: `https://api.travelcapsule.com`

---

### GET /api/health

서버 상태 확인.

**Request:**

```
GET /api/health
```

**Response (200):**

```json
{
  "ok": true,
  "timestamp": "2026-02-28T12:00:00.000Z"
}
```

**에러 케이스:** 없음 (항상 200 반환).

---

### POST /api/preview

Free 프리뷰 생성. Turnstile 검증 필수. IP + session_id 기준 일 5회 제한.

**Request:**

```
POST /api/preview
Content-Type: application/json
```

```json
{
  "cities": [
    {
      "name": "Paris",
      "country": "France",
      "days": 4,
      "lat": 48.856614,
      "lon": 2.352222
    },
    {
      "name": "Barcelona",
      "country": "Spain",
      "days": 3,
      "lat": 41.385064,
      "lon": 2.173404
    }
  ],
  "month": 6,
  "faceUrl": "r2://tmp/abc123.jpg",
  "turnstileToken": "cf-turnstile-response-xxx",
  "sessionId": "sess_abc123"
}
```

**Request Body Schema:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| `cities` | `CityInput[]` | O | 1~5개, 각 city에 name/country/days/lat/lon |
| `cities[].name` | `string` | O | 도시명 |
| `cities[].country` | `string` | O | 국가명 |
| `cities[].days` | `number` | O | 1~30 |
| `cities[].lat` | `number` | O | -90 ~ 90 |
| `cities[].lon` | `number` | O | -180 ~ 180 |
| `month` | `number` | O | 1~12 |
| `faceUrl` | `string` | X | R2 임시 경로 |
| `turnstileToken` | `string` | O | Cloudflare Turnstile 응답 토큰 |
| `sessionId` | `string` | O | 클라이언트 생성 세션 ID |

**Response (200):**

```json
{
  "tripId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expiresAt": "2026-03-01T12:00:00.000Z",
  "weather": [
    {
      "city": "Paris",
      "month": 6,
      "temp_min": 14,
      "temp_max": 24,
      "precipitation": 35,
      "vibe_band": "warm",
      "style_hint": "Light layers work best. A linen blazer handles both cafe and evening."
    }
  ],
  "vibes": [
    {
      "city": "Paris",
      "mood_name": "Rainy Chic",
      "tags": ["#EffortlessElegance", "#CafeTerraces", "#MidnightStrolls"],
      "palette": ["#2C3E50", "#8E7CC3", "#F5E6D3", "#C0392B", "#ECF0F1"],
      "avoid": "Bright neon athletic wear -- it clashes with the city's understated elegance."
    }
  ],
  "capsuleEstimate": {
    "itemCount": 9,
    "principles": [
      "Neutral base, bold accent -- mix and match without clashing",
      "Each piece works in 3+ outfits -- maximum versatility per item",
      "Layer for temperature swings -- one jacket replaces two sweaters"
    ]
  },
  "teaser": {
    "imageUrl": "https://assets.travelcapsule.com/a1b2c3d4/teaser-0.jpg",
    "city": "Paris",
    "moodName": "Rainy Chic"
  }
}
```

**에러 케이스:**

| HTTP | 코드 | 조건 | 응답 body |
|------|------|------|-----------|
| 400 | `INVALID_INPUT` | cities 누락, month 범위 초과 등 | `{"error": "Invalid input", "details": [...]}` |
| 403 | `TURNSTILE_FAILED` | Turnstile 토큰 검증 실패 | `{"error": "Bot verification failed"}` |
| 429 | `RATE_LIMIT_EXCEEDED` | IP+session 일 5회 초과 | `{"error": "Daily limit reached", "limit": 5, "resets_at": "..."}` |
| 500 | `GENERATION_FAILED` | weatherAgent/vibeAgent/teaserAgent 실패 | `{"error": "Generation failed", "retry": true}` |

---

### POST /api/preview/email

이메일 캡처 + 무드 카드 이메일 발송 (Resend).

**Request:**

```
POST /api/preview/email
Content-Type: application/json
```

```json
{
  "tripId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "user@example.com"
}
```

**Request Body Schema:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| `tripId` | `string` (UUID) | O | 존재하는 trip ID |
| `email` | `string` | O | 유효한 이메일 형식 |

**Response (200):**

```json
{
  "ok": true,
  "message": "Mood card sent to user@example.com"
}
```

**에러 케이스:**

| HTTP | 코드 | 조건 | 응답 body |
|------|------|------|-----------|
| 400 | `INVALID_EMAIL` | 이메일 형식 오류 | `{"error": "Invalid email format"}` |
| 404 | `TRIP_NOT_FOUND` | tripId 미존재 | `{"error": "Trip not found"}` |
| 500 | `EMAIL_SEND_FAILED` | Resend API 실패 | `{"error": "Failed to send email", "retry": true}` |

**사이드이펙트:**

- `email_captures` 테이블에 INSERT (tripId + email + captured_at)
- Resend API로 무드 카드 이메일 발송

---

### POST /api/payment/checkout

Polar 결제 세션 생성. checkout_url 반환.

**Request:**

```
POST /api/payment/checkout
Content-Type: application/json
```

```json
{
  "tripId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "plan": "standard"
}
```

**Request Body Schema:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| `tripId` | `string` (UUID) | O | 존재하는 trip ID, status="pending" |
| `plan` | `"standard" \| "pro" \| "annual"` | O | 유효한 플랜명 |

**Response (200):**

```json
{
  "checkout_url": "https://checkout.polar.sh/xxx..."
}
```

**Polar Checkout 생성 로직:**

```typescript
// plan -> Polar Product ID 매핑
const productIds: Record<string, string> = {
  standard: env.POLAR_PRODUCT_ID_STANDARD,
  pro: env.POLAR_PRODUCT_ID_PRO,
  annual: env.POLAR_PRODUCT_ID_ANNUAL,
};

// Polar API call
const checkout = await fetch('https://api.polar.sh/v1/checkouts/custom', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.POLAR_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product_id: productIds[plan],
    success_url: `https://travelcapsule.com/result/${tripId}?session_id=${sessionId}`,
    metadata: { tripId, plan, sessionId },
  }),
});
```

**에러 케이스:**

| HTTP | 코드 | 조건 | 응답 body |
|------|------|------|-----------|
| 400 | `INVALID_PLAN` | plan 값 오류 | `{"error": "Invalid plan. Must be standard, pro, or annual."}` |
| 404 | `TRIP_NOT_FOUND` | tripId 미존재 | `{"error": "Trip not found"}` |
| 409 | `ALREADY_PAID` | 이미 결제된 trip | `{"error": "Trip already paid"}` |
| 429 | `ANNUAL_LIMIT` | Annual 12회 초과 | `{"error": "Annual limit reached", "limit": 12}` |
| 500 | `CHECKOUT_FAILED` | Polar API 실패 | `{"error": "Failed to create checkout", "retry": true}` |

---

### POST /api/payment/webhook

Polar 웹훅 수신. HMAC-SHA256 서명 검증 필수.

**Request:**

```
POST /api/payment/webhook
Content-Type: application/json
Webhook-Id: msg_xxx
Webhook-Timestamp: 1234567890
Webhook-Signature: v1,base64signature...
```

```json
{
  "type": "checkout.updated",
  "data": {
    "id": "polar_checkout_xxx",
    "status": "succeeded",
    "metadata": {
      "tripId": "a1b2c3d4-...",
      "plan": "standard",
      "sessionId": "sess_abc123"
    },
    "customer_email": "user@example.com",
    "amount": 500
  }
}
```

**서명 검증:**

```typescript
// HMAC-SHA256 검증 (Polar Standard Webhooks)
const webhookId = request.headers.get('webhook-id');
const webhookTimestamp = request.headers.get('webhook-timestamp');
const webhookSignature = request.headers.get('webhook-signature');

const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
const secret = base64Decode(env.POLAR_WEBHOOK_SECRET.replace('whsec_', ''));
const expectedSignature = base64Encode(hmacSHA256(signedContent, secret));

// webhook-signature는 "v1,{signature}" 형식
const signatures = webhookSignature.split(' ').map(s => s.split(',')[1]);
const isValid = signatures.some(sig => timingSafeEqual(sig, expectedSignature));

if (!isValid) {
  return c.json({ error: 'Invalid signature' }, 401);
}
```

**Response (200):**

```json
{
  "ok": true
}
```

**에러 케이스:**

| HTTP | 코드 | 조건 | 응답 body |
|------|------|------|-----------|
| 401 | `INVALID_SIGNATURE` | HMAC 서명 불일치 | `{"error": "Invalid signature"}` |
| 409 | `DUPLICATE_ORDER` | polar_order_id UNIQUE 위반 | `{"error": "Order already processed"}` |
| 500 | `WEBHOOK_PROCESSING_FAILED` | DB/파이프라인 실패 | `{"error": "Webhook processing failed"}` |

**사이드이펙트 (성공 시):**

1. `orders` 테이블 INSERT
2. `trips` 상태 -> `"processing"`
3. Orchestrator 파이프라인 시작 (비동기)
4. Standard 플랜인 경우 `upgrade_token` 생성
5. Annual 플랜인 경우 `usage_records.trip_count` 증가

---

### POST /api/payment/upgrade

Standard -> Pro 업그레이드. upgrade_token 검증 필수.

**Request:**

```
POST /api/payment/upgrade
Content-Type: application/json
```

```json
{
  "tripId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "upgradeToken": "base64encodedtoken..."
}
```

**Request Body Schema:**

| 필드 | 타입 | 필수 | 제약 |
|------|------|------|------|
| `tripId` | `string` (UUID) | O | 존재하는 trip ID, Standard 결제 완료 상태 |
| `upgradeToken` | `string` | O | growthAgent 생성 HMAC 토큰, 3분 유효 |

**Response (200):**

```json
{
  "checkout_url": "https://checkout.polar.sh/yyy..."
}
```

**에러 케이스:**

| HTTP | 코드 | 조건 | 응답 body |
|------|------|------|-----------|
| 400 | `INVALID_TOKEN` | 토큰 형식 오류 | `{"error": "Invalid upgrade token"}` |
| 403 | `TOKEN_EXPIRED` | 3분 초과 | `{"error": "Upgrade offer expired"}` |
| 404 | `TRIP_NOT_FOUND` | tripId 미존재 | `{"error": "Trip not found"}` |
| 409 | `ALREADY_UPGRADED` | 이미 Pro로 업그레이드됨 | `{"error": "Already upgraded to Pro"}` |
| 500 | `UPGRADE_FAILED` | Polar API 실패 | `{"error": "Upgrade checkout failed", "retry": true}` |

---

### GET /api/result/:tripId

결제 확인 후 전체 결과 반환. 결제 미완료 시 403.

**Request:**

```
GET /api/result/a1b2c3d4-e5f6-7890-abcd-ef1234567890?session_id=sess_abc123
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `session_id` | `string` | O | 세션 ID (RLS 검증용) |

**Response (200):**

```json
{
  "trip": {
    "id": "a1b2c3d4-...",
    "cities": [{"name": "Paris", "days": 4}, {"name": "Barcelona", "days": 3}],
    "month": 6,
    "status": "completed"
  },
  "order": {
    "plan": "standard",
    "amount": 500
  },
  "images": [
    {
      "city": "Paris",
      "moodName": "Rainy Chic",
      "url": "https://assets.travelcapsule.com/a1b2c3d4/paris-0.jpg",
      "prompt": "..."
    }
  ],
  "capsule": {
    "items": [
      {
        "name": "Linen Blazer",
        "category": "outerwear",
        "why": "Handles 10C+ temperature swings between day and night",
        "versatility_score": 9
      }
    ],
    "daily_plan": [
      {
        "day": 1,
        "city": "Paris",
        "outfit": ["Linen Blazer", "White Tee", "Dark Jeans"],
        "note": "Cafe-hopping day. Blazer for evening cooling."
      }
    ]
  },
  "share": {
    "url": "https://travelcapsule.com/share/a1b2c3d4?utm_source=share&utm_medium=direct&utm_campaign=rainy-chic",
    "copies": {
      "instagram": "My AI travel stylist just nailed it...",
      "twitter": "Thread: How AI packed my Paris trip...",
      "kakao": "나 이번 파리 여행 AI 스타일리스트한테..."
    }
  },
  "upgradeToken": "base64token..."
}
```

> `upgradeToken`은 Standard 플랜 결제자에게만 포함. Pro/Annual은 `null`.

**에러 케이스:**

| HTTP | 코드 | 조건 | 응답 body |
|------|------|------|-----------|
| 403 | `NOT_PAID` | 결제 미완료 | `{"error": "Payment required"}` |
| 404 | `TRIP_NOT_FOUND` | tripId 미존재 | `{"error": "Trip not found"}` |
| 202 | `PROCESSING` | 아직 생성 중 | `{"error": "Still generating", "status": "processing", "progress": {...}}` |

---

### GET /api/share/:tripId

공유용 티저 데이터 반환. 결제 여부와 무관하게 접근 가능.

**Request:**

```
GET /api/share/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Response (200):**

```json
{
  "tripId": "a1b2c3d4-...",
  "city": "Paris",
  "moodName": "Rainy Chic",
  "month": 6,
  "teaser": {
    "imageUrl": "https://assets.travelcapsule.com/a1b2c3d4/teaser-0.jpg"
  },
  "og": {
    "title": "Paris -- Rainy Chic | TravelCapsule",
    "description": "AI-styled travel looks for Paris in June. Get yours for $5.",
    "image": "https://assets.travelcapsule.com/a1b2c3d4/teaser-og.jpg"
  }
}
```

**에러 케이스:**

| HTTP | 코드 | 조건 | 응답 body |
|------|------|------|-----------|
| 404 | `TRIP_NOT_FOUND` | tripId 미존재 | `{"error": "Trip not found"}` |

---

## 8. Rate Limit & Abuse Prevention

### 8-1. Cloudflare Turnstile

| 항목 | 값 |
|------|-----|
| 적용 대상 | `POST /api/preview` 모든 요청 |
| 검증 방식 | 서버사이드 Turnstile siteverify API 호출 |
| 시크릿 키 | `CLOUDFLARE_TURNSTILE_SECRET_KEY` (Workers Secret) |
| 사이트 키 | `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` (Pages Env) |
| 로컬 개발 | `SKIP_TURNSTILE=true` (.env.local 전용) |

**서버사이드 검증:**

```typescript
// apps/worker/src/middleware/turnstile.ts
async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
      }),
    }
  );
  const data = await response.json<{ success: boolean }>();
  return data.success;
}
```

**실패 시 응답:**

```json
// HTTP 403
{
  "error": "Bot verification failed",
  "code": "TURNSTILE_FAILED"
}
```

---

### 8-2. IP + Session Rate Limit

| 항목 | 값 |
|------|-----|
| 적용 대상 | `POST /api/preview` |
| 제한 | 하루 5회 (IP + session_id 조합) |
| 저장소 | Supabase (rate_limits 테이블) 또는 Workers KV |
| 리셋 | UTC 0시 기준 일간 리셋 |
| 카운트 키 | `{IP}:{session_id}:{YYYY-MM-DD}` |

**검증 로직:**

```typescript
async function checkRateLimit(
  ip: string,
  sessionId: string,
  env: Bindings
): Promise<{ allowed: boolean; remaining: number; resetsAt: string }> {
  const today = new Date().toISOString().split('T')[0];
  const key = `${ip}:${sessionId}:${today}`;

  // Supabase 또는 KV에서 카운트 조회
  const count = await getRequestCount(key, env);

  if (count >= 5) {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      allowed: false,
      remaining: 0,
      resetsAt: tomorrow.toISOString(),
    };
  }

  await incrementRequestCount(key, env);

  return {
    allowed: true,
    remaining: 4 - count,
    resetsAt: `${today}T24:00:00.000Z`,
  };
}
```

**초과 시 응답:**

```json
// HTTP 429
{
  "error": "Daily limit reached",
  "code": "RATE_LIMIT_EXCEEDED",
  "limit": 5,
  "remaining": 0,
  "resets_at": "2026-03-01T00:00:00.000Z"
}
```

---

### 8-3. Annual 12회 서버사이드 검증

| 항목 | 값 |
|------|-----|
| 적용 대상 | Annual 플랜 사용자의 `POST /api/preview` + `POST /api/payment/checkout` |
| 제한 | 구독 기간당 12회 |
| 저장소 | Supabase `usage_records` 테이블 |
| 카운트 필드 | `usage_records.trip_count` |
| 기간 필드 | `usage_records.period_start` ~ `usage_records.period_end` |
| 검증 위치 | **서버사이드만** (프론트엔드 단독 검증 절대 금지) |

**usage_records 테이블 구조:**

```sql
CREATE TABLE IF NOT EXISTS usage_records (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email   TEXT        NOT NULL,
  plan         TEXT        NOT NULL DEFAULT 'annual' CHECK (plan = 'annual'),
  trip_count   INTEGER     NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_email, period_start)
);
```

**검증 로직:**

```typescript
async function checkAnnualLimit(
  email: string,
  env: Bindings
): Promise<{ allowed: boolean; used: number; limit: number; renewsAt: string }> {
  const now = new Date().toISOString();

  const { data } = await supabase
    .from('usage_records')
    .select('trip_count, period_end')
    .eq('user_email', email)
    .eq('plan', 'annual')
    .gte('period_end', now)
    .order('period_end', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    // No active annual subscription found
    return { allowed: false, used: 0, limit: 12, renewsAt: '' };
  }

  if (data.trip_count >= 12) {
    return {
      allowed: false,
      used: 12,
      limit: 12,
      renewsAt: data.period_end,
    };
  }

  return {
    allowed: true,
    used: data.trip_count,
    limit: 12,
    renewsAt: data.period_end,
  };
}
```

**초과 시 응답:**

```json
// HTTP 429
{
  "error": "Annual limit reached",
  "code": "ANNUAL_LIMIT",
  "limit": 12,
  "used": 12,
  "renews_at": "2027-02-28T00:00:00.000Z"
}
```

---

### 8-4. upgrade_token 보안

| 항목 | 값 |
|------|-----|
| 적용 대상 | `POST /api/payment/upgrade` |
| 알고리즘 | HMAC-SHA256 |
| 유효 시간 | 3분 (180초) |
| 재사용 | 불가 (1회 사용 후 orders.upgrade_from에 기록) |
| 위변조 방지 | 서버사이드 HMAC 검증 |

**보안 체크리스트:**

- [x] 토큰 생성: HMAC-SHA256, `POLAR_WEBHOOK_SECRET` 키 사용
- [x] 페이로드: `{tripId}:{orderId}:{timestamp}` (예측 불가)
- [x] 만료 검증: `timestamp + 180 < now` -> 거부
- [x] 서명 검증: HMAC 재계산 후 timing-safe 비교
- [x] 재사용 방지: 업그레이드 완료 시 `orders.upgrade_from` 기록, 이후 동일 tripId 업그레이드 거부
- [x] 대상 검증: Standard 결제자만 (Pro/Annual 업그레이드 시도 거부)

---

### Rate Limit 요약표

| 보호 계층 | 대상 | 제한 | 저장소 | 초과 시 HTTP |
|-----------|------|------|--------|-------------|
| Turnstile | `/api/preview` | 봇 차단 | Cloudflare | 403 |
| IP+Session | `/api/preview` | 일 5회 | Supabase / KV | 429 |
| Annual | `/api/preview`, `/api/payment/checkout` | 기간당 12회 | Supabase `usage_records` | 429 |
| upgrade_token | `/api/payment/upgrade` | 3분 1회 | HMAC 검증 | 403 |
| Polar HMAC | `/api/payment/webhook` | 서명 불일치 차단 | 서버사이드 검증 | 401 |

---

## Appendix: DB 스키마 참조

전체 스키마는 `supabase/migrations/001_initial_schema.sql`에 정의되어 있다.

### 테이블 요약

| 테이블 | 용도 | RLS |
|--------|------|-----|
| `trips` | 세션별 여행 데이터 | anon: session_id 매칭 SELECT/INSERT |
| `orders` | Polar 결제 기록 | anon 접근 불가 (Service Role Only) |
| `generation_jobs` | 이미지 생성 작업 추적 | anon: trip의 session_id 매칭 SELECT |
| `capsule_results` | 캡슐 워드로브 + 데일리 플랜 | anon: trip의 session_id 매칭 SELECT |
| `city_vibes` | 30개 도시 참조 데이터 | 모든 사용자 공개 읽기 |
| `weather_cache` | 날씨 캐시 (24h TTL) | Service Role Only |
| `email_captures` | 이메일 수집 기록 | Service Role Only |
| `usage_records` | Annual 사용 횟수 추적 | Service Role Only |

### 추가 필요 컬럼 (기존 스키마 대비)

| 테이블 | 컬럼 | 타입 | 용도 |
|--------|------|------|------|
| `trips` | `expires_at` | `TIMESTAMPTZ` | 티저 만료 타이머 기준 (생성 + 24h) |
| `orders` | `plan` | `TEXT CHECK (plan IN ('standard', 'pro', 'annual'))` | 결제 플랜 구분 |
| `orders` | `upgrade_from` | `UUID REFERENCES orders(id)` | 업그레이드 원 주문 추적 |
| `generation_jobs` | `job_type` | `TEXT CHECK (job_type IN ('teaser', 'full'))` | 티저 vs 전체 생성 구분 |
| `city_vibes` | `mood_name` | `TEXT` | 무드 네이밍 캐시 |
