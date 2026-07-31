// Entry point for the CAT app. Wires together patient selection, the
// checklist, scoring, and the report screens.

import { getCurrentUser, login } from "./auth/auth.js";
import { listPatients, getPatient, createPatient, saveAssessment } from "./store/patientStore.js";
import { DEFAULT_CHECKLIST } from "./data/checklist.js";
import { VIDEO_MAP } from "./data/videoMap.js";
import { computeScores } from "./scoring.js";
import { renderChecklist, renderScoreSummary } from "./checklistUI.js";
import { renderScoresTable, initTabs } from "./report.js";
import { initSettingsPanel } from "./settings.js";
import { generateClinicalNarrative } from "./ai/narrative.js";
import { generateCaregiverReport } from "./ai/caregiverReport.js";

const checklist = DEFAULT_CHECKLIST;

// Current in-progress assessment state.
let currentPatientId = null;
let currentAssessmentId = null;
let itemScores = {};

function showSection(sectionId) {
  document.querySelectorAll(".app-section").forEach((section) => {
    section.hidden = section.id !== sectionId;
  });
}

function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------- Login ----------

function initLogin() {
  const form = document.getElementById("login-form");
  const nameInput = document.getElementById("clinician-name-input");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    login(name);
    showPatientList();
  });

  const existingUser = getCurrentUser();
  if (existingUser) {
    showPatientList();
  } else {
    showSection("login-section");
  }
}

// ---------- Patient list ----------

function showPatientList() {
  renderPatientList();
  const signedInAs = document.getElementById("signed-in-as");
  const user = getCurrentUser();
  signedInAs.textContent = user ? `Signed in as ${user}` : "";
  showSection("patient-section");
}

function renderPatientList() {
  const container = document.getElementById("patient-list");
  container.textContent = "";

  const patients = listPatients();
  if (patients.length === 0) {
    const note = document.createElement("p");
    note.className = "placeholder-note";
    note.textContent = "No patients yet. Create one below to get started.";
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

    const meta = document.createElement("div");
    meta.className = "patient-row-meta";
    const assessmentCount = patient.assessments.length;
    meta.textContent = `${assessmentCount} assessment${assessmentCount === 1 ? "" : "s"}`;
    info.appendChild(meta);

    row.appendChild(info);

    const startBtn = document.createElement("button");
    startBtn.className = "btn btn-primary";
    startBtn.type = "button";
    startBtn.textContent = "Start assessment";
    startBtn.addEventListener("click", () => startAssessment(patient.id));
    row.appendChild(startBtn);

    container.appendChild(row);
  });
}

function initNewPatientForm() {
  const form = document.getElementById("new-patient-form");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("patient-name-input").value.trim();
    const dob = document.getElementById("patient-dob-input").value;
    const caregiverName = document.getElementById("caregiver-name-input").value.trim();
    const caregiverRelationship = document.getElementById("caregiver-relationship-input").value.trim();
    const caregiverEmail = document.getElementById("caregiver-email-input").value.trim();

    if (!name) return;

    const patient = createPatient({
      name,
      dob,
      caregiver: {
        name: caregiverName,
        relationship: caregiverRelationship,
        email: caregiverEmail,
      },
    });

    form.reset();
    startAssessment(patient.id);
  });
}

// ---------- Checklist ----------

function startAssessment(patientId) {
  const patient = getPatient(patientId);
  if (!patient) return;

  currentPatientId = patientId;
  currentAssessmentId = generateId();
  itemScores = {};

  document.getElementById("clinician-notes-input").value = "";
  renderChecklistScreen(patient);
  showSection("checklist-section");
}

function renderChecklistScreen(patient) {
  document.getElementById("checklist-patient-name").textContent = `Checklist — ${patient.name}`;

  const domainsContainer = document.getElementById("checklist-domains");
  renderChecklist(checklist, itemScores, VIDEO_MAP, domainsContainer, (itemId, value) => {
    itemScores[itemId] = value;
    updateScoreSummary();
  });

  updateScoreSummary();
}

function updateScoreSummary() {
  const summaryContainer = document.getElementById("score-summary");
  renderScoreSummary(checklist, itemScores, summaryContainer);
}

function persistAssessment() {
  const notes = document.getElementById("clinician-notes-input").value;
  const scores = computeScores(checklist, itemScores);

  const assessment = {
    id: currentAssessmentId,
    checklistId: checklist.id,
    date: new Date().toISOString(),
    itemScores: { ...itemScores },
    notes,
    scores,
  };

  saveAssessment(currentPatientId, assessment);
  return assessment;
}

// ---------- Report ----------

async function generateReport() {
  const loadingEl = document.getElementById("report-loading");
  const errorEl = document.getElementById("report-error");
  const clinicalTextarea = document.getElementById("clinical-narrative-text");
  const caregiverTextarea = document.getElementById("caregiver-narrative-text");

  errorEl.hidden = true;
  errorEl.textContent = "";
  clinicalTextarea.value = "";
  caregiverTextarea.value = "";

  const assessment = persistAssessment();
  const scores = assessment.scores;

  renderScoresTable(scores, document.getElementById("report-scores-table"));
  showSection("report-section");
  initTabs();

  loadingEl.hidden = false;

  try {
    const notes = document.getElementById("clinician-notes-input").value;
    const clinicalNarrative = await generateClinicalNarrative(checklist, itemScores, scores, notes);
    clinicalTextarea.value = clinicalNarrative;

    const caregiverReport = await generateCaregiverReport(clinicalNarrative, scores);
    caregiverTextarea.value = caregiverReport;
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || "Something went wrong generating the report.";
    errorEl.hidden = false;
  } finally {
    loadingEl.hidden = true;
  }
}

// ---------- Init ----------

function init() {
  initLogin();
  initNewPatientForm();
  initSettingsPanel();

  document.getElementById("back-to-patients-btn").addEventListener("click", showPatientList);
  document.getElementById("back-to-checklist-btn").addEventListener("click", () => {
    showSection("checklist-section");
  });
  document.getElementById("generate-report-btn").addEventListener("click", generateReport);
  document.getElementById("print-report-btn").addEventListener("click", () => window.print());
}

init();
