/**
 * PRISM Instructor OS — Subject Utilities
 *
 * Provides deterministic color, emoji, and Tailwind class mappings for any
 * custom subject string.  All components should use these helpers instead of
 * branching on `subject === 'Solar'` or `subject === 'ICT'`.
 *
 * Color palette is stable across renders — the same subject name always maps
 * to the same index bucket.
 */

// ─── Palette Definitions ───────────────────────────────────────────────
/** Tailwind gradient classes used for glassy subject header banners */
export const SUBJECT_GRADIENTS = [
  'bg-gradient-to-br from-orange-600 to-red-600',
  'bg-gradient-to-br from-blue-600 to-indigo-700',
  'bg-gradient-to-br from-emerald-600 to-teal-700',
  'bg-gradient-to-br from-violet-600 to-purple-700',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-sky-500 to-blue-700',
  'bg-gradient-to-br from-rose-500 to-pink-700',
  'bg-gradient-to-br from-lime-500 to-green-600',
];

/** Tailwind hover border-left color classes for class-list cards */
export const SUBJECT_BORDER_HOVERS = [
  'hover:border-l-orange-500',
  'hover:border-l-blue-500',
  'hover:border-l-emerald-500',
  'hover:border-l-violet-500',
  'hover:border-l-amber-500',
  'hover:border-l-sky-500',
  'hover:border-l-rose-500',
  'hover:border-l-lime-500',
];

/** Tailwind icon background + text class pairs (bg + text) for small pill icons */
export const SUBJECT_PILL_CLASSES = [
  { bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400', border: 'border-orange-200', darkBorder: 'dark:border-orange-800/50' },
  { bg: 'bg-blue-100',   text: 'text-blue-600',   darkBg: 'dark:bg-blue-900/30',   darkText: 'dark:text-blue-400',   border: 'border-blue-200',   darkBorder: 'dark:border-blue-800/50'   },
  { bg: 'bg-emerald-100',text: 'text-emerald-600',darkBg: 'dark:bg-emerald-900/30',darkText: 'dark:text-emerald-400',border: 'border-emerald-200',darkBorder: 'dark:border-emerald-800/50'},
  { bg: 'bg-violet-100', text: 'text-violet-600', darkBg: 'dark:bg-violet-900/30', darkText: 'dark:text-violet-400', border: 'border-violet-200', darkBorder: 'dark:border-violet-800/50' },
  { bg: 'bg-amber-100',  text: 'text-amber-600',  darkBg: 'dark:bg-amber-900/30',  darkText: 'dark:text-amber-400',  border: 'border-amber-200',  darkBorder: 'dark:border-amber-800/50'  },
  { bg: 'bg-sky-100',    text: 'text-sky-600',    darkBg: 'dark:bg-sky-900/30',    darkText: 'dark:text-sky-400',    border: 'border-sky-200',    darkBorder: 'dark:border-sky-800/50'    },
  { bg: 'bg-rose-100',   text: 'text-rose-600',   darkBg: 'dark:bg-rose-900/30',   darkText: 'dark:text-rose-400',   border: 'border-rose-200',   darkBorder: 'dark:border-rose-800/50'   },
  { bg: 'bg-lime-100',   text: 'text-lime-600',   darkBg: 'dark:bg-lime-900/30',   darkText: 'dark:text-lime-400',   border: 'border-lime-200',   darkBorder: 'dark:border-lime-800/50'   },
];

/** Hex colors for Recharts / SVG chart strokes */
export const SUBJECT_HEX_COLORS = [
  '#f97316', // orange
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#0ea5e9', // sky
  '#f43f5e', // rose
  '#84cc16', // lime
];

/** Emoji identifiers mapped to subject index */
export const SUBJECT_EMOJIS = ['⚡', '💻', '🌱', '🎨', '🔭', '🧮', '📚', '🔬'];

// ─── Core Hash ─────────────────────────────────────────────────────────
/**
 * Returns a deterministic bucket index for a given subject name.
 * The index is stable across renders — the same name always resolves
 * to the same color/emoji bucket.
 */
export function getSubjectIndex(subject: string): number {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % SUBJECT_HEX_COLORS.length;
}

// ─── Public Helpers ─────────────────────────────────────────────────────
/** Hex color string for chart strokes and fill areas */
export function getSubjectHex(subject: string): string {
  return SUBJECT_HEX_COLORS[getSubjectIndex(subject)];
}

/** Tailwind gradient class for glassy banners / card headers */
export function getSubjectGradient(subject: string): string {
  return SUBJECT_GRADIENTS[getSubjectIndex(subject)];
}

/** Tailwind `hover:border-l-*` class for list-card hover accents */
export function getSubjectBorderHover(subject: string): string {
  return SUBJECT_BORDER_HOVERS[getSubjectIndex(subject)];
}

/** Pill styles (bg, text, border) as individual Tailwind class strings */
export function getSubjectPill(subject: string) {
  return SUBJECT_PILL_CLASSES[getSubjectIndex(subject)];
}

/** Single-character emoji for the subject */
export function getSubjectEmoji(subject: string): string {
  return SUBJECT_EMOJIS[getSubjectIndex(subject)];
}

/**
 * Compact Tailwind classes for small circular / square subject icon badges.
 * Returns a combined `bg-* text-white` string that can be used directly on
 * a `div` or `span`.
 */
const SUBJECT_ICON_BG = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-lime-500',
];

export function getSubjectIconBg(subject: string): string {
  return SUBJECT_ICON_BG[getSubjectIndex(subject)];
}

/**
 * Compact text color class for subject labels (e.g. student roster)
 */
const SUBJECT_TEXT_COLORS = [
  'text-amber-500',
  'text-sky-500',
  'text-emerald-500',
  'text-violet-500',
  'text-orange-500',
  'text-blue-500',
  'text-rose-500',
  'text-lime-500',
];

export function getSubjectTextColor(subject: string): string {
  return SUBJECT_TEXT_COLORS[getSubjectIndex(subject)];
}
