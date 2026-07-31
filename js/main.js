// Entry point for the CAT app.
// This file will grow to wire together patient selection, the checklist,
// scoring, and the report screens as each is built.

/**
 * Shows one app section and hides the others.
 * @param {string} sectionId - id of the <section> to show
 */
function showSection(sectionId) {
  document.querySelectorAll(".app-section").forEach((section) => {
    section.hidden = section.id !== sectionId;
  });
}

showSection("patient-section");
