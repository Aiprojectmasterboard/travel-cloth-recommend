# Travel Capsule AI — CLAUDE.md

> Claude Code가 이 파일을 먼저 읽고 프로젝트 컨텍스트를 파악합니다.
> 코딩 시작 전 반드시 전체 읽기.

---

## 제품 개요

**TravelCapsule.com** — AI 여행 스타일링 서비스 (글로벌 런칭 타겟)

사용자가 도시 + 여행 일자 + 사진(선택) 입력 →
AI가 날씨·도시 바이브 분석 → 무드 네이밍 → 티저 이미지 생성 →
결제 후 전체 코디 이미지 + 캡슐 워드로브 + 데일리 플랜 제공

**핵심 원칙:** Free는 충분히 가치 있게 느껴지되, 진짜 payoff는 결제 후에만 공개.

---

## 가격 플랜 (현재 라이브)

| 플랜 | 가격 | 내용 | 제한 |
|------|------|------|------|
| Standard | ~~Free~~ **DEPRECATED** | Pro로 리다이렉트 (`polarCheckout.ts` getDashboardRoute) | DB에는 존재하나 실질적 미사용 |
| Pro | $3.99 (일회성) | 도시당 4개 AI 코디 (2x2 그리드), Ultra Hi-Res, 1회 재생성, 최대 3개 도시 | 없음 |
| Annual | $9.99/년 (구독) | Pro 전체 + 연 12회 제한 + Priority AI + VIP Concierge + Style DNA | 서버사이드 12회 체크 필수 |

> Annual 12회 초과 시 → 429 반환 + 업그레이드 유도. 프론트 단독 검증 절대 금지.

---

## 기술 스택 (현재 라이브)

| 영역 | 기술 |
|------|------|
| Frontend | **Vite + React** (React Router v7, Tailwind CSS v4) → Cloudflare Pages |
| API | Cloudflare Workers (Hono) |
| DB | Supabase (Postgres + RLS) |
| Storage | Cloudflare R2 |
| 결제 | Polar (MoR) — Stripe 사용 금지 |
| 이미지 생성 | **OpenAI gpt-image-1.5** (OPENAI_API_KEY) + Identity Engine |
| AI (Vibe) | Claude API (claude-sonnet-4-6) — vibeDb 정적 조회 병행 |
| 기후 데이터 | Open-Meteo (무료, 가입 불필요) |
| 도시 검색 | 자체 city-vibes-db (90+ 도시, 한국어 alias 포함) |
| 이메일 | Resend |
| 봇 차단 | Cloudflare Turnstile |
| i18n | LanguageContext — `t("key.path")` 함수형 API (en/ko/ja/zh/fr/es) |

> **주의:** 프론트엔드는 `figma/` 디렉토리 (Vite+React). `apps/web/` (Next.js)은 레거시이며 배포하지 않음.

---

## 프로젝트 폴더 구조 (현재)

```
travel-cloth-recom/
├── figma/                            ← 현재 프론트엔드 (Vite + React)
│   ├── src/app/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       ← 랜딩
│   │   │   ├── OnboardingStep1.tsx   ← 도시 선택 + 날짜
│   │   │   ├── OnboardingStep2.tsx   ← 성별/체형/스타일
│   │   │   ├── OnboardingStep3.tsx   ← 사진 업로드(선택)
│   │   │   ├── OnboardingStep4.tsx   ← 최종 확인
│   │   │   ├── PreviewPage.tsx       ← Free 결과 + 페이월
│   │   │   ├── StandardDashboard.tsx ← Standard 플랜 대시보드
│   │   │   ├── ProDashboard.tsx      ← Pro 플랜 대시보드
│   │   │   ├── AnnualDashboard.tsx   ← Annual 플랜 대시보드
│   │   │   ├── SharePage.tsx         ← 공유 페이지
│   │   │   ├── MyPage.tsx            ← 마이페이지
│   │   │   ├── RootLayout.tsx        ← 최상위 (Providers + ErrorBoundary)
│   │   │   └── ExampleProPage.tsx, DemoProPage.tsx, ExampleAnnualPage.tsx
│   │   ├── components/
│   │   │   ├── ErrorBoundary.tsx     ← 에러 복구 UI
│   │   │   └── travel-capsule/       ← 공통 컴포넌트
│   │   ├── context/
│   │   │   ├── OnboardingContext.tsx  ← 4단계 온보딩 상태
│   │   │   ├── LanguageContext.tsx    ← i18n
│   │   │   ├── AuthContext.tsx        ← 로그인 상태
│   │   │   └── TripContext.tsx        ← 여행 데이터
│   │   ├── services/
│   │   │   ├── outfitGenerator.ts    ← 도시별 이미지 풀 + 아웃핏 생성
│   │   │   └── polarCheckout.ts      ← Polar 결제
│   │   ├── lib/
│   │   │   ├── api.ts                ← Worker API 호출
│   │   │   └── turnstile.ts          ← Cloudflare Turnstile
│   │   └── routes.ts                 ← React Router (lazy loading)
│   ├── public/
│   │   └── _redirects                ← SPA fallback (/* /index.html 200)
│   └── dist/                         ← 빌드 산출물
├── apps/
│   ├── web/                          ← [레거시] Next.js — 배포 안함
│   └── worker/
│       ├── src/
│       │   ├── index.ts              ← Hono 라우터
│       │   └── agents/
│       │       ├── orchestrator.ts   ← 파이프라인 오케스트레이터
│       │       ├── weatherAgent.ts
│       │       ├── vibeAgent.ts
│       │       ├── teaserAgent.ts    ← gpt-image-1.5 티저 이미지 + Identity Engine
│       │       ├── imageGenAgent.ts  ← gpt-image-1.5 풀 이미지 + Identity Engine
│       │       ├── capsuleAgent.ts
│       │       ├── fulfillmentAgent.ts
│       │       └── growthAgent.ts
│       └── wrangler.toml
├── packages/
│   └── city-vibes-db/cities.json     ← 90+ 도시 데이터
├── supabase/
│   └── migrations/
└── CLAUDE.md
```

