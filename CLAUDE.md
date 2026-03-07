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
| Standard | Free | 이미지 1장 선명 + 3장 블러 해제, 캡슐 리스트, 데일리 플랜 | 없음 |
| Pro | $3.99 | 전 도시 4~6장 실제 생성, 고화질, 1회 재생성 | 없음 |
| Annual | $9.99/년 | Pro 혜택 전체 + 연 12회 제한 | 서버사이드 12회 체크 필수 |

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
| 이미지 생성 | **Gemini** (NANOBANANA_API_KEY = Gemini API 키) |
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
│       │       ├── teaserAgent.ts    ← Gemini 티저 이미지 생성
│       │       ├── imageGenAgent.ts  ← Gemini 풀 이미지 생성
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
[runTeaserBackground] → teaserAgent → Gemini 이미지 생성 → R2 저장
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
[Post-payment] imageGenAgent → Gemini → R2 → result images
```

**핵심 규칙:**
- teaserAgent: Gemini 1장만 실제 생성. 나머지 3장은 CSS blur+tint overlay (프론트 처리)
- Gemini 실패 시 반드시 **도시별** 폴백 이미지 사용 (빈 문자열이나 파리 이미지 절대 금지)
- waitUntil()에 반드시 `.catch()` 핸들러 필요 — 없으면 에러가 조용히 삼켜짐
- generation_jobs INSERT 1회 재시도 (실패 시 프론트가 영원히 pending)

---

## 도시별 폴백 이미지 시스템

Gemini 이미지 생성 실패 시 사용. **3곳에 모두 일관되게 유지 필수.**

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
- **증상**: 사용자가 사진을 안 올렸는데도 Gemini에 default face 이미지를 전달 → 안전 필터 차단 → 40초 낭비 후 재시도
- **원인**: `effectiveFaceUrl = face_url || default-male/female.png` — 항상 face 포함
- **수정**: `effectiveFaceUrl = face_url || undefined` — 사용자가 올린 사진만 사용
- **규칙**: AI 이미지 생성 시 사용자가 명시적으로 제공한 데이터만 전달. 플레이스홀더 데이터 전달 금지.

### BUG-005: PreviewPage 폴백 URL 미반영 [2026-03-07]
- **증상**: Gemini 실패 시 서버가 보낸 폴백 URL이 무시됨
- **원인**: `status === 'fallback'`일 때 `setPolledTeaserUrl(result.teaser_url)` 누락
- **수정**: fallback 상태에서 서버 URL을 `setPolledTeaserUrl()`로 반영
- **규칙**: 폴링 응답의 모든 status 분기에서 URL 데이터를 항상 반영할 것

### BUG-005: sessionStorage 티저 URL 유실 [2026-03-07]
- **증상**: PreviewPage에서 생성된 AI 티저가 Polar 결제 리다이렉트 후 사라짐
- **원인**: 폴링으로 받은 teaser_url을 sessionStorage `tc_preview_data`에 저장하지 않음
- **수정**: `status === 'ready'`일 때 sessionStorage 업데이트 로직 추가
- **규칙**: 외부 리다이렉트(결제 등) 전에 반드시 sessionStorage에 최신 데이터 동기화

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
