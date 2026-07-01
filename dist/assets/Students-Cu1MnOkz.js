import { s as createLucideIcon, a as reactExports, j as jsxRuntimeExports, u as useTheme, e as useToast, b as useAuth, m as motion, U as Users, t as UserPlus, v as Search, c as clsx, n as BookOpen, G as GraduationCap, w as Grid3x3, A as AnimatePresence, g as ChevronRight, X, x as Mail, C as Calendar, o as User, y as ChartColumn, T as Trash2 } from "./index-CTZ1eQC9.js";
import { g as getStudentGroups, b as getLevelShortLabel } from "./educationLevels-CWONNkiO.js";
import { P as PageHeader } from "./PageHeader-D8byMYqA.js";
import { E as EditStudentModal, A as AddStudentModal } from "./AddStudentModal-C60HkeDg.js";
import { g as getSubjectEmoji, a as getSubjectIconBg, b as getSubjectPill } from "./subjectUtils-CWZOIqn8.js";
import { B as Building2, S as School } from "./school-BfWEIvcb.js";
import { P as Phone } from "./phone-BjaBqTx6.js";
import { M as MapPin } from "./map-pin-BEkLhwxj.js";
import { P as PenLine } from "./pen-line-78u3QdsD.js";
import "./circle-alert-Be-OeDUH.js";
import "./camera--fvz1ABz.js";
import "./save-DCsHzsxU.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const List = createLucideIcon("List", [
  ["path", { d: "M3 12h.01", key: "nlz23k" }],
  ["path", { d: "M3 18h.01", key: "1tta3j" }],
  ["path", { d: "M3 6h.01", key: "1rqtza" }],
  ["path", { d: "M8 12h13", key: "1za7za" }],
  ["path", { d: "M8 18h13", key: "1lx6n3" }],
  ["path", { d: "M8 6h13", key: "ik3vkj" }]
]);
function VirtualList({
  items,
  itemHeight,
  height,
  width = "100%",
  renderItem,
  keyExtractor,
  className = "",
  overscanCount = 5,
  emptyState,
  isLoading = false,
  loadingComponent
}) {
  const containerRef = reactExports.useRef(null);
  const [scrollTop, setScrollTop] = reactExports.useState(0);
  const [containerWidth, setContainerWidth] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);
  const handleScroll = reactExports.useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
  const visibleCount = Math.ceil(height / itemHeight) + 2 * overscanCount;
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount);
  if (isLoading && loadingComponent) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className, children: loadingComponent });
  }
  if (items.length === 0 && emptyState) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className, children: emptyState });
  }
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const item = items[i];
    const style = {
      position: "absolute",
      top: i * itemHeight,
      height: itemHeight,
      width: "100%"
    };
    visibleItems.push(
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style, children: renderItem(item, i, style) }, keyExtractor(item, i))
    );
  }
  const resolvedWidth = typeof width === "number" ? `${width}px` : width;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: containerRef,
      className,
      style: {
        height,
        width: resolvedWidth,
        overflow: "auto",
        position: "relative"
      },
      onScroll: handleScroll,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: totalHeight, position: "relative" }, children: visibleItems })
    }
  );
}
const Students = ({
  data,
  onUpdateStudent,
  onAddStudent,
  onDeleteStudent,
  onNavigate,
  selectedStudentId: initialSelectedId
}) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const { preferences } = useTheme();
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [subjectFilter, setSubjectFilter] = reactExports.useState("All");
  const [groupFilter, setGroupFilter] = reactExports.useState("All");
  const [viewMode, setViewMode] = reactExports.useState("grid");
  const [selectedStudent, setSelectedStudent] = reactExports.useState(
    initialSelectedId ? data.students.find((s) => s.id === initialSelectedId) || null : null
  );
  const [isEditing, setIsEditing] = reactExports.useState(false);
  const [showAddModal, setShowAddModal] = reactExports.useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const [listHeight, setListHeight] = reactExports.useState(500);
  const containerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const calculated = window.innerHeight - rect.top - 24;
        setListHeight(Math.max(calculated, 300));
      }
    };
    setTimeout(updateHeight, 50);
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [viewMode, data.students]);
  const filteredStudents = data.students.filter((s) => {
    var _a2;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.lot.includes(searchTerm) || ((_a2 = s.email) == null ? void 0 : _a2.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = subjectFilter === "All" || s.subject === subjectFilter;
    const matchesGroup = groupFilter === "All" || s.studentGroup === groupFilter;
    return matchesSearch && matchesSubject && matchesGroup;
  });
  const getStudentAvg = (student) => {
    const vals = Object.values(student.competencies);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const handleSaveEdit = (updatedStudent) => {
    onUpdateStudent(updatedStudent, true);
    setSelectedStudent(updatedStudent);
    setIsEditing(false);
  };
  const handleStartEdit = () => {
    setIsEditing(true);
  };
  const handleViewAnalytics = () => {
    if (selectedStudent) {
      onNavigate("student-analytics", selectedStudent.id);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col animate-fade-in pb-6 relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col h-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900/30 overflow-hidden p-6 md:p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 opacity-20 dark:opacity-10 mix-blend-overlay pointer-events-none", style: { backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { animate: { opacity: [0.5, 1, 0.5] }, transition: { duration: 4, repeat: Infinity, ease: "linear" }, className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-black/50 to-transparent -translate-x-full" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            title: "Students",
            subtitle: `${data.students.length} students enrolled`,
            icon: Users,
            action: (user == null ? void 0 : user.role) !== "viewer" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setShowAddModal(true),
                className: "px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 18 }),
                  "Add Student"
                ]
              }
            ) : void 0
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-3 sm:p-4 mb-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center justify-between bg-[var(--md-sys-color-surface)]/80 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 min-w-[200px] input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-outline)]", size: 18 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "Search by name, lot, or email...",
              className: "w-full pl-11 pr-4 py-2 bg-transparent rounded-xl text-sm focus:outline-none transition-all text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto overflow-visible", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-[var(--md-sys-color-surface-variant)]/60 rounded-lg p-1 border border-[var(--md-sys-color-outline)] overflow-x-auto custom-scrollbar flex-shrink-0", children: ["All", ...preferences.customSubjects || ["Solar", "ICT"]].map((sub) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setSubjectFilter(sub),
              className: clsx(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 active:scale-95",
                subjectFilter === sub ? "glass-card bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-sm" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-white/5"
              ),
              children: [
                sub !== "All" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px]", children: getSubjectEmoji(sub) }),
                sub
              ]
            },
            sub
          )) }),
          getStudentGroups(preferences.institutionType).length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-[var(--md-sys-color-surface-variant)]/60 rounded-lg p-1 border border-[var(--md-sys-color-outline)] overflow-x-auto custom-scrollbar flex-shrink-0", children: ["All", ...getStudentGroups(preferences.institutionType)].map((grp) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setGroupFilter(grp),
              className: clsx(
                "px-2 sm:px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 whitespace-nowrap flex-shrink-0 active:scale-95",
                groupFilter === grp ? "glass-card bg-[var(--md-sys-color-surface)] text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-white/5"
              ),
              children: [
                grp === "Campus" && /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 12 }),
                grp === "Academy" && /* @__PURE__ */ jsxRuntimeExports.jsx(School, { size: 12 }),
                grp === "CBC" && /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 12 }),
                grp === "High School" && /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { size: 12 }),
                grp
              ]
            },
            grp
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:flex bg-[var(--md-sys-color-surface-variant)]/60 rounded-lg p-1 border border-[var(--md-sys-color-outline)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setViewMode("grid"),
                "aria-label": "Grid view",
                title: "Grid view",
                className: clsx(
                  "p-1.5 rounded-md transition-all active:scale-90",
                  viewMode === "grid" ? "glass-card bg-[var(--md-sys-color-surface)] text-violet-600 shadow-sm" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-white/5"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Grid3x3, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setViewMode("list"),
                "aria-label": "List view",
                title: "List view",
                className: clsx(
                  "p-1.5 rounded-md transition-all active:scale-90",
                  viewMode === "list" ? "glass-card bg-[var(--md-sys-color-surface)] text-violet-600 shadow-sm" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-white/5"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(List, { size: 16 })
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: containerRef, className: clsx(
        "flex-1 custom-scrollbar",
        viewMode === "grid" ? "overflow-y-auto" : "overflow-hidden"
      ), children: [
        viewMode === "grid" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: filteredStudents.map((student, index) => {
          var _a2;
          const avg = getStudentAvg(student);
          const isAtRisk = avg < 2.5 || student.attendancePct < 80;
          const isSelected = (selectedStudent == null ? void 0 : selectedStudent.id) === student.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.button,
            {
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 },
              exit: { opacity: 0, scale: 0.9 },
              transition: { delay: index * 0.03 },
              whileHover: { y: -4, scale: 1.02 },
              whileTap: { scale: 0.98 },
              onClick: () => setSelectedStudent(student),
              className: clsx(
                "glass-card p-5 text-left transition-all relative overflow-hidden group hover:shadow-xl",
                isSelected ? "border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/20 shadow-lg shadow-[var(--md-sys-color-primary)]/10" : "border-[var(--md-sys-color-outline)]"
              ),
              children: [
                isAtRisk && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-400" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto mb-4", children: [
                  student.photo ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: student.photo,
                      alt: student.name,
                      className: "w-20 h-20 rounded-2xl object-cover shadow-md"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold text-violet-600 dark:text-violet-400", children: student.name.charAt(0) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md",
                    getSubjectIconBg(student.subject)
                  ), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px]", children: getSubjectEmoji(student.subject) }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-3 left-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
                  "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm border",
                  student.studentGroup === "Campus" ? "bg-indigo-100/80 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800" : student.studentGroup === "Academy" ? "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800" : student.studentGroup === "CBC" ? "bg-sky-100/80 text-sky-700 border-sky-200 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-800" : "bg-rose-100/80 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800"
                ), children: student.studentGroup }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-[var(--md-sys-color-on-surface)] text-center truncate", children: student.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] text-center mt-1", children: [
                  getLevelShortLabel(student.studentGroup, String(student.grade)),
                  " • ",
                  ((_a2 = preferences.terminology) == null ? void 0 : _a2.cohortLabel) || "Lot",
                  " ",
                  student.lot
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-center gap-4 mt-4 pt-4 border-t border-[var(--md-sys-color-outline)]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: clsx(
                      "text-lg font-bold",
                      student.attendancePct >= 85 ? "text-green-600 dark:text-green-400" : student.attendancePct >= 70 ? "text-orange-500 dark:text-orange-400" : "text-red-500 dark:text-red-400"
                    ), children: [
                      student.attendancePct,
                      "%"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold", children: "Attend" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold text-violet-600 dark:text-violet-400", children: avg.toFixed(1) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold", children: "Avg" })
                  ] })
                ] })
              ]
            },
            student.id
          );
        }) }) }) : (
          // List View
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            VirtualList,
            {
              items: filteredStudents,
              itemHeight: 88,
              height: listHeight,
              keyExtractor: (student) => student.id.toString(),
              className: "custom-scrollbar",
              renderItem: (student) => {
                var _a2;
                const avg = getStudentAvg(student);
                const isSelected = (selectedStudent == null ? void 0 : selectedStudent.id) === student.id;
                return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { paddingBottom: "8px", height: "100%" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => setSelectedStudent(student),
                    className: clsx(
                      "w-full h-full glass-panel px-4 py-3 text-left flex items-center gap-4 transition-all active:scale-[0.99]",
                      isSelected ? "border-violet-500 shadow-md ring-1 ring-violet-500/20 bg-violet-500/5" : "border-[var(--md-sys-color-outline)] hover:border-violet-400/50 hover:bg-violet-500/5"
                    ),
                    children: [
                      student.photo ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: student.photo, alt: student.name, className: "w-12 h-12 rounded-xl object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold text-violet-600 dark:text-violet-400", children: student.name.charAt(0) }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-[var(--md-sys-color-on-surface)] truncate", children: student.name }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 flex-wrap", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                            student.studentGroup === "Campus" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : student.studentGroup === "Academy" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : student.studentGroup === "CBC" ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                          ), children: student.studentGroup }),
                          "• ",
                          student.subject,
                          " • ",
                          getLevelShortLabel(student.studentGroup, String(student.grade)),
                          " • ",
                          ((_a2 = preferences.terminology) == null ? void 0 : _a2.cohortLabel) || "Lot",
                          " ",
                          student.lot
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx(
                          "font-bold",
                          student.attendancePct >= 85 ? "text-green-600 dark:text-green-400" : "text-orange-500 dark:text-orange-400"
                        ), children: [
                          student.attendancePct,
                          "%"
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-violet-600 dark:text-violet-400", children: avg.toFixed(1) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, className: "text-[var(--md-sys-color-secondary)]" })
                      ] })
                    ]
                  }
                ) });
              }
            }
          )
        ),
        filteredStudents.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 bg-[var(--md-sys-color-surface-variant)] rounded-2xl flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 32, className: "text-[var(--md-sys-color-secondary)]" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-[var(--md-sys-color-on-surface)]", children: "No students found" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1", children: "Try adjusting your search or filters" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: selectedStudent && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          className: "fixed inset-0 bg-black/20 backdrop-blur-sm z-40",
          onClick: () => setSelectedStudent(null)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { x: "100%" },
          animate: { x: 0 },
          exit: { x: "100%" },
          transition: { type: "spring", damping: 25, stiffness: 200 },
          className: "fixed top-0 right-0 bottom-0 w-full max-w-md glass-panel !rounded-none !rounded-l-[32px] shadow-2xl z-50 flex flex-col overflow-hidden border-l border-[var(--md-sys-color-outline)] !backdrop-blur-xl bg-[var(--md-sys-color-surface)]/80",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-900/60 dark:to-slate-900/20 border-b border-[var(--md-sys-color-outline)] relative overflow-hidden group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { size: 140 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setSelectedStudent(null),
                  "aria-label": "Close profile",
                  title: "Close profile",
                  className: "absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors z-10",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20, className: "text-[var(--md-sys-color-secondary)]" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center relative z-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-6 w-full border-b border-dashed border-gray-300 dark:border-gray-700 pb-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold tracking-widest text-[var(--md-sys-color-secondary)] uppercase", children: preferences.mtaaniCenter ? `${preferences.mtaaniCenter} Center` : "PRISM Institute" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-[var(--md-sys-color-outline)] tracking-wider", children: "OFFICIAL STUDENT IDENTIFICATION" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-32 h-40 bg-gray-200 rounded-lg overflow-hidden border-2 border-white shadow-lg ring-1 ring-black/5 dark:ring-white/10", children: selectedStudent.photo ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: selectedStudent.photo,
                        alt: selectedStudent.name,
                        className: "w-full h-full object-cover"
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl font-black text-slate-400 dark:text-slate-500", children: selectedStudent.name.charAt(0) }) }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 text-center space-y-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
                        getSubjectPill(selectedStudent.subject).bg,
                        getSubjectPill(selectedStudent.subject).text,
                        getSubjectPill(selectedStudent.subject).border,
                        getSubjectPill(selectedStudent.subject).darkBg,
                        getSubjectPill(selectedStudent.subject).darkText,
                        getSubjectPill(selectedStudent.subject).darkBorder
                      ), children: [
                        getSubjectEmoji(selectedStudent.subject),
                        " ",
                        selectedStudent.subject
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
                        "block mx-auto w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm mt-1",
                        selectedStudent.studentGroup === "Campus" ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" : selectedStudent.studentGroup === "Academy" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" : selectedStudent.studentGroup === "CBC" ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                      ), children: selectedStudent.studentGroup })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-3 pt-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-black text-[var(--md-sys-color-on-surface)] uppercase leading-tight font-google", children: selectedStudent.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-[var(--md-sys-color-secondary)] uppercase tracking-wide", children: "Adm:" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-[var(--md-sys-color-on-surface)] font-bold", children: selectedStudent.admissionNumber || "N/A" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-x-4 gap-y-2 text-xs", children: [
                      ((_a = preferences.enabledFields) == null ? void 0 : _a.nitaNumber) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[9px] text-[var(--md-sys-color-outline)] uppercase", children: "NITA Reg No." }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-medium text-[var(--md-sys-color-on-surface)]", children: selectedStudent.nitaNumber || "Pending" })
                      ] }),
                      ((_b = preferences.enabledFields) == null ? void 0 : _b.kcseGrade) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[9px] text-[var(--md-sys-color-outline)] uppercase", children: "KCSE Grade" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-medium text-[var(--md-sys-color-on-surface)]", children: selectedStudent.kcseGrade || "-" })
                      ] }),
                      ((_c = preferences.enabledFields) == null ? void 0 : _c.epraLicenseStatus) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[9px] text-[var(--md-sys-color-outline)] uppercase", children: "EPRA Status" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
                          "font-bold",
                          selectedStudent.epraLicenseStatus === "None" ? "text-gray-400" : "text-green-600"
                        ), children: selectedStudent.epraLicenseStatus || "None" })
                      ] }),
                      ((_d = preferences.enabledFields) == null ? void 0 : _d.nemisNumber) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[9px] text-[var(--md-sys-color-outline)] uppercase", children: "NEMIS ID" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-medium text-[var(--md-sys-color-on-surface)]", children: selectedStudent.nemisNumber || "-" })
                      ] }),
                      ((_e = preferences.enabledFields) == null ? void 0 : _e.upi) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[9px] text-[var(--md-sys-color-outline)] uppercase", children: "UPI" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-medium text-[var(--md-sys-color-on-surface)]", children: selectedStudent.upi || "-" })
                      ] }),
                      ((_f = preferences.enabledFields) == null ? void 0 : _f.kcpeMarks) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[9px] text-[var(--md-sys-color-outline)] uppercase", children: "KCPE Marks" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-[var(--md-sys-color-on-surface)]", children: selectedStudent.kcpeMarks || "-" })
                      ] }),
                      ((_g = preferences.enabledFields) == null ? void 0 : _g.nationalId) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[9px] text-[var(--md-sys-color-outline)] uppercase", children: "National ID" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-medium text-[var(--md-sys-color-on-surface)]", children: selectedStudent.nationalId || "-" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-[9px] text-[var(--md-sys-color-outline)] uppercase", children: ((_h = preferences.terminology) == null ? void 0 : _h.cohortLabel) || "Cohort" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-[var(--md-sys-color-on-surface)]", children: selectedStudent.lot })
                      ] })
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider", children: "Contact Information" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 glass-panel rounded-xl bg-[var(--md-sys-color-surface-variant)]/40 border-[var(--md-sys-color-outline)]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 16, className: "text-[var(--md-sys-color-on-surface-variant)]" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-[var(--md-sys-color-on-surface)]", children: selectedStudent.email || "No email" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 glass-panel rounded-xl bg-[var(--md-sys-color-surface-variant)]/40 border-[var(--md-sys-color-outline)]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 16, className: "text-[var(--md-sys-color-on-surface-variant)]" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-[var(--md-sys-color-on-surface)]", children: selectedStudent.phone || "No phone" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 glass-panel rounded-xl bg-[var(--md-sys-color-surface-variant)]/40 border-[var(--md-sys-color-outline)]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 16, className: "text-[var(--md-sys-color-on-surface-variant)]" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-[var(--md-sys-color-on-surface)]", children: selectedStudent.dateOfBirth || "No DOB" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 glass-panel rounded-xl bg-[var(--md-sys-color-surface-variant)]/40 border-[var(--md-sys-color-outline)]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 16, className: "text-[var(--md-sys-color-on-surface-variant)]" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-[var(--md-sys-color-on-surface)]", children: selectedStudent.address || "No address" })
                  ] })
                ] })
              ] }),
              ((_i = preferences.enabledFields) == null ? void 0 : _i.guardianDetails) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider", children: "Guardian Information" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 glass-panel rounded-xl bg-[var(--md-sys-color-surface-variant)]/40 border border-[var(--md-sys-color-outline)] space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold", children: "Name" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-[var(--md-sys-color-on-surface)]", children: selectedStudent.guardianName || "Not specified" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold", children: "Phone" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-[var(--md-sys-color-on-surface)]", children: selectedStudent.guardianPhone || "Not specified" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider", children: "Performance Summary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 glass-card bg-gradient-to-br from-green-505/10 to-emerald-500/5 rounded-xl border border-green-500/20 text-center hover:shadow-lg transition-all duration-300", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: clsx(
                      "text-2xl font-bold",
                      selectedStudent.attendancePct >= 85 ? "text-green-600 dark:text-green-400" : "text-orange-500 dark:text-orange-400"
                    ), children: [
                      selectedStudent.attendancePct,
                      "%"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-green-700 dark:text-green-400 font-bold uppercase", children: "Attendance" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 glass-card bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-xl border border-violet-500/20 text-center hover:shadow-lg transition-all duration-300", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-violet-600 dark:text-violet-400", children: getStudentAvg(selectedStudent).toFixed(1) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-violet-700 dark:text-violet-400 font-bold uppercase", children: "Avg Score" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-t border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]/90 backdrop-blur-md space-y-3 pb-safe z-10 relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => onNavigate("students", selectedStudent.id),
                    className: "w-full py-3 glass-button text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors flex flex-col items-center justify-center gap-1 border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-md active:scale-95",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 18 }),
                      "Full Profile"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handleViewAnalytics,
                    className: "w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg active:scale-95",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { size: 18 }),
                      "Deep Insights"
                    ]
                  }
                )
              ] }),
              (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-3 mt-1 border-t border-[var(--md-sys-color-outline)] border-dashed", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handleStartEdit,
                    className: "flex-1 py-2 bg-transparent text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)] rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 hover:bg-[var(--md-sys-color-surface-variant)]",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 14 }),
                      "Quick Edit"
                    ]
                  }
                ),
                (user == null ? void 0 : user.role) === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => {
                      if (window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
                        onDeleteStudent(selectedStudent.id);
                        setSelectedStudent(null);
                        showToast("Student deleted successfully", "success");
                      }
                    },
                    className: "flex-1 py-2 bg-transparent text-rose-500 hover:text-rose-700 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-900/20",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14 }),
                      "Delete"
                    ]
                  }
                )
              ] })
            ] })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditStudentModal,
      {
        isOpen: isEditing,
        onClose: () => setIsEditing(false),
        student: selectedStudent,
        onSave: handleSaveEdit
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddStudentModal,
      {
        isOpen: showAddModal,
        onClose: () => setShowAddModal(false),
        onAdd: (student) => {
          onAddStudent(student);
          showToast("Student added successfully!", "success");
        }
      }
    )
  ] });
};
export {
  Students as default
};
