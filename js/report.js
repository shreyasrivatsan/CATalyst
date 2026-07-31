// Report screen helpers: scores table and tab switching between the
// clinical and caregiver views.

/**
 * @param {{domainScores: any[], composite: number|null}} scores
 * @param {HTMLElement} container
 */
export function renderScoresTable(scores, container) {
  container.textContent = "";

  const table = document.createElement("table");
  table.className = "scores-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Domain", "Score"].forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  scores.domainScores.forEach((d) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = d.name;
    row.appendChild(nameCell);

    const scoreCell = document.createElement("td");
    scoreCell.textContent = d.percent !== null ? `${d.percent}%` : "no data";
    row.appendChild(scoreCell);

    tbody.appendChild(row);
  });

  const compositeRow = document.createElement("tr");
  compositeRow.className = "composite-row";
  const compositeLabel = document.createElement("td");
  compositeLabel.textContent = "Composite";
  compositeRow.appendChild(compositeLabel);
  const compositeValue = document.createElement("td");
  compositeValue.textContent = scores.composite !== null ? `${scores.composite}%` : "no data";
  compositeRow.appendChild(compositeValue);
  tbody.appendChild(compositeRow);

  table.appendChild(tbody);
  container.appendChild(table);
}

export function initTabs() {
  const clinicalTabBtn = document.getElementById("clinical-tab-btn");
  const caregiverTabBtn = document.getElementById("caregiver-tab-btn");
  const clinicalTab = document.getElementById("clinical-tab");
  const caregiverTab = document.getElementById("caregiver-tab");

  if (!clinicalTabBtn || !caregiverTabBtn) return;

  function showTab(tab) {
    const isClinical = tab === "clinical";
    clinicalTab.hidden = !isClinical;
    caregiverTab.hidden = isClinical;
    clinicalTabBtn.classList.toggle("active", isClinical);
    caregiverTabBtn.classList.toggle("active", !isClinical);
  }

  clinicalTabBtn.addEventListener("click", () => showTab("clinical"));
  caregiverTabBtn.addEventListener("click", () => showTab("caregiver"));

  showTab("clinical");
}
