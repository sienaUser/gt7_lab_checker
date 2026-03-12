const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const ENTRY = path.join(ROOT, 'src', 'worker.js');
const OUT = path.join(DIST, '_worker.js');

// dist 디렉토리 초기화
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// public/ 정적 파일을 dist/로 복사
copyDir(PUBLIC, DIST);

// src/worker.js → dist/_worker.js 번들링
execSync(
  `npx esbuild "${ENTRY}" --bundle --outfile="${OUT}" --format=esm --minify`,
  { stdio: 'inherit', cwd: ROOT }
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
