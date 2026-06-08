import { o as createLucideIcon, j as jsxRuntimeExports, n as User, t as Mail, aa as Shield, C as Calendar, c as clsx, a3 as Award } from "./index-CWZOk6sM.js";
import { P as Phone } from "./phone-BblhE0EH.js";
import { M as MapPin } from "./map-pin-VVi2kWKK.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Book = createLucideIcon("Book", [
  [
    "path",
    {
      d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",
      key: "k3hazp"
    }
  ]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Building = createLucideIcon("Building", [
  ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2", ry: "2", key: "76otgf" }],
  ["path", { d: "M9 22v-4h6v4", key: "r93iot" }],
  ["path", { d: "M8 6h.01", key: "1dz90k" }],
  ["path", { d: "M16 6h.01", key: "1x0f13" }],
  ["path", { d: "M12 6h.01", key: "1vi96p" }],
  ["path", { d: "M12 10h.01", key: "1nrarc" }],
  ["path", { d: "M12 14h.01", key: "1etili" }],
  ["path", { d: "M16 10h.01", key: "1m94wz" }],
  ["path", { d: "M16 14h.01", key: "1gbofw" }],
  ["path", { d: "M8 10h.01", key: "19clt8" }],
  ["path", { d: "M8 14h.01", key: "6423bh" }]
]);
const OverviewTab = ({ student }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in relative z-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-5 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-6 rounded-2xl relative overflow-hidden group hover:shadow-md transition-all duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-80" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 16 }),
          " Contact Information"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group/item flex items-center gap-4 p-3 hover:bg-[var(--md-sys-color-surface-variant)]/40 rounded-xl transition-all duration-300 cursor-default hover:translate-x-1 border border-transparent hover:border-[var(--md-sys-color-outline)]/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl group-hover/item:scale-110 transition-transform shadow-sm border border-blue-100 dark:border-blue-800/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 18 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Email Address" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5", children: student.email || "Not provided" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group/item flex items-center gap-4 p-3 hover:bg-[var(--md-sys-color-surface-variant)]/40 rounded-xl transition-all duration-300 cursor-default hover:translate-x-1 border border-transparent hover:border-[var(--md-sys-color-outline)]/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl group-hover/item:scale-110 transition-transform shadow-sm border border-emerald-100 dark:border-emerald-800/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 18 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Phone Number" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5", children: student.phone || "Not provided" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group/item flex items-center gap-4 p-3 hover:bg-[var(--md-sys-color-surface-variant)]/40 rounded-xl transition-all duration-300 cursor-default hover:translate-x-1 border border-transparent hover:border-[var(--md-sys-color-outline)]/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2.5 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl group-hover/item:scale-110 transition-transform shadow-sm border border-amber-100 dark:border-amber-800/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 18 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Home Address" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5", children: student.address || "Not provided" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-6 rounded-2xl relative overflow-hidden group hover:shadow-md transition-all duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-orange-500 opacity-80" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-6 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 16 }),
          " Guardian & Emergency"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border border-[var(--md-sys-color-outline)]/50 space-y-4 bg-[var(--md-sys-color-surface-variant)]/20 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 12, className: "text-rose-400" }),
              " Primary Guardian"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-bold text-[var(--md-sys-color-on-surface)] mt-1", children: student.guardianName || "Not specified" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px w-full bg-gradient-to-r from-[var(--md-sys-color-outline)]/10 via-[var(--md-sys-color-outline)] to-[var(--md-sys-color-outline)]/10 my-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 12, className: "text-rose-400" }),
              " Emergency Contact"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-1", children: student.guardianPhone || "Not specified" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between p-4 bg-[var(--md-sys-color-surface-variant)]/20 rounded-xl border border-[var(--md-sys-color-outline)]/40 hover:bg-[var(--md-sys-color-surface-variant)]/40 transition-colors duration-350", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 12, className: "text-indigo-400" }),
            " Date of Birth"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: student.dateOfBirth || "Unknown" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-7 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-6 rounded-2xl relative overflow-hidden group hover:shadow-md transition-all duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Building, { size: 16 }),
          " Institutional Registration"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-4 rounded-2xl border border-[var(--md-sys-color-outline)]/60 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-0.5 duration-350", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-4 -top-4 w-12 h-12 bg-emerald-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Admission Number" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-black text-[var(--md-sys-color-on-surface)] mt-1", children: student.admissionNumber || "Pending" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-4 rounded-2xl border border-[var(--md-sys-color-outline)]/60 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-0.5 duration-350", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-4 -top-4 w-12 h-12 bg-indigo-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "NITA Registration" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-black text-[var(--md-sys-color-on-surface)] mt-1 truncate", children: student.nitaNumber || "Pending" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-4 rounded-2xl border border-[var(--md-sys-color-outline)]/60 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-0.5 duration-350", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-4 -top-4 w-12 h-12 bg-amber-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "EPRA Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
                "w-2 h-2 rounded-full",
                student.epraLicenseStatus === "T1" || student.epraLicenseStatus === "T2" || student.epraLicenseStatus === "T3" ? "bg-emerald-500" : student.epraLicenseStatus === "None" ? "bg-slate-300" : "bg-slate-300"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: student.epraLicenseStatus || "None" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-4 rounded-2xl border border-[var(--md-sys-color-outline)]/60 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-0.5 duration-350", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-4 -top-4 w-12 h-12 bg-blue-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "KCSE Grade" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-black text-[var(--md-sys-color-on-surface)] mt-1", children: student.kcseGrade || "N/A" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-6 rounded-2xl bg-gradient-to-br from-[var(--md-sys-color-surface)] to-indigo-50/30 dark:to-indigo-500/5 relative overflow-hidden group hover:shadow-md transition-all duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Book, { size: 16 }),
          " Program Summary"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/40 dark:border-slate-700/50 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { size: 24 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: [
              "Enrolled in ",
              student.subject,
              " Program"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-[var(--md-sys-color-secondary)] mt-0.5", children: [
              "Lot ",
              student.lot,
              " • ",
              student.studentGroup,
              " • Grade ",
              student.grade
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
export {
  OverviewTab
};