---

## 배포 정보

| 항목 | 값 |
|------|---|
| 프론트엔드 도메인 | travel-cloth-recommend.pages.dev / travelscapsule.com |
| Worker URL | https://travel-capsule-worker.netson94.workers.dev |
| GitHub Repo | https://github.com/Aiprojectmasterboard/travel-cloth-recommend |
| CI/CD | main push → GitHub Actions → Pages + Worker 자동 배포 |
| GA4 | G-WDM6NTJZHW |
| 빌드 명령 | `cd figma && npm run build` → `figma/dist/` |

---

## 이미지 생성 파이프라인

```
[온보딩] 도시 + 사진(선택) 입력
    ↓
[POST /api/preview] → runPreview() → 즉시 응답 (날씨+바이브+폴백URL)
    ↓ waitUntil()
[runTeaserBackground] → teaserAgent → gpt-image-1.5 이미지 생성 → R2 저장
    ↓                     ↓ (실패 시)
    ↓               getCityFallbackImage(city, gender)
    ↓                     ↓
    ↓               도시별 Unsplash 폴백 이미지 사용
    ↓
[generation_jobs INSERT] → status: completed | failed_fallback
    ↓
[프론트: PreviewPage] → pollTeaser() 3초 간격 (최대 25회 = 75초)
    ↓ ready → polledTeaserUrl 설정
    ↓ fallback → 서버 폴백 URL 사용
    ↓
[결제] Polar checkout → webhook → runResult()
    ↓
[Post-payment] imageGenAgent → gpt-image-1.5 → R2 → result images
```

**핵심 규칙:**
- teaserAgent: gpt-image-1.5로 1장 실제 생성. 나머지 3장은 CSS blur+tint overlay (프론트 처리)
- Identity Engine: 사용자 사진 업로드 시 /images/edits로 동일 인물 유지, 미업로드 시 기본 모델
- gpt-image-1.5 실패 시 반드시 **도시별** 폴백 이미지 사용 (빈 문자열이나 파리 이미지 절대 금지)
- waitUntil()에 반드시 `.catch()` 핸들러 필요 — 없으면 에러가 조용히 삼켜짐
- generation_jobs INSERT 1회 재시도 (실패 시 프론트가 영원히 pending)

---

## 도시별 폴백 이미지 시스템

gpt-image-1.5 이미지 생성 실패 시 사용. **3곳에 모두 일관되게 유지 필수.**

### 1. Worker — `orchestrator.ts` → `CITY_FALLBACK_IMAGES`
- 10개 도시 + _default, male/female 분리
- `getCityFallbackImage(city, gender)` export 함수
- runTeaserBackground catch + /api/preview fallbackTeaser에서 사용

### 2. Frontend — `outfitGenerator.ts` → `MALE_OUTFITS` / `FEMALE_OUTFITS`
- 10개 도시: paris, rome, barcelona, tokyo, london, "new york", seoul, milan, bali, bangkok + _default
- `getOutfitImages(gender, cityKey)` — `.toLowerCase()` 매칭
- _default는 중립 패션 이미지 (파리 랜드마크 금지)

### 3. Frontend — `ProDashboard.tsx` → `CITY_HEROES`
- 16개 도시 hero 이미지 등록

> 새 도시 추가 시 3곳 모두 동시에 업데이트할 것.

---

## API 엔드포인트

```
GET  /api/health                    ← 7개 서비스 상태 확인
POST /api/preview                   ← Turnstile 검증 필수
POST /api/teaser/generate           ← 티저 생성 트리거 (fire-and-forget)
GET  /api/teaser/:tripId            ← 티저 폴링 (ready/pending/fallback)
POST /api/preview/email             ← 이메일 캡처 + Resend
POST /api/payment/checkout          ← Polar checkout
POST /api/payment/webhook           ← HMAC-SHA256 검증 필수
POST /api/payment/upgrade           ← Standard → Pro 업그레이드
GET  /api/result/:tripId            ← 결제 후 결과
POST /api/generate                  ← Pro 이미지 온디맨드 생성
GET  /api/share/:tripId
```

---

## 코드에서 환경변수 읽는 방법

### Workers (Hono) — 반드시 c.env 사용
```typescript
// 절대 금지: process.env.ANTHROPIC_API_KEY
// 올바른 방법:
const key = c.env.ANTHROPIC_API_KEY

// Agent 함수에 env 전달
export async function vibeAgent(input: VibeInput, env: Bindings) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
}
```

### Vite (클라이언트) — VITE_ 접두사만
```typescript
import.meta.env.VITE_WORKER_URL      // 브라우저 OK
import.meta.env.VITE_SUPABASE_URL    // 브라우저 OK
// 비밀키는 절대 VITE_ 접두사 금지
```

