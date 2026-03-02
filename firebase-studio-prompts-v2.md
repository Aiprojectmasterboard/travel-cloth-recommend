# Travel Capsule AI — Firebase Studio 실행 프롬프트 v2

> 순서대로 복사 → 붙여넣기만 하면 됩니다.
> 각 STEP마다 **완료 확인 방법**을 확인하고 다음으로 넘어가세요.

---

## 📐 제품 전략 요약 (프롬프트 작성 기반)

### 가격 플랜 (확정)
| 플랜 | 가격 | 내용 | trip당 원가 | 손익분기 |
|------|------|------|------------|---------|
| Standard | $5 | 이미지 1장 선명 + 3장 블러 변형, 캡슐 리스트, 데일리 플랜 | ~$0.10 | trip당 $4.90 마진 |
| Pro | $12 | 히어로 이미지 포함 실제 4~6장 생성, 고화질, 1회 재생성 | ~$0.30 | trip당 $11.70 마진 |
| Annual | $29/년 | 연 12회 제한 (월 1회), Pro 혜택 전체 포함 | 최대 $3.60/년 | $25.40 마진 확보 |

> Annual 12회 설정 근거: Pro 원가 $0.30 × 12 = $3.60 → $29 대비 원가율 12.4%. 현실 여행 빈도(연 5~8회)보다 여유 있어 사용자 만족 + 원가 안전.

### Free → Paid 전환 퍼널
```
입력 (도시+날짜+월)
    ↓ 즉시 (캐싱 가능, 생성 비용 거의 없음)
[FREE] 날씨 리포트 카드 + 시티 바이브 카드 + 캡슐 카운트 추정기
    ↓
[FREE] 워터마크 티저 이미지 (실제 생성 1장 + 블러 변형 3장 → 2x2 그리드)
    ↓
[GATE] 이메일 캡처 ("무드 카드 이메일 전송" 마이크로 컨버전)
    ↓
[PAYWALL] $5 / $12 / $29 플랜 선택
    ↓
[POST-PAYMENT] 결제 직후 Pro 업셀 ($7 추가)
    ↓
[RESULT] 전체 결과 갤러리
    ↓
[VIRAL] "내 Paris Rainy Chic 무드 보기" 공유 링크 → 신규 유저 Teaser 유입
```

### 전환 심리 장치 (모든 UI에 반영)
- Progress: 체크리스트 완료 표시 (`✅ Weather analyzed / ✅ Vibe matched / ✅ 4 looks generated / 🔒 Full capsule waiting`)
- 무드 네이밍: "4 outfit images" 대신 "Paris — Rainy Chic", "Tokyo — Urban Minimal"
- 결과 만료: "Your looks expire in 48 hours" (R2 temp 파일 실제 48시간 후 삭제)
- Annual 카피: "For the traveler who never stops — $2.42/month" (월 환산)
- Rate limit: Cloudflare Turnstile (봇 차단) + session_id + IP 조합

---

---

## 🔧 사전 준비 (딱 한 번만)

Firebase Studio 터미널에서 실행:

```bash
mkdir -p ~/.claude && cat > ~/.claude/settings.json << 'EOF'
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
EOF

mkdir -p travel-capsule-ai && cd travel-capsule-ai
# CLAUDE.md 파일을 이 폴더에 넣은 후:
claude
```

---

---

## 📋 STEP 1 — 프로젝트 초기 세팅

**언제:** claude 실행 직후 바로
**소요 시간:** 약 3~5분

---

```
CLAUDE.md를 읽고 Travel Capsule AI 프로젝트 초기 세팅을 해줘.

아래를 순서대로 실행해:

1. .gitignore 생성
   내용:
   .env.local
   .env*.local
   .env
   node_modules
   .wrangler
   dist
   .next
   .DS_Store

2. .env.example 생성 (키값 없이 변수명만)
   ANTHROPIC_API_KEY=
   NANOBANANA_API_KEY=
   POLAR_ACCESS_TOKEN=
   POLAR_WEBHOOK_SECRET=
   POLAR_PRODUCT_ID_STANDARD=
   POLAR_PRODUCT_ID_PRO=
   POLAR_PRODUCT_ID_ANNUAL=
   SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET_NAME=
   R2_PUBLIC_URL=
   RESEND_API_KEY=
   GOOGLE_PLACES_API_KEY=
   CLOUDFLARE_TURNSTILE_SECRET_KEY=
   NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=

3. 폴더 구조 전체 생성
   mkdir -p apps/web/app/trip
   mkdir -p apps/web/app/preview/\[tripId\]
   mkdir -p apps/web/app/result/\[tripId\]
   mkdir -p apps/web/app/share/\[tripId\]
   mkdir -p apps/web/components/ui
   mkdir -p apps/web/components/funnel
   mkdir -p apps/web/lib
   mkdir -p apps/worker/src/agents
   mkdir -p packages/types
   mkdir -p packages/city-vibes-db
   mkdir -p supabase/migrations
   mkdir -p docs/spec
   mkdir -p docs/review
   mkdir -p docs/deploy

4. apps/worker/package.json 생성 후 npm install
   dependencies: hono, @anthropic-ai/sdk, @supabase/supabase-js
   devDependencies: wrangler, typescript, @cloudflare/workers-types

5. apps/web/package.json 생성 후 npm install
   dependencies: next, react, react-dom, @supabase/supabase-js
   devDependencies: typescript, tailwindcss, @types/react

6. apps/worker/wrangler.toml 생성
   name = "travel-capsule-worker"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"
   [vars] 섹션: SUPABASE_URL, R2_BUCKET_NAME, R2_PUBLIC_URL, POLAR_PRODUCT_ID_STANDARD, POLAR_PRODUCT_ID_PRO, POLAR_PRODUCT_ID_ANNUAL

7. git init && git add . && git commit -m "init: project structure"

완료 후 tree 명령어로 폴더 구조 확인해줘.
```

