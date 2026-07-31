// Patient data store.
//
// Backed by localStorage for this prototype so patient records persist
// across browser sessions without needing a server. This is a stand-in
// "database" — it's per-browser/per-device, unencrypted, and capped at a
// few MB, so it is not production-grade. The functions below are the only
// thing the rest of the app touches, so swapping this for a real backend
// later is a one-file change.

const STORAGE_KEY = "cat_patients_v1";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read patient data from local storage", err);
    return [];
  }
}

function writeAll(patients) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function listPatients() {
  return readAll();
}

export function getPatient(patientId) {
  return readAll().find((p) => p.id === patientId) || null;
}

export function createPatient({ name, dob, caregiver }) {
  const patients = readAll();
  const patient = {
    id: generateId(),
    name,
    dob: dob || "",
    caregiver: {
      name: caregiver?.name || "",
      relationship: caregiver?.relationship || "",
      email: caregiver?.email || "",
    },
    assessments: [],
  };
  patients.push(patient);
  writeAll(patients);
  return patient;
}

export function saveAssessment(patientId, assessment) {
  const patients = readAll();
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) throw new Error(`Patient ${patientId} not found`);

  const existingIndex = patient.assessments.findIndex((a) => a.id === assessment.id);
  if (existingIndex >= 0) {
    patient.assessments[existingIndex] = assessment;
  } else {
    patient.assessments.push(assessment);
  }
  writeAll(patients);
  return assessment;
}

export function deletePatient(patientId) {
  const patients = readAll().filter((p) => p.id !== patientId);
  writeAll(patients);
}
