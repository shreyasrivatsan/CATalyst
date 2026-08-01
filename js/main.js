// Entry point for the CATalyst app. Wires together sign-in, the sidebar
// shell, patient management, the checklist, scoring, and reports.

import { getCurrentUser, login } from "./auth/auth.js";
import {
  listPatients,
  getPatient,
  createPatient,
  saveAssessment,
  listAssessments,
} from "./store/patientStore.js";
import { DEFAULT_CHECKLIST } from "./data/checklist.js";
import { VIDEO_MAP } from "./data/videoMap.js";
import { computeScores } from "./scoring.js";
import { renderChecklist, renderScoreSummary } from "./checklistUI.js";
import { renderScoresTable, initTabs } from "./report.js";
import { getApiKey, setApiKey, clearApiKey } from "./settings.js";
import { generateClinicalNarrative } from "./ai/narrative.js";
import { generateCaregiverReport } from "./ai/caregiverReport.js";
import { renderDashboardStats, renderRecentActivity } from "./views/dashboardView.js";
import { renderPatientsList, renderPatientDetail } from "./views/patientsView.js";
import { renderReportsList } from "./views/reportsView.js";

const checklist = DEFAULT_CHECKLIST;

// Current in-progress assessment state.
let currentPatientId = null;
let currentAssessmentId = null;
let itemScores = {};

// Which patient is showing in Patient Detail, so its "Start new assessment"
// button knows who to start for.
let currentDetailPatientId = null;

// Which shell view to return to when the report screen's "Back" is clicked
// — depends on how the user got there (fresh generation vs. reopening a
// saved report from Patient Detail or Clinical Reports).
let reportBackTarget = "checklist-view";

// Which shell view to return to when Settings' "Back" is clicked.
let viewBeforeSettings = "dashboard-view";

// ---------- Shell navigation ----------

function showShellView(viewId) {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = view.id !== viewId;
  });
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });
}

function enterApp() {
  document.getElementById("login-wrapper").hidden = true;
  document.getElementById("app-shell").hidden = false;
  document.getElementById("signed-in-as").textContent = `Signed in as ${getCurrentUser()}`;
  goToDashboard();
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
    enterApp();
  });

  if (getCurrentUser()) {
    enterApp();
  }
}

// ---------- Dashboard ----------

function goToDashboard() {
  const clinician = getCurrentUser();
  const patients = listPatients(clinician);
  const assessments = listAssessments(clinician);

  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCount = assessments.filter((a) => new Date(a.date).getTime() >= weekAgoMs).length;

  const scored = assessments.filter(
    (a) => a.scores?.composite !== null && a.scores?.composite !== undefined
  );
  const avgComposite = scored.length
    ? Math.round(scored.reduce((sum, a) => sum + a.scores.composite, 0) / scored.length)
    : null;

  renderDashboardStats(
    {
      totalPatients: patients.length,
      totalAssessments: assessments.length,
      recentCount,
      avgComposite,
    },
    document.getElementById("dashboard-stats")
  );

  renderRecentActivity(assessments, document.getElementById("dashboard-recent"), (patientId) => {
    goToPatientDetail(patientId);
  });

  showShellView("dashboard-view");
}

// ---------- Patients ----------

function goToPatients() {
  const patients = listPatients(getCurrentUser());
  renderPatientsList(patients, document.getElementById("patients-list"), {
    onView: (id) => goToPatientDetail(id),
    onStartAssessment: (id) => startAssessment(id),
  });
  showShellView("patients-view");
}

function goToPatientDetail(patientId) {
  const patient = getPatient(patientId);
  if (!patient) {
    goToPatients();
    return;
  }
  currentDetailPatientId = patientId;

  document.getElementById("patient-detail-name").textContent = patient.name;
  renderPatientDetail(
    patient,
    document.getElementById("patient-detail-meta"),
    document.getElementById("patient-detail-scores"),
    document.getElementById("patient-detail-reports"),
    (assessment) => showSavedReport(patient, assessment, "patient-detail-view")
  );

  showShellView("patient-detail-view");
}

// ---------- New Assessment ----------

