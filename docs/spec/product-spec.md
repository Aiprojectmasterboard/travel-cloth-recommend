# Travel Capsule AI - Product Specification

> **Version**: 1.0.0
> **Last Updated**: 2026-02-28
> **Status**: Development
> **Pricing**: $5 / trip (one-time, non-recurring)

---

## Table of Contents

1. [제품 개요 (Product Overview)](#1-제품-개요-product-overview)
2. [기술 스택 (Tech Stack)](#2-기술-스택-tech-stack)
3. [전체 사용자 여정 (User Journey)](#3-전체-사용자-여정-user-journey)
4. [페이지별 상세 스펙 (Page-by-Page Specifications)](#4-페이지별-상세-스펙-page-by-page-specifications)
5. [Worker API 엔드포인트 목록 (Worker API Endpoints)](#5-worker-api-엔드포인트-목록-worker-api-endpoints)
6. [기능별 인수 기준 (Acceptance Criteria)](#6-기능별-인수-기준-acceptance-criteria)

---

## 1. 제품 개요 (Product Overview)

### 핵심 가치 제안 (Core Value Proposition)

Travel Capsule AI는 **$5/trip** 가격의 AI 기반 여행 스타일링 서비스이다. 여행자가 목적지 도시, 여행 월, 그리고 선택적으로 얼굴 사진을 입력하면, AI가 각 도시의 기후와 분위기(바이브)를 분석하여 최적화된 캡슐 워드로브와 데일리 아웃핏 플랜을 생성한다.

### 서비스 흐름 요약

```
사용자 입력 (도시 + 여행월 + 사진)
     │
     ▼
AI 기후·바이브 분석
     │
     ▼
코디 이미지 3-4장/도시 생성 (NanoBanana API)
     │
     ▼
캡슐 워드로브 8-12개 아이템 (Claude API)
     │
     ▼
데일리 아웃핏 플랜 (Claude API)
     │
     ▼
결제 ($5, Polar)
     │
     ▼
갤러리 링크 발송 (이메일 + 웹)
```

### 핵심 산출물 (Deliverables per Trip)

| 산출물 | 수량 | 설명 |
|--------|------|------|
| 코디 이미지 | 3-4장/도시 | 도시별 기후·바이브 반영 패션 에디토리얼 사진 |
| 캡슐 워드로브 | 8-12개 아이템 | 기내 반입 가능한 최적화 의류 목록 |
| 데일리 아웃핏 플랜 | 여행 일수만큼 | 요일별 도시·활동에 맞는 아웃핏 조합 |
| 갤러리 링크 | 1개 | 결제 후 이메일 발송, 공유 가능 |

### 타겟 사용자

- 해외여행을 계획 중인 2030 밀레니얼/Z세대
- 여행지 기후에 맞는 옷을 고민하는 패션 관심층
- 짐을 최소화하고 싶은 캡슐 워드로브 관심 여행자
- SNS에 여행 코디를 공유하고 싶은 인플루언서 지향층

### Agent 아키텍처

```
User Request
 └─ Orchestrator (apps/worker/src/agents/orchestrator.ts)
      │
      ├─ 1. Climate Agent     → Open-Meteo API (기후 데이터 조회)
      │     climateAgent.ts
      │
      ├─ 2. Style Agent       → Claude API (코디 프롬프트 생성)
      │     styleAgent.ts
      │
      ├─ 3. ImageGen Agent    → NanoBanana API (이미지 생성)
      │     imageGenAgent.ts
      │
      ├─ 4. Capsule Agent     → Claude API (캡슐 워드로브 + 데일리 플랜)
      │     capsuleAgent.ts
      │
      ├─ 5. Fulfillment Agent → R2 + Resend (갤러리 링크 + 프라이버시 정리)
      │     fulfillmentAgent.ts
      │
      └─ 6. Growth Agent      → UTM + 공유 카피 (바이럴 루프)
            growthAgent.ts
```

**파이프라인 실행 순서:**

1. Trip 데이터 파싱
2. 기후 데이터 조회 (도시별 병렬)
3. 스타일 프롬프트 생성 (도시별 병렬, Claude API)
4. generation_jobs DB 저장
5. 이미지 생성 (동시성: 2, NanoBanana API)
6. 캡슐 워드로브 생성 (Claude API)
7. Fulfillment (이메일 + 원본 사진 삭제)
8. 공유 콘텐츠 생성
9. Trip 상태 `completed`로 변경

---

## 2. 기술 스택 (Tech Stack)

| 영역 | 기술 | 비고 |
|------|------|------|
| **Frontend** | Next.js App Router | Cloudflare Pages에 배포 |
| **API** | Cloudflare Workers (Hono) | Edge runtime, `process.env` 사용 불가 |
| **DB** | Supabase (Postgres + RLS) | Session 기반 RLS, Service Role Key로 Worker 접근 |
| **Storage** | Cloudflare R2 | 네이티브 R2 바인딩 (`R2Bucket`) 사용 |
| **결제** | Polar (MoR) | Stripe 사용 금지, 일회성 $5, HMAC-SHA256 서명 검증 |
| **이미지 생성** | NanoBanana API | 768x1024, 최대 3회 재시도, 얼굴 보존 지원 |
| **AI (Style/Capsule)** | Claude API (claude-sonnet-4-6) | Style: temp 0.8, Capsule: temp 0.7 |
| **기후 데이터** | Open-Meteo | 무료, 가입 불필요, 12개월 월별 예보 |
| **도시 검색** | Google Places API | Autocomplete, `(cities)` 타입 필터 |
| **이메일** | Resend | 갤러리 링크 포함 HTML 이메일 |

### DB 스키마 요약

| 테이블 | 주요 컬럼 | RLS 정책 |
|--------|-----------|----------|
| `trips` | `id(UUID PK)`, `session_id`, `cities(JSONB)`, `month`, `face_url`, `status`, `gallery_url` | anon: session_id 매칭 SELECT/INSERT |
| `orders` | `id(UUID PK)`, `polar_order_id(UNIQUE)`, `trip_id(FK)`, `status`, `amount`, `customer_email` | anon 접근 불가 (Service Role Only) |
| `generation_jobs` | `id(UUID PK)`, `trip_id(FK)`, `city`, `mood`, `prompt`, `status`, `image_url`, `attempts` | anon: trip의 session_id 매칭 SELECT |
| `capsule_results` | `id(UUID PK)`, `trip_id(FK UNIQUE)`, `items(JSONB)`, `daily_plan(JSONB)` | anon: trip의 session_id 매칭 SELECT |
| `city_vibes` | `id(UUID PK)`, `city(UNIQUE)`, `country`, `lat`, `lon`, `vibe_cluster`, `style_keywords(TEXT[])` | 모든 사용자 공개 읽기 |

---

## 3. 전체 사용자 여정 (User Journey)

### 3.1 여정 전체 흐름도

```
[1. 랜딩 페이지 도착] ──► [2. 폼 입력] ──► [3. AI 처리 중] ──► [4. 미리보기]
                                                                       │
                                                                       ▼
                        [7. 공유] ◄── [6. 갤러리 수령] ◄── [5. 결제 ($5)]
```

### 3.2 단계별 상세 분석

#### 단계 1: 랜딩 페이지 도착

| 항목 | 설명 |
|------|------|
| **사용자 행동** | 광고/SNS 공유 링크 클릭 → 랜딩 페이지 도착. 헤드라인과 히어로 이미지를 스캔, 서비스 가치 파악 시도. 스크롤하며 작동 방식과 샘플 결과물 확인. |
| **감정 상태** | 호기심 + 약간의 의심 ("정말 AI가 코디를 해줄 수 있어?") |
| **이탈 위험 요소** | (1) 가치 제안이 3초 안에 전달되지 않으면 이탈 (2) 모바일에서 로딩이 느리면 바로 이탈 (3) 사회적 증거(리뷰, 사용자 수)가 없으면 신뢰 부족 |
| **대응 전략** | (1) 히어로 섹션: 6단어 이내 핵심 카피 + 결과물 미리보기 이미지 (2) Core Web Vitals 최적화 (LCP < 2.5s) (3) 소셜 프루프: 사용자 수 카운터 + 별점 리뷰 3-5개 (4) "See a Sample" CTA로 즉시 결과 확인 유도 |
| **핵심 KPI** | 바운스율 < 50%, 스크롤 깊이 > 50% |

#### 단계 2: 폼 입력 (도시 선택, 여행월, 사진 업로드)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | (1) 도시 입력 (Google Places Autocomplete, 최대 3개 도시, 각 도시별 일수 입력) (2) 여행월 선택 (월 피커) (3) 사진 업로드 (선택, 얼굴 사진) (4) 이메일 입력 |
| **감정 상태** | 기대감 + "이게 정말 되나?" 반신반의 → 폼 완성 시 기대감 상승 |
| **이탈 위험 요소** | (1) 폼이 복잡하게 느껴지면 이탈 (2) 도시 검색이 안 되면 좌절 (3) 사진 업로드 필수로 느껴지면 진입 장벽 (4) 가격이 폼 완성 후에야 나오면 배신감 |
| **대응 전략** | (1) 프로그레스 스텝 표시 (Step 1/3 → 2/3 → 3/3) (2) Google Places Autocomplete으로 2글자부터 즉시 추천 (3) 사진 업로드를 "선택사항"으로 명확히 표시 (4) 폼 위에 "$5 one-time, no subscription" 항상 노출 (5) 인라인 검증: 에러 메시지를 필드 바로 아래에 표시 |
| **핵심 KPI** | 폼 시작률 > 30%, 폼 완료율 > 60% |

#### 단계 3: AI 처리 중 (로딩/대기 화면)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | 폼 제출 후 대기. 진행 상태 확인. 평균 대기 시간: 60-120초 (기후 조회 + 스타일 프롬프트 + 이미지 생성 + 캡슐 워드로브). |
| **감정 상태** | 불안 + 궁금증 ("제대로 되고 있는 건가?") → 진행 표시가 있으면 참을성 증가 |
| **이탈 위험 요소** | (1) 2분 이상 아무 피드백 없이 대기하면 탭 닫기 (2) 에러 발생 시 재시도 안내가 없으면 이탈 (3) 다른 탭으로 이동 후 돌아오지 않음 |
| **대응 전략** | (1) 멀티 스텝 프로그레스 바: "기후 분석 중..." → "스타일 생성 중..." → "이미지 생성 중..." → "캡슐 완성 중..." (2) 각 단계 예상 시간 표시 (3) "이 탭을 닫지 마세요" 안내 (4) generation_jobs 상태를 5초 간격으로 폴링 (GET /api/trips/:tripId) (5) 에러 시 자동 재시도 안내 + "고객센터 문의" 링크 |
| **핵심 KPI** | 대기 중 이탈률 < 15%, 평균 대기 시간 < 90초 |

#### 단계 4: 미리보기 (1장 공개 + 3장 블러)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | AI 생성 완료 후 미리보기 페이지 이동. 첫 번째 이미지를 선명하게 확인. 나머지 3장은 블러 처리된 상태로 확인. 캡슐 워드로브 아이템 이름만 공개 (상세 블러). |
| **감정 상태** | 놀라움 + 강한 호기심 ("나머지도 보고 싶다!") → 결제 의지 형성 |
| **이탈 위험 요소** | (1) 첫 이미지 품질이 기대 이하면 결제 의지 소멸 (2) 블러 이미지가 매력적이지 않으면 궁금하지 않음 (3) $5가 가치에 비해 비싸게 느껴짐 |
| **대응 전략** | (1) 첫 이미지는 가장 매력적인 무드(golden-hour 등) 선택 (2) 블러 이미지에 살짝 보이는 의상 실루엣으로 호기심 자극 (3) "Unlock all 4 looks + your complete capsule wardrobe" 카피 (4) 가격 앵커링: "$5 = less than a coffee, saves hours of packing stress" (5) 캡슐 워드로브 아이템 이름만 리스트로 보여주고, versatility_score와 why는 블러 |
| **핵심 KPI** | 미리보기 → 결제 전환율 > 25% |

#### 단계 5: 결제 ($5 Polar 결제)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | "Unlock" 버튼 클릭 → Polar 결제 페이지 리다이렉트 → 카드/애플페이 결제 → 완료 후 콜백. |
| **감정 상태** | 결단 → 결제 완료 시 만족감 + 기대감 |
| **이탈 위험 요소** | (1) 결제 페이지 리다이렉트 중 로딩 지연 (2) 결제 수단이 제한적 (3) 결제 실패 시 재시도 방법 불명확 (4) 환불 정책이 보이지 않으면 불안 |
| **대응 전략** | (1) Polar Custom Checkout: 빠른 리다이렉트 + 깔끔한 UI (2) 카드/애플페이/구글페이 지원 확인 (3) 결제 실패 시 에러 메시지 + "Try Again" 버튼 (4) 결제 버튼 아래 "100% money-back if not satisfied" 문구 (5) Webhook으로 주문 상태 실시간 확인 (polar_order_id UNIQUE로 멱등성 보장) |
| **핵심 KPI** | 결제 전환율 > 70% (미리보기에서 결제 진입한 사용자 중), 결제 실패율 < 5% |

#### 단계 6: 갤러리 수령 (이메일 + 웹 갤러리)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | 결제 완료 → Polar Webhook(order.paid) → Orchestrator 파이프라인 실행 → 완료 후 이메일 수신 (갤러리 링크). 웹 갤러리에서 모든 이미지 + 캡슐 워드로브 + 데일리 플랜 확인. |
| **감정 상태** | 만족 + 감탄 ("$5 치고 이 정도면 대박") 또는 실망 (품질 미달 시) |
| **이탈 위험 요소** | (1) 이메일이 스팸함으로 가서 못 찾음 (2) 갤러리 로딩이 느림 (이미지 다수) (3) 결과물 품질에 대한 기대 불일치 |
| **대응 전략** | (1) 결제 완료 화면에서 즉시 갤러리 링크 제공 (이메일 의존도 낮춤) (2) R2 CDN으로 이미지 빠른 로딩 (3) 이메일 발신자: "Travel Capsule AI <hello@travelcapsule.ai>" (SPF/DKIM 설정) (4) 이미지 lazy loading + WebP 최적화 (5) 갤러리 하단에 "Not satisfied? Reply to this email" 안내 |
| **핵심 KPI** | 이메일 오픈율 > 60%, 갤러리 조회율 > 80%, NPS > 40 |

#### 단계 7: 공유 (바이럴 루프)

| 항목 | 설명 |
|------|------|
| **사용자 행동** | 갤러리에서 공유 버튼 클릭 → SNS(Instagram, Twitter/X, KakaoTalk) 또는 링크 복사. UTM 태그된 링크를 통해 친구가 랜딩 페이지로 유입. |
| **감정 상태** | 자랑하고 싶음 + "친구도 해봐" → 자연스러운 바이럴 |
| **이탈 위험 요소** | (1) 공유할 만큼 매력적이지 않으면 공유 안 함 (2) 공유 버튼이 눈에 안 띄면 인지 못함 (3) 링크 클릭 시 랜딩 페이지가 매력적이지 않으면 2차 전환 실패 |
| **대응 전략** | (1) 공유 시 미리 작성된 카피 제공 (한국어/영어 이중 지원) (2) UTM 파라미터: `utm_source=share&utm_medium=user&utm_campaign=trip_share` (3) 친구 할인 코드 또는 리워드 (2차 전환 유도) (4) Instagram Story 최적화 세로형 이미지 (768x1024 = 3:4) (5) "Share & get $1 off your next trip" 인센티브 |
| **핵심 KPI** | 공유율 > 15%, 공유 링크 CTR > 5%, 2차 전환율 > 10% |

### 3.3 사용자 여정 종합 퍼널

```
랜딩 페이지 방문자     100%
     │
     ▼
폼 입력 시작           30%  ← 히어로 + 소셜 프루프 + 샘플 보기
     │
     ▼
폼 완료 제출           18%  ← 프로그레스 스텝 + 인라인 검증
     │
     ▼
AI 처리 완료 대기      15%  ← 멀티스텝 프로그레스 + 상태 폴링
     │
     ▼
미리보기 확인          14%  ← 첫 이미지 품질 + 블러 호기심
     │
     ▼
결제 완료             10%  ← 가격 앵커링 + Polar 결제 UX
     │
     ▼
갤러리 확인            8%  ← 이메일 + 웹 직접 접근
     │
     ▼
공유                  1.2%  ← 공유 카피 + SNS 버튼 + 인센티브
```

---

## 4. 페이지별 상세 스펙 (Page-by-Page Specifications)

### 4.1 Landing Page (`/`)

**파일 위치**: `apps/web/app/page.tsx`

#### 4.1.1 페이지 구성 (섹션 순서)

| 순번 | 섹션 | 컴포넌트 | 목적 |
|------|------|----------|------|
| 1 | Header | `Header` | 로고 + 네비게이션 + CTA 버튼 |
| 2 | Hero Section | `HeroSection` | 핵심 가치 전달 + 메인 CTA |
| 3 | Social Proof | `SocialProof` | 사용자 수 + 별점 리뷰 |
| 4 | How It Works | `HowItWorksSection` | 3단계 작동 방식 설명 |
| 5 | Photo Comparison | `PhotoComparison` | Before/After 비교 |
| 6 | Preview Explainer | `PreviewExplainer` | 미리보기 + 결제 흐름 설명 |
| 7 | Form Section | `FormSection` | 인라인 폼 (도시/월/사진) |
| 8 | Sample Output | `SampleOutputSection` | 실제 결과물 미리보기 |
| 9 | Capsule Section | `CapsuleSection` | 캡슐 워드로브 개념 설명 |
| 10 | Pricing Section | `PricingSection` | $5 가격표 + CTA |
| 11 | FAQ Section | `FaqSection` | 자주 묻는 질문 아코디언 |
| 12 | Partner Section | `PartnerSection` | 파트너/미디어 로고 |
| 13 | Footer | `Footer` | 링크 + 법적 고지 |

#### 4.1.2 Hero Section 상세

```
┌─────────────────────────────────────────────────────────┐
│                      [Header Bar]                        │
│  Logo                           [Get Started] [Sign In]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│     Pack Like a Style Editor                            │
│     ─────────────────────────                            │
│     AI-powered capsule wardrobe for your next trip.      │
│     8-12 versatile pieces. Daily outfit plans.           │
│     All for just $5.                                     │
│                                                          │
│     [Start My Trip →]     [See a Sample]                │
│                                                          │
│     ★★★★★ "Best $5 I ever spent" — 2,847 travelers     │
│                                                          │
│     [Hero Image: AI-generated outfit editorial]          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**헤드라인 규칙:**
- 메인 헤드라인: 6단어 이내, 감성적 + 실용적
- 서브헤드라인: 2줄 이내, 구체적 혜택 나열
- 가격: 헤드라인 근처에 항상 노출

**CTA 버튼:**
- Primary: "Start My Trip" → FormSection으로 스크롤
- Secondary: "See a Sample" → SampleOutputSection으로 스크롤
- 색상: Primary = terracotta (#C4613A), Secondary = ghost/outline

#### 4.1.3 Social Proof 섹션

```
┌─────────────────────────────────────────────────────────┐
│  ★★★★★ 4.9/5 from 2,847 travelers                      │
│                                                          │
│  [Avatar] "..."  [Avatar] "..."  [Avatar] "..."         │
│  — Sarah, NYC    — Mina, Seoul   — Leo, Berlin          │
│                                                          │
│  [Trusted by travelers from 47 countries]                │
└─────────────────────────────────────────────────────────┘
```

- 리뷰 카드: 최소 3개, 최대 5개
- 각 리뷰: 이름, 도시, 별점, 한 줄 코멘트
- 국가 카운터: 실시간 업데이트 (향후)

#### 4.1.4 How It Works 섹션

| Step | 아이콘 | 제목 | 설명 |
|------|--------|------|------|
| 1 | 지구본 | Tell Us Where | Pick your cities and travel month |
| 2 | 카메라 | Upload a Photo (Optional) | Add a selfie for personalized styling |
| 3 | 옷걸이 | Get Your Capsule | Receive your AI-curated wardrobe + outfit plan |

#### 4.1.5 FAQ 섹션

아코디언 형태, 최소 6개 항목:

| 질문 | 답변 요지 |
|------|-----------|
| What do I get for $5? | 3-4 outfit images per city + 8-12 item capsule wardrobe + daily plan |
| How long does it take? | 1-2 minutes after form submission |
| Is the photo required? | Optional. Without photo, generic model used. With photo, your face is preserved. |
| What about my privacy? | Your photo is deleted immediately after image generation. Never shared or used for training. |
| Can I get a refund? | 100% money-back if not satisfied. Reply to the email. |
| Which cities are supported? | Any city worldwide. We use AI to analyze any destination. |

#### 4.1.6 변환 전략 및 카피 원칙

**카피 원칙:**
- FOMO: "2,847 travelers styled this month" (사용자 수)
- 가격 앵커링: "Less than a coffee" / "Skip one latte, pack like a pro"
- 리스크 제거: "100% money-back guarantee"
- 구체성: "$5", "8-12 items", "3-4 looks per city"
- 긴급성: "Your trip is coming. Don't stress about packing."

**디자인 토큰:**

```
Colors:
  terracotta: #C4613A  (Primary CTA)
  ink:        #1A1410  (Text)
  sand:       #F5EFE6  (Background Alt)
  cream:      #FDF8F3  (Background Main)
  gold:       #C8A96E  (Accent/Stars)
  muted:      #8A7B6E  (Secondary Text)

Fonts:
  serif:  Playfair Display (Headings)
  sans:   DM Sans (Body)
```

---

### 4.2 Trip Form (`/trip/new`)

**참고**: 현재 구현에서는 랜딩 페이지 내 인라인 폼(`FormSection` 컴포넌트)으로 존재. 향후 독립 페이지(`/trip/new`)로 분리 가능.

#### 4.2.1 폼 구성

```
┌─────────────────────────────────────────────────────────┐
│  Step 1 of 3: Where are you going?                      │
│  ────────────────────────────────                        │
│                                                          │
│  🔍 [Search cities...            ]  ← Google Places AC  │
│                                                          │
│  Selected cities:                                        │
│  ┌──────────────────────────────────┐                   │
│  │ 🏙 Paris, France     [4 days] ✕  │                   │
│  │ 🏙 Barcelona, Spain  [3 days] ✕  │                   │
│  └──────────────────────────────────┘                   │
│  (Add up to 3 cities)                                    │
│                                                          │
│                                          [Next →]        │
├─────────────────────────────────────────────────────────┤
│  Step 2 of 3: When are you traveling?                    │
│  ────────────────────────────────                        │
│                                                          │
│  [Jan] [Feb] [Mar] [Apr] [May] [Jun]                    │
│  [Jul] [Aug] [Sep] [Oct] [Nov] [Dec]                    │
│                                                          │
│  Selected: September 2026                                │
│                                                          │
│                              [← Back]  [Next →]         │
├─────────────────────────────────────────────────────────┤
│  Step 3 of 3: Almost done!                               │
│  ────────────────────────────────────                    │
│                                                          │
│  📷 Upload a photo (optional)                            │
│  ┌─────────────────────────────────┐                    │
│  │                                 │                    │
│  │   Drag & drop or click to       │                    │
│  │   upload your photo              │                    │
│  │   JPEG, PNG, WebP — Max 10 MB   │                    │
│  │                                 │                    │
│  └─────────────────────────────────┘                    │
│  Your photo is used only for styling and deleted         │
│  immediately after generation. We never store or         │
│  share your photos.                                      │
│                                                          │
│  📧 Email address                                        │
│  [your@email.com                    ]                    │
│  We'll send your gallery link here.                      │
│                                                          │
│                   [← Back]  [Get My Capsule for $5 →]   │
└─────────────────────────────────────────────────────────┘
```

#### 4.2.2 도시 입력 (Google Places Autocomplete)

| 속성 | 규칙 |
|------|------|
| **검색 시작** | 최소 2글자 입력 후 자동완성 시작 |
| **검색 최대 길이** | 100자 이하 |
| **API 필터** | `types: '(cities)'` (도시만 검색) |
| **최대 도시 수** | 3개 |
| **최소 도시 수** | 1개 |
| **각 도시 일수** | 1일 이상, 기본값 3일 |
| **디바운스** | 300ms |
| **프록시** | Worker API `GET /api/cities/search?input=` 경유 (API 키 서버 보호) |
| **응답 형식** | `{ predictions: [{ place_id, description, city, country }] }` |

**에러 상태:**
- 도시 0개: "Please add at least one city"
- 도시 4개 이상: "Maximum 3 cities allowed" (추가 버튼 비활성화)
- 검색 실패: "City search unavailable. Please try again."
- 중복 도시: "This city is already added"

#### 4.2.3 여행월 선택

| 속성 | 규칙 |
|------|------|
| **UI** | 12개 월 버튼 그리드 (3x4 또는 6x2) |
| **기본 선택** | 다음 달 (현재 2월이면 3월 기본 선택) |
| **값 범위** | 1-12 (정수) |
| **필수 여부** | 필수 |

#### 4.2.4 사진 업로드

| 속성 | 규칙 |
|------|------|
| **필수 여부** | 선택 (Optional) |
| **허용 형식** | JPEG, PNG, WebP |
| **최대 크기** | 10 MB |
| **파일 확장자 검증** | MIME type과 확장자 일치 확인 |
| **업로드 엔드포인트** | `POST /api/uploads/face` (multipart/form-data) |
| **저장 경로** | R2: `faces/tmp/{uuid}.{ext}` |
| **프라이버시** | 이미지 생성 후 즉시 R2에서 삭제 + DB face_url NULL 처리 |
| **미리보기** | 업로드 후 썸네일 미리보기 + 삭제 버튼 |

**검증 에러 메시지:**

| 에러 | 메시지 |
|------|--------|
| 파일 없음 | "Missing file field" |
| 10MB 초과 | "File too large. Maximum size is 10 MB." |
| 잘못된 형식 | "Only JPEG, PNG, WEBP are allowed" |
| 확장자 불일치 | "File extension does not match declared content type" |

#### 4.2.5 이메일 입력

| 속성 | 규칙 |
|------|------|
| **필수 여부** | 필수 (갤러리 링크 발송용) |
| **검증 패턴** | `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` |
| **최대 길이** | 254자 |
| **인라인 에러** | "Please enter a valid email address" |

#### 4.2.6 폼 검증 규칙 전체

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| `cities` | `CityInput[]` | 필수 | 1-3개, 각 도시에 `name`, `country`, `days`(>= 1) 포함 |
| `month` | `number` | 필수 | 1-12 정수 |
| `face_url` | `string` | 선택 | 유효한 R2 URL, 512자 이하 |
| `email` | `string` | 필수 | RFC-5322 호환, 254자 이하 |
| `session_id` | `string` | 자동 | 클라이언트 생성 UUID, 128자 이하 |

#### 4.2.7 에러 상태 처리

| 에러 유형 | UI 처리 |
|-----------|---------|
| 필드별 유효성 에러 | 해당 필드 아래 빨간 텍스트 + 필드 테두리 빨간색 |
| 네트워크 에러 | 토스트 알림 "Network error. Please check your connection." |
| 서버 에러 (500) | 토스트 알림 "Something went wrong. Please try again." + 재시도 버튼 |
| 도시 검색 API 에러 | 검색 필드 아래 "City search unavailable" + 수동 입력 안내 |
| 파일 업로드 실패 | 업로드 영역에 에러 메시지 + "Try Again" 링크 |

---

### 4.3 Preview Page (`/trip/[tripId]/preview`)

**접근 조건**: Trip 생성 완료 + AI 처리 완료 (status: `completed` 또는 generation_jobs에 이미지 존재)

#### 4.3.1 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  [Header]                                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Your Paris & Barcelona Preview                          │
│  ─────────────────────────────                           │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │              │  │ ░░░░░░░░░░░░ │                     │
│  │  [Image 1]   │  │  [BLURRED]   │                     │
│  │  (Clear)     │  │   🔒 Locked  │                     │
│  │              │  │              │                     │
│  └──────────────┘  └──────────────┘                     │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ ░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░ │                     │
│  │  [BLURRED]   │  │  [BLURRED]   │                     │
│  │   🔒 Locked  │  │   🔒 Locked  │                     │
│  │              │  │              │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                          │
│  ─── Your Capsule Wardrobe (8 items) ───                │
│                                                          │
│  ✓ White linen button-down shirt                         │
│  ✓ Navy chino trousers                                   │
│  ✓ Beige linen blazer                                    │
│  ░ ░░░░░░░░░░░░░░░░░░░░                                 │
│  ░ ░░░░░░░░░░░░░░░░░░░░                                 │
│  ░ ░░░░░░░░░░░░░░░░░░░░                                 │
│  ░ ░░░░░░░░░░░░░░░░░░░░                                 │
│  ░ ░░░░░░░░░░░░░░░░░░░░                                 │
│                                                          │
│  ┌───────────────────────────────────────┐              │
│  │  Unlock all 4 looks + full capsule    │              │
│  │  wardrobe + daily outfit plan         │              │
│  │                                       │              │
│  │       [$5 — Unlock My Capsule]        │              │
│  │                                       │              │
│  │  💳 Secure checkout via Polar          │              │
│  │  🔒 100% money-back guarantee          │              │
│  └───────────────────────────────────────┘              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 4.3.2 이미지 표시 규칙

| 이미지 | 표시 상태 | 설명 |
|--------|-----------|------|
| 1번째 | **선명** | 가장 매력적인 무드 (golden-hour 우선) |
| 2번째 | **블러** | CSS `filter: blur(20px)` + 잠금 아이콘 |
| 3번째 | **블러** | CSS `filter: blur(20px)` + 잠금 아이콘 |
| 4번째 | **블러** | CSS `filter: blur(20px)` + 잠금 아이콘 |

**블러 이미지 CSS:**
```css
.blurred-image {
  filter: blur(20px);
  pointer-events: none;
  user-select: none;
}
.blurred-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
}
```

#### 4.3.3 캡슐 워드로브 힌트

- 처음 3개 아이템: 이름만 공개 (예: "White linen button-down shirt")
- 나머지 5-9개: 블러 처리 (텍스트 자체를 블러)
- `category`, `why`, `versatility_score`는 모두 블러
- 아이템 총 개수만 공개 (예: "8 items")

#### 4.3.4 결제 유도 CTA

**위치**: 블러 이미지 영역 직후 + 페이지 하단 고정 바

**카피 옵션:**
- "Unlock all 4 looks + your complete capsule wardrobe — $5"
- "Get your full packing guide for less than a coffee"
- "Don't pack blind. Get your AI-curated capsule now."

**CTA 버튼:**
- 텍스트: "$5 — Unlock My Capsule"
- 색상: terracotta (#C4613A)
- 클릭 시: `POST /api/checkout` → Polar 결제 페이지 리다이렉트

**신뢰 요소:**
- "Secure checkout via Polar" + 잠금 아이콘
- "100% money-back guarantee"
- Polar/Visa/Mastercard/Apple Pay 로고

---

### 4.4 Result Gallery (`/result/[tripId]`)

**파일 위치**: `apps/web/app/result/[tripId]/page.tsx`
**접근 조건**: 결제 완료 (orders 테이블에 status: `paid` 레코드 존재) + trip status: `completed`

#### 4.4.1 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  [Header]          Travel Capsule AI                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Your Trip to Paris & Barcelona                          │
│  September 2026 — 7 days                                │
│  ─────────────────────────────                           │
│                                                          │
│  ═══ PARIS (4 days) ═══════════════════════════         │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ Image 1  │ │ Image 2  │ │ Image 3  │                │
│  │ morning  │ │ golden-  │ │ evening  │                │
│  │ explore  │ │ hour     │ │ out      │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│                                                          │
│  ═══ BARCELONA (3 days) ══════════════════════          │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ Image 4  │ │ Image 5  │ │ Image 6  │                │
│  │ morning  │ │ market   │ │ evening  │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│                                                          │
│  ═══ CAPSULE WARDROBE (8 items) ══════════════         │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │ 👕 White linen button-down shirt          │           │
│  │    Category: Top                          │           │
│  │    Why: Breathable base for warm climates │           │
│  │    Versatility: ████████░░ 8/10           │           │
│  ├──────────────────────────────────────────┤           │
│  │ 👖 Navy chino trousers                    │           │
│  │    Category: Bottom                       │           │
│  │    Why: Goes with everything, dressy...   │           │
│  │    Versatility: █████████░ 9/10           │           │
│  ├──────────────────────────────────────────┤           │
│  │ ... (6 more items)                        │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
│  ═══ DAILY OUTFIT PLAN ═══════════════════════         │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │ Day 1 — Paris                             │           │
│  │ Outfit: White linen shirt + Navy chinos   │           │
│  │         + Leather sneakers                │           │
│  │ Note: Morning sightseeing to cafe lunch   │           │
│  ├──────────────────────────────────────────┤           │
│  │ Day 2 — Paris                             │           │
│  │ Outfit: ...                               │           │
│  ├──────────────────────────────────────────┤           │
│  │ ... (5 more days)                         │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
│  [📥 Download All Images]   [📤 Share My Capsule]       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 4.4.2 이미지 그리드 상세

| 속성 | 값 |
|------|-----|
| **레이아웃** | 도시별 그룹핑, 각 도시 3-4장 이미지 |
| **이미지 사이즈** | 768 x 1024px (3:4 세로형) |
| **그리드** | 데스크톱: 3열, 태블릿: 2열, 모바일: 1열 |
| **이미지 소스** | R2 CDN (`{R2_PUBLIC_URL}/{key}`) |
| **로딩** | Lazy loading (`loading="lazy"`) |
| **포맷** | WebP 우선, JPEG 폴백 |
| **무드 라벨** | 이미지 하단에 무드 태그 (예: "morning-exploration", "golden-hour-cafe") |

#### 4.4.3 캡슐 워드로브 목록

각 아이템 카드:

```typescript
interface CapsuleItemCard {
  name: string;           // "White linen button-down shirt"
  category: string;       // "top" | "bottom" | "outerwear" | "shoes" | "dress/jumpsuit" | "accessory"
  why: string;            // "Breathable base layer for warm Mediterranean climates"
  versatility_score: number; // 1-10, 시각적 프로그레스 바로 표시
}
```

**카테고리별 아이콘:**

| 카테고리 | 아이콘 |
|----------|--------|
| top | 셔츠 아이콘 |
| bottom | 바지 아이콘 |
| outerwear | 재킷 아이콘 |
| shoes | 신발 아이콘 |
| dress/jumpsuit | 드레스 아이콘 |
| accessory | 가방 아이콘 |

#### 4.4.4 데일리 아웃핏 플랜

```typescript
interface DailyPlanCard {
  day: number;      // 1, 2, 3, ...
  city: string;     // "Paris"
  outfit: string[]; // ["White linen shirt", "Navy chinos", "Leather sneakers"]
  note: string;     // "Morning sightseeing to evening dinner"
}
```

**표시 형식:**
- 요일별 카드 (세로 스크롤)
- 도시 전환 지점에 구분선 + 도시명 헤더
- 각 아웃핏 아이템을 클릭하면 캡슐 워드로브 해당 아이템으로 스크롤

#### 4.4.5 다운로드 기능

| 기능 | 설명 |
|------|------|
| **개별 이미지 다운로드** | 각 이미지 우측 상단 다운로드 아이콘 |
| **전체 다운로드** | ZIP 파일 (향후, 모든 이미지 + capsule-wardrobe.pdf) |
| **파일명 규칙** | `travel-capsule-{city}-{mood}-{tripId}.webp` |

---

### 4.5 Share Page

**구현 방식**: Result Gallery 페이지 내 공유 모달/섹션 + 별도 공유 미리보기 OG 메타 태그

#### 4.5.1 바이럴 공유 카피

**영어 (자동 생성):**
```
My AI-styled trip to Paris & Barcelona is ready!
Check out my personalized capsule wardrobe and outfit plan.
Get yours for just $5 at {share_url}
```

**한국어 (자동 생성):**
```
Paris & Barcelona 여행을 위한 AI 스타일링이 완성됐어요!
나만을 위한 캡슐 워드로브와 데일리 아웃핏 플랜을 확인해보세요.
단 $5로 나만의 여행 스타일링 받기: {share_url}
```

**카피 생성 로직** (`growthAgent.ts`):
- 도시 1개: "My AI-styled trip to Paris is ready!"
- 도시 2개: "My AI-styled trip to Paris & Barcelona is ready!"
- 도시 3개: "My AI-styled trip to Paris, Barcelona & Tokyo is ready!"

#### 4.5.2 UTM 링크 생성

```
Base URL: https://travelcapsule.ai/result/{tripId}
UTM Parameters:
  utm_source   = share
  utm_medium   = user
  utm_campaign = trip_share

Result: https://travelcapsule.ai/result/{tripId}?utm_source=share&utm_medium=user&utm_campaign=trip_share
```

**플랫폼별 추가 UTM:**

| 플랫폼 | utm_source | utm_medium |
|--------|------------|------------|
| Instagram | instagram | social |
| Twitter/X | twitter | social |
| KakaoTalk | kakao | social |
| 링크 복사 | share | user |

#### 4.5.3 친구 할인 (2차 전환)

| 요소 | 설명 |
|------|------|
| **공유자 리워드** | "$1 off your next trip" (쿠폰 코드 생성, 향후) |
| **수신자 혜택** | "Your friend styled their trip. Get yours for $5" |
| **레퍼럴 트래킹** | UTM 파라미터 + 쿠폰 코드 기반 |
| **2차 전환 CTA** | "Start My Trip" 버튼 (랜딩 페이지로 이동) |

#### 4.5.4 SNS 공유 버튼

```
┌───────────────────────────────────────────┐
│  Share your capsule wardrobe              │
│                                           │
│  [📋 Copy Link]                           │
│                                           │
│  [Instagram]  [Twitter/X]  [KakaoTalk]   │
│                                           │
│  Share & get $1 off your next trip!       │
└───────────────────────────────────────────┘
```

| 플랫폼 | 공유 방식 | 설명 |
|--------|-----------|------|
| **링크 복사** | `navigator.clipboard.writeText(shareUrl)` | 토스트: "Link copied!" |
| **Instagram** | Instagram Stories deep link (모바일) / 링크 복사 (데스크톱) | 세로형 이미지(768x1024) 최적화 |
| **Twitter/X** | `https://twitter.com/intent/tweet?text={encodedText}&url={shareUrl}` | 프리필 카피 + URL |
| **KakaoTalk** | Kakao JavaScript SDK `Kakao.Share.sendDefault()` | OG 메타 태그 기반 미리보기 |

**OG 메타 태그 (공유 시 미리보기):**
```html
<meta property="og:title" content="My AI-Styled Trip to Paris & Barcelona" />
<meta property="og:description" content="8-item capsule wardrobe + daily outfit plan, powered by AI. Get yours for $5." />
<meta property="og:image" content="{first_image_url}" />
<meta property="og:url" content="{share_url}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

---

## 5. Worker API 엔드포인트 목록 (Worker API Endpoints)

**Base URL**: `https://api.travelcapsule.ai` (Cloudflare Workers)
**CORS**: `https://travelcapsule.ai`, `https://www.travelcapsule.ai`
**Content-Type**: `application/json` (달리 명시하지 않는 한)

---

### 5.1 `POST /api/trips` -- 새 여행 생성

새로운 여행 세션을 생성하고 Supabase `trips` 테이블에 저장한다.

**Request:**

```json
{
  "session_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "cities": [
    { "name": "Paris", "country": "France", "days": 4, "lat": 48.8566, "lon": 2.3522 },
    { "name": "Barcelona", "country": "Spain", "days": 3, "lat": 41.3874, "lon": 2.1686 }
  ],
  "month": 9,
  "face_url": "https://assets.travelcapsule.ai/faces/tmp/uuid.jpg"
}
```

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| `session_id` | `string` | 필수 | 비어있지 않은 문자열, 128자 이하 |
| `cities` | `CityInput[]` | 필수 | 비어있지 않은 배열, 최대 10개 |
| `month` | `number` | 필수 | 정수, 1-12 |
| `face_url` | `string` | 선택 | 유효한 URL, 512자 이하 |

**Response (201):**

```json
{
  "trip_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "pending"
}
```

**에러 케이스:**

| HTTP | 조건 | 응답 |
|------|------|------|
| 400 | JSON 파싱 실패 | `{ "error": "Invalid JSON body" }` |
| 400 | session_id 누락/빈값 | `{ "error": "session_id is required" }` |
| 400 | session_id 128자 초과 | `{ "error": "session_id must be 128 characters or fewer" }` |
| 400 | cities 빈 배열/미배열 | `{ "error": "cities must be a non-empty array" }` |
| 400 | cities 10개 초과 | `{ "error": "A maximum of 10 cities per trip is allowed" }` |
| 400 | month 범위 초과 | `{ "error": "month must be an integer 1-12" }` |
| 400 | face_url 형식 오류 | `{ "error": "Invalid face_url" }` |
| 500 | DB 저장 실패 | `{ "error": "Failed to create trip", "detail": "..." }` |

---

### 5.2 `GET /api/trips/:tripId` -- 여행 상태 조회

Trip 상태와 관련 데이터를 조회한다. `completed` 상태에서는 capsule_results도 포함한다.

**Request:**

```
GET /api/trips/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

| 파라미터 | 위치 | 타입 | 검증 |
|----------|------|------|------|
| `tripId` | path | UUID v4 | RFC-4122 UUID 형식 필수 |

**Response (200) -- 처리 중:**

```json
{
  "trip": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "session_id": "a1b2c3d4-...",
    "cities": [...],
    "month": 9,
    "status": "processing",
    "created_at": "2026-02-28T10:00:00.000Z",
    "updated_at": "2026-02-28T10:01:00.000Z"
  },
  "jobs": [
    { "city": "Paris", "mood": "morning-exploration", "status": "completed", "image_url": "..." },
    { "city": "Paris", "mood": "golden-hour-cafe", "status": "processing", "image_url": null },
    { "city": "Barcelona", "mood": "local-market", "status": "pending", "image_url": null }
  ]
}
```

**Response (200) -- 완료:**

```json
{
  "trip": {
    "id": "f47ac10b-...",
    "status": "completed",
    ...
  },
  "capsule": {
    "id": "...",
    "trip_id": "f47ac10b-...",
    "items": [
      { "name": "White linen shirt", "category": "top", "why": "...", "versatility_score": 8 }
    ],
    "daily_plan": [
      { "day": 1, "city": "Paris", "outfit": ["White linen shirt", "Navy chinos"], "note": "..." }
    ]
  }
}
```

**에러 케이스:**

| HTTP | 조건 | 응답 |
|------|------|------|
| 400 | UUID 형식 아님 | `{ "error": "Invalid trip ID" }` |
| 404 | Trip 미존재 | `{ "error": "Trip not found" }` |
| 500 | DB 조회 실패 | `{ "error": "Failed to fetch trip" }` |

---

### 5.3 `POST /api/uploads/face` -- 사진 업로드

얼굴 사진을 R2에 업로드한다. 이미지 생성 완료 후 자동 삭제된다.

**Request:**

```
Content-Type: multipart/form-data

Form field: file (binary)
```

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| `file` | `File` | 필수 | JPEG/PNG/WebP, 최대 10MB, 확장자-MIME 일치 |

**Response (201):**

```json
{
  "face_url": "https://assets.travelcapsule.ai/faces/tmp/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d.jpg"
}
```

**에러 케이스:**

| HTTP | 조건 | 응답 |
|------|------|------|
| 400 | multipart 아님 | `{ "error": "Expected multipart/form-data" }` |
| 400 | file 필드 누락 | `{ "error": "Missing file field" }` |
| 413 | 10MB 초과 | `{ "error": "File too large. Maximum size is 10 MB." }` |
| 415 | 미허용 형식 | `{ "error": "Only JPEG, PNG, WEBP are allowed" }` |
| 415 | 확장자 불일치 | `{ "error": "File extension does not match declared content type" }` |

---

### 5.4 `POST /api/checkout` -- 결제 링크 생성

Polar Custom Checkout 세션을 생성하고 결제 URL을 반환한다.

**Request:**

```json
{
  "trip_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "customer_email": "user@example.com"
}
```

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| `trip_id` | `string` | 필수 | UUID v4 형식 |
| `customer_email` | `string` | 선택 | RFC-5322 호환, 254자 이하 |

**Response (200):**

```json
{
  "checkout_url": "https://checkout.polar.sh/custom/...",
  "checkout_id": "chk_..."
}
```

**에러 케이스:**

| HTTP | 조건 | 응답 |
|------|------|------|
| 400 | trip_id 누락 | `{ "error": "trip_id is required" }` |
| 400 | UUID 형식 아님 | `{ "error": "trip_id must be a valid UUID" }` |
| 400 | 이메일 형식 오류 | `{ "error": "customer_email must be a valid email address" }` |
| 404 | Trip 미존재 | `{ "error": "Trip not found" }` |
| 500 | DB 조회 실패 | `{ "error": "Failed to fetch trip" }` |
| 502 | Polar API 에러 | `{ "error": "Failed to create checkout session" }` |

---

### 5.5 `POST /api/webhooks/polar` -- Polar 웹훅 처리

Polar 결제 완료 웹훅을 수신하여 주문을 기록하고 AI 파이프라인을 트리거한다.

**Request:**

```
Headers:
  X-Polar-Signature: sha256=abc123...

Body (raw JSON):
{
  "type": "order.paid",
  "data": {
    "id": "ord_...",
    "metadata": { "trip_id": "f47ac10b-..." },
    "amount": 500,
    "user": { "email": "user@example.com" }
  }
}
```

**서명 검증:**
- HMAC-SHA256 (`POLAR_WEBHOOK_SECRET` 사용)
- 포맷: `sha256={hex_digest}`
- 타이밍 안전 비교 (constant-time comparison)

**처리 흐름:**
1. 서명 검증
2. `order.paid` 이벤트 확인
3. 멱등성 확인 (`polar_order_id` UNIQUE)
4. `orders` 테이블에 기록
5. `trips.status` → `processing`으로 변경
6. `orchestrateTrip()` 비동기 실행 (`waitUntil`)

**Response (200):**

```json
{ "received": true }
```

**멱등성 응답:**

```json
{ "received": true, "idempotent": true }
```

**에러 케이스:**

| HTTP | 조건 | 응답 |
|------|------|------|
| 401 | 서명 불일치 | `{ "error": "Invalid signature" }` |
| 400 | JSON 파싱 실패 | `{ "error": "Invalid JSON" }` |
| 400 | trip_id 누락 | `{ "error": "Missing trip_id in order metadata" }` |
| 400 | trip_id UUID 아님 | `{ "error": "Invalid trip_id in order metadata" }` |
| 500 | 주문 기록 실패 | `{ "error": "Failed to record order" }` |

---

### 5.6 `GET /api/trips/:tripId` (갤러리 결과 조회)

Trip이 `completed` 상태일 때 갤러리 결과를 포함하여 반환한다. (5.2와 동일 엔드포인트, status에 따라 응답 변화)

**완료 시 추가 데이터:**

```json
{
  "trip": { "...": "...", "status": "completed" },
  "capsule": {
    "trip_id": "...",
    "items": [
      {
        "name": "White linen button-down shirt",
        "category": "top",
        "why": "Breathable base layer for warm Mediterranean climates",
        "versatility_score": 8
      }
    ],
    "daily_plan": [
      {
        "day": 1,
        "city": "Paris",
        "outfit": ["White linen shirt", "Navy chinos", "Leather sneakers"],
        "note": "Morning sightseeing to cafe lunch"
      }
    ]
  }
}
```

---

### 5.7 `POST /api/trips/:tripId/process` -- AI 파이프라인 수동 트리거

개발/관리자 용도. 결제된 Trip의 AI 파이프라인을 수동으로 실행한다.

**Request:**

```
POST /api/trips/f47ac10b-58cc-4372-a567-0e02b2c3d479/process
```

**전제 조건**: `orders` 테이블에 해당 trip_id의 `status: paid` 레코드 존재

**Response (200):**

```json
{
  "trip_id": "f47ac10b-...",
  "status": "processing"
}
```

**에러 케이스:**

| HTTP | 조건 | 응답 |
|------|------|------|
| 400 | UUID 형식 아님 | `{ "error": "Invalid trip ID" }` |
| 402 | 결제 미완료 | `{ "error": "No paid order found for this trip" }` |
| 500 | DB 조회 실패 | `{ "error": "Failed to check order status" }` |

---

### 5.8 `GET /api/cities/search` -- 도시 검색 (Google Places 프록시)

Google Places Autocomplete API를 프록시하여 도시 검색 결과를 반환한다.
클라이언트에서 직접 Google API를 호출하지 않아 API 키를 보호한다.

**Request:**

```
GET /api/cities/search?input=par
```

| 파라미터 | 위치 | 타입 | 검증 규칙 |
|----------|------|------|-----------|
| `input` | query | string | 최소 2글자, 최대 100글자 |

**Response (200):**

```json
{
  "predictions": [
    {
      "place_id": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
      "description": "Paris, France",
      "city": "Paris",
      "country": "France"
    },
    {
      "place_id": "...",
      "description": "Paramaribo, Suriname",
      "city": "Paramaribo",
      "country": "Suriname"
    }
  ]
}
```

**에러 케이스:**

| HTTP | 조건 | 응답 |
|------|------|------|
| 200 | 2글자 미만 | `{ "predictions": [] }` (빈 배열) |
| 400 | 100글자 초과 | `{ "error": "Search query too long" }` |
| 502 | Google API 에러 | `{ "error": "Google Places API error" }` |

---

### 5.9 `GET /health` -- 헬스 체크

Worker의 상태를 확인한다.

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2026-02-28T10:00:00.000Z"
}
```

---

### API 엔드포인트 요약 표

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| `GET` | `/health` | 헬스 체크 | 없음 |
| `POST` | `/api/trips` | 새 여행 생성 | 없음 (session 기반) |
| `GET` | `/api/trips/:tripId` | 여행 상태/결과 조회 | 없음 (session 기반) |
| `POST` | `/api/uploads/face` | 얼굴 사진 업로드 | 없음 |
| `POST` | `/api/checkout` | Polar 결제 세션 생성 | 없음 |
| `POST` | `/api/webhooks/polar` | Polar 웹훅 처리 | HMAC-SHA256 서명 |
| `POST` | `/api/trips/:tripId/process` | AI 파이프라인 수동 트리거 | 결제 확인 (orders) |
| `GET` | `/api/cities/search` | 도시 검색 (Google Places 프록시) | 없음 |

---

## 6. 기능별 인수 기준 (Acceptance Criteria)

### 6.1 도시 검색 기능

- [ ] 사용자가 2글자 이상 입력하면 Google Places Autocomplete 결과가 300ms 이내에 표시된다
- [ ] 검색 결과에 `city` (도시명)과 `country` (국가명)이 분리되어 표시된다
- [ ] 결과에서 도시를 클릭하면 선택 목록에 추가되고 검색 필드가 초기화된다
- [ ] 최대 3개 도시까지 추가할 수 있으며, 3개 도달 시 검색 필드가 비활성화된다
- [ ] 이미 추가된 도시를 다시 선택하면 "This city is already added" 에러가 표시된다
- [ ] 각 도시의 일수(days)를 1일 이상으로 설정할 수 있다
- [ ] 도시 옆 X 버튼을 클릭하면 선택 목록에서 제거된다
- [ ] Google Places API 에러 시 사용자에게 "City search unavailable" 메시지가 표시된다
- [ ] API 키가 클라이언트에 노출되지 않는다 (Worker 프록시 경유 확인)
- [ ] 입력 100자 초과 시 "Search query too long" 에러가 반환된다

### 6.2 여행 폼 제출

- [ ] 필수 필드(cities, month, email) 미입력 시 인라인 에러 메시지가 표시된다
- [ ] 유효하지 않은 이메일 입력 시 "Please enter a valid email address" 에러가 표시된다
- [ ] 사진 업로드 없이도 폼 제출이 가능하다 (선택 사항)
- [ ] 사진 업로드 시 JPEG/PNG/WebP만 허용되며, 10MB 초과 파일은 거부된다
- [ ] 사진 업로드 후 썸네일 미리보기가 표시되고 삭제 버튼이 작동한다
- [ ] 폼 제출 시 `POST /api/trips` 호출이 성공하고 `trip_id`가 반환된다
- [ ] `session_id`가 클라이언트에서 자동 생성되어 전송된다 (128자 이하 UUID)
- [ ] cities 배열의 각 도시에 `name`, `country`, `days` 필드가 포함된다
- [ ] month 값이 1-12 사이의 정수로 전송된다
- [ ] 네트워크 에러 시 토스트 알림이 표시되고 재시도가 가능하다
- [ ] 폼 제출 중 중복 제출이 방지된다 (버튼 비활성화)
- [ ] 프로그레스 스텝 UI(Step 1/3, 2/3, 3/3)가 정상 작동한다

### 6.3 AI 이미지 생성

- [ ] Trip 생성 후 Climate Agent가 각 도시의 기후 데이터를 Open-Meteo에서 조회한다
- [ ] 기후 조회 실패 시 폴백 데이터(temp_min: 15, temp_max: 22)가 사용된다
- [ ] Style Agent가 도시별 3-4개의 패션 에디토리얼 프롬프트를 생성한다
- [ ] 프롬프트에 도시 바이브, 기후, 무드가 반영된다
- [ ] ImageGen Agent가 NanoBanana API를 통해 768x1024 이미지를 생성한다
- [ ] 이미지 생성 실패 시 최대 3회 재시도(지수 백오프: 1s, 2s, 4s)가 수행된다
- [ ] 얼굴 사진이 제공된 경우 `face_preservation_strength: 0.8`로 얼굴 보존 생성이 수행된다
- [ ] 이미지 생성 동시성이 2로 제한된다 (과부하 방지)
- [ ] 각 generation_job의 상태가 `pending` → `processing` → `completed`/`failed`로 업데이트된다
- [ ] generation_jobs에 `attempts` 카운트가 기록된다
- [ ] 모든 이미지 생성 후 Capsule Agent가 8-12개 아이템 캡슐 워드로브를 생성한다
- [ ] 캡슐 워드로브의 각 아이템에 `name`, `category`, `why`, `versatility_score`가 포함된다
- [ ] 데일리 아웃핏 플랜이 여행 총 일수만큼 생성된다
- [ ] 각 daily_plan에 `day`, `city`, `outfit`(아이템 배열), `note`가 포함된다
- [ ] Negative prompt에 부적절한 콘텐츠 방지 키워드가 포함된다
- [ ] AI 처리 전체 파이프라인이 5분 이내에 완료된다

### 6.4 결제 처리

- [ ] `POST /api/checkout`이 Polar Custom Checkout URL을 반환한다
- [ ] 결제 금액이 $5(500 cents)로 고정된다
- [ ] trip_id가 Polar metadata에 포함되어 Webhook에서 연결 가능하다
- [ ] Polar Webhook(`order.paid`)이 HMAC-SHA256 서명 검증을 통과해야 처리된다
- [ ] 서명이 유효하지 않으면 401 응답이 반환된다
- [ ] `polar_order_id` UNIQUE 제약으로 중복 Webhook이 멱등적으로 처리된다
- [ ] 중복 Webhook 수신 시 `{ "received": true, "idempotent": true }`가 반환된다
- [ ] 결제 완료 후 `orders` 테이블에 `status: paid` 레코드가 생성된다
- [ ] 결제 완료 후 자동으로 AI 파이프라인(`orchestrateTrip`)이 트리거된다
- [ ] 파이프라인은 `waitUntil`로 비동기 실행되어 Webhook 응답이 즉시 반환된다
- [ ] 존재하지 않는 trip_id로 결제 시도 시 404 에러가 반환된다
- [ ] Polar API 에러 시 502 에러가 반환된다

### 6.5 갤러리 접근

- [ ] 결제 완료된 Trip의 갤러리 URL(`/result/{tripId}`)에 접근하면 모든 이미지가 표시된다
- [ ] 이미지가 도시별로 그룹핑되어 표시된다
- [ ] 각 이미지에 무드(mood) 라벨이 표시된다
- [ ] 캡슐 워드로브 8-12개 아이템이 카드 형태로 표시된다
- [ ] 각 아이템의 `name`, `category`, `why`, `versatility_score`가 모두 표시된다
- [ ] versatility_score가 시각적 프로그레스 바(1-10)로 표시된다
- [ ] 데일리 아웃핏 플랜이 요일별로 표시된다
- [ ] 각 데일리 플랜에 도시, 아웃핏 아이템 목록, 활동 노트가 포함된다
- [ ] 이미지가 R2 CDN에서 로드되며 lazy loading이 적용된다
- [ ] 결제하지 않은 Trip의 갤러리 접근 시 Preview 페이지로 리다이렉트된다
- [ ] 이메일에 포함된 갤러리 링크가 정상 작동한다
- [ ] Fulfillment 완료 후 원본 얼굴 사진이 R2에서 삭제되고 DB face_url이 NULL이다
- [ ] 이메일 발송 실패가 비치명적으로 처리된다 (로그만 기록, 파이프라인 계속 진행)

### 6.6 공유 기능

- [ ] 갤러리 페이지에 공유 버튼(링크 복사, Instagram, Twitter/X, KakaoTalk)이 표시된다
- [ ] 공유 링크에 UTM 파라미터(`utm_source=share&utm_medium=user&utm_campaign=trip_share`)가 포함된다
- [ ] "Copy Link" 버튼 클릭 시 UTM 링크가 클립보드에 복사되고 토스트 알림이 표시된다
- [ ] Twitter/X 공유 시 프리필 카피와 URL이 포함된 트윗 작성 창이 열린다
- [ ] 공유 카피가 영어/한국어 두 버전으로 생성된다
- [ ] 도시 수에 따라 카피가 적절히 포맷팅된다 (1개: "to Paris", 2개: "to Paris & Barcelona", 3개: "to Paris, Barcelona & Tokyo")
- [ ] OG 메타 태그가 설정되어 SNS 공유 시 이미지 미리보기가 표시된다
- [ ] og:image에 첫 번째 생성 이미지 URL이 사용된다
- [ ] 공유 링크로 접근한 신규 사용자가 랜딩 페이지를 볼 수 있다
- [ ] UTM 파라미터가 Analytics에서 트래킹 가능하다

---

## 부록: 상태 다이어그램

### Trip 상태 전이

```
┌─────────┐     POST /api/trips     ┌──────────┐
│  (없음)  │ ─────────────────────► │  pending  │
└─────────┘                         └──────────┘
                                         │
                              Webhook order.paid OR
                              POST /api/trips/:id/process
                                         │
                                         ▼
                                    ┌────────────┐
                                    │ processing  │
                                    └────────────┘
                                      │        │
                            성공      │        │  실패
                                      ▼        ▼
                               ┌───────────┐  ┌────────┐
                               │ completed  │  │ failed │
                               └───────────┘  └────────┘
```

### Generation Job 상태 전이

```
┌─────────┐   Orchestrator   ┌────────────┐   성공   ┌───────────┐
│ pending  │ ──────────────► │ processing  │ ───────► │ completed  │
└─────────┘                  └────────────┘          └───────────┘
                                    │
                              3회 실패
                                    │
                                    ▼
                              ┌────────┐
                              │ failed │
                              └────────┘
```

### Order 상태 전이

```
              Webhook order.paid      환불 요청 (향후)
(생성됨) ──────────────────────► paid ───────────────► refunded
```
