const SUBJECT_GRADIENTS = [
  "bg-gradient-to-br from-orange-600 to-red-600",
  "bg-gradient-to-br from-blue-600 to-indigo-700",
  "bg-gradient-to-br from-emerald-600 to-teal-700",
  "bg-gradient-to-br from-violet-600 to-purple-700",
  "bg-gradient-to-br from-amber-500 to-orange-600",
  "bg-gradient-to-br from-sky-500 to-blue-700",
  "bg-gradient-to-br from-rose-500 to-pink-700",
  "bg-gradient-to-br from-lime-500 to-green-600"
];
const SUBJECT_BORDER_HOVERS = [
  "hover:border-l-orange-500",
  "hover:border-l-blue-500",
  "hover:border-l-emerald-500",
  "hover:border-l-violet-500",
  "hover:border-l-amber-500",
  "hover:border-l-sky-500",
  "hover:border-l-rose-500",
  "hover:border-l-lime-500"
];
const SUBJECT_PILL_CLASSES = [
  { bg: "bg-orange-100", text: "text-orange-600", darkBg: "dark:bg-orange-900/30", darkText: "dark:text-orange-400", border: "border-orange-200", darkBorder: "dark:border-orange-800/50" },
  { bg: "bg-blue-100", text: "text-blue-600", darkBg: "dark:bg-blue-900/30", darkText: "dark:text-blue-400", border: "border-blue-200", darkBorder: "dark:border-blue-800/50" },
  { bg: "bg-emerald-100", text: "text-emerald-600", darkBg: "dark:bg-emerald-900/30", darkText: "dark:text-emerald-400", border: "border-emerald-200", darkBorder: "dark:border-emerald-800/50" },
  { bg: "bg-violet-100", text: "text-violet-600", darkBg: "dark:bg-violet-900/30", darkText: "dark:text-violet-400", border: "border-violet-200", darkBorder: "dark:border-violet-800/50" },
  { bg: "bg-amber-100", text: "text-amber-600", darkBg: "dark:bg-amber-900/30", darkText: "dark:text-amber-400", border: "border-amber-200", darkBorder: "dark:border-amber-800/50" },
  { bg: "bg-sky-100", text: "text-sky-600", darkBg: "dark:bg-sky-900/30", darkText: "dark:text-sky-400", border: "border-sky-200", darkBorder: "dark:border-sky-800/50" },
  { bg: "bg-rose-100", text: "text-rose-600", darkBg: "dark:bg-rose-900/30", darkText: "dark:text-rose-400", border: "border-rose-200", darkBorder: "dark:border-rose-800/50" },
  { bg: "bg-lime-100", text: "text-lime-600", darkBg: "dark:bg-lime-900/30", darkText: "dark:text-lime-400", border: "border-lime-200", darkBorder: "dark:border-lime-800/50" }
];
const SUBJECT_HEX_COLORS = [
  "#f97316",
  // orange
  "#3b82f6",
  // blue
  "#10b981",
  // emerald
  "#8b5cf6",
  // violet
  "#f59e0b",
  // amber
  "#0ea5e9",
  // sky
  "#f43f5e",
  // rose
  "#84cc16"
  // lime
];
const SUBJECT_EMOJIS = ["⚡", "💻", "🌱", "🎨", "🔭", "🧮", "📚", "🔬"];
function getSubjectIndex(subject) {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % SUBJECT_HEX_COLORS.length;
}
function getSubjectHex(subject) {
  return SUBJECT_HEX_COLORS[getSubjectIndex(subject)];
}
function getSubjectGradient(subject) {
  return SUBJECT_GRADIENTS[getSubjectIndex(subject)];
}
function getSubjectBorderHover(subject) {
  return SUBJECT_BORDER_HOVERS[getSubjectIndex(subject)];
}
function getSubjectPill(subject) {
  return SUBJECT_PILL_CLASSES[getSubjectIndex(subject)];
}
function getSubjectEmoji(subject) {
  return SUBJECT_EMOJIS[getSubjectIndex(subject)];
}
const SUBJECT_ICON_BG = [
  "bg-orange-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-lime-500"
];
function getSubjectIconBg(subject) {
  return SUBJECT_ICON_BG[getSubjectIndex(subject)];
}
const SUBJECT_TEXT_COLORS = [
  "text-amber-500",
  "text-sky-500",
  "text-emerald-500",
  "text-violet-500",
  "text-orange-500",
  "text-blue-500",
  "text-rose-500",
  "text-lime-500"
];
function getSubjectTextColor(subject) {
  return SUBJECT_TEXT_COLORS[getSubjectIndex(subject)];
}
export {
  getSubjectIconBg as a,
  getSubjectPill as b,
  getSubjectHex as c,
  getSubjectBorderHover as d,
  getSubjectGradient as e,
  getSubjectTextColor as f,
  getSubjectEmoji as g
};