function goToNewAssessment() {
  const patients = listPatients(getCurrentUser());
  renderPatientsList(patients, document.getElementById("new-assessment-existing-list"), {
    onView: (id) => goToPatientDetail(id),
    onStartAssessment: (id) => startAssessment(id),
  });
  showShellView("new-assessment-view");
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
      clinicianName: getCurrentUser(),
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
  showShellView("checklist-view");
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
  const saveStatusEl = document.getElementById("report-save-status");
  const clinicalTextarea = document.getElementById("clinical-narrative-text");
  const caregiverTextarea = document.getElementById("caregiver-narrative-text");

  errorEl.hidden = true;
  errorEl.textContent = "";
  saveStatusEl.hidden = true;
  clinicalTextarea.value = "";
  caregiverTextarea.value = "";

  const assessment = persistAssessment();
  const scores = assessment.scores;

  renderScoresTable(scores, document.getElementById("report-scores-table"));
  reportBackTarget = "checklist-view";
  showShellView("report-view");
  initTabs();

  loadingEl.hidden = false;

  try {
    const notes = document.getElementById("clinician-notes-input").value;
    const clinicalNarrative = await generateClinicalNarrative(checklist, itemScores, scores, notes);
    clinicalTextarea.value = clinicalNarrative;

    const caregiverReport = await generateCaregiverReport(clinicalNarrative, scores);
    caregiverTextarea.value = caregiverReport;

    // Persist the generated report onto the assessment record so it can be
    // reopened later from Patient Detail or Clinical Reports.
    assessment.clinicalNarrative = clinicalNarrative;
    assessment.caregiverNarrative = caregiverReport;
    assessment.reportGeneratedAt = new Date().toISOString();
    saveAssessment(currentPatientId, assessment);
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || "Something went wrong generating the report.";
    errorEl.hidden = false;
  } finally {
    loadingEl.hidden = true;
  }
}

function showSavedReport(patient, assessment, backTarget) {
  currentPatientId = patient.id;
  currentAssessmentId = assessment.id;
  reportBackTarget = backTarget;

  document.getElementById("report-error").hidden = true;
  document.getElementById("report-loading").hidden = true;
  document.getElementById("report-save-status").hidden = true;

  renderScoresTable(assessment.scores, document.getElementById("report-scores-table"));
  document.getElementById("clinical-narrative-text").value = assessment.clinicalNarrative || "";
  document.getElementById("caregiver-narrative-text").value = assessment.caregiverNarrative || "";

  showShellView("report-view");
  initTabs();
}

function initReportActions() {
  document.getElementById("report-back-btn").addEventListener("click", () => {
    showShellView(reportBackTarget);
  });

  document.getElementById("print-report-btn").addEventListener("click", () => window.print());

  document.getElementById("save-report-btn").addEventListener("click", () => {
    if (!currentPatientId || !currentAssessmentId) return;
    const patient = getPatient(currentPatientId);
    const assessment = patient?.assessments.find((a) => a.id === currentAssessmentId);
    if (!assessment) return;

    assessment.clinicalNarrative = document.getElementById("clinical-narrative-text").value;
    assessment.caregiverNarrative = document.getElementById("caregiver-narrative-text").value;
    saveAssessment(currentPatientId, assessment);

    const statusEl = document.getElementById("report-save-status");
    statusEl.hidden = false;
    setTimeout(() => {
      statusEl.hidden = true;
    }, 2000);
  });
}

// ---------- Clinical Reports ----------

function goToReports() {
  const assessments = listAssessments(getCurrentUser()).filter((a) => a.clinicalNarrative);
  renderReportsList(assessments, document.getElementById("reports-list"), (assessment) => {
    const patient = getPatient(assessment.patientId);
    if (!patient) return;
    showSavedReport(patient, assessment, "reports-view");
  });
  showShellView("reports-view");
}

// ---------- Sidebar navigation ----------

function initSidebarNav() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view === "dashboard-view") goToDashboard();
      else if (view === "patients-view") goToPatients();
      else if (view === "new-assessment-view") goToNewAssessment();
      else if (view === "reports-view") goToReports();
    });
  });

  document.getElementById("back-to-patients-list-btn").addEventListener("click", goToPatients);
  document.getElementById("start-assessment-for-patient-btn").addEventListener("click", () => {
    if (currentDetailPatientId) startAssessment(currentDetailPatientId);
  });
  document.getElementById("back-to-patients-btn").addEventListener("click", goToPatients);
}

// ---------- Settings ----------

function initSettingsSection() {
  const openBtn = document.getElementById("open-settings-btn");
  const closeBtn = document.getElementById("close-settings-btn");
  const saveBtn = document.getElementById("save-api-key-btn");
  const clearBtn = document.getElementById("clear-api-key-btn");
  const input = document.getElementById("api-key-input");
  const statusEl = document.getElementById("api-key-status");

  function refreshStatus() {
    statusEl.textContent = getApiKey()
      ? "An API key is set for this browser tab."
      : "No API key set.";
  }

  openBtn.addEventListener("click", () => {
    const currentView = document.querySelector("#app-shell .view:not([hidden])");
    if (currentView) viewBeforeSettings = currentView.id;

    input.value = getApiKey();
    refreshStatus();
    showShellView("settings-view");
  });

  closeBtn.addEventListener("click", () => {
    showShellView(viewBeforeSettings);
  });

  saveBtn.addEventListener("click", () => {
    const key = input.value.trim();
    if (key) {
      setApiKey(key);
      refreshStatus();
    }
  });

  clearBtn.addEventListener("click", () => {
    clearApiKey();
    input.value = "";
    refreshStatus();
  });
}

// ---------- Init ----------

function init() {
  initLogin();
  initNewPatientForm();
  initSettingsSection();
  initSidebarNav();
  initReportActions();

  document.getElementById("generate-report-btn").addEventListener("click", generateReport);
}

init();