---

## 디자인 시스템

### 컬러
```
primary:     #C4613A  ← CTA, 강조 (terracotta)
secondary:   #1A1410  ← 텍스트, 다크 배경
cream:       #FDF8F3  ← 메인 배경
sand:        #F5EFE6  ← 보조 배경
gold:        #D4AF37  ← 별점, 이탤릭 강조
weatherBlue: #E0F2FE  ← 날씨 UI
```

### 타이포그래피
```
heading: Playfair Display (이탤릭 editorial-text 클래스)
body:    DM Sans
data:    JetBrains Mono
아이콘:  Material Symbols Outlined
```

---

## 보안 규칙 (절대 위반 금지)

1. `.env.local` GitHub 커밋 절대 금지
2. 코드 내 API 키 하드코딩 금지
3. Workers에서 `process.env` 사용 금지 — 반드시 `c.env` 사용
4. `VITE_` 변수에 비밀키 절대 금지
5. `SUPABASE_SERVICE_ROLE_KEY` Worker에서만 사용
6. Polar webhook: HMAC-SHA256 검증 없으면 401 반환
7. `/api/preview`: Turnstile 토큰 검증 필수
8. Annual 12회 제한: `usage_records` 서버사이드 검증만 신뢰
9. R2 원본 사진: 이미지 생성 완료 즉시 삭제

---

## 과거 버그 기록 — 절대 재발 금지

### BUG-001: TDZ (Temporal Dead Zone) 크래시 [2026-03-07]
- **파일**: `ProDashboard.tsx`
- **증상**: 프로덕션 빌드에서 "Cannot access 'he' before initialization" → 결제 후 페이지 전체 크래시
- **원인**: `const apiResultImages`를 `useEffect` 의존성 배열에서 사용한 뒤, 실제 선언은 그 아래에 위치
- **규칙**: `const` 파생 변수는 반드시 그것을 참조하는 모든 `useEffect`/`useCallback` **위에** 선언
- **방어책**:
  1. 대시보드를 `React.lazy()` 코드 분할 → TDZ 에러가 전체 앱을 크래시하지 않음 (`routes.ts`)
  2. `ErrorBoundary` + `Suspense`로 복구 UI 제공 (`RootLayout.tsx`)
  3. 대시보드 파일 상단에 `// IMPORTANT: TDZ 방지` 주석 유지

### BUG-002: 도시별 폴백 이미지 미적용 [2026-03-07]
- **증상**: 런던 여행인데 에펠탑(파리) 이미지가 표시됨
- **원인**:
  1. Worker `fallbackTeaser: preview.teaser_url || ''` — 빈 문자열 폴백
  2. `outfitGenerator.ts`의 `_default` 풀이 파리 이미지
  3. london, seoul 등 주요 도시가 이미지 풀에 없음
- **수정**:
  1. Worker: `getCityFallbackImage(city, gender)` 도입, 빈 문자열 대신 도시별 이미지 반환
  2. outfitGenerator: 10개 도시 추가, _default를 중립 이미지로 교체
- **규칙**: 새 도시 추가 시 orchestrator + outfitGenerator + CITY_HEROES 3곳 동시 업데이트

### BUG-003: Turnstile `size:'invisible'` [2026-03-07]
- **파일**: `figma/src/app/lib/turnstile.ts`
- **증상**: Preview API 호출 시 403 "Turnstile token required"
- **원인**: `turnstile.render()`에 `size: 'invisible'` 사용 — Cloudflare Turnstile 미지원 값
- **유효한 값**: `'compact'` | `'normal'` | `'flexible'` (이 3개만 허용)
- **현재 설정**: `size: 'compact'` + 컨테이너 `display: none`

### BUG-004: 불필요한 기본 얼굴 이미지 강제 전달 [2026-03-07]
- **파일**: `orchestrator.ts` → `runTeaserBackground()`
- **증상**: 사용자가 사진을 안 올렸는데도 gpt-image-1.5에 default face 이미지를 전달 → 안전 필터 차단 → 40초 낭비 후 재시도
- **원인**: `effectiveFaceUrl = face_url || default-male/female.png` — 항상 face 포함
- **수정**: `effectiveFaceUrl = face_url || undefined` — 사용자가 올린 사진만 사용
- **규칙**: AI 이미지 생성 시 사용자가 명시적으로 제공한 데이터만 전달. 플레이스홀더 데이터 전달 금지.

### BUG-005: PreviewPage 폴백 URL 미반영 [2026-03-07]
- **증상**: gpt-image-1.5 실패 시 서버가 보낸 폴백 URL이 무시됨
- **원인**: `status === 'fallback'`일 때 `setPolledTeaserUrl(result.teaser_url)` 누락
- **수정**: fallback 상태에서 서버 URL을 `setPolledTeaserUrl()`로 반영
- **규칙**: 폴링 응답의 모든 status 분기에서 URL 데이터를 항상 반영할 것

### BUG-005: sessionStorage 티저 URL 유실 [2026-03-07]
- **증상**: PreviewPage에서 생성된 AI 티저가 Polar 결제 리다이렉트 후 사라짐
- **원인**: 폴링으로 받은 teaser_url을 sessionStorage `tc_preview_data`에 저장하지 않음
- **수정**: `status === 'ready'`일 때 sessionStorage 업데이트 로직 추가
- **규칙**: 외부 리다이렉트(결제 등) 전에 반드시 sessionStorage에 최신 데이터 동기화

