const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const PUBLIC = path.join(__dirname, 'public');

// dist 디렉토리 초기화
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// public/ 정적 파일을 dist/로 복사
copyDir(PUBLIC, DIST);

// src/worker.js → dist/_worker.js 번들링
execSync(
  'npx esbuild src/worker.js --bundle --outfile=dist/_worker.js --format=esm --minify',
  { stdio: 'inherit' }
);

console.log('Build complete → dist/');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