**✅ 완료 확인:** 폴더 트리 출력 + init 커밋 확인

---

---

## 📋 STEP 2 — 기획 문서 생성

**언제:** STEP 1 완료 후
**소요 시간:** 약 8~12분
**모델:** /model opus 로 전환 후 실행

---

```
/model opus

CLAUDE.md를 읽고 Travel Capsule AI 기획 문서 3개를 작성해줘.

--- 파일 1: docs/spec/product-spec.md ---

Travel Capsule AI 제품 스펙. 아래 내용 전부 포함:

1. 전체 퍼널 플로우 (7단계)
   입력 → Free 리워드 → 이메일 캡처 → 페이월 → 결제 → Post-결제 업셀 → 결과+공유
   각 단계별: 사용자 행동 / 보여주는 UI / 이탈 위험 포인트 / 대응 전략

2. Free 경험 4가지 상세 스펙
   a) 날씨 리포트 카드 (도시별): 주간/야간 온도 범위, 강수 확률, 일교차 경고, 1-2줄 스타일 힌트
   b) 시티 바이브 카드: 바이브 태그 3개, 컬러 팔레트 3-5색, "피해야 할 것" 1줄
   c) 캡슐 카운트 추정기: "{9-11} items로 커버 가능" + 레이어링 3원칙 (풀 리스트 비공개)
   d) 티저 이미지 (2x2): 실제 생성 1장 선명 + 동일 이미지 블러+색조 변형 3장, 워터마크 필수
      → 첫 번째 도시만 적용 (비용 최소화)

3. 전환 심리 장치
   - Progress 체크리스트:
     ✅ Weather analyzed for {cities}
     ✅ City vibe matched — {MoodName}
     ✅ 4 looks generated (1 unlocked)
     🔒 Full capsule ({N} items) + Day-by-day plan — Unlock to see
   - 무드 네이밍 시스템: climateAgent + styleAgent 결과 → "{City} — {MoodName}" 생성
     예: "Paris — Rainy Chic", "Tokyo — Urban Minimal", "Bali — Coastal Ease"
   - 결과 만료: 티저 이미지 R2 temp 경로 48시간 TTL, UI에 "Your looks expire in 48h" 표시
   - 이메일 캡처 타이밍: 티저 직후, "이메일로 무드 카드 전송" 마이크로 컨버전

4. 페이월 스펙
   플랜 3개:
   - Standard $5: 첫 도시 선명 이미지 4장 (블러 해제), 캡슐 리스트, 데일리 플랜
   - Pro $12: 전체 도시 히어로 이미지 포함 4~6장 실제 생성, 고화질, 1회 재생성
   - Annual $29/년: 연 12회 (월 1회) 제한, Pro 혜택 전체 포함, "For the traveler who never stops — $2.42/month"
   강조 언어: "moods" / "looks" / "{City} — {MoodName}" (image count 언급 최소화)
   CTA: "Unlock Your {City} Looks" (도시명 동적 삽입)

5. Post-결제 업셀 스펙
   Standard 결제 완료 직후 3분 이내 팝업:
   "Pro로 업그레이드 — 지금 $7 추가하면 전체 도시 히어로 이미지 + 고화질 + 재생성 1회"
   원클릭 결제 (Polar upgrade flow)
   DB orders 테이블에 upgrade_from 필드 필요

6. 공유 루프 스펙
   결과 페이지 → "내 {City} {MoodName} 무드 보기" 공유 링크 생성
   공유 링크 랜딩: Teaser와 동일 구조 (1장 선명 + 3장 블러) + "나도 만들기" CTA
   UTM: utm_source=share&utm_medium=direct&utm_campaign={moodName}

7. API 엔드포인트 전체 목록
   GET  /api/health
   POST /api/preview          — Free 경험 생성 (날씨+바이브+카운트+티저)
   POST /api/preview/email    — 이메일 캡처 + 무드 카드 전송
   POST /api/payment/checkout — Polar checkout session 생성
   POST /api/payment/webhook  — Polar webhook (HMAC 검증 필수)
   POST /api/payment/upgrade  — Standard → Pro 업그레이드
   GET  /api/result/:tripId   — 결제 완료 후 전체 결과
   GET  /api/share/:tripId    — 공유 페이지 데이터
   각 엔드포인트: method, request body, response, 에러 케이스 명시

8. Rate Limit & Abuse Prevention
   - Cloudflare Turnstile 토큰: /api/preview 호출 시 필수 검증
   - IP + session_id 조합: 동일 IP 하루 5회 Free 생성 제한
   - Annual 플랜: usage_count 필드로 연간 12회 카운트, 초과 시 결제 유도
   - 날씨/바이브 데이터: city+month 키로 24시간 캐싱 (Supabase 또는 KV)

--- 파일 2: docs/spec/tech-spec.md ---

기술 설계 문서:

1. Worker 라우팅 구조 (Hono)
2. Agent 인터페이스 전체
   각 Agent input/output/error 타입 명시:
   - weatherAgent: city+lat+lon+month → WeatherResult
   - vibeAgent: city+weatherResult → VibeResult (Claude API)
   - teaserAgent: vibeResult+faceUrl → TeaserResult (NanoBanana, 1장 생성)
   - styleAgent: vibeResult+climate → StylePrompts (Claude API, Pro용)
   - imageGenAgent: stylePrompts → GeneratedImages (NanoBanana, 4-6장, Pro용)
   - capsuleAgent: vibeResult+stylePrompts → CapsuleResult (Claude API)
   - fulfillmentAgent: tripId+results → 이메일 발송 + R2 저장
   - growthAgent: tripId+moodName → 공유 링크 + UTM 카피
   - orchestrator: 모든 agent 조율

3. TypeScript 타입 전체 (packages/types/index.ts)
   PlanType = "standard" | "pro" | "annual"
   TripInput, WeatherResult, VibeResult, TeaserResult, CapsuleResult,
   OrderResult, ShareResult, UsageRecord 포함

4. DB 스키마 설계
   trips: id, session_id, cities(JSONB), month, face_url, status, expires_at, created_at
   orders: id, polar_order_id(UNIQUE), trip_id(FK), plan(PlanType), amount, upgrade_from, status, created_at
   generation_jobs: id, trip_id(FK), city, job_type("teaser"/"full"), prompt, status, image_url, attempts, created_at
   capsule_results: id, trip_id(FK), items(JSONB), daily_plan(JSONB), created_at
   city_vibes: id, city, country, lat, lon, vibe_cluster, style_keywords(JSONB)
   weather_cache: id, city, month, data(JSONB), cached_at (24시간 TTL)
   email_captures: id, trip_id(FK), email, captured_at
   usage_records: id, user_email, plan("annual"), trip_count, period_start, period_end

5. Supabase RLS 정책
   각 테이블 anon/service_role 권한 명시

6. R2 파일 경로 컨벤션
   temp/{session_id}/face.jpg          ← 원본 사진 (48시간 TTL)
   temp/{trip_id}/teaser.webp          ← 티저 이미지 (48시간 TTL)
   outputs/{trip_id}/{city}/{index}.webp ← 결제 후 최종 이미지 (영구)

7. Cloudflare Turnstile 검증 흐름
   Frontend: <script src="https://challenges.cloudflare.com/turnstile/v0/api.js">
   Widget: data-sitekey={NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}
   Worker: POST https://challenges.cloudflare.com/turnstile/v0/siteverify 로 토큰 검증

--- 파일 3: docs/spec/design-spec.md ---

디자인 시스템 (Stitch 확정 가이드라인):

1. 컬러 시스템 (Tailwind config)
   primary: "#b8552e"    ← CTA, 강조
   secondary: "#1A1410"  ← 텍스트, 다크 배경
   cream: "#FDF8F3"      ← 메인 배경
   sand: "#F5EFE6"       ← 보조 배경
   gold: "#D4AF37"       ← 별점, 액센트
   weatherBlue: "#E0F2FE" ← 날씨 UI

2. 타이포그래피
   serif: ["Playfair Display", "serif"]    ← 헤딩, 이탤릭 강조
   sans: ["Plus Jakarta Sans", "sans-serif"] ← 바디, UI
   Google Fonts: Playfair Display (ital,wght 0,400;0,500;0,700;1,400) + Plus Jakarta Sans (400;500;600;700)
   Material Symbols Outlined (아이콘)

3. 섹션별 배경색 패턴
   Header: bg-cream/95 backdrop-blur-sm border-b border-sand
   Hero: bg-secondary grain-overlay
   Features: bg-cream
   How it Works: bg-sand
   Testimonial: bg-white border-y border-sand
   CTA: bg-secondary
   Footer: bg-white border-t border-sand

4. grain-overlay CSS
   .grain-overlay { position: relative; }
   .grain-overlay::before {
     content: ""; position: absolute; inset: 0;
     background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
     pointer-events: none; z-index: 1;
   }
   .editorial-text { font-family: 'Playfair Display', serif; }

5. 컴포넌트 스펙 (Tailwind 클래스 명시)
   Button primary: bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all
   Button ghost: bg-transparent border border-white/30 hover:border-white text-white rounded-lg
   Card: p-8 rounded-2xl bg-white border border-sand hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all group
   ImageCard visible: rounded-xl overflow-hidden shadow-md
   ImageCard blurred: filter blur-sm + absolute inset-0 bg-black/20 + lock icon (material symbols)
   ImageCard skeleton: animate-pulse bg-gray-200 rounded-xl aspect-square
   WeatherWidget: w-48 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/20
   Badge weather: px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white backdrop-blur-md border border-white/10
   Badge city: px-3 py-1 rounded-full bg-sand text-secondary text-xs font-medium
   ProgressChecklist: 각 항목 flex items-center gap-2 + checkmark(text-primary) or lock icon(text-secondary/40)

6. Funnel 전용 컴포넌트 (apps/web/components/funnel/)
   ProgressChecklist.tsx — 4단계 체크리스트
   WeatherCard.tsx       — 도시별 날씨 리포트
   VibeCard.tsx          — 바이브 태그 + 컬러 팔레트
   CapsuleEstimator.tsx  — 아이템 수 추정 + 3원칙
   TeaserGrid.tsx        — 2x2 이미지 그리드 (1선명+3블러)
   EmailCapture.tsx      — 이메일 입력 + 전송 버튼
   PaywallModal.tsx      — 3개 플랜 비교 + CTA
   UpgradeModal.tsx      — Standard→Pro 업셀 팝업

7. 카피 가이드 (EN/KR)
   섹션 레이블: text-primary font-bold tracking-wider text-sm uppercase
   헤드라인: editorial-text italic (이탤릭 강조 부분에 text-gold)
   Free 리워드 카피:
     EN: "Your {City} — {MoodName} is ready to unlock"
     KR: "{City}의 {무드명} 스타일이 잠금 해제를 기다리고 있어요"
   CTA:
     EN: "Unlock Your {City} Looks" / "Start My $5 Plan"
     KR: "{City} 룩 잠금 해제하기" / "$5로 시작하기"
   Annual:
     EN: "For the traveler who never stops — $2.42/month"
     KR: "멈추지 않는 여행자를 위해 — 월 $2.42"
   만료:
     EN: "Your looks expire in 48 hours"
     KR: "48시간 후 만료됩니다"

3개 파일 완료 후 docs/spec/ ls 확인해줘.
```