### BUG-006: StandardDashboard 티저 URL 미전파 [2026-03-07]
- **파일**: `PreviewPage.tsx`, `TripContext.tsx`, `StandardDashboard.tsx`
- **증상**: PreviewPage에서 AI 티저 생성 확인 → Standard 플랜 선택 → 기본 이미지만 표시
- **원인**:
  1. PreviewPage 폴링 결과를 로컬 state에만 저장, TripContext/sessionStorage 미동기화
  2. TripProvider는 마운트 시 sessionStorage에서 초기화 → 이후 재읽기 없음
  3. Standard는 무료 플랜 → `loadResult()` 호출 시 항상 402 반환 → 데이터 미로드
- **수정**:
  1. `TripContext`에 `updatePreviewTeaser(url)` 메서드 추가 (state + sessionStorage 동시 갱신)
  2. PreviewPage에서 폴링 성공 시 `updatePreviewTeaser()` 호출
  3. StandardDashboard에서 `loadResult()` 제거 (무료 플랜은 order가 없으므로 402 필연)
  4. StandardDashboard 티저 폴링: static fallback URL 감지 → 실제 AI 이미지 대기
- **규칙**:
  - TripContext 상태 변경 시 반드시 React state와 sessionStorage **동시** 갱신
  - 무료 플랜(Standard)은 `/api/result/:tripId` 호출 금지 (402 반환 확정)

### BUG-007: Pro 플랜 코디 이미지 ↔ 아이템 리스트 불일치 [2026-03-07]
- **파일**: `orchestrator.ts`, `styleAgent.ts`, `ProDashboard.tsx`
- **증상**: AI 생성 이미지에는 블랙 첼시부츠인데 아이템 리스트에는 White Sneakers로 표시
- **원인**:
  1. `capsuleAgent`와 `styleAgent`가 독립 실행 → 각자 다른 아이템을 선택
  2. ProDashboard에서 `apiCapsuleItems.slice(expandedOutfit * 3, ...)` — 임의 슬라이싱으로 아이템 매칭
- **수정**:
  1. 파이프라인 순서 변경: `capsuleAgent → styleAgent → imageGenAgent` (순차)
  2. capsuleAgent의 `daily_plan[].outfit[]` 아이템명을 styleAgent 프롬프트에 주입
  3. styleAgent 프롬프트에 "CRITICAL: MUST depict EXACTLY the items listed" 규칙 추가
  4. ProDashboard에서 `daily_plan[].outfit[]`으로 아이템 조회 (임의 슬라이싱 제거)
- **규칙**:
  - AI 파이프라인 순서: **capsule → style → imageGen** (절대 변경 금지)
  - 이미지 프롬프트에는 capsuleAgent가 결정한 아이템을 그대로 전달
  - 프론트엔드 아이템 표시: `daily_plan[].outfit[]`에서 이름 조회 → capsule items 매칭

### BUG-008: 날씨 데이터 월 단위 조회로 정확도 부족 [2026-03-07]
- **파일**: `weatherAgent.ts`, `orchestrator.ts`, `TripContext.tsx`
- **증상**: 8월 1~5일 여행인데 8월 전체 평균 날씨를 반환 → 실제 날씨와 큰 괴리
- **원인**: weatherAgent가 `month` 값만 받아 작년 해당 월 전체를 Open-Meteo에 쿼리
- **수정**:
  1. `fromDate`/`toDate`를 프론트엔드 → Worker → weatherAgent까지 전파
  2. weatherAgent에 `toLastYear()` 헬퍼 추가 (날짜를 작년 동일 MM-DD로 변환, 윤년 처리)
  3. 정확한 날짜 범위로 Open-Meteo Archive API 쿼리
  4. 캐시 키에 `date_range` (e.g., `2025-08-01~2025-08-05`) 사용
  5. 날짜 미제공 시 기존 월 단위 폴백 유지
- **규칙**: 날씨 쿼리 시 가능하면 정확한 날짜 범위 사용 (월 단위는 폴백용)

### BUG-009: /api/result 이미지 인덱스 글로벌 vs 도시별 불일치 [2026-03-08]
- **파일**: `apps/worker/src/index.ts` → `/api/result/:tripId`
- **증상**: 2개 도시 여행 시 첫 도시 이미지만 표시, 두 번째 도시는 빈 슬롯
- **원인**: `completedImages.map((j, idx) => ({ index: idx }))` — 전체 순번(0~7)을 index로 부여. 대시보드는 도시별 index(0~3)를 기대
- **수정**: 도시별 카운터 `cityIndexCounters`로 각 도시마다 0부터 인덱스 부여
- **규칙**: 이미지 인덱스는 항상 **도시별(per-city)** 0부터 시작. 글로벌 순번 사용 금지.

### BUG-010: capsuleAgent 아이템명 대소문자 불일치 [2026-03-08]
- **파일**: `apps/worker/src/agents/capsuleAgent.ts`
- **증상**: daily_plan의 outfit[]에서 참조한 아이템이 items[]에서 찾을 수 없어 빈 리스트 반환
- **원인**: Claude AI가 items[]와 daily_plan.outfit[]에서 같은 아이템의 대소문자를 다르게 반환 (예: "Black Chelsea Boots" vs "black chelsea boots")
- **수정**: `Map<lowercase, canonical>` 룩업으로 대소문자 무관 매칭 + filter로 미매칭 제거
- **규칙**: AI 응답의 문자열 매칭은 항상 **대소문자 무관(case-insensitive)** 비교 사용

