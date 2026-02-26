# Travel Capsule AI — Project Context

## 제품 개요

Travel Capsule AI — $5/trip, AI 여행 스타일링 서비스 (글로벌 런칭 타겟)

- 사용자가 도시 + 여행월 + 사진(선택) 입력
- AI가 도시별 기후·바이브 분석 → 코디 이미지 3-4장/도시 생성
- 캡슐 워드로브 8-12개 + 데일리 아웃핏 플랜 제공
- 결제 후 공유 가능한 갤러리 링크 발송

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
| AI (Style/Capsule) | Claude API (claude-sonnet-4-6) |
| 기후 데이터 | Open-Meteo (무료, 가입 불필요) |
| 도시 검색 | Google Places API |
| 이메일 | Resend |

---

## 프로젝트 폴더 구조

```
travel-capsule-ai/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── result/[tripId]/
│   │   │   └── api/
│   │   └── components/
│   └── worker/
│       ├── src/
│       │   ├── index.ts
│       │   └── agents/
│       └── wrangler.toml
├── packages/
│   ├── types/
│   └── city-vibes-db/
│       └── cities.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local          <- 로컬 전용, gitignore 필수
├── .env.example        <- 키값 없이 변수명만 기록 (GitHub 커밋 OK)
├── .gitignore
└── CLAUDE.md
```

---

## Agent 아키텍처

```
User
 └─ Orchestrator
      ├─ Climate Agent     (Open-Meteo API)
      ├─ Style Agent       (Claude API)
      ├─ ImageGen Agent    (NanoBanana API)
      ├─ Capsule Agent     (Claude API)
      ├─ Fulfillment Agent (R2 + Resend)
      └─ Growth Agent      (UTM + 공유 카피)
```

Agent 파일 위치: apps/worker/src/agents/
- orchestrator.ts
- climateAgent.ts
- styleAgent.ts
- imageGenAgent.ts
- capsuleAgent.ts
- fulfillmentAgent.ts
- growthAgent.ts

---

## DB 스키마 (Supabase)

```
trips            -- session_id, cities(JSONB), month, face_url, status
orders           -- polar_order_id(UNIQUE), trip_id, status
generation_jobs  -- city, mood, prompt, status, image_url, attempts
capsule_results  -- trip_id, items(JSONB), daily_plan(JSONB)
city_vibes       -- city, country, lat, lon, vibe_cluster, style_keywords
```

---

## 환경변수 & Cloudflare 설정

### 환경변수 전체 목록 및 위치

아래 표를 기준으로 로컬과 Cloudflare에 각각 입력한다.
코드에서 직접 키값을 하드코딩하는 것은 절대 금지.

| 변수명 | 용도 | 로컬(.env.local) | Cloudflare Workers Secrets | Cloudflare Pages Env |
|--------|------|:-:|:-:|:-:|
| ANTHROPIC_API_KEY | Claude API 인증 | O | O (Secret) | - |
| NANOBANANA_API_KEY | 이미지 생성 | O | O (Secret) | - |
| POLAR_ACCESS_TOKEN | Polar 결제 API | O | O (Secret) | - |
| POLAR_PRODUCT_ID | Polar 상품 ID | O | O (Plain) | - |
| POLAR_WEBHOOK_SECRET | Webhook 서명 검증 | O | O (Secret) | - |
| SUPABASE_URL | Supabase 프로젝트 URL | O | O (Plain) | - |
| SUPABASE_SERVICE_ROLE_KEY | DB 서버사이드 접근 | O | O (Secret) | - |
| NEXT_PUBLIC_SUPABASE_URL | 클라이언트용 Supabase URL | O | - | O (Plain) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | 클라이언트용 공개키 | O | - | O (Plain) |
| R2_ACCOUNT_ID | Cloudflare 계정 ID | O | O (Plain) | - |
| R2_ACCESS_KEY_ID | R2 버킷 접근 | O | O (Secret) | - |
| R2_SECRET_ACCESS_KEY | R2 버킷 접근 | O | O (Secret) | - |
| R2_BUCKET_NAME | R2 버킷 이름 | O | O (Plain) | - |
| R2_PUBLIC_URL | CDN 공개 URL | O | O (Plain) | O (Plain) |
| RESEND_API_KEY | 이메일 발송 | O | O (Secret) | - |
| GOOGLE_PLACES_API_KEY | 도시 자동완성 | O | O (Secret) | - |

### Cloudflare에 입력하는 방법

Workers Secrets 입력 (터미널):
```
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put NANOBANANA_API_KEY
wrangler secret put POLAR_ACCESS_TOKEN
wrangler secret put POLAR_WEBHOOK_SECRET
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put GOOGLE_PLACES_API_KEY
```

Workers Plain 변수는 wrangler.toml에 직접 작성:
```toml
[vars]
POLAR_PRODUCT_ID = "prod_xxxx"
SUPABASE_URL = "https://xxxx.supabase.co"
R2_ACCOUNT_ID = "xxxx"
R2_BUCKET_NAME = "travel-capsule-assets"
R2_PUBLIC_URL = "https://assets.yourdomain.ai"
```

