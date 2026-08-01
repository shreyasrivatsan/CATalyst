// Renders the Clinical Reports screen: every saved report across all of
// this clinician's patients, most recent first.

import { formatComposite } from "./dashboardView.js";

/**
 * @param {Array<object>} assessments - flattened assessments already
 *   filtered to ones with a saved report, sorted most-recent-first
 * @param {HTMLElement} container
 * @param {(assessment:object)=>void} onView
 */
export function renderReportsList(assessments, container, onView) {
  container.textContent = "";

  if (assessments.length === 0) {
    const note = document.createElement("p");
    note.className = "placeholder-note";
    note.textContent = "No reports generated yet. Generate one from a patient's checklist.";
    container.appendChild(note);
    return;
  }

  assessments.forEach((assessment) => {
    const row = document.createElement("div");
    row.className = "patient-row";

    const info = document.createElement("div");
    info.className = "patient-row-info";

    const name = document.createElement("strong");
    name.textContent = assessment.patientName;
    info.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "patient-row-meta";
    meta.textContent = `${new Date(assessment.date).toLocaleDateString()} — Composite: ${formatComposite(assessment)}`;
    info.appendChild(meta);

    row.appendChild(info);

    const viewBtn = document.createElement("button");
    viewBtn.className = "btn btn-secondary";
    viewBtn.type = "button";
    viewBtn.textContent = "View report";
    viewBtn.addEventListener("click", () => onView(assessment));
    row.appendChild(viewBtn);

    container.appendChild(row);
  });
}