### BUG-011: ProDashboard 다른 도시 daily_plan 폴백 [2026-03-08]
- **파일**: `figma/src/app/pages/ProDashboard.tsx`
- **증상**: 도쿄 코디 상세에 파리의 아이템 리스트가 표시됨
- **원인**: `apiDailyPlan[expandedOutfit]` — 글로벌 인덱스로 조회하여 다른 도시 데이터 반환
- **수정**: `apiDailyPlan.filter(d => d.city === cityName)` 도시 필터 후 인덱스 조회. 매칭 실패 시 빈 아이템이 나오되 다른 도시 데이터는 절대 표시 안함
- **규칙**: daily_plan 조회 시 반드시 **도시명 필터** 적용 후 인덱스 접근. 글로벌 인덱스 접근 금지.

### BUG-012: AnnualDashboard/StandardDashboard 임의 슬라이싱 [2026-03-08]
- **파일**: `figma/src/app/pages/AnnualDashboard.tsx`, `StandardDashboard.tsx`
- **증상**: 코디 이미지와 무관한 아이템 리스트 표시
- **원인**: `apiCapsuleItems.slice(idx * 3, idx * 3 + 5)` — 임의 슬라이싱으로 아이템 선택
- **수정**: `daily_plan[].outfit[]` 이름으로 capsule items 대소문자 무관 매칭
- **규칙**: 모든 대시보드에서 아이템 표시는 `daily_plan[].outfit[]` 기반 매칭만 사용. 임의 슬라이싱 절대 금지.

### BUG-013: styleAgent PROMPTS_PER_CITY=2 → 대시보드 4슬롯 불일치 [2026-03-08]
- **파일**: `apps/worker/src/agents/styleAgent.ts`
- **증상**: Pro 대시보드 4개 코디 슬롯 중 2개만 AI 이미지, 나머지 2개는 동일 티저 이미지 반복
- **원인**: `PROMPTS_PER_CITY = 2` — 도시당 2개 프롬프트만 생성. 대시보드는 4슬롯 기대
- **수정**: `PROMPTS_PER_CITY = 4`로 변경 + 프롬프트 다양성 규칙 강화
- **규칙**: `PROMPTS_PER_CITY`는 대시보드 슬롯 수와 항상 일치해야 함 (현재 4)

### BUG-014: /api/regenerate 사용자 프로필 미반영 [2026-03-09]
- **파일**: `apps/worker/src/index.ts` → `POST /api/regenerate`
- **증상**: 남성 185cm/89kg/Streetwear인데 여성 모델 이미지 생성
- **원인**: 재생성 프롬프트에 사용자 성별/체형/스타일 정보가 전혀 포함되지 않음. trips 테이블에서 `vibe_data, cities, month`만 조회하고 `gender, height_cm, weight_kg, aesthetics` 미조회
- **수정**:
  1. trips SELECT에 `gender, height_cm, weight_kg, aesthetics` 추가
  2. 프롬프트에 `modelDirective + heightDesc + bmiNote + aestheticStyle` 포함
  3. 기존 프롬프트에 성별 정보가 없으면 프로필 프리픽스를 앞에 추가
- **규칙**: **모든 이미지 생성 엔드포인트**는 반드시 사용자 프로필(성별, 체형, 스타일)을 프롬프트에 포함해야 함. 프롬프트에 "Male/Female model"이 없으면 버그.

### BUG-015: 프론트엔드 하드코딩 영어 [2026-03-09]
- **파일**: `PreviewPage.tsx`, `ProDashboard.tsx`, `AnnualDashboard.tsx`, `StandardDashboard.tsx`, `OnboardingStep3.tsx`
- **증상**: 한국어 설정인데 aesthetic("Streetwear"), 날짜("Mar 12"), 활동명("Arrival") 등이 영어로 표시
- **원인**:
  1. aesthetic 라벨: 영어 키로 저장되어 번역 없이 그대로 표시
  2. 날짜: `toLocaleDateString("en-US", ...)` 하드코딩
  3. StandardDashboard 폴백 활동명: 영어 하드코딩
- **수정**:
  1. `aesthetic.{label}` i18n 키 6개 x 6개 언어 추가
  2. `dateLocale` 변수로 사용자 언어 → locale 매핑 (`ko → ko-KR` 등)
  3. StandardDashboard 활동명 `t("dashboard.activity.xxx")` 사용
- **규칙**: **사용자에게 표시되는 모든 텍스트**는 `t()` 함수 또는 i18n 키 사용 필수. 하드코딩 문자열은 디버그 로그에만 허용.

---

## 코딩 규칙 — 재발 방지 체크리스트

### React Hook 순서 규칙
```typescript
// 1. useState/useRef/useContext 등 기본 훅
const [state, setState] = useState(...)

// 2. 파생 변수 (const) — useEffect보다 반드시 위에
const derivedValue = someState?.field || defaultValue

// 3. useEffect/useCallback/useMemo
useEffect(() => {
  // derivedValue 사용 OK — 위에서 선언됨
}, [derivedValue])
```

