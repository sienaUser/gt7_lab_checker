// ── 정적 데이터 ──────────────────────────────────────────
const CARS = [
  { id: 'car_001', maker: 'Toyota', model: 'GR86' },
  { id: 'car_002', maker: 'Nissan', model: "GT-R Nismo '17" },
  { id: 'car_003', maker: 'Honda', model: "NSX Type R '02" },
  { id: 'car_004', maker: 'Mazda', model: "RX-7 Spirit R '02" },
  { id: 'car_005', maker: 'Subaru', model: "WRX STI Type S '14" },
  { id: 'car_006', maker: 'Ferrari', model: '458 Italia' },
  { id: 'car_007', maker: 'Lamborghini', model: 'Huracán LP 610-4' },
  { id: 'car_008', maker: 'Porsche', model: '911 GT3 (992)' },
  { id: 'car_009', maker: 'BMW', model: 'M3 Competition (G80)' },
  { id: 'car_010', maker: 'Mercedes-Benz', model: 'AMG GT R' }
];

const CIRCUITS = [
  { id: 'cir_001', name: 'Nürburgring GP', country: 'Germany' },
  { id: 'cir_002', name: 'Suzuka Circuit', country: 'Japan' },
  { id: 'cir_003', name: 'Fuji Speedway', country: 'Japan' },
  { id: 'cir_004', name: 'Tsukuba Circuit', country: 'Japan' },
  { id: 'cir_005', name: 'Brands Hatch', country: 'UK' },
  { id: 'cir_006', name: 'Monza Circuit', country: 'Italy' },
  { id: 'cir_007', name: 'Spa-Francorchamps', country: 'Belgium' },
  { id: 'cir_008', name: 'Deep Forest Raceway', country: 'GT7 Original' },
  { id: 'cir_009', name: 'Trial Mountain Circuit', country: 'GT7 Original' },
  { id: 'cir_010', name: 'Willow Springs Raceway', country: 'USA' }
];

const TIRE_TYPES = [
  'Comfort: Hard', 'Comfort: Medium', 'Comfort: Soft',
  'Sport: Hard', 'Sport: Medium', 'Sport: Soft',
  'Sport: Super Soft', 'Sport: Intermediate', 'Sport: Heavy Wet',
  'Racing: Hard', 'Racing: Medium', 'Racing: Soft',
  'Racing: Super Soft', 'Racing: Intermediate', 'Racing: Heavy Wet',
  'Dirt Tires', 'Snow Tires'
];

const STORAGE_KEY = 'gt7_laptimes';
const EXPIRY_DAYS = 90;

// ── localStorage (만료 기능 포함) ────────────────────────
function saveLaps(laps) {
  const item = {
    data: laps,
    expiry: Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
}

function loadLaps() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const item = JSON.parse(raw);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return item.data || [];
  } catch {
    return [];
  }
}

