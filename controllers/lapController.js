const lapModel = require('../models/lapModel');
const carModel = require('../models/carModel');
const circuitModel = require('../models/circuitModel');

const TIRE_TYPES = [
  'Comfort: Hard', 'Comfort: Medium', 'Comfort: Soft',
  'Sport: Hard', 'Sport: Medium', 'Sport: Soft',
  'Sport: Super Soft', 'Sport: Intermediate', 'Sport: Heavy Wet',
  'Racing: Hard', 'Racing: Medium', 'Racing: Soft',
  'Racing: Super Soft', 'Racing: Intermediate', 'Racing: Heavy Wet',
  'Dirt Tires', 'Snow Tires'
];

// 밀리초 → "분:초.밀리초" 문자열
function msToDisplay(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

// "분:초.밀리초" 또는 "분:초:밀리초" → 밀리초
function displayToMs(str) {
  const match = str.trim().match(/^(\d+):(\d{2})[.:](\d{1,3})$/);
  if (!match) return null;
  const [, m, s, ms] = match;
  const msVal = parseInt(ms.padEnd(3, '0'));
  return parseInt(m) * 60000 + parseInt(s) * 1000 + msVal;
}

// 랩 배열에 차량/서킷 이름 및 표시용 타임 추가
function enrichLaps(laps, cars, circuits) {
  return laps.map(lap => {
    const car = cars.find(c => c.id === lap.carId);
    const circuit = circuits.find(c => c.id === lap.circuitId);
    return {
      ...lap,
      carName: car ? `${car.maker} ${car.model}` : lap.carId,
      circuitName: circuit ? circuit.name : lap.circuitId,
      timeDisplay: msToDisplay(lap.timeMs),
      dateDisplay: new Date(lap.createdAt).toLocaleDateString('ko-KR')
    };
  });
}

// 차량+서킷 조합별 베스트랩 계산
function computeBestLaps(laps, cars, circuits) {
  const map = {};
  for (const lap of laps) {
    const key = `${lap.carId}__${lap.circuitId}`;
    if (!map[key] || lap.timeMs < map[key].timeMs) {
      map[key] = lap;
    }
  }
  return enrichLaps(Object.values(map), cars, circuits)
    .sort((a, b) => a.timeMs - b.timeMs);
}

// Chart.js용 데이터 생성 (선택 서킷의 차량별 타임 추이)
function buildChartData(laps, cars, circuitId) {
  if (!circuitId) return null;

  const filtered = laps
    .filter(l => l.circuitId === circuitId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (filtered.length === 0) return null;

  const carIds = [...new Set(filtered.map(l => l.carId))];
  const COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
  ];

  const datasets = carIds.map((carId, i) => {
    const car = cars.find(c => c.id === carId);
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

// GET /  — 랩타임 목록
async function getLapList(req, res) {
  try {
    const { carId, circuitId } = req.query;
    let laps = await lapModel.getAll();
    const cars = await carModel.getAll();
    const circuits = await circuitModel.getAll();

    if (carId) laps = laps.filter(l => l.carId === carId);
    if (circuitId) laps = laps.filter(l => l.circuitId === circuitId);

    laps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const enriched = enrichLaps(laps, cars, circuits);

    res.render('index', {
      laps: enriched,
      cars,
      circuits,
      filter: { carId: carId || '', circuitId: circuitId || '' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
}

// GET /record  — 입력 폼
async function getRecordForm(req, res) {
  try {
    const cars = await carModel.getAll();
    const circuits = await circuitModel.getAll();
    res.render('record', {
      cars,
      circuits,
      tireTypes: TIRE_TYPES,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
}

// POST /laps  — 랩타임 저장
async function postLap(req, res) {
  try {
    const { carId, circuitId, timeInput, tireType, memo } = req.body;

    if (!carId || !circuitId || !timeInput || !tireType) {
      return res.redirect('/record?error=missing_fields');
    }

    const timeMs = displayToMs(timeInput);
    if (!timeMs || timeMs <= 0) {
      return res.redirect('/record?error=invalid_time');
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

    await lapModel.add(lap);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('저장 중 오류가 발생했습니다.');
  }
}

// DELETE /laps/:id  — 랩타임 삭제
async function deleteLap(req, res) {
  try {
    await lapModel.deleteById(req.params.id);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('삭제 중 오류가 발생했습니다.');
  }
}

// GET /stats  — 베스트랩 + 그래프
async function getStats(req, res) {
  try {
    const { circuitId } = req.query;
    const laps = await lapModel.getAll();
    const cars = await carModel.getAll();
    const circuits = await circuitModel.getAll();

    const bestLaps = computeBestLaps(laps, cars, circuits);
    const chartData = buildChartData(laps, cars, circuitId);

    res.render('stats', {
      bestLaps,
      chartData: chartData ? JSON.stringify(chartData) : null,
      circuits,
      selectedCircuitId: circuitId || ''
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
}

module.exports = { getLapList, getRecordForm, postLap, deleteLap, getStats };