### 이미지 폴백 체인 규칙
```
API 생성 이미지 → teaser_url (폴링) → sessionStorage → outfitGenerator(도시별) → _default(중립)
```
- 폴백 체인의 어떤 단계에서도 빈 문자열(`''`)이 최종값이 되면 안 됨
- _default 이미지는 특정 도시 랜드마크를 포함하면 안 됨

### waitUntil() 패턴 규칙
```typescript
c.executionCtx.waitUntil(
  asyncFunction(args, env)
    .catch((err) => {
      // 반드시 .catch() — 없으면 에러가 조용히 삼켜짐
      console.error('[waitUntil] failed:', (err as Error).message)
    })
)
```

### Turnstile 규칙
- `size` 파라미터: `'compact'` | `'normal'` | `'flexible'` 만 허용
- `'invisible'`는 Cloudflare Turnstile에서 지원하지 않는 값 (reCAPTCHA v2 전용)

### TripContext 상태 동기화 규칙
```typescript
// ❌ 절대 금지 — React state만 업데이트, sessionStorage 미갱신
setState(s => ({ ...s, preview: { ...s.preview, teaser_url: url } }));

// ✅ 올바른 방법 — TripContext의 전용 메서드 사용 (state + sessionStorage 동시 갱신)
updatePreviewTeaser(url);
```
- TripProvider는 **마운트 시 1회만** sessionStorage에서 읽음 → 이후 sessionStorage 변경은 반영 안 됨
- 따라서 모든 상태 변경은 **React state + sessionStorage 동시 갱신** 필수
- 외부 리다이렉트(결제 등) 전에 최신 데이터가 sessionStorage에 반영되었는지 확인

### AI 파이프라인 순서 규칙 (orchestrator.ts)
```
1. weatherAgent (병렬)  — 날씨 데이터
2. vibeAgent (병렬)     — 도시 무드
3. capsuleAgent         — 캡슐 워드로브 + daily_plan (outfit[] 포함)
4. styleAgent           — 이미지 프롬프트 (capsule 아이템 참조)
5. imageGenAgent        — 이미지 생성 (style 프롬프트 사용)
```
- **capsule → style → imageGen 순서 절대 변경 금지**
- styleAgent에 capsuleAgent의 `daily_plan[].outfit[]`과 `capsule items` 전달 필수
- 이미지와 아이템 리스트의 일관성은 이 순서로만 보장됨

### 프론트엔드 아이템 표시 규칙 (모든 대시보드)
```typescript
// ❌ 절대 금지 — 임의 슬라이싱은 실제 코디와 무관한 아이템 표시
const items = capsuleItems.slice(index * 3, index * 3 + 5);

// ✅ 올바른 방법 — daily_plan의 outfit[] 이름으로 capsule items 대소문자 무관 매칭
const dayPlan = apiDailyPlan.find(d => d.city === city && d.day === dayNum);
const items = dayPlan.outfit.map(name =>
  capsuleItems.find(c => c.name.toLowerCase() === name.toLowerCase())
);
```
- 이 규칙은 ProDashboard, AnnualDashboard, StandardDashboard **모두**에 적용

### 이미지 인덱스 규칙 (Worker + Dashboard)
```typescript
// ❌ 절대 금지 — 글로벌 인덱스는 다중 도시에서 깨짐
images.map((img, idx) => ({ index: idx }));

// ✅ 올바른 방법 — 도시별 카운터로 per-city 인덱스
const cityCounters: Record<string, number> = {};
images.map((img) => {
  const key = img.city.toLowerCase();
  const idx = cityCounters[key] ?? 0;
  cityCounters[key] = idx + 1;
  return { ...img, index: idx };
});
```

### AI 응답 문자열 매칭 규칙
- AI(Claude/GPT) 응답에서 문자열 비교는 항상 `.toLowerCase()` 사용
- 특히 `daily_plan[].outfit[]` ↔ `items[].name` 매칭에 필수
- `Map<lowercase, canonical>` 패턴 권장

### 무료 플랜(Standard) API 호출 규칙
- Standard 플랜은 Polar 결제 없음 → `orders` 테이블에 레코드 없음
- `/api/result/:tripId`는 order가 없으면 402 반환 → **Standard에서 호출 금지**
- Standard 데이터: `preview` (TripContext) + teaser 폴링으로만 구성

### 이미지 생성 프로필 규칙 (모든 이미지 생성 경로)
```
필수 체크: 이미지 생성하는 모든 엔드포인트/에이전트에서 사용자 프로필 확인
1. /api/generate          — trips 테이블 미조회, body에서 직접 수신
2. /api/regenerate        — trips 테이블에서 gender, height_cm, weight_kg, aesthetics 조회 필수
3. runResult → styleAgentGrid  — orchestrator에서 userProfile 전달
4. runTeaserBackground → teaserAgent — user_profile 전달
```
- **모든 이미지 프롬프트에 반드시 포함**: 성별(Male/Female/Androgynous model), 체형(tall/petite/average), 빌드(slim/athletic/regular), 스타일(aesthetic)
- 새 이미지 생성 엔드포인트 추가 시 반드시 trips 테이블에서 프로필 조회
- 프롬프트에 "model" 키워드 없으면 버그로 간주

