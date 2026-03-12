# GT7 랩타임 트래커 Design Document

> **Summary**: Node.js + Express + EJS + MVC 구조로 랩타임 기록/베스트랩 표시/Chart.js 시각화를 구현하는 상세 설계
>
> **Project**: gt7-lap-tracker
> **Version**: 1.0.0
> **Author**: siena
> **Date**: 2026-03-05
> **Status**: Draft
> **Planning Doc**: [gt7-lap-tracker.plan.md](../01-plan/features/gt7-lap-tracker.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- Express MVC 패턴을 명확히 분리하여 각 레이어의 책임을 단순하게 유지한다
- JSON 파일 I/O를 Model 레이어에만 격리하여 향후 DB 교체 가능성을 열어둔다
- EJS 템플릿은 렌더링만 담당, 비즈니스 로직은 Controller에서 처리한다
- Chart.js를 클라이언트 사이드에서 초기화하여 서버 부하를 줄인다

### 1.2 Design Principles

- **단일 책임**: Model = I/O, Controller = 로직, View = 렌더링
- **async/await 일관성**: 모든 파일 I/O는 `fs.promises` 사용
- **방어적 파싱**: JSON 읽기 시 항상 try/catch + 빈 배열 fallback
- **최소 의존성**: 외부 라이브러리는 필요 최소한으로 (express, ejs, chart.js만)

---

## 2. Architecture

### 2.1 MVC 컴포넌트 흐름

```
Browser (GET/POST)
      │
      ▼
┌─────────────┐
│  routes/    │  URL 매핑만 담당 (로직 없음)
│  index.js   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  controllers/   │  비즈니스 로직, 유효성 검사, res.render()
│  lapController  │
└──────┬──────────┘
       │
       ▼
┌─────────────┐
│  models/    │  JSON 파일 읽기/쓰기 (I/O만)
│  lapModel   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  data/                      │
│  laptimes.json / cars.json  │
│  circuits.json              │
└─────────────────────────────┘
       │ (controller → view)
       ▼
┌─────────────┐
│  views/     │  EJS 템플릿 렌더링
│  *.ejs      │
└─────────────┘
```

### 2.2 데이터 흐름

```
[랩타임 등록]
사용자 폼 입력 → POST /laps → validateInput() → parseTimeInput() → lapModel.add() → redirect /

[목록 조회]
GET / → lapModel.getAll() + carModel.getAll() + circuitModel.getAll() → 필터 적용 → render(index)

[통계/그래프]
GET /stats → lapModel.getAll() → getBestLaps() + buildChartData() → render(stats)
```

### 2.3 모듈 의존성

| 모듈 | 의존 | 역할 |
|------|------|------|
| `app.js` | express, routes/index | 서버 설정, 미들웨어 |
| `routes/index.js` | controllers/lapController | URL → Handler 매핑 |
| `controllers/lapController.js` | models/lapModel, models/carModel, models/circuitModel | 요청 처리 |
| `models/lapModel.js` | fs.promises, path | laptimes.json I/O |
| `models/carModel.js` | fs.promises, path | cars.json I/O |
| `models/circuitModel.js` | fs.promises, path | circuits.json I/O |

---

## 3. Data Model

### 3.1 JSON 스키마 상세

#### `data/laptimes.json`

```json
[
  {
    "id": "1741170000000",
    "carId": "car_001",
    "circuitId": "cir_001",
    "timeMs": 83456,
    "tireType": "Racing Medium",
    "memo": "FF 세팅, 스프링 소프트",
    "createdAt": "2026-03-05T10:00:00.000Z"
  }
]
```

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `id` | string | `Date.now().toString()` | `"1741170000000"` |
| `carId` | string | cars.json의 id 참조 | `"car_001"` |
| `circuitId` | string | circuits.json의 id 참조 | `"cir_001"` |
| `timeMs` | number | 랩타임 밀리초 정수 | `83456` (= 1:23.456) |
| `tireType` | string | 타이어 종류 | `"Racing Medium"` |
| `memo` | string | 튜닝 메모 (빈 문자열 허용) | `"스프링 소프트"` |
| `createdAt` | string | ISO 8601 날짜 문자열 | `"2026-03-05T10:00:00.000Z"` |

#### `data/cars.json`

```json
[
  { "id": "car_001", "maker": "Toyota", "model": "GR86" },
  { "id": "car_002", "maker": "Nissan", "model": "GT-R Nismo '17" },
  { "id": "car_003", "maker": "Honda", "model": "NSX Type R '02" },
  { "id": "car_004", "maker": "Mazda", "model": "RX-7 Spirit R '02" },
  { "id": "car_005", "maker": "Subaru", "model": "WRX STI Type S '14" },
  { "id": "car_006", "maker": "Ferrari", "model": "458 Italia" },
  { "id": "car_007", "maker": "Lamborghini", "model": "Huracán LP 610-4" },
  { "id": "car_008", "maker": "Porsche", "model": "911 GT3 (992)" }
]
```

#### `data/circuits.json`

```json
[
  { "id": "cir_001", "name": "Nürburgring GP", "country": "Germany" },
  { "id": "cir_002", "name": "Suzuka Circuit", "country": "Japan" },
  { "id": "cir_003", "name": "Fuji Speedway", "country": "Japan" },
  { "id": "cir_004", "name": "Tsukuba Circuit", "country": "Japan" },
  { "id": "cir_005", "name": "Brands Hatch", "country": "UK" },
  { "id": "cir_006", "name": "Monza Circuit", "country": "Italy" },
  { "id": "cir_007", "name": "Spa-Francorchamps", "country": "Belgium" },
  { "id": "cir_008", "name": "Deep Forest Raceway", "country": "GT7 Original" },
  { "id": "cir_009", "name": "Trial Mountain Circuit", "country": "GT7 Original" }
]
```

### 3.2 타이어 종류 목록 (상수)

```javascript
const TIRE_TYPES = [
  // Comfort
  'Comfort: Hard', 'Comfort: Medium', 'Comfort: Soft',
  // Sport
  'Sport: Hard', 'Sport: Medium', 'Sport: Soft',
  'Sport: Super Soft', 'Sport: Intermediate', 'Sport: Heavy Wet',
  // Racing
  'Racing: Hard', 'Racing: Medium', 'Racing: Soft',
  'Racing: Super Soft', 'Racing: Intermediate', 'Racing: Heavy Wet',
  // Other
  'Dirt Tires', 'Snow Tires'
];
```

### 3.3 시간 변환 유틸 함수

```javascript
// 밀리초 → 표시 문자열 (예: 83456 → "1:23.456")
function msToDisplay(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

// 입력 문자열 → 밀리초 (예: "1:23.456" → 83456)
function displayToMs(str) {
  // 형식: M:SS.mmm 또는 M:SS:mmm
  const match = str.match(/^(\d+):(\d{2})[.:](\d{1,3})$/);
  if (!match) return null;
  const [, m, s, ms] = match;
  return parseInt(m) * 60000 + parseInt(s) * 1000 + parseInt(ms.padEnd(3, '0'));
}
```

---

## 4. API Specification (Express Routes)

### 4.1 라우트 목록

| Method | Path | Controller 함수 | 설명 |
|--------|------|-----------------|------|
| GET | `/` | `getLapList` | 랩타임 목록 (필터 가능) |
| GET | `/record` | `getRecordForm` | 랩타임 입력 폼 |
| POST | `/laps` | `postLap` | 랩타임 저장 |
| DELETE | `/laps/:id` | `deleteLap` | 랩타임 삭제 |
| GET | `/stats` | `getStats` | 베스트랩 + 그래프 |

### 4.2 상세 스펙

#### `GET /`

**Query Parameters:**
- `carId` (optional): 차량 필터
- `circuitId` (optional): 서킷 필터

**응답:** `index.ejs` 렌더링

**Controller 로직:**
```javascript
async function getLapList(req, res) {
  const { carId, circuitId } = req.query;
  let laps = await lapModel.getAll();          // laptimes.json 전체
  if (carId) laps = laps.filter(l => l.carId === carId);
  if (circuitId) laps = laps.filter(l => l.circuitId === circuitId);
  laps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  // car/circuit 이름을 join하여 뷰에 전달
  const cars = await carModel.getAll();
  const circuits = await circuitModel.getAll();
  res.render('index', { laps: enrichLaps(laps, cars, circuits), cars, circuits, filter: { carId, circuitId } });
}
```

#### `GET /record`

**응답:** `record.ejs` 렌더링 (차량/서킷/타이어 목록 전달)

#### `POST /laps`

**Request Body (form-urlencoded):**
```
carId=car_001&circuitId=cir_001&timeInput=1:23.456&tireType=Racing+Medium&memo=스프링+소프트
```

**유효성 검사:**
- `carId`, `circuitId`, `timeInput`, `tireType` 필수
- `timeInput` 형식: `/^\d+:\d{2}[.:]\d{1,3}$/`
- 시간 파싱 실패 시 400 에러 또는 폼 재렌더링

**Controller 로직:**
```javascript
async function postLap(req, res) {
  const { carId, circuitId, timeInput, tireType, memo } = req.body;
  const timeMs = displayToMs(timeInput);
  if (!timeMs) return res.redirect('/record?error=invalid_time');
  const lap = { id: Date.now().toString(), carId, circuitId, timeMs, tireType, memo: memo || '', createdAt: new Date().toISOString() };
  await lapModel.add(lap);
  res.redirect('/');
}
```

#### `DELETE /laps/:id`

**응답:** redirect `/`

**참고:** HTML 폼은 DELETE 메서드 미지원 → `method-override` 미들웨어 사용 또는 POST + `_method=DELETE` 처리

#### `GET /stats`

**Query Parameters:**
- `circuitId` (optional): 특정 서킷의 그래프 표시

**응답:** `stats.ejs` 렌더링

**Controller 로직:**
```javascript
async function getStats(req, res) {
  const laps = await lapModel.getAll();
  const cars = await carModel.getAll();
  const circuits = await circuitModel.getAll();
  // 베스트랩 계산: carId+circuitId 조합별 최소 timeMs
  const bestLaps = computeBestLaps(laps, cars, circuits);
  // 차트 데이터: 선택 서킷의 시간순 랩타임
  const chartData = buildChartData(laps, cars, req.query.circuitId);
  res.render('stats', { bestLaps, chartData, circuits, selectedCircuitId: req.query.circuitId });
}
```

---

## 5. UI/UX Design

### 5.1 공통 레이아웃

```
┌─────────────────────────────────────────────┐
│  GT7 Lap Tracker  | 목록 | 기록하기 | 통계  │  ← header.ejs (nav)
├─────────────────────────────────────────────┤
│                                             │
│           [Page Content]                    │
│                                             │
├─────────────────────────────────────────────┤
│  GT7 Lap Tracker © 2026                     │  ← footer.ejs
└─────────────────────────────────────────────┘
```

### 5.2 `index.ejs` — 랩타임 목록

```
┌─────────────────────────────────────────────┐
│  필터: [차량 선택 ▼] [서킷 선택 ▼] [적용]  │
├──────┬──────────┬──────────┬───────┬────────┤
│ 순위 │ 차량     │ 서킷     │ 타임  │ 삭제   │
├──────┼──────────┼──────────┼───────┼────────┤
│  1   │ GR86     │ Suzuka   │1:23.4 │  [X]   │
│  2   │ NSX      │ Fuji     │1:45.2 │  [X]   │
└──────┴──────────┴──────────┴───────┴────────┘
                             [+ 랩타임 기록하기]
```

### 5.3 `record.ejs` — 랩타임 입력

```
┌─────────────────────────────────────────────┐
│  랩타임 기록                                │
│                                             │
│  차량      [Toyota GR86          ▼]         │
│  서킷      [Suzuka Circuit        ▼]        │
│  랩타임    [1:23.456           ]            │
│            ↑ 형식: 분:초.밀리초              │
│  타이어    [Racing: Medium       ▼]         │
│  튜닝메모  [                    ]           │
│            [textarea, 여러 줄]              │
│                                             │
│                      [저장] [취소]          │
└─────────────────────────────────────────────┘
```

### 5.4 `stats.ejs` — 통계 / 그래프

```
┌─────────────────────────────────────────────┐
│  베스트 랩타임                              │
├──────────┬──────────┬───────────────────────┤
│  차량    │  서킷    │  베스트 타임          │
├──────────┼──────────┼───────────────────────┤
│  GR86    │ Suzuka   │  1:23.456             │
│  NSX     │ Fuji     │  1:45.210             │
└──────────┴──────────┴───────────────────────┘
│                                             │
│  랩타임 추이  서킷: [Suzuka Circuit ▼]     │
│  ┌─────────────────────────────────────┐   │
│  │  Chart.js Line Chart                │   │
│  │  x축: 기록 날짜/순서                 │   │
│  │  y축: 랩타임 (초 단위)              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 5.5 Chart.js 데이터 구조

서버에서 EJS로 전달하는 `chartData` 형식:

```javascript
// 서킷별, 차량별로 구분된 데이터셋
{
  labels: ['2026-03-01', '2026-03-03', '2026-03-05'],  // 기록 날짜
  datasets: [
    {
      label: 'Toyota GR86',
      data: [83456, 82100, 81890],   // timeMs 배열
      borderColor: '#e74c3c',
      tension: 0.3
    },
    {
      label: 'Honda NSX',
      data: [105210, 104800],
      borderColor: '#3498db',
      tension: 0.3
    }
  ]
}
```

y축 표시는 클라이언트 사이드 `chart-init.js`에서 ms → `분:초.밀리초` 형식으로 변환.

---

## 6. Error Handling

### 6.1 에러 처리 방식

| 상황 | 처리 방법 |
|------|-----------|
| JSON 파일 미존재 | 빈 배열 반환 (파일 자동 생성 없음, 초기 파일 필요) |
| JSON 파싱 실패 | `try/catch` → 빈 배열 반환 + console.error |
| 잘못된 시간 형식 | redirect `/record?error=invalid_time` → 폼에서 에러 메시지 표시 |
| 필수 필드 누락 | redirect `/record?error=missing_fields` |
| 존재하지 않는 ID 삭제 | 무시 (찾지 못하면 원본 유지) |
| 서버 에러 | Express 기본 에러 핸들러 (500 응답) |

### 6.2 에러 메시지 (EJS 내 표시)

```html
<% if (query.error === 'invalid_time') { %>
  <div class="error">시간 형식이 올바르지 않습니다. 예: 1:23.456</div>
<% } %>
```

---

## 7. Security Considerations

- [x] 입력값 trim() 처리 (XSS 방지는 EJS 기본 이스케이프로 처리)
- [x] `memo` 필드: EJS `<%= %>` 이스케이프 사용 (raw HTML 금지)
- [x] 파일 경로는 하드코딩 (`path.join(__dirname, '../data/...')`) — path traversal 불가
- [ ] Rate Limiting: 로컬 앱이므로 불필요
- [ ] HTTPS: 로컬 앱이므로 불필요

---

## 8. Test Plan

### 8.1 수동 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| T-01 | 차량/서킷/타임/타이어 입력 후 저장 | 목록에 새 항목 표시 |
| T-02 | 잘못된 타임 형식 입력 (예: `abc`) | 에러 메시지 표시, 저장 안됨 |
| T-03 | 차량 필터 적용 | 해당 차량 랩타임만 표시 |
| T-04 | 랩타임 삭제 | 목록에서 제거 |
| T-05 | 통계 페이지 베스트랩 | 각 조합별 최소 타임 표시 |
| T-06 | 서킷 선택 후 그래프 | Chart.js 라인 차트 렌더링 |
| T-07 | 메모 없이 저장 | 정상 저장 (빈 문자열) |

---

## 9. Clean Architecture (MVC 레이어 정의)

### 9.1 레이어 구조 (Express MVC 맥락)

| 레이어 | Express MVC 대응 | 위치 | 역할 |
|--------|------------------|------|------|
| Presentation | View | `views/*.ejs` | EJS 렌더링만 |
| Application | Controller | `controllers/lapController.js` | 비즈니스 로직, 집계 |
| Domain | (없음 / 인라인) | controller 내 유틸 함수 | 시간 변환, 베스트랩 계산 |
| Infrastructure | Model | `models/*.js` | JSON 파일 I/O |

### 9.2 Model 인터페이스 설계

#### `models/lapModel.js`

```javascript
const fs = require('fs').promises;
const path = require('path');
const FILE = path.join(__dirname, '../data/laptimes.json');

async function getAll() { ... }           // 전체 조회 → Array
async function add(lap) { ... }           // 추가 → void
async function deleteById(id) { ... }     // 삭제 → void
async function getByCircuit(cId) { ... }  // 서킷별 조회 → Array
```

#### `models/carModel.js`

```javascript
async function getAll() { ... }           // cars.json 전체 → Array
async function getById(id) { ... }        // id로 단건 조회 → Object|null
```

#### `models/circuitModel.js`

```javascript
async function getAll() { ... }           // circuits.json 전체 → Array
async function getById(id) { ... }        // id로 단건 조회 → Object|null
```

---

## 10. Coding Convention Reference

### 10.1 이 프로젝트 적용 컨벤션 (CLAUDE.md 기준)

| 항목 | 규칙 | 예시 |
|------|------|------|
| 파일명 | camelCase | `lapController.js`, `lapModel.js` |
| 함수명 | camelCase | `getLapList()`, `postLap()` |
| 상수 | UPPER_SNAKE_CASE | `TIRE_TYPES`, `DATA_DIR` |
| EJS 파일 | kebab-case | `lap-detail.ejs` |
| 시간 저장 | `timeMs` (밀리초 정수) | `83456` |
| ID 생성 | `Date.now().toString()` | `"1741170000000"` |
| 파일 I/O | `fs.promises` + async/await | - |

### 10.2 환경 변수

| 변수 | 용도 | 기본값 |
|------|------|--------|
| `PORT` | 서버 포트 | `3000` |

---

## 11. Implementation Guide

### 11.1 패키지 설치

```bash
npm init -y
npm install express ejs method-override
```

> `method-override`: HTML 폼에서 DELETE 메서드 처리용

### 11.2 구현 순서

1. [ ] `package.json` 생성 및 의존성 설치
2. [ ] `data/cars.json`, `data/circuits.json` 초기 데이터 파일 생성
3. [ ] `data/laptimes.json` 빈 배열로 생성 (`[]`)
4. [ ] `models/carModel.js` — getAll(), getById()
5. [ ] `models/circuitModel.js` — getAll(), getById()
6. [ ] `models/lapModel.js` — getAll(), add(), deleteById()
7. [ ] `controllers/lapController.js` — 모든 핸들러 함수
8. [ ] `routes/index.js` — 라우트 정의
9. [ ] `app.js` — Express 설정, 미들웨어, 라우터 마운트
10. [ ] `views/partials/header.ejs`, `footer.ejs`
11. [ ] `views/record.ejs` — 입력 폼
12. [ ] `views/index.ejs` — 목록 + 필터
13. [ ] `views/stats.ejs` — 베스트랩 + Chart.js
14. [ ] `public/css/style.css` — 기본 스타일
15. [ ] `public/js/chart-init.js` — Chart.js 초기화
16. [ ] 동작 테스트 (T-01 ~ T-07)

### 11.3 `app.js` 설정 개요

```javascript
const express = require('express');
const methodOverride = require('method-override');
const path = require('path');
const routes = require('./routes/index');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`GT7 Tracker running on http://localhost:${PORT}`));
```

---

## Version History

| Version | Date | 변경 내용 | Author |
|---------|------|-----------|--------|
| 0.1 | 2026-03-05 | 최초 작성 | siena |