// ── 유틸리티 ─────────────────────────────────────────────
function msToDisplay(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function displayToMs(str) {
  const match = str.trim().match(/^(\d+):(\d{2})[.:](\d{1,3})$/);
  if (!match) return null;
  const [, m, s, ms] = match;
  const msVal = parseInt(ms.padEnd(3, '0'));
  return parseInt(m) * 60000 + parseInt(s) * 1000 + msVal;
}

function esc(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

function getCarName(carId) {
  const car = CARS.find(c => c.id === carId);
  return car ? `${car.maker} ${car.model}` : carId;
}

function getCircuitName(circuitId) {
  const c = CIRCUITS.find(c => c.id === circuitId);
  return c ? c.name : circuitId;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR');
}

// ── 페이지: 랩타임 목록 (index) ─────────────────────────
function initIndex() {
  const app = document.getElementById('app');
  const params = new URLSearchParams(window.location.search);
  const filterCarId = params.get('carId') || '';
  const filterCircuitId = params.get('circuitId') || '';

  let laps = loadLaps();
  if (filterCarId) laps = laps.filter(l => l.carId === filterCarId);
  if (filterCircuitId) laps = laps.filter(l => l.circuitId === filterCircuitId);
  laps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
            <tr><th>#</th><th>차량</th><th>서킷</th><th>랩타임</th><th>타이어</th><th>튜닝 메모</th><th>날짜</th><th></th></tr>
          </thead>
          <tbody>
            ${laps.map((lap, i) => `
            <tr>
              <td class="num">${i + 1}</td>
              <td>${esc(getCarName(lap.carId))}</td>
              <td>${esc(getCircuitName(lap.circuitId))}</td>
              <td class="time">${esc(msToDisplay(lap.timeMs))}</td>
              <td class="tire">${esc(lap.tireType)}</td>
              <td class="memo">${esc(lap.memo || '—')}</td>
              <td class="date">${esc(formatDate(lap.createdAt))}</td>
              <td><button class="btn-delete" data-id="${lap.id}" title="삭제">&#x2715;</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  app.innerHTML = `
    <div class="page-header">
      <h1>랩타임 목록</h1>
      <a href="/record" class="btn btn-primary">+ 기록하기</a>
    </div>
    <form class="filter-form" id="filterForm">
      <select name="carId">
        <option value="">전체 차량</option>
        ${CARS.map(c => `<option value="${c.id}"${filterCarId === c.id ? ' selected' : ''}>${esc(c.maker)} ${esc(c.model)}</option>`).join('')}
      </select>
      <select name="circuitId">
        <option value="">전체 서킷</option>
        ${CIRCUITS.map(c => `<option value="${c.id}"${filterCircuitId === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}
      </select>
      <button type="submit" class="btn btn-secondary">필터 적용</button>
      ${(filterCarId || filterCircuitId) ? '<a href="/" class="btn btn-ghost">초기화</a>' : ''}
    </form>
    ${listHtml}`;

  // 필터 폼
  document.getElementById('filterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const p = new URLSearchParams();
    if (fd.get('carId')) p.set('carId', fd.get('carId'));
    if (fd.get('circuitId')) p.set('circuitId', fd.get('circuitId'));
    window.location.search = p.toString();
  });

  // 삭제 버튼
  app.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('이 기록을 삭제하시겠습니까?')) return;
      const id = btn.dataset.id;
      const all = loadLaps().filter(l => l.id !== id);
      saveLaps(all);
      window.location.reload();
    });
  });
}