### i18n 하드코딩 방지 규칙 (모든 프론트엔드)
```typescript
// ❌ 절대 금지 — 영어 문자열 하드코딩
const label = "Arrival";
const date = d.toLocaleDateString("en-US", { month: "short" });

// ✅ 올바른 방법 — i18n 키 + locale 매핑
const label = t("dashboard.activity.arrival");
const dateLocale = lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : ...;
const date = d.toLocaleDateString(dateLocale, { month: "short" });
```
- 사용자에게 표시되는 **모든 텍스트**는 `t()` 함수 사용 필수 (디버그 로그 제외)
- `toLocaleDateString()` 호출 시 반드시 `dateLocale` 변수 사용 (`"en-US"` 하드코딩 금지)
- 새 UI 텍스트 추가 시 6개 언어 모두에 번역 키 추가 (en, ko, ja, zh, fr, es)
- aesthetic, 활동명 등 선택값도 i18n 키로 매핑 (`t("aesthetic.Streetwear")` 패턴)

### 스타일링 품질 규칙 (capsuleAgent + styleAgent)

#### Trip Styling Brief (capsuleAgent)
- 모든 유료 캡슐은 `styling_brief` 포함: `base_neutrals` (2-3색), `accent_color` (1색), `jewelry_tone`, `silhouette_goal`
- 아이템 선택 시 색상 팔레트 일관성 유지
- `styling_brief`는 `styleAgent`에 전달되어 이미지 프롬프트에 반영

#### 아이템 반복 제한 규칙
```
bottoms: 각 하의 최대 총 여행일수의 50%
outerwear: 각 아우터 최대 50%
inner tops (knit/sweater): 각 이너 최대 50%
T-shirts/short-sleeve: 각 티셔츠 최대 25%
shoes: 각 신발 최대 50%
accessories: 제한 없음
동일 전체 조합: 절대 반복 금지
```
- 수정 우선순위: 1) 상의 변경 → 2) 하의 변경 → 3) 액세서리 추가

#### 3색 규칙
- 각 코디 최대 3색: dominant + secondary + (optional) accent
- accent_color는 전체 코디의 30-40%에만 등장 (매일 X)

#### Third Piece 원칙
- 모든 코디에 반드시 포함: 레이어 피스(블레이저/코트/카디건/베스트) OR 마감 액세서리(벨트/스카프/가방/주얼리)

#### Rule of Thirds 비율
- 시각적 분할 1/3 또는 2/3 지점: 턱인/하프턱, 크롭 아우터 + 하이웨이스트, 벨트, 오픈 코트

#### 비 오는 날 규칙
- 강수 확률 >40% → 반드시 방수 레이어 + 우산 포함
- styleAgent: 우산 손에 든 모습, 젖은 도로 반사, 흐린 분위기 조명

#### 이미지 프롬프트 규칙 (styleAgent)
- positive: 스타일 디렉션 + 풀바디 프레이밍 + 현실적 비율 + 아이템 스펙 + 스타일링 디렉션(턱/오픈/레이어링) + 조명 + 랜드마크 배경(살짝 블러/보케)
- negative: extra limbs, deformed hands, twisted anatomy, low-res, text/logos, messy layering, mismatched shoes, incorrect weather props
- 랜드마크: 같은 도시 내 쿼드런트마다 다른 랜드마크 필수
- 브랜드 로고 0, 텍스트 오버레이 0

#### capsuleAgent 아이템 필수 필드
```typescript
interface CapsuleItem {
  name: string;           // 구체적 명칭
  category: string;       // top, bottom, outerwear, shoes, dress/jumpsuit, accessory
  color: string;          // 주 색상
  material?: string;      // 소재 (linen, wool blend, cotton 등)
  fit?: string;           // 핏 (relaxed, tailored, oversized, slim)
  formality?: string;     // casual, smart-casual, dressy
  water_resistant?: boolean;
  why: string;
  versatility_score: number;
}
```

#### 최소 4룩 보장 규칙 (MIN_DAILY_PLAN_PER_CITY=4)
- 대시보드 2x2 그리드에 맞춰 도시당 최소 4개 daily_plan 엔트리
- 1-3일 여행: 실제 일수 + 보너스 룩 (morning casual, evening dressy 등)
- 보너스 룩은 fractional day number 사용 (1.5, 2.5 등)
- `padDailyPlanToMinimum()` 안전장치가 GPT 응답 후 보정

### 이미지 생성 방식 규칙 (개별 이미지 vs 그리드)
```
❌ 절대 금지 — 2x2 그리드 합성 이미지 (gpt-image-1.5가 안정적으로 생성 못함)
styleAgentGrid → imageGenAgentGrid → 1장 합성 이미지

✅ 올바른 방법 — 도시당 4개 개별 이미지
styleAgent → imageGenAgent → 4장 개별 이미지 (1024x1536 portrait)
```
- gpt-image-1.5는 2x2 그리드 레이아웃을 안정적으로 생성하지 못함 → 개별 이미지 생성 후 프론트에서 2x2 배치
- `styleAgentGrid`/`imageGenAgentGrid`는 레거시로 유지하되, `runResult()`에서 사용 금지

### styleAgent 구조화 프롬프트 규칙
- 모든 이미지 프롬프트는 9개 섹션 순서를 반드시 따름:
  `[STYLE] → [SUBJECT] → [OUTFIT_SPEC] → [STYLING_DIRECTIONS] → [COMPOSITION] → [LIGHTING] → [BACKGROUND] → [WEATHER_OVERRIDES] → [NEGATIVE]`
