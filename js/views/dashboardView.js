// Renders the Dashboard screen: summary stat cards + a recent-activity list.
//
// Pure rendering only — main.js computes the stats and assessment list from
// patientStore and passes them in here. No store access from this file.

/**
 * @param {{ totalPatients: number, totalAssessments: number, recentCount: number, avgComposite: number|null }} stats
 * @param {HTMLElement} container
 */
export function renderDashboardStats(stats, container) {
  container.textContent = "";

  const cards = [
    { label: "Total Patients", value: String(stats.totalPatients) },
    { label: "Total Assessments", value: String(stats.totalAssessments) },
    { label: "Assessments (Last 7 Days)", value: String(stats.recentCount) },
    { label: "Average Composite Score", value: stats.avgComposite !== null ? `${stats.avgComposite}%` : "—" },
  ];

  cards.forEach((card) => {
    const cardEl = document.createElement("div");
    cardEl.className = "stat-card";

    const value = document.createElement("div");
    value.className = "stat-value";
    value.textContent = card.value;
    cardEl.appendChild(value);

    const label = document.createElement("div");
    label.className = "stat-label";
    label.textContent = card.label;
    cardEl.appendChild(label);

    container.appendChild(cardEl);
  });
}

/**
 * @param {Array<object>} assessments - flattened assessments (from
 *   patientStore.listAssessments), already sorted most-recent-first
 * @param {HTMLElement} container
 * @param {(patientId: string) => void} onViewPatient
 */
export function renderRecentActivity(assessments, container, onViewPatient) {
  container.textContent = "";

  if (assessments.length === 0) {
    const note = document.createElement("p");
    note.className = "placeholder-note";
    note.textContent = "No assessments yet. Start one from Patients or New Assessment.";
    container.appendChild(note);
    return;
  }

  const list = document.createElement("div");
  list.className = "activity-list";

  assessments.slice(0, 5).forEach((assessment) => {
    const row = document.createElement("div");
    row.className = "activity-row";

    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = assessment.patientName;
    info.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "patient-row-meta";
    meta.textContent = `${new Date(assessment.date).toLocaleDateString()} — Composite: ${formatComposite(assessment)}`;
    info.appendChild(meta);

    row.appendChild(info);

    const btn = document.createElement("button");
    btn.className = "btn btn-secondary";
    btn.type = "button";
    btn.textContent = "View patient";
    btn.addEventListener("click", () => onViewPatient(assessment.patientId));
    row.appendChild(btn);

    list.appendChild(row);
  });

  container.appendChild(list);
}

export function formatComposite(assessment) {
  const composite = assessment.scores?.composite;
  return composite !== null && composite !== undefined ? `${composite}%` : "no score";
}
