const fs = require('fs').promises;
const path = require('path');

const FILE = path.join(__dirname, '../data/laptimes.json');

async function getAll() {
  try {
    const raw = await fs.readFile(FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function add(lap) {
  const laps = await getAll();
  laps.push(lap);
  await fs.writeFile(FILE, JSON.stringify(laps, null, 2), 'utf-8');
}

async function deleteById(id) {
  const laps = await getAll();
  const filtered = laps.filter(l => l.id !== id);
  await fs.writeFile(FILE, JSON.stringify(filtered, null, 2), 'utf-8');
}

async function getByCircuit(circuitId) {
  const laps = await getAll();
  return laps.filter(l => l.circuitId === circuitId);
}

module.exports = { getAll, add, deleteById, getByCircuit };
