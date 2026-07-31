// Generates a clinical narrative from checklist results.
//
// IMPORTANT: no patient-identifying information (name, DOB, caregiver
// identity) is ever included in the prompt sent to Claude. The prompt refers
// only to "the individual". Identity is spliced back in locally, in the
// browser, when the report is displayed.

import { callClaude } from "./client.js";

function formatValue(value) {
  if (value === "present") return "Present";
  if (value === "absent") return "Absent";
  if (value === "na") return "Not Observed";
  return "Not yet rated";
}

function buildResultsSummary(checklist, itemScores, scores) {
  const lines = [];
  lines.push(`Composite score: ${scores.composite !== null ? scores.composite + "%" : "not available"}`);
  lines.push("");

  checklist.domains.forEach((domain, i) => {
    const domainScore = scores.domainScores[i];
    lines.push(`Domain: ${domain.name} — ${domainScore.percent !== null ? domainScore.percent + "%" : "no data"}`);
    domain.items.forEach((item) => {
      lines.push(`  - ${item.text}: ${formatValue(itemScores[item.id])}`);
    });
    lines.push("");
  });

  return lines.join("\n");
}

/**
 * @param {object} checklist
 * @param {Record<string,string>} itemScores
 * @param {{domainScores: any[], composite: number|null}} scores
 * @param {string} [notes] - optional free-text clinician notes (no PII)
 */
export async function generateClinicalNarrative(checklist, itemScores, scores, notes) {
  const resultsSummary = buildResultsSummary(checklist, itemScores, scores);

  const system = "You are assisting a speech-language clinician by drafting a " +
    "clinical narrative summary from structured checklist results. Write in " +
    "professional clinical language appropriate for a clinical record. " +
    "Refer to the person being assessed only as 'the individual' — you have " +
    "not been given their name. Organize the narrative by domain, note " +
    "strengths and areas for growth, and end with general observations. " +
    "This draft will be reviewed and edited by a licensed clinician before " +
    "use, so it does not need a disclaimer in the text itself.";

  let userContent = `Checklist: ${checklist.name}\n\n${resultsSummary}`;
  if (notes && notes.trim()) {
    userContent += `\n\nClinician's free-text observations:\n${notes.trim()}`;
  }

  return callClaude(
    [{ role: "user", content: userContent }],
    { system, maxTokens: 1500 },
  );
}
