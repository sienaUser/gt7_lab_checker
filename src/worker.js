import { Hono } from 'hono';
import { indexPage, recordPage, statsPage } from './templates';
import { msToDisplay, displayToMs, escapeHtml } from './utils';

// ── 정적 데이터 (cars, circuits는 읽기 전용) ──────────────────
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

// 초기 시드 데이터 (KV가 비어있을 때 사용)
const SEED_LAPTIMES = [
  { id: '1741100000001', carId: 'car_001', circuitId: 'cir_002', timeMs: 135891, tireType: 'Sport: Soft', memo: '기본 세팅, 첫 주행', createdAt: '2026-02-28T10:00:00.000Z' },
  { id: '1741100000002', carId: 'car_001', circuitId: 'cir_002', timeMs: 134210, tireType: 'Sport: Soft', memo: '브레이크 포인트 조정', createdAt: '2026-03-01T11:30:00.000Z' },
  { id: '1741100000003', carId: 'car_001', circuitId: 'cir_002', timeMs: 132755, tireType: 'Racing: Medium', memo: '타이어 업그레이드, 스프링 소프트', createdAt: '2026-03-02T14:00:00.000Z' },
  { id: '1741100000004', carId: 'car_004', circuitId: 'cir_002', timeMs: 128430, tireType: 'Racing: Soft', memo: 'RX-7 첫 시도, 오버스티어 세팅', createdAt: '2026-03-02T16:00:00.000Z' },
  { id: '1741100000005', carId: 'car_004', circuitId: 'cir_002', timeMs: 126980, tireType: 'Racing: Soft', memo: '다운포스 조정, 랩 단축 성공', createdAt: '2026-03-03T10:00:00.000Z' },
  { id: '1741100000006', carId: 'car_008', circuitId: 'cir_001', timeMs: 362145, tireType: 'Racing: Hard', memo: '뉘르 GP 첫 주행, 풀 탱크', createdAt: '2026-03-04T09:00:00.000Z' },
  { id: '1741100000007', carId: 'car_008', circuitId: 'cir_001', timeMs: 358820, tireType: 'Racing: Medium', memo: '타이어 변경, 섹터2 개선', createdAt: '2026-03-05T13:00:00.000Z' }
];

// ── KV 헬퍼 ──────────────────────────────────────────────
async function getAllLaps(kv) {
  const data = await kv.get('laptimes', { type: 'json' });
  if (data === null) {
    await kv.put('laptimes', JSON.stringify(SEED_LAPTIMES));
    return [...SEED_LAPTIMES];
  }
  return data;
}

async function saveLaps(kv, laps) {
  await kv.put('laptimes', JSON.stringify(laps));
}

// ── 데이터 가공 ──────────────────────────────────────────
function enrichLaps(laps) {
  return laps.map(lap => {
    const car = CARS.find(c => c.id === lap.carId);
    const circuit = CIRCUITS.find(c => c.id === lap.circuitId);
    return {
      ...lap,
      carName: car ? `${car.maker} ${car.model}` : lap.carId,
      circuitName: circuit ? circuit.name : lap.circuitId,
      timeDisplay: msToDisplay(lap.timeMs),
      dateDisplay: new Date(lap.createdAt).toLocaleDateString('ko-KR')
    };
  });
}

function computeBestLaps(laps) {
  const map = {};
  for (const lap of laps) {
    const key = `${lap.carId}__${lap.circuitId}`;
    if (!map[key] || lap.timeMs < map[key].timeMs) {
      map[key] = lap;
    }
  }
  return enrichLaps(Object.values(map)).sort((a, b) => a.timeMs - b.timeMs);
}

function buildChartData(laps, circuitId) {
  if (!circuitId) return null;
  const filtered = laps
    .filter(l => l.circuitId === circuitId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (filtered.length === 0) return null;

  const carIds = [...new Set(filtered.map(l => l.carId))];
  const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

  const datasets = carIds.map((carId, i) => {
    const car = CARS.find(c => c.id === carId);
    const carLaps = filtered.filter(l => l.carId === carId);
    return {
      label: car ? `${car.maker} ${car.model}` : carId,
      data: carLaps.map(l => ({ x: l.createdAt, y: l.timeMs })),
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: COLORS[i % COLORS.length] + '33',
      tension: 0.3,
      pointRadius: 4
    };
  });

  return { datasets };
}

// ── Hono 앱 ──────────────────────────────────────────────
const app = new Hono();

// GET / — 랩타임 목록
app.get('/', async (c) => {
  const kv = c.env.DATA;
  const carId = c.req.query('carId') || '';
  const circuitId = c.req.query('circuitId') || '';

  let laps = await getAllLaps(kv);
  if (carId) laps = laps.filter(l => l.carId === carId);
  if (circuitId) laps = laps.filter(l => l.circuitId === circuitId);
  laps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const enriched = enrichLaps(laps);
  return c.html(indexPage(enriched, CARS, CIRCUITS, { carId, circuitId }));
});

// GET /record — 기록 입력 폼
app.get('/record', (c) => {
  const error = c.req.query('error') || null;
  return c.html(recordPage(CARS, CIRCUITS, TIRE_TYPES, error));
});

// POST /laps — 랩타임 저장
app.post('/laps', async (c) => {
  const kv = c.env.DATA;
  const body = await c.req.parseBody();
  const { carId, circuitId, timeInput, tireType, memo } = body;

  if (!carId || !circuitId || !timeInput || !tireType) {
    return c.redirect('/record?error=missing_fields');
  }

  const timeMs = displayToMs(timeInput);
  if (!timeMs || timeMs <= 0) {
    return c.redirect('/record?error=invalid_time');
  }

  const lap = {
    id: Date.now().toString(),
    carId,
    circuitId,
    timeMs,
    tireType,
    memo: (memo || '').trim(),
    createdAt: new Date().toISOString()
  };

  const laps = await getAllLaps(kv);
  laps.push(lap);
  await saveLaps(kv, laps);
  return c.redirect('/');
});

// POST /laps/:id?_method=DELETE — 랩타임 삭제 (method-override)
app.post('/laps/:id', async (c) => {
  const method = c.req.query('_method');
  if (method !== 'DELETE') {
    return c.text('Method not allowed', 405);
  }

  const kv = c.env.DATA;
  const id = c.req.param('id');
  const laps = await getAllLaps(kv);
  const filtered = laps.filter(l => l.id !== id);
  await saveLaps(kv, filtered);
  return c.redirect('/');
});

// GET /stats — 통계
app.get('/stats', async (c) => {
  const kv = c.env.DATA;
  const circuitId = c.req.query('circuitId') || '';

  const laps = await getAllLaps(kv);
  const bestLaps = computeBestLaps(laps);
  const chartData = buildChartData(laps, circuitId);

  return c.html(statsPage(bestLaps, CIRCUITS, chartData, circuitId));
});

export default app;
