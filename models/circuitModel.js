const fs = require('fs').promises;
const path = require('path');

const FILE = path.join(__dirname, '../data/circuits.json');

async function getAll() {
  try {
    const raw = await fs.readFile(FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function getById(id) {
  const circuits = await getAll();
  return circuits.find(c => c.id === id) || null;
}

module.exports = { getAll, getById };
