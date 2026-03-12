(function () {
  const data = window.LAP_CHART_DATA;
  if (!data) return;

  function msToDisplay(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  }

  const ctx = document.getElementById('lapChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${msToDisplay(context.parsed.y)}`;
            }
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
          ticks: {
            callback: function (value) {
              return msToDisplay(value);
            }
          }
        }
      }
    }
  });
})();
