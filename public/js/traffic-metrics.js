async function fetchTrafficMetrics() {
  try {
    const response = await fetch('/api/traffic-metrics');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch traffic metrics:', error);
    return null;
  }
}

async function renderChart() {
  const metrics = await fetchTrafficMetrics();
  if (!metrics) {
    return;
  }
  const ctx = document.getElementById('trafficMetricsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Total Requests', 'Requests Last Minute'],
      datasets: [{
        label: 'Traffic Metrics',
        data: [metrics.requestCount, metrics.requestsLastMinute],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

renderChart();