**✅ 완료 확인:** `docs/spec/`에 3개 파일 생성

---

---

## 📋 STEP 3-A — DB + Backend 개발 (Agent Teams)

**언제:** STEP 2 완료 후
**소요 시간:** 약 15~25분

---

```
CLAUDE.md와 docs/spec/tech-spec.md를 읽어줘.

Agent Teams 생성:
팀 이름: dev-backend
delegate mode 활성화

teammate 2명:

=== Teammate 1: DB Engineer (model: sonnet) ===
담당: supabase/migrations/, packages/city-vibes-db/

작업:
1. supabase/migrations/001_initial_schema.sql
   tech-spec.md의 DB 스키마 설계 섹션 그대로 구현.
   테이블 8개: trips, orders, generation_jobs, capsule_results, city_vibes, weather_cache, email_captures, usage_records
   - trips에 expires_at 컬럼 포함 (타임스탬프, 48시간 TTL 관리용)
   - orders에 upgrade_from 컬럼 포함 (Standard→Pro 업셀 추적)
   - usage_records: user_email, plan, trip_count, period_start, period_end
   - weather_cache: city+month UNIQUE 제약, cached_at 인덱스
   - 모든 테이블 RLS 활성화
     service_role: 전체 권한
     anon: trips INSERT/SELECT, email_captures INSERT, 나머지 SELECT만

2. packages/city-vibes-db/cities.json
   30개 도시, 각 도시:
   { city, country, lat, lon, vibe_cluster, style_keywords[], mood_name }
   mood_name 예시: "Paris → Rainy Chic", "Tokyo → Urban Minimal", "Bali → Coastal Ease",
   "New York → Street Edge", "Barcelona → Sun-Soaked Bold", "London → Understated Layer",
   "Rome → Golden Hour", "Seoul → Clean Contemporary", "Sydney → Easy Coastal",
   "Dubai → Desert Luxe", "Amsterdam → Bicycle Chic", "Lisbon → Faded Pastel",
   "Prague → Dark Academia", "Marrakech → Spice Market", "Kyoto → Wabi-Sabi"
   나머지 15개 도시도 동일 패턴으로 작성

3. feature/db 브랜치 커밋: "feat: schema with funnel tables and city mood names"
4. Backend Engineer에게 메시지: "DB ready. Schema includes usage_records and weather_cache."

=== Teammate 2: Backend Engineer (model: sonnet) ===
담당: apps/worker/src/
규칙: process.env 절대 금지 → c.env 또는 env 파라미터

작업:
1. packages/types/index.ts
   타입: PlanType, TripInput, WeatherResult, VibeResult, TeaserResult,
   CapsuleResult, StylePrompts, GeneratedImages, OrderResult, ShareResult,
   UsageRecord, EmailCapture

2. apps/worker/src/index.ts — Hono 라우터 + Bindings 타입 (21개 변수 포함)
   라우트 전체:
   GET  /api/health
   POST /api/preview          ← Turnstile 토큰 검증 필수
   POST /api/preview/email    ← 이메일 캡처 + Resend 발송
   POST /api/payment/checkout ← Polar checkout session 생성 (플랜별 3개 product ID)
   POST /api/payment/webhook  ← HMAC-SHA256 검증 필수
   POST /api/payment/upgrade  ← Standard → Pro 업그레이드
   GET  /api/result/:tripId
   GET  /api/share/:tripId

3. apps/worker/src/agents/weatherAgent.ts
   - Open-Meteo API: https://archive-api.open-meteo.com/v1/archive
   - city+lat+lon+month 기반 기후 분석
   - weather_cache 테이블 확인 → 캐시 히트 시 DB 반환, 미스 시 API 호출 후 저장
   - 반환: temperature_day_avg, temperature_night_avg, precipitation_prob, diurnal_swing, climate_band("cold"/"cool"/"mild"/"warm"/"hot"), style_hint(1-2줄 영문)

4. apps/worker/src/agents/vibeAgent.ts
   - Claude API (claude-sonnet-4-6) 호출
   - weatherResult + city + vibe_cluster → VibeResult
   - 반환: vibe_tags(3개), color_palette(hex 3-5개), avoid_note(1줄), mood_name(예: "Rainy Chic")

5. apps/worker/src/agents/teaserAgent.ts
   - Free용 이미지 생성 (비용 최소화)
   - NanoBanana API 1회 호출 (첫 번째 도시만)
   - face_url 있으면 face_strength: 0.82 적용
   - 생성된 이미지 R2 temp/{trip_id}/teaser.webp 저장
   - 나머지 3장: 동일 이미지 URL에 ?blur=1&tint={hex} 쿼리 파라미터로 변형 표현
     (실제 이미지 3장 추가 생성 안 함, 프론트에서 CSS blur + tint overlay 처리)
   - 반환: teaser_url(선명 1장), watermark: true, expires_at(48시간 후 ISO)

6. apps/worker/src/agents/capsuleAgent.ts
   - Claude API 호출
   - vibeResult + weatherResult → 캡슐 카운트 추정 (Free용: 숫자 + 3원칙만)
   - 결제 후 Full: 8-12개 아이템 리스트 + 데일리 플랜 생성

7. apps/worker/src/agents/styleAgent.ts (Pro용)
   - Claude API로 vibeResult + climate → NanoBanana 프롬프트 4-6개 생성
   - 영어, 구체적 의류 묘사

8. apps/worker/src/agents/imageGenAgent.ts (Pro용)
   - NanoBanana API 다중 호출
   - 실패 시 3회 재시도 (exponential backoff)
   - 생성 이미지 R2 outputs/{trip_id}/{city}/{index}.webp 저장

9. apps/worker/src/agents/fulfillmentAgent.ts
   - 결제 완료 후 최종 이미지 R2에 저장
   - Resend로 갤러리 링크 이메일 발송
   - R2 temp 파일 삭제 (프라이버시)

10. apps/worker/src/agents/growthAgent.ts
    - 공유 링크 생성: /share/{tripId}?utm_source=share&utm_medium=direct&utm_campaign={moodName}
    - 소셜 카피 생성 (인스타, 트위터, 카카오)
    - Standard→Pro 업셀용 upgrade_token 생성 (결제 직후 3분 유효)

11. apps/worker/src/agents/orchestrator.ts
    - /api/preview 흐름: weatherAgent → vibeAgent → teaserAgent → capsuleAgent(free) → 결과 반환
    - /api/result 흐름: styleAgent → imageGenAgent → capsuleAgent(full) → fulfillmentAgent → growthAgent
    - generation_jobs 상태 업데이트
    - usage_records 카운트 증가 (Annual 플랜 12회 체크)
    - Annual 12회 초과 시 429 + "Annual limit reached" 반환

12. Cloudflare Turnstile 검증 미들웨어
    /api/preview 라우트에 적용:
    request body의 cf_turnstile_token 추출
    POST https://challenges.cloudflare.com/turnstile/v0/siteverify 로 검증
    실패 시 403 반환

13. Rate limiting 미들웨어
    IP + 하루 5회 Free 생성 제한
    Supabase preview_requests 임시 카운팅 또는 Workers KV 사용

14. feature/worker 브랜치 커밋: "feat: full worker with funnel agents and rate limiting"

두 teammate 완료 후 dev에 merge.
```

