// Asigna un color consistente por tutor (mismo id => mismo color en todo el calendario).
// Se deriva deterministamente del UUID del tutor.

const PALETA = [
  { name: "azul", bg: "#2f63f5", soft: "#d9e6ff", text: "#1a3aab" },
  { name: "violeta", bg: "#7c3aed", soft: "#ede4ff", text: "#5b21b6" },
  { name: "esmeralda", bg: "#059669", soft: "#d1fae5", text: "#065f46" },
  { name: "ambar", bg: "#d97706", soft: "#fef3c7", text: "#92400e" },
  { name: "rosa", bg: "#db2777", soft: "#fce7f3", text: "#9d174d" },
  { name: "cian", bg: "#0891b2", soft: "#cffafe", text: "#155e75" },
  { name: "indigo", bg: "#4f46e5", soft: "#e0e7ff", text: "#3730a3" },
  { name: "lima", bg: "#65a30d", soft: "#ecfccb", text: "#3f6212" },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function colorTutor(tutorId: string) {
  return PALETA[hashStr(tutorId) % PALETA.length];
}

export type ColorTutor = (typeof PALETA)[number];
