import { a as reactExports, j as jsxRuntimeExports, B as BookOpen, O as CircleCheckBig, Q as Clock, c as clsx } from "./index-CWZOk6sM.js";
const AnalyticsTab = ({ student }) => {
  const termHistory = reactExports.useMemo(() => [
    { term: "Term 3, 2023", gpa: 3.1, status: "Completed", date: "Dec 2023" },
    { term: "Term 1, 2024", gpa: 3.4, status: "Completed", date: "Apr 2024" },
    { term: "Term 2, 2024", gpa: 3.6, status: "In Progress", date: "Current" }
  ], []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-2 space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6 rounded-2xl border border-[var(--md-sys-color-outline)]/75", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider mb-5 flex items-center gap-2 font-google", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 16 }),
        " Term History"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: termHistory.map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 bg-[var(--md-sys-color-surface-variant)]/40 hover:bg-[var(--md-sys-color-surface)]/70 hover:shadow-md transition-all duration-300 rounded-xl border border-[var(--md-sys-color-outline)]/60 hover:scale-[1.01] active:scale-[0.99]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)] text-sm", children: t.term }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-secondary)] mt-0.5", children: t.date })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "GPA" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-bold text-[var(--md-sys-color-on-surface)] mt-0.5", children: [
              t.gpa.toFixed(1),
              "/4.0"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx(
            "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-sm",
            t.status === "Completed" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50" : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50"
          ), children: [
            t.status === "Completed" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 12 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 12 }),
            t.status
          ] })
        ] })
      ] }, i)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6 rounded-2xl border border-[var(--md-sys-color-outline)]/75", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider mb-5 flex items-center gap-2 font-google", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 16 }),
        " Current Units"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: Object.entries(student.competencies).map(([key, value]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--md-sys-color-surface-variant)]/30 p-4 rounded-xl border border-[var(--md-sys-color-outline)]/50 shadow-sm hover:shadow-md transition-all duration-350 hover:bg-[var(--md-sys-color-surface-variant)]/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2", children: key }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-end mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: [
            "Score: ",
            value,
            "/4.0"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)]", children: [
            Math.round(value / 4 * 100),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-[var(--md-sys-color-surface-variant)]/60 h-2 rounded-full overflow-hidden border border-[var(--md-sys-color-outline)]/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full", style: { width: `${value / 4 * 100}%` } }) })
      ] }, key)) })
    ] }) })
  ] });
};
export {
  AnalyticsTab
};