**✅ 완료 확인:** `apps/worker/src/agents/`에 9개 파일, SQL에 8개 테이블

---

---

## 📋 STEP 3-B — Frontend + UI 개발 (Agent Teams)

**언제:** STEP 3-A 완료 후
**소요 시간:** 약 20~30분

---

```
CLAUDE.md와 docs/spec/design-spec.md, docs/spec/product-spec.md를 읽어줘.
apps/worker/src/index.ts의 API 엔드포인트도 확인해줘.

Agent Teams 생성:
팀 이름: dev-frontend
delegate mode 활성화

teammate 2명:

=== Teammate 1: UI Engineer (model: sonnet) ===
담당: apps/web/app/globals.css, apps/web/components/ui/, apps/web/components/funnel/, tailwind.config.ts

작업:
1. tailwind.config.ts
   darkMode: "class"
   colors: primary "#b8552e", secondary "#1A1410", cream "#FDF8F3", sand "#F5EFE6", gold "#D4AF37", weatherBlue "#E0F2FE"
   fontFamily: sans ["Plus Jakarta Sans","sans-serif"], serif ["Playfair Display","serif"]

2. apps/web/app/globals.css
   Google Fonts import (Playfair Display + Plus Jakarta Sans + Material Symbols Outlined)
   .grain-overlay + ::before (design-spec 그대로)
   .editorial-text 클래스
   body: font-sans antialiased text-secondary bg-cream

3. apps/web/components/ui/ — 기본 컴포넌트
   Button.tsx: variant(primary/ghost/secondary) + size(sm/md/lg/xl) + loading + disabled
   Card.tsx: 기본 + hover lift
   Input.tsx: focus(primary border) + error 상태
   ImageCard.tsx: visible/blurred(CSS blur+lock icon)/skeleton
   Badge.tsx: weather/city/vibe 배리언트
   WeatherWidget.tsx: floating 날씨 카드

4. apps/web/components/funnel/ — 퍼널 전용 컴포넌트

   ProgressChecklist.tsx:
   4단계 체크리스트, 각 항목:
   - ✅ Weather analyzed for {cities} (완료)
   - ✅ City vibe matched — {MoodName} (완료, italic text-gold으로 MoodName 강조)
   - ✅ 4 looks generated (1 unlocked) (완료)
   - 🔒 Full capsule ({N} items) + Day-by-day plan (잠김, text-secondary/40)
   Props: cities[], moodName, itemCount, isLocked

   WeatherCard.tsx:
   도시별 날씨 카드. bg-white rounded-2xl border border-sand p-6
   - 도시명 + 국가 (editorial-text)
   - 주간/야간 온도 (크게)
   - 강수 확률 바 (weatherBlue 배경)
   - 일교차 경고 (있을 때만, warning 색상)
   - 스타일 힌트 (italic, text-secondary/70)
   Props: city, country, weather(WeatherResult)

   VibeCard.tsx:
   바이브 카드. bg-secondary text-cream rounded-2xl p-6
   - MoodName (editorial-text italic text-gold text-2xl)
   - 바이브 태그 3개 (Badge weather 변형)
   - 컬러 팔레트: 각 색상 w-8 h-8 rounded-full 원형 배치
   - "Avoid" 노트 (text-cream/60 text-sm)
   Props: city, vibeResult(VibeResult)

   CapsuleEstimator.tsx:
   캡슐 추정기. bg-sand rounded-2xl p-6
   - "{N} items can cover your entire trip" (editorial-text text-3xl)
   - 3원칙 체크리스트 (레이어링 / 뉴트럴 베이스 / 신발 전략)
   - 하단: "Full list unlocked after payment" (text-secondary/40 text-sm)
   Props: itemCount, principles[]

   TeaserGrid.tsx:
   2x2 이미지 그리드
   - [0]: 선명 이미지 (teaser_url) + "UNLOCKED" 배지
   - [1][2][3]: 동일 URL + CSS blur(8px) + tint overlay + lock icon 중앙
   - 우상단: "WATERMARKED PREVIEW" 뱃지
   - 하단: "3 more looks waiting — Unlock now" CTA 영역 (회색, 결제 버튼으로 이어짐)
   - 만료 타이머: "Expires in {HH:MM:SS}" (실시간 카운트다운, expires_at 기준)
   Props: teaserUrl, expiresAt, onUnlock()

   EmailCapture.tsx:
   이메일 캡처 카드. bg-white border border-sand rounded-2xl p-6
   - 제목: "Get your mood card by email"
   - 서브: "We'll send your {City} — {MoodName} vibe summary"
   - Input + "Send" 버튼 (primary)
   - 성공 시: "Sent! Check your inbox" (green)
   - 이메일 전송 후 결제 CTA 자연스럽게 강조
   Props: city, moodName, tripId, onSuccess()

   PaywallModal.tsx:
   모달 (fixed inset-0 bg-black/50 backdrop-blur-sm)
   내부: max-w-lg mx-auto bg-cream rounded-3xl p-8
   - 제목: "Unlock Your {City} Looks" (editorial-text)
   - 서브: "Your {MoodName} capsule is ready"
   - 플랜 3개 카드:
     Standard $5: 테두리 card, "Full mood set · Capsule list · Day plan"
     Pro $12: bg-primary text-white card (recommended), "+ Hero images · Hi-res · 1 retry"
     Annual $29/yr: card, "12 trips/year · $2.42/month · Pro benefits"
   - 각 플랜 CTA: "Get Standard" / "Get Pro (Best Value)" / "Go Annual"
   - 소인: "No subscription · Secure payment via Polar"
   Props: city, moodName, itemCount, tripId, onClose()

   UpgradeModal.tsx:
   Standard 결제 완료 직후 팝업 (3분 타이머)
   - "Want the full picture?"
   - "Upgrade to Pro now — just $7 more"
   - 혜택 3줄 체크리스트
   - "Upgrade for $7" (primary) / "No thanks, Standard is fine" (ghost)
   - 상단 우측: {MM:SS} 카운트다운 타이머
   Props: tripId, upgradeToken, onUpgrade(), onDecline()

5. feature/design-system 브랜치 커밋: "feat: design system + funnel components"
6. Frontend Engineer에게 메시지: "All components ready. You can start."

=== Teammate 2: Frontend Engineer (model: sonnet) ===
담당: apps/web/app/, apps/web/lib/
규칙: NEXT_PUBLIC_ 변수만 클라이언트, Worker URL로 API 호출

작업:
1. apps/web/lib/supabase.ts — anon key 클라이언트
2. apps/web/lib/api.ts — Worker API 호출 함수 전체
   previewApi(input): POST /api/preview (Turnstile 토큰 포함)
   emailCaptureApi(tripId, email): POST /api/preview/email
   checkoutApi(tripId, plan): POST /api/payment/checkout
   upgradeApi(tripId, upgradeToken): POST /api/payment/upgrade
   resultApi(tripId): GET /api/result/:tripId
   shareApi(tripId): GET /api/share/:tripId
3. apps/web/lib/turnstile.ts — Turnstile 토큰 발급 헬퍼

4. apps/web/app/layout.tsx
   Google Fonts <link> 태그 + Material Symbols
   Header 컴포넌트 (sticky, cream/95, blur)
   Turnstile 스크립트 로드

5. apps/web/app/page.tsx — 랜딩 페이지
   [Header] sticky bg-cream/95 backdrop-blur-sm border-b border-sand
     로고: material-symbols "cloudy_snowing" + "Travel Capsule AI" editorial-text
     네비: How it Works / Features / Pricing (text-secondary/80 hover:text-primary)
     CTA: "Start My $5 Plan" (bg-primary)

   [Hero] bg-secondary grain-overlay min-h-[600px]
     pill badge: "Stop guessing. Start wearing."
     헤드라인: "The End of Travel Weather Guesswork." (editorial-text text-5xl md:text-7xl)
     이탤릭 강조: italic text-gold
     서브: "Know exactly what to wear, from Tokyo to Paris."
     CTA: "Get Your Capsule" + arrow_forward / "See Weather Demo" (ghost)
     우측: outfit 이미지 카드 + floating WeatherWidget

   [Features] py-24 bg-cream
     레이블: "Smart Travel Features" (primary uppercase)
     헤딩: "Data-Driven Style Decisions" (editorial-text)
     3개 Feature Card (group hover):
       1) Precision Weather Mapping — ssid_chart, blue
       2) The 10-Item Blueprint — grid_view, orange
       3) Wear-It-Now Daily Guide — event_note, green

   [HowItWorks] py-24 bg-sand
     헤더: 제목 왼쪽 + "View sample" 링크 우측
     3단계: 입력 → 스타일 정의 → 캡슐 수령
     각 단계: aspect-video 이미지 + 번호 뱃지 + 설명

   [Testimonial] py-20 bg-white border-y border-sand
     별점 5개 (text-gold)
     인용문 editorial-text
     프로필 사진 + 이름/여행 정보

   [CTA] py-24 bg-secondary
     헤드라인: "Never Check the Weather App Again." (editorial-text text-cream)
     CTA: "Start My $5 Plan" + luggage 아이콘
     소인: "No subscription required. One-time payment."

   [Footer] bg-white py-12 border-t border-sand

6. apps/web/app/trip/page.tsx — 여행 폼 (3단계)
   ProgressChecklist 상단 표시 (1단계: 입력 중)
   Turnstile 위젯 포함 (폼 하단)
   Step 1: 도시 추가 (최대 5개, Google Places 자동완성) + 여행 월 선택
   Step 2: 사진 업로드 또는 "Use anonymous traveler" 스킵
   Step 3: 요약 확인 → "Analyze My Trip" 버튼 (Turnstile 토큰 함께 전송)
   제출 후 /preview/{tripId} 리다이렉트

7. apps/web/app/preview/[tripId]/page.tsx — 무료 리워드 + 페이월
   상단: ProgressChecklist (3단계 완료, 4단계 잠김)
   좌측 컬럼:
     WeatherCard × 도시 수
     VibeCard × 도시 수
   우측 컬럼:
     TeaserGrid (2x2, 만료 타이머 포함)
     CapsuleEstimator
     EmailCapture (이메일 전송 후 PaywallModal CTA 강조)
   하단 고정 바:
     "Your {City} — {MoodName} is ready to unlock"
     "Unlock Full Looks" 버튼 (primary, PaywallModal 트리거)
   PaywallModal (상태로 관리, 버튼 클릭 시 표시)

8. apps/web/app/result/[tripId]/page.tsx — 결제 후 결과 갤러리
   최초 렌더: UpgradeModal 표시 (Standard → Pro, 3분 타이머)
   도시 탭 (여러 도시)
   이미지 2x2 그리드 (선명, 전체 공개)
   캡슐 워드로브 목록 (8-12개)
   데일리 아웃핏 플랜 (캘린더형)
   공유 섹션: "{City} {MoodName} 무드 공유하기" + 링크 복사 + 소셜 아이콘
   "다른 여행 스타일링 시작" CTA (랜딩 페이지로)

9. apps/web/app/share/[tripId]/page.tsx — 공유 페이지
   OG 메타태그 (city, moodName, teaser 이미지)
   TeaserGrid (1선명 + 3블러) — 방문자용
   "{Name}의 {City} — {MoodName} 무드" 제목
   "나도 내 여행 룩 만들기" CTA (랜딩 페이지로, UTM 포함)

10. apps/web/next.config.js — Cloudflare Pages 설정

11. feature/web 브랜치 커밋: "feat: full funnel pages with free rewards and paywall"

두 teammate 완료 후 dev에 merge.
git log --oneline 출력.
```

