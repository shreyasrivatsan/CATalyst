// Renders a composite-score-over-time line chart for a patient's assessment
// history, using Chart.js (loaded via a CDN <script> tag in index.html —
// available globally as window.Chart, not imported as a module).
//
// Pure rendering only: main.js passes in the patient and the target
// canvas/empty-state elements; this file owns creating and tearing down the
// Chart.js instance.

let chartInstance = null;

/**
 * @param {object} patient
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} emptyStateEl - shown instead of the chart when there
 *   isn't enough scored data yet (fewer than two scored assessments)
 */
export function renderTrendChart(patient, canvas, emptyStateEl) {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const scored = patient.assessments
    .filter((a) => a.scores?.composite !== null && a.scores?.composite !== undefined)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (scored.length < 2 || typeof window.Chart === "undefined") {
    canvas.hidden = true;
    emptyStateEl.hidden = false;
    return;
  }

  canvas.hidden = false;
  emptyStateEl.hidden = true;

  const labels = scored.map((a) => new Date(a.date).toLocaleDateString());
  const data = scored.map((a) => a.scores.composite);

  chartInstance = new window.Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Composite score",
          data,
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.12)",
          tension: 0.25,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#4f46e5",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { callback: (value) => `${value}%` },
        },
      },
    },
  });
}
