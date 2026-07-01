import { s as createLucideIcon, u as useTheme, a as reactExports, R as React, j as jsxRuntimeExports, c as clsx, Z as Zap, i as Sparkles, v as Search, m as motion, n as BookOpen, A as AnimatePresence } from "./index-CTZ1eQC9.js";
import { P as PageHeader } from "./PageHeader-D8byMYqA.js";
import { g as getSubjectEmoji, a as getSubjectIconBg } from "./subjectUtils-CWZOIqn8.js";
import { C as ChevronDown } from "./chevron-down-BHZziYU6.js";
import { C as ClipboardList } from "./clipboard-list-Cq0F6BY7.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ChevronUp = createLucideIcon("ChevronUp", [["path", { d: "m18 15-6-6-6 6", key: "153udz" }]]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Layers = createLucideIcon("Layers", [
  [
    "path",
    {
      d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
      key: "zw3jo"
    }
  ],
  [
    "path",
    {
      d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
      key: "1wduqc"
    }
  ],
  [
    "path",
    {
      d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
      key: "kqbvx6"
    }
  ]
]);
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};
const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 }
  }
};
const Curriculum = ({ data, onNavigate }) => {
  const { preferences } = useTheme();
  const activeCurriculum = (preferences == null ? void 0 : preferences.selectedCurriculum) || "TVET_CDACC";
  const subjects = reactExports.useMemo(() => Object.keys(data.curriculum || {}), [data.curriculum]);
  const [activeSubject, setActiveSubject] = reactExports.useState(() => subjects[0] || "");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [expandedUnits, setExpandedUnits] = reactExports.useState({});
  React.useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(activeSubject)) {
      setActiveSubject(subjects[0]);
    }
  }, [subjects, activeSubject]);
  const toggleUnit = (unitTitle) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitTitle]: !prev[unitTitle]
    }));
  };
  const filteredUnits = reactExports.useMemo(() => {
    var _a;
    const units = ((_a = data.curriculum) == null ? void 0 : _a[activeSubject]) || [];
    if (!searchQuery.trim()) return units;
    const query = searchQuery.toLowerCase();
    return units.filter(
      (u) => u.unit.toLowerCase().includes(query) || u.title.toLowerCase().includes(query) || u.outcomes.some((o) => o.toLowerCase().includes(query)) || u.activities.toLowerCase().includes(query)
    );
  }, [data.curriculum, activeSubject, searchQuery]);
  const curriculumDetails = reactExports.useMemo(() => {
    switch (activeCurriculum) {
      case "CBC":
        return {
          title: "CBC (Competency Based Curriculum)",
          subtitle: "Kenya Institute of Curriculum Development (KICD)",
          desc: "Formative competencies focusing on learner outcomes, value-based education, and core competencies (e.g., communication, critical thinking, citizenship).",
          badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
          accent: "emerald"
        };
      case "KNEC":
        return {
          title: "KNEC (Kenya National Examinations Council)",
          subtitle: "Traditional Academic Framework (8-4-4 Standards)",
          desc: "Continuous Assessment Tests (CATs) and summative examinations mapped to terminal performance grades.",
          badgeBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
          accent: "indigo"
        };
      case "TVET_CDACC":
        return {
          title: "TVET CDACC (Curriculum Development, Assessment & Certification Council)",
          subtitle: "Competency-Based Education and Training (CBET)",
          desc: "Occupational standards designed for vocational mastery. Focuses on hand-on practice, safety portfolios, and workplace execution checklists.",
          badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
          accent: "amber"
        };
      case "NITA":
        return {
          title: "NITA (National Industrial Training Authority)",
          subtitle: "Industrial Skills Testing and Certification",
          desc: "Trade testing structure (Grade III, II, I) for commercial trades. Heavy emphasis on safety code execution and timed trade test practical tasks.",
          badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
          accent: "rose"
        };
      default:
        return {
          title: "Custom Curriculum",
          subtitle: "Institution Preset Outline",
          desc: "Customized educational pathways adjusted to organizational standards.",
          badgeBg: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
          accent: "slate"
        };
    }
  }, [activeCurriculum]);
  const isSolarMtaaniContext = activeCurriculum === "TVET_CDACC" || activeCurriculum === "NITA";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-4 lg:px-8 py-6 custom-scrollbar space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: "Curriculum Hub",
        subtitle: "Manage and audit active syllabus modules, lessons, and student competency outcomes"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-6 lg:p-8 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[var(--md-sys-color-primary-container)] opacity-40 blur-3xl pointer-events-none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-[var(--md-sys-color-secondary-container)] opacity-30 blur-3xl pointer-events-none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 max-w-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border", curriculumDetails.badgeBg), children: curriculumDetails.title }),
            isSolarMtaaniContext && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20 animate-pulse", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 10, className: "fill-current" }),
              " Solar Mtaani Preset"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold font-google text-[var(--md-sys-color-on-surface)]", children: curriculumDetails.subtitle }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]", children: curriculumDetails.desc })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => onNavigate("settings"),
            className: "flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[var(--md-sys-color-primary)] text-white hover:bg-[var(--md-sys-color-primary-hover)] active:scale-95 transition-all text-sm font-google font-bold shadow-md shadow-indigo-500/15",
            children: "Configure Preset"
          }
        )
      ] })
    ] }),
    isSolarMtaaniContext && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border border-orange-200 dark:border-orange-950/40 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/10 dark:to-amber-950/10 flex gap-4 items-start shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 20 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-bold text-orange-850 dark:text-orange-300 font-google", children: "Solar Mtaani Vocational Standard (Kibera/Mtaani Project)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-orange-750 dark:text-orange-400 mt-1 leading-relaxed", children: "This preset loads the standardized TVET CDACC / NITA syllabus for Solar PV Technology and Basic ICT. It is specifically designed to bridge the learning gap for local youth by providing practical assessment modules for workplace safety, battery bank configuration, and system commissioning under EPRA standards." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar flex-1", children: subjects.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)]", children: "No active subjects loaded." }) : subjects.map((sub) => {
        const isActive = activeSubject === sub;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              setActiveSubject(sub);
              setSearchQuery("");
            },
            className: clsx(
              "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-google font-bold text-xs whitespace-nowrap border transition-all duration-200 active:scale-95",
              isActive ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-primary)] shadow-sm" : "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-variant)]"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("w-6 h-6 rounded-lg flex items-center justify-center text-sm", getSubjectIconBg(sub)), children: getSubjectEmoji(sub) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: sub })
            ]
          },
          sub
        );
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full md:w-80", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: "Search syllabus units, outcomes...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all placeholder:text-[var(--md-sys-color-on-surface-variant)]"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        variants: containerVariants,
        initial: "hidden",
        animate: "visible",
        className: "space-y-4",
        children: filteredUnits.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 48, className: "text-[var(--md-sys-color-outline)] mb-3 animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-google font-bold text-sm text-[var(--md-sys-color-on-surface)]", children: "No modules found" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-sm", children: "We couldn't find any syllabus items matching your query or selected course subject." })
        ] }) : filteredUnits.map((u, idx) => {
          const isExpanded = expandedUnits[u.title] !== false;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              variants: cardVariants,
              className: "overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] shadow-sm hover:border-[var(--md-sys-color-outline)] transition-all duration-200",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    onClick: () => toggleUnit(u.title),
                    className: "flex items-center justify-between p-4 lg:p-5 cursor-pointer select-none bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-surface-variant)] transition-colors duration-150",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2.5 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex-shrink-0 flex items-center justify-center mt-0.5", children: u.week || u.session ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center leading-none", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-black uppercase tracking-widest text-[var(--md-sys-color-primary)]", children: u.week ? "WEEK" : "SESS" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-black mt-0.5", children: u.week || u.session })
                        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { size: 18 }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider", children: u.unit }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-0.5 font-google truncate", children: u.title })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[var(--md-sys-color-on-surface-variant)] ml-4", children: isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { size: 18 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 18 }) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { initial: false, children: isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  motion.div,
                  {
                    initial: { height: 0 },
                    animate: { height: "auto" },
                    exit: { height: 0 },
                    transition: { duration: 0.2, ease: "easeInOut" },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 border-t border-[var(--md-sys-color-outline-variant)] space-y-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { size: 12 }),
                          " Expected Competency Outcomes"
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: u.outcomes.map((outcome, oIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "li",
                          {
                            className: "flex gap-2.5 items-start p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)]",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] mt-1.5 flex-shrink-0" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: outcome })
                            ]
                          },
                          oIdx
                        )) })
                      ] }),
                      u.activities && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[9px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)]", children: "Suggested Student Activities / Pedagogy" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed", children: u.activities })
                      ] })
                    ] })
                  }
                ) })
              ]
            },
            u.title
          );
        })
      },
      `${activeSubject}-${searchQuery}`
    )
  ] });
};
export {
  Curriculum,
  Curriculum as default
};
