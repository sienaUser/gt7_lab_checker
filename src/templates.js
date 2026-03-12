import { escapeHtml } from './utils';

// ── 레이아웃 ─────────────────────────────────────────────
function layout(body) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GT7 Lap Tracker</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <nav class="navbar">
      <a href="/" class="brand">GT7 Lap Tracker</a>
      <ul class="nav-links">
        <li><a href="/">랩타임 목록</a></li>
        <li><a href="/record" class="btn-primary">+ 기록하기</a></li>
        <li><a href="/stats">통계</a></li>
      </ul>
    </nav>
  </header>
  <main class="container">
${body}
  </main>
  <footer>
    <p>GT7 Lap Tracker &copy; 2026</p>
  </footer>
</body>
</html>`;
}

// ── 랩타임 목록 페이지 ───────────────────────────────────
export function indexPage(laps, cars, circuits, filter) {
  const filterHtml = `
<form class="filter-form" method="GET" action="/">
  <select name="carId">
    <option value="">전체 차량</option>
    ${cars.map(car =>
      `<option value="${car.id}"${filter.carId === car.id ? ' selected' : ''}>${escapeHtml(car.maker)} ${escapeHtml(car.model)}</option>`
    ).join('')}
  </select>
  <select name="circuitId">
    <option value="">전체 서킷</option>
    ${circuits.map(c =>
      `<option value="${c.id}"${filter.circuitId === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`
    ).join('')}
  </select>
  <button type="submit" class="btn btn-secondary">필터 적용</button>
  ${(filter.carId || filter.circuitId) ? '<a href="/" class="btn btn-ghost">초기화</a>' : ''}
</form>`;

  let listHtml;
  if (laps.length === 0) {
    listHtml = `
<div class="empty-state">
  <p>아직 기록된 랩타임이 없습니다.</p>
  <a href="/record" class="btn btn-primary">첫 번째 기록 추가하기</a>
</div>`;
  } else {
    listHtml = `
<div class="table-wrap">
  <table class="lap-table">
    <thead>
      <tr>
        <th>#</th><th>차량</th><th>서킷</th><th>랩타임</th>
        <th>타이어</th><th>튜닝 메모</th><th>날짜</th><th></th>
      </tr>
    </thead>
    <tbody>
      ${laps.map((lap, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${escapeHtml(lap.carName)}</td>
        <td>${escapeHtml(lap.circuitName)}</td>
        <td class="time">${escapeHtml(lap.timeDisplay)}</td>
        <td class="tire">${escapeHtml(lap.tireType)}</td>
        <td class="memo">${escapeHtml(lap.memo || '—')}</td>
        <td class="date">${escapeHtml(lap.dateDisplay)}</td>
        <td>
          <form method="POST" action="/laps/${lap.id}?_method=DELETE"
                onsubmit="return confirm('이 기록을 삭제하시겠습니까?')">
            <button type="submit" class="btn-delete" title="삭제">&#x2715;</button>
          </form>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;
  }

  return layout(`
<div class="page-header">
  <h1>랩타임 목록</h1>
  <a href="/record" class="btn btn-primary">+ 기록하기</a>
</div>
${filterHtml}
${listHtml}`);
}

// ── 기록 입력 폼 페이지 ──────────────────────────────────
export function recordPage(cars, circuits, tireTypes, error) {
  let alertHtml = '';
  if (error === 'invalid_time') {
    alertHtml = `<div class="alert alert-error">시간 형식이 올바르지 않습니다. 예: <strong>1:23.456</strong> (분:초.밀리초)</div>`;
  } else if (error === 'missing_fields') {
    alertHtml = `<div class="alert alert-error">차량, 서킷, 랩타임, 타이어는 필수 항목입니다.</div>`;
  }

  return layout(`
<div class="page-header">
  <h1>랩타임 기록</h1>
  <a href="/" class="btn btn-ghost">&larr; 목록으로</a>
</div>
${alertHtml}
<div class="form-card">
  <form method="POST" action="/laps" class="lap-form">
    <div class="form-group">
      <label for="carId">차량 <span class="required">*</span></label>
      <select id="carId" name="carId" required>
        <option value="">차량을 선택하세요</option>
        ${cars.map(car =>
          `<option value="${car.id}">${escapeHtml(car.maker)} ${escapeHtml(car.model)}</option>`
        ).join('')}
      </select>
    </div>
    <div class="form-group">
      <label for="circuitId">서킷 <span class="required">*</span></label>
      <select id="circuitId" name="circuitId" required>
        <option value="">서킷을 선택하세요</option>
        ${circuits.map(c =>
          `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.country)})</option>`
        ).join('')}
      </select>
    </div>
    <div class="form-group">
      <label for="timeInput">랩타임 <span class="required">*</span></label>
      <input type="text" id="timeInput" name="timeInput"
             placeholder="1:23.456" pattern="\\d+:\\d{2}[.:]\\d{1,3}"
             title="형식: 분:초.밀리초 (예: 1:23.456)" required>
      <span class="hint">형식: 분:초.밀리초 &nbsp;예) 1:23.456</span>
    </div>
    <div class="form-group">
      <label for="tireType">타이어 종류 <span class="required">*</span></label>
      <select id="tireType" name="tireType" required>
        <option value="">타이어를 선택하세요</option>
        ${tireTypes.map(tire =>
          `<option value="${escapeHtml(tire)}">${escapeHtml(tire)}</option>`
        ).join('')}
      </select>
    </div>
    <div class="form-group">
      <label for="memo">튜닝 메모</label>
      <textarea id="memo" name="memo" rows="3"
                placeholder="예: 스프링 소프트, FF 세팅, PP 예산 600"></textarea>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">저장</button>
      <a href="/" class="btn btn-ghost">취소</a>
    </div>
  </form>
</div>`);
}