**✅ 완료 확인:** `apps/web/components/funnel/`에 8개 파일, `apps/web/app/`에 4개 페이지 디렉토리

---

---

## 📋 STEP 4 — 보안 및 품질 검토 (Agent Teams)

**언제:** STEP 3-A + 3-B 완료 후
**소요 시간:** 약 10~15분

---

```
CLAUDE.md를 읽고 전체 코드 보안 및 품질 검토를 해줘.

Agent Teams 생성:
팀 이름: review
delegate mode 활성화

teammate 3명:

=== Teammate 1: Security Auditor (model: opus) ===
검토 항목:
1. 하드코딩된 API 키 전체 파일 검색 → CRITICAL
2. apps/worker/에서 process.env 사용 → CRITICAL
3. apps/web/에서 SUPABASE_SERVICE_ROLE_KEY 노출 → CRITICAL
4. NEXT_PUBLIC_ 변수에 비밀키 → CRITICAL
5. Polar webhook HMAC-SHA256 검증 코드 존재 → CRITICAL
6. Cloudflare Turnstile 검증 미들웨어 존재 → CRITICAL
7. .env.local이 .gitignore에 포함 → CRITICAL
8. usage_records Annual 12회 초과 처리 로직 → CRITICAL
9. R2 temp 파일 48시간 TTL 삭제 로직 → WARNING
10. RLS 정책 모든 테이블 적용 → WARNING
11. 이미지 생성 후 원본 사진 삭제 → WARNING
출력: docs/review/security-report.md

=== Teammate 2: QA Engineer (model: sonnet) ===
검토 항목:
1. API 엔드포인트 전체 목록 (product-spec.md 대조)
2. 누락된 에러 핸들링 (API 타임아웃/결제 실패/이미지 3회 실패)
3. ProgressChecklist 4단계 상태 정확히 반영 여부
4. TeaserGrid 2x2 구현 (1선명+3블러) 확인
5. EmailCapture → PaywallModal 연결 흐름
6. UpgradeModal 3분 타이머 작동 여부
7. Annual 12회 카운팅 로직 (usage_records)
8. 공유 링크 UTM 파라미터 포함 여부
9. 만료 타이머 카운트다운 실시간 작동 여부
10. 모바일 레이아웃 (320px) 구현 여부
출력: docs/review/qa-report.md

=== Teammate 3: Performance Auditor (model: sonnet) ===
검토 항목:
1. weather_cache 캐싱 로직 작동 여부 (중복 API 호출 방지)
2. teaserAgent 1장만 실제 생성 (추가 3장 CSS 처리) 확인
3. next/image 사용 여부
4. Cloudflare Cache-Control 헤더 설정 (Worker 응답)
5. 스켈레톤 로딩 구현 여부
6. 번들 크기 과도한 라이브러리 확인
출력: docs/review/performance-report.md

=== 팀 리드 ===
docs/review/final-review.md 작성:
CRITICAL 총 개수 / WARNING 총 개수 / 배포 가능 여부 (CRITICAL 0개만 "배포 가능")
CRITICAL 있으면 수정 필요 항목 목록 출력
```

