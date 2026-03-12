# GT7 랩타임 트래커 Planning Document

> **Summary**: 그란투리스모7 랩타임을 기록하고, 차량/서킷별 베스트랩을 비교하며, Chart.js 그래프로 추이를 시각화하는 로컬 웹 앱
>
> **Project**: gt7-lap-tracker
> **Version**: 1.0.0
> **Author**: siena
> **Date**: 2026-03-05
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

그란투리스모7 플레이 중 기록한 랩타임을 체계적으로 관리한다.
차량·서킷 조합별 베스트랩을 한눈에 파악하고, 시간 경과에 따른 기량 향상을 그래프로 확인하는 것이 목표다.

### 1.2 Background

- GT7 게임 내 기록은 직접 확인하기 불편하고 비교/분석 기능이 제한적이다.
- 외부 서비스나 스프레드시트 없이 로컬에서 간단히 기록·시각화할 수 있는 도구가 필요하다.
- DB 없이 JSON 파일만으로 완전 로컬 동작을 목표로 한다.

### 1.3 Related Documents

- CLAUDE.md: 프로젝트 코딩 컨벤션 및 구조 정의

---

## 2. Scope

### 2.1 In Scope

- [x] 차량 + 서킷 선택 후 랩타임 입력 (분:초:밀리초)
- [x] 타이어 종류 선택 (Sport/Racing/Comfort 계열)
- [x] 튜닝 메모 자유 입력 (텍스트)
- [x] 차량별 / 서킷별 베스트 랩 표시
- [x] 랩타임 추이 Chart.js 라인 차트
- [x] 랩타임 목록 조회 (필터: 차량, 서킷)
- [x] 랩타임 삭제
- [x] JSON 파일 기반 데이터 저장 (`data/laptimes.json`)

### 2.2 Out of Scope

- 사용자 인증/로그인 (단일 사용자 앱)
- DB 연동 (PostgreSQL, MongoDB 등)
- 외부 API 호출
- 멀티 세션 / 멀티 플레이어
- 모바일 앱 (반응형 웹은 포함)
- 랩 구간 분석 (섹터 타임)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|----------|------|
| FR-01 | 차량 목록(`cars.json`)에서 차량 선택 | High | Pending |
| FR-02 | 서킷 목록(`circuits.json`)에서 서킷 선택 | High | Pending |
| FR-03 | 랩타임 입력 (분:초.밀리초 형식, 예: 1:23.456) | High | Pending |
| FR-04 | 타이어 종류 선택 (드롭다운) | High | Pending |
| FR-05 | 튜닝 메모 입력 (textarea) | Medium | Pending |
| FR-06 | 랩타임 저장 → `data/laptimes.json` 추가 | High | Pending |
| FR-07 | 랩타임 목록 표시 (최신순) | High | Pending |
| FR-08 | 차량별 / 서킷별 필터링 | Medium | Pending |
| FR-09 | 차량+서킷 조합별 베스트 랩 표시 | High | Pending |
| FR-10 | 랩타임 추이 Chart.js 라인 차트 (서킷 기준) | High | Pending |
| FR-11 | 랩타임 개별 삭제 | Medium | Pending |

### 3.2 Non-Functional Requirements

| 카테고리 | 기준 | 측정 방법 |
|----------|------|-----------|
| 성능 | 로컬 JSON 읽기/쓰기 < 100ms | 브라우저 DevTools |
| 호환성 | Chrome 최신 버전 기준 동작 | 수동 테스트 |
| 반응형 | 1280px 이상 데스크탑 우선 | 브라우저 리사이즈 |
| 데이터 무결성 | JSON 파싱 에러 시 빈 배열 반환 | 에러 핸들링 코드 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] FR-01 ~ FR-11 모든 기능 구현 완료
- [x] `npm start`로 서버 실행, `localhost:3000` 접근 가능
- [x] JSON 파일 읽기/쓰기 정상 동작
- [x] Chart.js 그래프 렌더링 정상
- [x] 랩타임 등록 → 목록 → 베스트랩 → 그래프 흐름 동작

### 4.2 Quality Criteria

- [x] MVC 레이어 역할 분리 (Model: JSON I/O만, Controller: 비즈니스 로직)
- [x] 에러 발생 시 사용자에게 적절한 메시지 표시
- [x] EJS 템플릿에 복잡한 로직 없음
- [x] async/await 일관 사용

---

## 5. Risks and Mitigation

