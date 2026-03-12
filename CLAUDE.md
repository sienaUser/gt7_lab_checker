# GT7 랩타임 트래커 - CLAUDE.md

## 프로젝트 개요

그란투리스모7(Gran Turismo 7)의 랩타임을 기록하고, 비교하며, 그래프로 시각화하는 웹 애플리케이션.

## 기술 스택

- **런타임**: Node.js
- **프레임워크**: Express
- **템플릿 엔진**: EJS
- **아키텍처**: MVC 패턴
- **데이터 저장**: JSON 파일 (DB 없음)
- **패키지 매니저**: npm

## 프로젝트 구조

```
gt7-lap-tracker/
├── CLAUDE.md
├── package.json
├── app.js                  # Express 앱 진입점
├── controllers/            # MVC - Controller 레이어
├── models/                 # MVC - Model 레이어 (JSON 파일 읽기/쓰기)
├── views/                  # MVC - View 레이어 (EJS 템플릿)
│   └── partials/           # 공통 헤더/푸터 등
├── routes/                 # Express 라우터
├── public/                 # 정적 파일
│   ├── css/
│   ├── js/
│   └── images/
└── data/                   # JSON 데이터 파일 저장소
```

## 핵심 도메인 개념

- **Circuit (서킷)**: 레이스 트랙 정보 (이름, 레이아웃 등)
- **Car (차량)**: 사용한 차량 정보 (제조사, 모델, PP 수치 등)
- **LapTime (랩타임)**: 기록된 랩타임 데이터
  - 분:초:밀리초 형식 (예: 1:23.456)
  - 서킷, 차량, 날씨, 타이어 등 메타데이터 포함
- **Session (세션)**: 하나의 주행 세션 (여러 랩타임 묶음)

## 코딩 컨벤션

### 파일/변수 명명 규칙
- 파일명: camelCase (예: `lapTimeController.js`)
- 클래스명: PascalCase (예: `LapTime`)
- 변수/함수명: camelCase (예: `getLapTimes`)
- 상수: UPPER_SNAKE_CASE (예: `DATA_DIR`)
- EJS 템플릿: kebab-case (예: `lap-detail.ejs`)

### MVC 역할 분리
- **Model**: JSON 파일 I/O만 담당. 비즈니스 로직 없음.
- **Controller**: 비즈니스 로직, 요청/응답 처리.
- **View**: 렌더링만. 로직 최소화.
- **Route**: URL 매핑만. 로직 없음.

### 데이터 저장 (JSON)
- 모든 데이터는 `data/` 디렉토리의 JSON 파일로 저장
- 파일 읽기/쓰기는 `fs.promises` 사용 (비동기)
- JSON 파일 형식: 배열 기반 (예: `[{...}, {...}]`)
- ID는 타임스탬프 기반 (`Date.now().toString()`)

### 시간 형식
- 저장: 밀리초 단위 정수 (예: `83456` = 1:23.456)
- 표시: `분:초.밀리초` 형식 (예: `1:23.456`)
- 변환 유틸 함수 사용 (파싱/포맷팅 일관성 유지)

## 주요 기능

1. **랩타임 기록**: 서킷, 차량, 조건 선택 후 타임 입력
2. **랩타임 목록**: 서킷/차량별 필터링, 정렬
3. **랩타임 비교**: 두 랩타임 나란히 비교
4. **그래프 시각화**: Chart.js 사용, 타임 추이/분포 표시
5. **베스트 랩**: 서킷/차량 조합별 최고 기록

## 개발 규칙

- DB 없이 JSON 파일만 사용 — ORM, Prisma, DB 연결 불필요
- 외부 API 호출 없음 (완전 로컬 동작)
- 인증/로그인 없음 (단일 사용자 앱)
- `async/await` 사용 (`callback` 지양)
- 에러는 `try/catch`로 처리, 사용자에게 적절한 메시지 표시
- EJS 템플릿에서 복잡한 로직 금지 — controller에서 전처리 후 전달

## 실행 방법

```bash
npm install
npm start        # 프로덕션
npm run dev      # 개발 (nodemon)
```

기본 포트: `3000` (환경변수 `PORT`로 변경 가능)
