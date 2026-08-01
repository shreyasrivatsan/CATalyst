// Renders the Patients list and the Patient Detail screen.
//
// Pure rendering only — main.js fetches data from patientStore and passes
// it in, and provides callbacks for the actions (view detail, start
// assessment, view a saved report).

import { formatComposite } from "./dashboardView.js";

/**
 * @param {Array<object>} patients
 * @param {HTMLElement} container
 * @param {{ onView: (id:string)=>void, onStartAssessment: (id:string)=>void }} handlers
 */
export function renderPatientsList(patients, container, { onView, onStartAssessment }) {
  container.textContent = "";

  if (patients.length === 0) {
    const note = document.createElement("p");
    note.className = "placeholder-note";
    note.textContent = "No patients yet. Add one from New Assessment.";
    container.appendChild(note);
    return;
  }

  patients.forEach((patient) => {
    const row = document.createElement("div");
    row.className = "patient-row";

    const info = document.createElement("div");
    info.className = "patient-row-info";

    const name = document.createElement("strong");
    name.textContent = patient.name;
    info.appendChild(name);

    const latest = patient.assessments[patient.assessments.length - 1];
    const meta = document.createElement("div");
    meta.className = "patient-row-meta";
    const assessmentCount = patient.assessments.length;
    const compositeStr = latest ? formatComposite(latest) : "no assessments yet";
    meta.textContent = `${assessmentCount} assessment${assessmentCount === 1 ? "" : "s"} — Latest composite: ${compositeStr}`;
    info.appendChild(meta);

    row.appendChild(info);

    const actions = document.createElement("div");
    actions.className = "patient-row-actions";

    const viewBtn = document.createElement("button");
    viewBtn.className = "btn btn-secondary";
    viewBtn.type = "button";
    viewBtn.textContent = "View";
    viewBtn.addEventListener("click", () => onView(patient.id));
    actions.appendChild(viewBtn);

    const startBtn = document.createElement("button");
    startBtn.className = "btn btn-primary";
    startBtn.type = "button";
    startBtn.textContent = "Start assessment";
    startBtn.addEventListener("click", () => onStartAssessment(patient.id));
    actions.appendChild(startBtn);

    row.appendChild(actions);
    container.appendChild(row);
  });
}

/**
 * @param {object} patient
 * @param {HTMLElement} metaContainer
 * @param {HTMLElement} scoresContainer
 * @param {HTMLElement} reportsContainer
 * @param {(assessment:object)=>void} onViewReport
 */
export function renderPatientDetail(patient, metaContainer, scoresContainer, reportsContainer, onViewReport) {
  metaContainer.textContent = "";
  const dobText = patient.dob ? `DOB: ${patient.dob}` : "DOB: not recorded";
  const caregiverText = patient.caregiver?.name
    ? `Caregiver: ${patient.caregiver.name}${patient.caregiver.relationship ? ` (${patient.caregiver.relationship})` : ""}`
    : "Caregiver: not recorded";
  metaContainer.textContent = `${dobText} \u00B7 ${caregiverText}`;

  renderLatestScores(patient, scoresContainer);
  renderReportsList(patient, reportsContainer, onViewReport);
}

function renderLatestScores(patient, container) {
  container.textContent = "";
  const latest = patient.assessments[patient.assessments.length - 1];

  if (!latest) {
    const note = document.createElement("p");
    note.className = "placeholder-note";
    note.textContent = "No assessments recorded yet.";
    container.appendChild(note);
    return;
  }

  const list = document.createElement("ul");
  list.className = "domain-score-list";
  latest.scores.domainScores.forEach((d) => {
    const li = document.createElement("li");
    li.textContent = `${d.name}: ${d.percent !== null ? d.percent + "%" : "no data"}`;
    list.appendChild(li);
  });
  container.appendChild(list);

  const compositeEl = document.createElement("p");
  compositeEl.className = "composite-note";
  compositeEl.textContent = `Composite: ${formatComposite(latest)} (as of ${new Date(latest.date).toLocaleDateString()})`;
  container.appendChild(compositeEl);
}

// Lists every assessment for this patient (not just ones that already have
// a generated report) so a clinician can always get to — or generate — a
// report for any past assessment, even if generation previously failed or
// was never run.
function renderReportsList(patient, container, onViewReport) {
  container.textContent = "";
  const assessments = patient.assessments
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (assessments.length === 0) {
    const note = document.createElement("p");
    note.className = "placeholder-note";
    note.textContent = "No assessments recorded yet.";
    container.appendChild(note);
    return;
  }

  assessments.forEach((assessment) => {
    const hasReport = Boolean(assessment.clinicalNarrative);

    const row = document.createElement("div");
    row.className = "patient-row";

    const info = document.createElement("div");
    const statusText = hasReport ? "Report available" : "No report generated yet";
    info.textContent = `${new Date(assessment.date).toLocaleDateString()} — Composite: ${formatComposite(assessment)} — ${statusText}`;
    row.appendChild(info);

    const viewBtn = document.createElement("button");
    viewBtn.className = "btn btn-secondary";
    viewBtn.type = "button";
    viewBtn.textContent = hasReport ? "View report" : "Generate report";
    viewBtn.addEventListener("click", () => onViewReport(assessment));
    row.appendChild(viewBtn);

    container.appendChild(row);
  });
}