**✅ 완료 확인:** `final-review.md`에서 CRITICAL 0개 확인 후 STEP 5 진행

### CRITICAL 수정 프롬프트 (필요 시만)
```
docs/review/final-review.md를 읽고 CRITICAL 항목 전부 수정해줘.
수정 후 각 항목 재검증 → docs/review/fix-report.md 작성.
완료 후 git commit -m "fix: resolve all critical issues"
```

---

---

## 📋 STEP 5 — 배포

**언제:** STEP 4 CRITICAL 0개 확인 후만
**소요 시간:** 약 5~10분

---

```
CLAUDE.md와 docs/review/final-review.md를 읽어줘.
CRITICAL 항목 있으면 즉시 중단하고 알려줘.
CRITICAL 0개 확인 후 순서대로 실행:

1. dev → main merge + 태그
   git checkout main && git merge dev
   git tag v1.0.0 -m "Travel Capsule AI v1.0.0 — Free→Paid Funnel Launch"

2. GitHub push
   git push origin main && git push origin --tags

3. Worker 배포
   cd apps/worker && npx wrangler deploy
   배포 URL 출력

4. Worker secrets 설정 확인
   아래 secrets가 wrangler secret put으로 등록됐는지 확인 (없으면 안내):
   ANTHROPIC_API_KEY, NANOBANANA_API_KEY, POLAR_ACCESS_TOKEN,
   POLAR_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY,
   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
   RESEND_API_KEY, GOOGLE_PLACES_API_KEY, CLOUDFLARE_TURNSTILE_SECRET_KEY

5. 헬스 체크
   curl https://travel-capsule-worker.workers.dev/api/health

6. docs/deploy/launch-summary.md 작성
   Worker URL / Pages URL / 배포 시각
   v1.0.0 포함 기능: Free 리워드 퍼널 / 3단계 가격 플랜 / 이메일 캡처 / 공유 루프 / Annual 12회 제한
   알려진 제한: Turnstile 로컬 테스트 불가 (프로덕션에서만 동작)
   v1.1 예정: A/B 테스트 ($5 vs $5.99) / 결과 페이지 PDF 다운로드 / 다국어 지원

7. git log --oneline -10 출력
```

