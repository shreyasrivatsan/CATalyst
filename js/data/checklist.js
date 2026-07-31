// Default checklist content.
//
// This is a GENERIC, non-verbatim checklist structured around the three
// domains commonly used in the SCERTS framework (Social Communication,
// Emotional Regulation, Transactional Support). It is NOT a reproduction of
// any licensed instrument (Communication Matrix, Triple-C, or SCERTS itself)
// — it's a placeholder built for this prototype demo. A clinician using a
// licensed instrument should treat this as a starting template only.
//
// Each item is rated Present / Absent / Not Observed (N/A).
// `weight` defaults to 1 (no special weighting) but can be edited per item.

export const DEFAULT_CHECKLIST = {
  id: "default-scerts-inspired",
  name: "Communication & Regulation Checklist (Generic / Sample)",
  domains: [
    {
      id: "social-communication",
      name: "Social Communication",
      items: [
        { id: "sc-1", text: "Makes eye contact or shares attention with a communication partner", weight: 1 },
        { id: "sc-2", text: "Follows another person's point, gaze, or gesture toward an object or event", weight: 1 },
        { id: "sc-3", text: "Initiates a gesture (e.g., reaching, pointing, showing) to request a want or need", weight: 1 },
        { id: "sc-4", text: "Initiates communication to comment on or share interest in something", weight: 1 },
        { id: "sc-5", text: "Uses words, signs, pictures, or an AAC device to communicate a message", weight: 1 },
        { id: "sc-6", text: "Combines two or more words/symbols to express an idea", weight: 1 },
        { id: "sc-7", text: "Responds appropriately to a simple question or direction from a partner", weight: 1 },
      ],
    },
    {
      id: "emotional-regulation",
      name: "Emotional Regulation",
      items: [
        { id: "er-1", text: "Seeks comfort or help from a familiar adult when distressed", weight: 1 },
        { id: "er-2", text: "Communicates emotional state to a partner (e.g., shows they are upset, excited, tired)", weight: 1 },
        { id: "er-3", text: "Accepts and responds to a caregiver's soothing or calming strategy", weight: 1 },
        { id: "er-4", text: "Uses a self-calming strategy independently when upset (e.g., deep breaths, moving to a quiet space)", weight: 1 },
        { id: "er-5", text: "Recovers from an emotional upset within a reasonable amount of time", weight: 1 },
        { id: "er-6", text: "Tolerates a change in routine or activity without prolonged distress", weight: 1 },
      ],
    },
    {
      id: "transactional-support",
      name: "Transactional Support",
      items: [
        { id: "ts-1", text: "Engages when a communication partner uses simplified language or a slower pace", weight: 1 },
        { id: "ts-2", text: "Responds to visual supports when provided (e.g., picture schedule, cue cards)", weight: 1 },
        { id: "ts-3", text: "Participates in a structured activity with adult or peer support", weight: 1 },
        { id: "ts-4", text: "Uses or accepts an AAC device/communication board when offered", weight: 1 },
        { id: "ts-5", text: "Attends to and follows a modeled communication strategy from a partner", weight: 1 },
      ],
    },
  ],
};
