// Generates a caregiver-friendly version of the clinical narrative.
//
// Takes the already-generated clinical narrative and asks Claude to
// re-express it in warm, plain, jargon-free language for a parent or
// caregiver. No patient name or other identifying information is included
// in the prompt.

import { callClaude } from "./client.js";

/**
 * @param {string} clinicalNarrative
 * @param {{domainScores: any[], composite: number|null}} scores
 * @param {(textSoFar: string) => void} [onDelta] - called as text streams in
 */
export async function generateCaregiverReport(clinicalNarrative, scores, onDelta) {
  const system = "You are helping translate a clinical communication " +
    "assessment summary into a warm, plain-language report for a parent " +
    "or caregiver who is not a clinician. Avoid jargon and acronyms, or " +
    "explain them simply if unavoidable. Be encouraging and respectful, " +
    "focus on what the results mean for the child day-to-day, and suggest " +
    "supportive next steps in general terms. Do not use the word " +
    "'individual' — refer to 'your child'. Do not include any clinical " +
    "scoring jargon like percentages unless you also explain what they mean.";

  const userContent = `Here is the clinical summary to translate for a caregiver:\n\n${clinicalNarrative}` +
    `\n\n(Composite score for reference: ${scores.composite !== null ? scores.composite + "%" : "not available"})`;

  return callClaude(
    [{ role: "user", content: userContent }],
    { system, maxTokens: 1500, onDelta },
  );
}