// ── 통계 페이지 ──────────────────────────────────────────
export function statsPage(bestLaps, circuits, chartData, selectedCircuitId) {
  let bestHtml;
  if (bestLaps.length === 0) {
    bestHtml = `
<div class="empty-state">
  <p>아직 기록된 랩타임이 없습니다.</p>
  <a href="/record" class="btn btn-primary">기록 추가하기</a>
</div>`;
  } else {
    bestHtml = `
<div class="table-wrap">
  <table class="lap-table">
    <thead>
      <tr><th>#</th><th>차량</th><th>서킷</th><th>베스트 타임</th><th>타이어</th><th>날짜</th></tr>
    </thead>
    <tbody>
      ${bestLaps.map((lap, i) => `
      <tr class="${i === 0 ? 'best-row' : ''}">
        <td class="num">${i === 0 ? '&#x1F3C6;' : i + 1}</td>
        <td>${escapeHtml(lap.carName)}</td>
        <td>${escapeHtml(lap.circuitName)}</td>
        <td class="time best-time">${escapeHtml(lap.timeDisplay)}</td>
        <td class="tire">${escapeHtml(lap.tireType)}</td>
        <td class="date">${escapeHtml(lap.dateDisplay)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;
  }

  let chartHtml;
  if (selectedCircuitId && !chartData) {
    chartHtml = `<div class="empty-state"><p>선택한 서킷의 기록이 없습니다.</p></div>`;
  } else if (chartData) {
    chartHtml = `
<div class="chart-container">
  <canvas id="lapChart"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
<script>window.LAP_CHART_DATA = ${JSON.stringify(chartData)};</script>
<script src="/js/chart-init.js"></script>`;
  } else {
    chartHtml = `<div class="empty-state"><p>서킷을 선택하면 랩타임 추이 그래프를 볼 수 있습니다.</p></div>`;
  }

  return layout(`
<div class="page-header">
  <h1>통계</h1>
</div>
<section class="stats-section">
  <h2>베스트 랩타임</h2>
  ${bestHtml}
</section>
<section class="stats-section chart-section">
  <h2>랩타임 추이</h2>
  <form class="filter-form" method="GET" action="/stats">
    <select name="circuitId" onchange="this.form.submit()">
      <option value="">서킷을 선택하세요</option>
      ${circuits.map(c =>
        `<option value="${c.id}"${selectedCircuitId === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`
      ).join('')}
    </select>
  </form>
  ${chartHtml}
</section>`);
}