**✅ 완료 확인:** Worker 헬스 체크 `{"ok": true}` + Pages 자동 배포 완료

---

---

## 📊 전체 순서 한눈에

```
사전 준비 (터미널)
    ↓
STEP 1: 초기 세팅                  [3~5분]   단일 세션
    ↓
STEP 2: 기획 문서 (/model opus)    [8~12분]  단일 세션 (Opus)
    ↓
STEP 3-A: DB + Backend            [15~25분] Agent Teams 2명
    ↓ (완료 확인)
STEP 3-B: Frontend + UI           [20~30분] Agent Teams 2명
    ↓ (완료 확인)
STEP 4: 보안/QA/성능 검토          [10~15분] Agent Teams 3명
    ↓ (CRITICAL 0개 확인)
STEP 5: 배포                      [5~10분]  단일 세션
    ↓
🚀 Travel Capsule AI v1.0 런칭
```

---

## ⚠️ 주의사항

1. 각 STEP 완료 확인 후 다음 실행 (건너뛰기 금지)
2. STEP 3-A 완료 후 STEP 3-B 실행 (Backend API 의존성)
3. CRITICAL 있으면 STEP 5 절대 실행 금지
4. Annual 12회 제한은 반드시 서버사이드 (usage_records) 에서 검증 — 프론트 단독 검증 금지
5. Turnstile은 로컬에서 동작 안 함 → 로컬 테스트 시 SKIP_TURNSTILE=true 환경변수로 우회 처리
6. R2 temp 파일 TTL은 Cloudflare R2 Lifecycle Rule로 설정 (코드가 아닌 대시보드에서)