- `[STYLING_DIRECTIONS]`: 3-color rule + third piece + rule-of-thirds + capsule styling_directions 포함 필수
- `[COMPOSITION]`: 4:5 vertical, full-body, feet visible, eye-level
- `[BACKGROUND]`: 랜드마크 recognizable but not dominant, bokeh
- capsuleAgent의 `styling_brief` (base_neutrals, accent_color)를 반드시 반영

### SocialShareButton 공유 URL 규칙
```typescript
// ❌ 절대 금지 — 홈페이지 URL 공유
<SocialShareButton />  // props 없이 사용 → 홈페이지 URL

// ✅ 올바른 방법 — trip-specific share URL 전달
<SocialShareButton
  shareUrl={`https://travelscapsule.com/share/${tripId}?utm_source=share&utm_medium=social`}
  shareTitle={t("dashboard.multiCityStyleGuide")}
/>
```
- SocialShareButton을 대시보드에서 사용할 때 반드시 tripId 기반 share URL을 prop으로 전달
- sessionStorage `tc_trip_id` 폴백은 보조 수단 — prop 전달이 우선

### 대시보드 프로필 카드 규칙
```typescript
// ❌ 절대 금지 — Example 이름 사용
{t("examples.pro.profile")}   // "Emily (example)"

// ✅ 올바른 방법 — 사용자 프로필 라벨
{t("dashboard.yourProfile")}   // "내 프로필" / "Your Profile"
```
- 실제 대시보드(Pro/Annual)의 프로필 카드에는 `t("dashboard.yourProfile")` 사용
- `t("examples.pro.profile")`/`t("examples.annual.profile")`은 Example 페이지 전용

---

## 완료된 작업

1. Vite+React `figma/` 프론트엔드 (Next.js 대체)
2. Worker API 전체 (9개 Agent + Hono 라우터)
3. Polar 결제 연동 (checkout + webhook + upgrade)
4. GA4 SPA page_view 트래킹
5. i18n (6개 언어)
6. 온보딩 4단계 + 90+ 도시 + 한국어 alias
7. PreviewPage 티저 폴링 + sessionStorage 동기화
8. 3개 대시보드 (Standard/Pro/Annual) + 프로필 fallback
9. ErrorBoundary + React.lazy() 코드 분할
10. 도시별 폴백 이미지 시스템 (Worker + Frontend 3곳)
11. TDZ 크래시 수정 + 방지 장치
12. 공유 페이지 + UTM 바이럴 루프
13. Cloudflare Turnstile 연동
14. R2 이미지 저장 + CDN
15. CI/CD (GitHub Actions → Pages + Worker 자동 배포)
16. TripContext updatePreviewTeaser() 상태 동기화
17. Standard 플랜 티저 폴링 + loadResult 제거
18. AI 파이프라인 순서 변경 (capsule → style → imageGen)
19. Pro 코디 이미지 ↔ 아이템 매칭 (daily_plan 기반)
20. 정확한 날짜 기반 날씨 쿼리 (Open-Meteo Archive API)
21. 브라우저 FaceDetector API 얼굴 감지 (OnboardingStep3)
22. PreviewPage 멀티 도시 탭 네비게이션
23. styleAgent PROMPTS_PER_CITY=4 + 이미지 다양성 강화
24. /api/result 도시별(per-city) 이미지 인덱싱
25. capsuleAgent 대소문자 무관 아이템명 매칭
26. 전 대시보드 daily_plan 기반 아이템 표시 (임의 슬라이싱 제거)
27. BUG-004 재발 방지 (기본 얼굴 이미지 주입 제거)
28. 연락처 이메일 netson94@gmail.com 통일
29. /api/regenerate 사용자 프로필(성별/체형/스타일) 프롬프트 반영
30. ProDashboard 일별 날씨(daily_forecast) 사이드바 렌더링
31. 전체 프론트엔드 i18n 감사 (aesthetic, 날짜 locale, 활동명 번역)
32. AnnualDashboard 날짜 locale 하드코딩(en-US) → 사용자 언어 매핑
33. capsuleAgent 최소 4룩 보장 (MIN_DAILY_PLAN_PER_CITY=4, padDailyPlanToMinimum 안전장치)
34. 3개 대시보드 ExampleProPage/ExampleAnnualPage 디자인 매칭 리디자인
35. StandardDashboard 2x2 그리드 (1장 선명 + 3장 블러+잠금)
36. 대시보드 사이드바: 프로필 → 패킹리스트 → 날씨 → 스타일통계 → CTA 순서 통일
37. 스타일링 품질 시스템: Trip Styling Brief + 3색 규칙 + Third Piece + Rule of Thirds
38. capsuleAgent 아이템 확장 필드 (color, material, fit, formality, water_resistant)
39. styleAgent 강화: 스타일링 디렉션, 비/랜드마크 처리, 향상된 negative prompt
40. styleAgentGrid에 stylingBrief 전달 (색상 팔레트 일관성)
41. 2x2 그리드 합성 → 4개 개별 이미지 전환 (orchestrator + imageGenAgent)
42. styleAgent 구조화 프롬프트 (9-section template: STYLE~NEGATIVE)
43. ProDashboard 프로필 "Emily (example)" → "Your Profile" (i18n 6개 언어)
44. SocialShareButton tripId 기반 share URL 수정
45. Google AdSense (ca-pub-8181981899493446) 추가
46. ProDashboard 로딩 스켈레톤 shimmer 애니메이션 개선
47. 개별 이미지 다운로드 버튼 추가