| 리스크 | 영향 | 가능성 | 대응 |
|--------|------|--------|------|
| JSON 파일 동시 쓰기 충돌 | Medium | Low | 단일 사용자 앱이므로 허용 범위. 필요 시 write lock 추가 고려 |
| 데이터 누적 시 응답 지연 | Low | Low | 로컬 앱 특성상 수백 건 수준, 문제 없을 것으로 예상 |
| Chart.js CDN 로드 실패 | Low | Low | 로컬 npm 패키지 또는 fallback 처리 |
| 잘못된 시간 형식 입력 | Medium | Medium | 서버/클라이언트 양측에서 유효성 검사 |

---

## 6. Architecture Considerations

### 6.1 Project Level

| Level | 선택 이유 |
|-------|-----------|
| **Starter** | DB 없음, 단일 사용자, 간단한 CRUD + 시각화. MVC 구조로 충분 |

### 6.2 Key Architectural Decisions

| 결정 항목 | 선택 | 이유 |
|-----------|------|------|
| 프레임워크 | Express + EJS | 요구사항 명시. 서버사이드 렌더링으로 심플하게 |
| 데이터 저장 | JSON 파일 | 요구사항 명시. DB 불필요 |
| 그래프 | Chart.js | 요구사항 명시. CDN 또는 npm 패키지 |
| 스타일 | 순수 CSS (Bootstrap 선택적) | 의존성 최소화 |
| 패키지 매니저 | npm | 기본 |

### 6.3 디렉토리 구조

```
gt7-lap-tracker/
├── app.js                    # Express 진입점, 미들웨어 설정
├── package.json
├── CLAUDE.md
├── data/
│   ├── laptimes.json         # 랩타임 데이터 [{id, carId, circuitId, time, tireType, memo, date}]
│   ├── cars.json             # 차량 목록 [{id, maker, model}]
│   └── circuits.json         # 서킷 목록 [{id, name, country, layout}]
├── routes/
│   └── index.js              # 모든 라우트 정의
├── controllers/
│   └── lapController.js      # 비즈니스 로직, req/res 처리
├── models/
│   └── lapModel.js           # JSON 파일 읽기/쓰기 (I/O만)
├── views/
│   ├── partials/
│   │   ├── header.ejs        # 공통 헤더 (nav)
│   │   └── footer.ejs        # 공통 푸터
│   ├── index.ejs             # 랩타임 목록 + 필터
│   ├── record.ejs            # 랩타임 입력 폼
│   └── stats.ejs             # 베스트랩 + Chart.js 그래프
└── public/
    ├── css/
    │   └── style.css
    └── js/
        └── chart-init.js     # Chart.js 초기화 스크립트
```

### 6.4 데이터 스키마

**laptimes.json**
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

**cars.json**
```json
[
  { "id": "car_001", "maker": "Toyota", "model": "GR86" },
  { "id": "car_002", "maker": "Nissan", "model": "GT-R Nismo" }
]
```

**circuits.json**
```json
[
  { "id": "cir_001", "name": "Nürburgring GP", "country": "Germany" },
  { "id": "cir_002", "name": "Suzuka Circuit", "country": "Japan" }
]
```

---

## 7. Convention Prerequisites

### 7.1 적용 컨벤션 (CLAUDE.md 기준)

- [x] CLAUDE.md 작성 완료 (코딩 컨벤션, 시간 형식 정의 포함)
- [ ] ESLint 설정 (선택사항, 이 프로젝트는 JS 단순 구조라 생략 가능)

### 7.2 핵심 컨벤션

| 카테고리 | 규칙 |
|----------|------|
| 시간 저장 | 밀리초 정수 (`timeMs`) |
| 시간 표시 | `분:초.밀리초` 문자열 (예: `1:23.456`) |
| ID 생성 | `Date.now().toString()` |
| 파일 I/O | `fs.promises` + `async/await` |
| 에러 처리 | `try/catch`, 사용자에게 메시지 표시 |

### 7.3 환경 변수

| 변수 | 용도 | 기본값 |
|------|------|--------|
| `PORT` | 서버 포트 | `3000` |

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`gt7-lap-tracker.design.md`) — `/pdca design gt7-lap-tracker`
2. [ ] 초기 JSON 데이터 파일 생성 (cars.json, circuits.json 기본 데이터)
3. [ ] 구현 시작 — `/pdca do gt7-lap-tracker`

---

## Version History

| Version | Date | 변경 내용 | Author |
|---------|------|-----------|--------|
| 0.1 | 2026-03-05 | 최초 작성 | siena |
