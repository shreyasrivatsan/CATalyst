// Renders the checklist screen: one block per domain, one row per item,
// with Present/Absent/N-A radio options and an optional teaching video link.
//
// All DOM is built with createElement/textContent (never innerHTML with
// dynamic data) so patient names, item text, etc. can never be interpreted
// as HTML.

import { computeScores } from "./scoring.js";

const OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "na", label: "Not Observed" },
];

/**
 * @param {object} checklist
 * @param {Record<string,string>} itemScores - itemId -> 'present'|'absent'|'na'
 * @param {Record<string,string>} videoMap - itemId -> video URL
 * @param {HTMLElement} container
 * @param {(itemId: string, value: string) => void} onChange
 */
export function renderChecklist(checklist, itemScores, videoMap, container, onChange) {
  container.textContent = "";

  checklist.domains.forEach((domain) => {
    const domainBlock = document.createElement("div");
    domainBlock.className = "domain-block";

    const heading = document.createElement("h3");
    heading.textContent = domain.name;
    domainBlock.appendChild(heading);

    domain.items.forEach((item) => {
      const itemRow = document.createElement("div");
      itemRow.className = "checklist-item";

      const itemText = document.createElement("p");
      itemText.className = "item-text";
      itemText.textContent = item.text;
      itemRow.appendChild(itemText);

      const optionsRow = document.createElement("div");
      optionsRow.className = "item-options";

      OPTIONS.forEach((option) => {
        const label = document.createElement("label");
        label.className = "option-label";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `item-${item.id}`;
        input.value = option.value;
        input.checked = itemScores[item.id] === option.value;
        input.addEventListener("change", () => {
          if (input.checked) onChange(item.id, option.value);
        });

        label.appendChild(input);
        label.appendChild(document.createTextNode(` ${option.label}`));
        optionsRow.appendChild(label);
      });

      itemRow.appendChild(optionsRow);

      const videoUrl = videoMap[item.id];
      if (videoUrl) {
        const videoLink = document.createElement("a");
        videoLink.className = "video-link";
        videoLink.href = videoUrl;
        videoLink.target = "_blank";
        videoLink.rel = "noopener noreferrer";
        videoLink.textContent = "\uD83C\uDFA5 Watch teaching video";
        itemRow.appendChild(videoLink);
      }

      domainBlock.appendChild(itemRow);
    });

    container.appendChild(domainBlock);
  });
}

/**
 * @param {object} checklist
 * @param {Record<string,string>} itemScores
 * @param {HTMLElement} container
 */
export function renderScoreSummary(checklist, itemScores, container) {
  const { domainScores, composite } = computeScores(checklist, itemScores);
  container.textContent = "";

  const compositeEl = document.createElement("div");
  compositeEl.className = "composite-score";
  compositeEl.textContent = `Composite score: ${composite !== null ? composite + "%" : "—"}`;
  container.appendChild(compositeEl);

  const list = document.createElement("ul");
  list.className = "domain-score-list";
  domainScores.forEach((d) => {
    const li = document.createElement("li");
    li.textContent = `${d.name}: ${d.percent !== null ? d.percent + "%" : "no data"}`;
    list.appendChild(li);
  });
  container.appendChild(list);
}