Pages 환경변수는 Cloudflare Dashboard에서 입력:
경로: Pages 프로젝트 선택 → Settings → Environment variables → Add variable
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
R2_PUBLIC_URL
```

---

## 코드에서 환경변수 읽는 방법

### Cloudflare Workers (Hono)

Cloudflare Workers는 process.env를 쓰지 않는다.
반드시 fetch handler의 env 파라미터로 받는다.

```typescript
// apps/worker/src/index.ts
import { Hono } from 'hono'

type Bindings = {
  ANTHROPIC_API_KEY: string
  NANOBANANA_API_KEY: string
  POLAR_ACCESS_TOKEN: string
  POLAR_PRODUCT_ID: string
  POLAR_WEBHOOK_SECRET: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
  R2_PUBLIC_URL: string
  RESEND_API_KEY: string
  GOOGLE_PLACES_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', (c) => {
  // env 접근 방법
  const key = c.env.ANTHROPIC_API_KEY
  return c.json({ ok: true })
})

export default app
```

### Agent에 env 전달하는 방법

```typescript
// apps/worker/src/agents/styleAgent.ts
export async function styleAgent(
  city: string,
  climate: ClimateResult,
  env: Bindings   // <- env를 파라미터로 받음
) {
  const Anthropic = await import('@anthropic-ai/sdk')
  const client = new Anthropic.default({ apiKey: env.ANTHROPIC_API_KEY })
  // ...
}

// 라우트에서 호출할 때
app.post('/api/trip', async (c) => {
  const result = await styleAgent(city, climate, c.env)
})
```

### Next.js (Pages, 클라이언트)

NEXT_PUBLIC_ 접두사 붙은 것만 브라우저에서 읽힌다.

```typescript
// apps/web/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 로컬 개발용 .env.local 예시

```
ANTHROPIC_API_KEY=sk-ant-여기에입력
NANOBANANA_API_KEY=nb_live_여기에입력
POLAR_ACCESS_TOKEN=polar_at_여기에입력
POLAR_PRODUCT_ID=prod_여기에입력
POLAR_WEBHOOK_SECRET=whs_여기에입력
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ여기에입력
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ여기에입력
R2_ACCOUNT_ID=여기에입력
R2_ACCESS_KEY_ID=여기에입력
R2_SECRET_ACCESS_KEY=여기에입력
R2_BUCKET_NAME=travel-capsule-assets
R2_PUBLIC_URL=https://assets.yourdomain.ai
RESEND_API_KEY=re_여기에입력
GOOGLE_PLACES_API_KEY=AIza여기에입력
```

---

## .gitignore 필수 항목

```
.env.local
.env*.local
.env
node_modules
.wrangler
dist
.next
```

---

## 보안 규칙 (절대 위반 금지)

- .env.local 파일을 GitHub에 절대 커밋하지 않는다
- 코드 안에 API 키값을 직접 쓰지 않는다
- Workers에서 process.env 쓰지 않는다 (동작 안 함)
- NEXT_PUBLIC_ 변수에 비밀키를 절대 넣지 않는다
- SUPABASE_SERVICE_ROLE_KEY는 Worker에서만 사용한다

---

## Polar 결제 규칙

- 디지털 상품만 판매 (현재 OK)
- 일회성 5달러, 자동갱신 없음
- Webhook 서명 검증 필수 (HMAC-SHA256)
- polar_order_id UNIQUE 제약으로 중복 방지

---

## 사용자 사진 프라이버시

- 업로드 사진은 R2 임시 경로에만 저장
- 이미지 생성 완료 즉시 원본 삭제
- 외부 공유 및 ML 학습 활용 금지

---

## 완료된 작업

- 랜딩 페이지 HTML (travel-capsule-ai.html) 전환 최적화 완성
- 전체 아키텍처 설계 (TravelCapsuleAI-Blueprint.docx)
- DB 스키마 설계
- Agent 역할 정의

---

## 남은 작업 (우선순위 순)

1. .gitignore 생성 및 .env.local 추가 확인
2. .env.local 파일 생성 및 키값 입력
3. apps/worker/wrangler.toml 작성 (Bindings 포함)
4. wrangler secret put 명령어로 Cloudflare에 Secret 등록
5. supabase/migrations/001_initial_schema.sql 작성 및 적용
6. apps/worker/src/index.ts Hono 라우터 + Bindings 타입 정의
7. apps/worker/src/agents/climateAgent.ts 구현
8. packages/city-vibes-db/cities.json 생성 (30개 도시)
9. apps/worker/src/agents/styleAgent.ts 구현
10. apps/worker/src/agents/imageGenAgent.ts 구현
11. Polar checkout 및 webhook 라우트 구현
12. Cloudflare Pages 환경변수 등록 및 배포
