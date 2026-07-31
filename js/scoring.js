// Scoring engine.
//
// Rules:
// - Each item is "present", "absent", or "na" (not observed / not applicable).
// - "na" items are excluded entirely from both the numerator and denominator.
// - Domain score = weighted percent of applicable items marked "present".
// - Composite score = simple average of domain percentages (domains with no
//   applicable items are excluded from the average). No domain-level
//   weighting for now — only item-level weighting within a domain.

export function computeScores(checklist, itemScores) {
  const domainScores = checklist.domains.map((domain) => {
    let weightedPresent = 0;
    let weightedTotal = 0;

    domain.items.forEach((item) => {
      const value = itemScores[item.id];
      if (value === "present" || value === "absent") {
        const weight = item.weight || 1;
        weightedTotal += weight;
        if (value === "present") weightedPresent += weight;
      }
    });

    const percent = weightedTotal > 0
      ? Math.round((weightedPresent / weightedTotal) * 100)
      : null;

    return { id: domain.id, name: domain.name, percent, weightedPresent, weightedTotal };
  });

  const scoredDomains = domainScores.filter((d) => d.percent !== null);
  const composite = scoredDomains.length > 0
    ? Math.round(scoredDomains.reduce((sum, d) => sum + d.percent, 0) / scoredDomains.length)
    : null;

  return { domainScores, composite };
}
