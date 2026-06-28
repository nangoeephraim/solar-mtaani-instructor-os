import { o as createLucideIcon, a as reactExports, j as jsxRuntimeExports, a0 as Activity, bC as MessageSquare, Q as Clock } from "./index-D-ESeA_n.js";
import { P as Plus } from "./plus-d9Yse0vX.js";
import { C as CircleAlert } from "./circle-alert-CGb8Sipw.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CalendarCheck = createLucideIcon("CalendarCheck", [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }],
  ["path", { d: "m9 16 2 2 4-4", key: "19s6y9" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CalendarX = createLucideIcon("CalendarX", [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }],
  ["path", { d: "m14 14-4 4", key: "rymu2i" }],
  ["path", { d: "m10 14 4 4", key: "3sz06r" }]
]);
const AttendanceTab = ({ student, onAddNote }) => {
  const [noteInput, setNoteInput] = reactExports.useState("");
  const handleAddNoteClick = () => {
    if (!noteInput.trim() || !onAddNote) return;
    onAddNote(noteInput);
    setNoteInput("");
  };
  const presentCount = student.attendanceHistory.filter((h) => h.status === "present").length;
  const absentCount = student.attendanceHistory.filter((h) => h.status === "absent").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in relative z-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-8 glass-panel p-6 rounded-2xl flex flex-col h-[600px] relative overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-fuchsia-500 opacity-80" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-6 flex items-center gap-2 font-google", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 16 }),
        " Behavior & Interaction Timeline"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mb-8 input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]/40 p-2 backdrop-blur-sm shadow-sm relative z-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            className: "flex-1 bg-transparent border-none px-4 py-2 text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none placeholder-[var(--md-sys-color-secondary)]",
            placeholder: "Log a new behavior or note...",
            title: "Add Note",
            value: noteInput,
            onChange: (e) => setNoteInput(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && handleAddNoteClick()
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleAddNoteClick,
            "aria-label": "Add note",
            title: "Add Note",
            className: "bg-violet-600 hover:bg-violet-750 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 shadow-md shadow-violet-500/20 flex items-center gap-2 active:scale-95",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16 }),
              " Log Entry"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto pr-4 custom-scrollbar relative pl-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--md-sys-color-outline)] via-[var(--md-sys-color-outline)] to-transparent" }),
        student.notes.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6 pb-4", children: student.notes.map((note, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex gap-4 group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 border-2 border-[var(--md-sys-color-surface)] flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm mt-1 ring-4 ring-[var(--md-sys-color-surface)]/20 flex-shrink-0 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 14 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 glass-card p-4 rounded-2xl shadow-sm border border-[var(--md-sys-color-outline)]/65 group-hover:border-violet-300 dark:group-hover:border-violet-800/80 group-hover:shadow-md transition-all duration-300 relative overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 top-0 bottom-0 w-1 bg-violet-500/25 group-hover:bg-violet-550 transition-all duration-300" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest bg-violet-50/70 dark:bg-violet-500/10 px-2 py-0.5 rounded-full", children: "Instructor Note" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 10 }),
                " ",
                (/* @__PURE__ */ new Date()).toLocaleDateString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed", children: note })
          ] })
        ] }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-[var(--md-sys-color-secondary)] relative z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-[var(--md-sys-color-surface-variant)]/50 rounded-2xl flex items-center justify-center mb-4 opacity-70", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 24 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]", children: "No timeline events" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1", children: "Start by adding an entry above." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-4 space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-6 rounded-2xl h-[600px] relative overflow-hidden group hover:shadow-md transition-all duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-sky-500 opacity-80" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2 font-google", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarCheck, { size: 16 }),
        " Record Summary"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:scale-[1.02] transition-all duration-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-8 -bottom-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-4xl md:text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-2", children: [
            Math.round(student.attendancePct),
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-widest", children: "Overall Attendance" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 glass-card rounded-2xl flex items-center justify-between border-[var(--md-sys-color-outline)]/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-widest font-bold text-[var(--md-sys-color-secondary)]", children: "Total Present" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-1", children: presentCount })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-inner border border-emerald-200 dark:border-emerald-800/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarCheck, { size: 20 }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 glass-card rounded-2xl flex items-center justify-between border-[var(--md-sys-color-outline)]/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] uppercase tracking-widest font-bold text-[var(--md-sys-color-secondary)] flex items-center gap-1.5", children: [
              "Total Absent ",
              absentCount > 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full bg-rose-500 animate-pulse" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-1", children: absentCount })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-inner border border-rose-200 dark:border-rose-800/50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarX, { size: 20 }) })
        ] }),
        absentCount > 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 p-4 bg-rose-50 border border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/20 rounded-xl flex gap-3 text-rose-700 dark:text-rose-400 animate-pulse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 18, className: "flex-shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider mb-1", children: "Warning flag" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium opacity-90", children: "This student has missed more than 3 classes. Consider scheduling a meeting with the guardian." })
          ] })
        ] })
      ] })
    ] }) })
  ] });
};
export {
  AttendanceTab
};
