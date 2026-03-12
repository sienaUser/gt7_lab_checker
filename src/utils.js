export function msToDisplay(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export function displayToMs(str) {
  const match = str.trim().match(/^(\d+):(\d{2})[.:](\d{1,3})$/);
  if (!match) return null;
  const [, m, s, ms] = match;
  const msVal = parseInt(ms.padEnd(3, '0'));
  return parseInt(m) * 60000 + parseInt(s) * 1000 + msVal;
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