// ── 페이지: 기록 입력 (record) ──────────────────────────
function initRecord() {
  const app = document.getElementById('app');
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');

  let alertHtml = '';
  if (error === 'invalid_time') {
    alertHtml = `<div class="alert alert-error">시간 형식이 올바르지 않습니다. 예: <strong>1:23.456</strong> (분:초.밀리초)</div>`;
  } else if (error === 'missing_fields') {
    alertHtml = `<div class="alert alert-error">차량, 서킷, 랩타임, 타이어는 필수 항목입니다.</div>`;
  }

  app.innerHTML = `
    <div class="page-header">
      <h1>랩타임 기록</h1>
      <a href="/" class="btn btn-ghost">&larr; 목록으로</a>
    </div>
    ${alertHtml}
    <div class="form-card">
      <form id="lapForm" class="lap-form">
        <div class="form-group">
          <label for="carId">차량 <span class="required">*</span></label>
          <select id="carId" name="carId" required>
            <option value="">차량을 선택하세요</option>
            ${CARS.map(c => `<option value="${c.id}">${esc(c.maker)} ${esc(c.model)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="circuitId">서킷 <span class="required">*</span></label>
          <select id="circuitId" name="circuitId" required>
            <option value="">서킷을 선택하세요</option>
            ${CIRCUITS.map(c => `<option value="${c.id}">${esc(c.name)} (${esc(c.country)})</option>`).join('')}
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
            ${TIRE_TYPES.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}
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
    </div>`;

  document.getElementById('lapForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const carId = fd.get('carId');
    const circuitId = fd.get('circuitId');
    const timeInput = fd.get('timeInput');
    const tireType = fd.get('tireType');
    const memo = (fd.get('memo') || '').trim();

    if (!carId || !circuitId || !timeInput || !tireType) {
      window.location.href = '/record?error=missing_fields';
      return;
    }

    const timeMs = displayToMs(timeInput);
    if (!timeMs || timeMs <= 0) {
      window.location.href = '/record?error=invalid_time';
      return;
    }

    const lap = {
      id: Date.now().toString(),
      carId,
      circuitId,
      timeMs,
      tireType,
      memo,
      createdAt: new Date().toISOString()
    };

    const laps = loadLaps();
    laps.push(lap);
    saveLaps(laps);
    window.location.href = '/';
  });
}

// ── 페이지: 통계 (stats) ───────────────────────────────
function initStats() {
  const app = document.getElementById('app');
  const params = new URLSearchParams(window.location.search);
  const selectedCircuitId = params.get('circuitId') || '';

  const laps = loadLaps();

  // 베스트 랩 계산
  const bestMap = {};
  for (const lap of laps) {
    const key = `${lap.carId}__${lap.circuitId}`;
    if (!bestMap[key] || lap.timeMs < bestMap[key].timeMs) {
      bestMap[key] = lap;
    }
  }
  const bestLaps = Object.values(bestMap).sort((a, b) => a.timeMs - b.timeMs);

  let bestHtml;
  if (bestLaps.length === 0) {
    bestHtml = `<div class="empty-state"><p>아직 기록된 랩타임이 없습니다.</p><a href="/record" class="btn btn-primary">기록 추가하기</a></div>`;
  } else {
    bestHtml = `
      <div class="table-wrap">
        <table class="lap-table">
          <thead><tr><th>#</th><th>차량</th><th>서킷</th><th>베스트 타임</th><th>타이어</th><th>날짜</th></tr></thead>
          <tbody>
            ${bestLaps.map((lap, i) => `
            <tr class="${i === 0 ? 'best-row' : ''}">
              <td class="num">${i === 0 ? '&#x1F3C6;' : i + 1}</td>
              <td>${esc(getCarName(lap.carId))}</td>
              <td>${esc(getCircuitName(lap.circuitId))}</td>
              <td class="time best-time">${esc(msToDisplay(lap.timeMs))}</td>
              <td class="tire">${esc(lap.tireType)}</td>
              <td class="date">${esc(formatDate(lap.createdAt))}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // 차트 데이터
  let chartHtml;
  if (selectedCircuitId) {
    const filtered = laps
      .filter(l => l.circuitId === selectedCircuitId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (filtered.length === 0) {
      chartHtml = `<div class="empty-state"><p>선택한 서킷의 기록이 없습니다.</p></div>`;
    } else {
      chartHtml = `<div class="chart-container"><canvas id="lapChart"></canvas></div>`;
    }
  } else {
    chartHtml = `<div class="empty-state"><p>서킷을 선택하면 랩타임 추이 그래프를 볼 수 있습니다.</p></div>`;
  }

  app.innerHTML = `
    <div class="page-header"><h1>통계</h1></div>
    <section class="stats-section">
      <h2>베스트 랩타임</h2>
      ${bestHtml}
    </section>
    <section class="stats-section chart-section">
      <h2>랩타임 추이</h2>
      <form class="filter-form" id="chartFilter">
        <select name="circuitId">
          <option value="">서킷을 선택하세요</option>
          ${CIRCUITS.map(c => `<option value="${c.id}"${selectedCircuitId === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select>
      </form>
      ${chartHtml}
    </section>`;

  // 서킷 선택 시 자동 이동
  document.querySelector('#chartFilter select').addEventListener('change', function () {
    const p = new URLSearchParams();
    if (this.value) p.set('circuitId', this.value);
    window.location.search = p.toString();
  });

  // 차트 그리기
  if (selectedCircuitId && document.getElementById('lapChart')) {
    const filtered = laps
      .filter(l => l.circuitId === selectedCircuitId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const carIds = [...new Set(filtered.map(l => l.carId))];
    const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

    const datasets = carIds.map((carId, i) => {
      const carLaps = filtered.filter(l => l.carId === carId);
      return {
        label: getCarName(carId),
        data: carLaps.map(l => ({ x: l.createdAt, y: l.timeMs })),
        borderColor: COLORS[i % COLORS.length],
        backgroundColor: COLORS[i % COLORS.length] + '33',
        tension: 0.3,
        pointRadius: 4
      };
    });

    new Chart(document.getElementById('lapChart').getContext('2d'), {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${msToDisplay(ctx.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day', displayFormats: { day: 'MM/dd' } },
            title: { display: true, text: '날짜' }
          },
          y: {
            title: { display: true, text: '랩타임' },
            ticks: { callback: (v) => msToDisplay(v) }
          }
        }
      }
    });
  }
}

// ── 페이지 라우팅 ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  if (path === '/' || path === '/index') initIndex();
  else if (path === '/record') initRecord();
  else if (path === '/stats') initStats();
});
