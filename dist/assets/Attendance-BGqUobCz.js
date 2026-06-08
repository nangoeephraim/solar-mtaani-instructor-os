import { a as reactExports, d as useToast, u as useAuth, j as jsxRuntimeExports, f as ChevronRight, c as clsx, N as Clock, C as Calendar, m as motion, b5 as UserCheck, A as AnimatePresence, Z as Zap, M as Monitor, L as CircleCheckBig, U as Users, p as Search, X, i as CircleX, n as User } from "./index-l2RTGEA9.js";
import { g as getLevelShortLabel } from "./educationLevels-CHjJC3HX.js";
import { C as ChevronLeft } from "./chevron-left-CMd1fSnt.js";
import { A as ArrowLeft } from "./arrow-left-DdTxxQg4.js";
import { C as Check } from "./check-BxyKNVAo.js";
import { C as CircleAlert } from "./circle-alert-CMgkxloe.js";
import { E as Eye } from "./eye-DNeGjsdY.js";
const Attendance = ({ data, onUpdateStudent, onNavigate }) => {
  const [selectedClass, setSelectedClass] = reactExports.useState(null);
  const [selectedDate, setSelectedDate] = reactExports.useState(/* @__PURE__ */ new Date());
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [filterStatus, setFilterStatus] = reactExports.useState("all");
  const [mobileShowSheet, setMobileShowSheet] = reactExports.useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const today = /* @__PURE__ */ new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const currentHour = today.getHours();
  const selectedDayOfWeek = selectedDate.getDay();
  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const displayClasses = reactExports.useMemo(() => {
    const recurring = data.schedule.filter((s) => s.dayOfWeek === selectedDayOfWeek && !s.overrideDate);
    const overrides = data.schedule.filter((s) => s.overrideDate === selectedDateStr);
    const replacedIds = new Set(overrides.filter((o) => o.replacesSlotId).map((o) => o.replacesSlotId));
    return [
      ...recurring.filter((r) => !replacedIds.has(r.id)),
      ...overrides
    ].filter((s) => s.status !== "Cancelled").sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.schedule, selectedDayOfWeek, selectedDateStr]);
  const studentsInClass = reactExports.useMemo(() => {
    if (!selectedClass) return [];
    return data.students.filter((s) => s.grade === selectedClass.grade && s.subject === selectedClass.subject);
  }, [selectedClass, data.students]);
  const getSlotDate = () => selectedDateStr;
  const getAttendanceStatus = (student, slot) => {
    const date = getSlotDate();
    const record = student.attendanceHistory.find((h) => h.slotId === slot.id && h.date === date);
    return (record == null ? void 0 : record.status) || "unmarked";
  };
  const attendanceStats = reactExports.useMemo(() => {
    if (!selectedClass) return { present: 0, absent: 0, unmarked: 0 };
    let present = 0, absent = 0, unmarked = 0;
    studentsInClass.forEach((student) => {
      const status = getAttendanceStatus(student, selectedClass);
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else unmarked++;
    });
    return { present, absent, unmarked };
  }, [selectedClass, studentsInClass]);
  const handleAttendance = (student, status) => {
    if (!selectedClass) return;
    const date = getSlotDate();
    const existingIndex = student.attendanceHistory.findIndex((h) => h.slotId === selectedClass.id && h.date === date);
    let newHistory = [...student.attendanceHistory];
    const record = { date, slotId: selectedClass.id, status };
    if (existingIndex >= 0) {
      newHistory[existingIndex] = record;
    } else {
      newHistory.push(record);
    }
    const presentCount = newHistory.filter((h) => h.status === "present").length;
    const newPct = newHistory.length > 0 ? Math.round(presentCount / newHistory.length * 100) : 100;
    onUpdateStudent({ ...student, attendanceHistory: newHistory, attendancePct: newPct });
  };
  const handleBatchAttendance = (status) => {
    studentsInClass.forEach((student) => handleAttendance(student, status));
    showToast(`All students marked ${status}`, "success");
  };
  const filteredStudents = reactExports.useMemo(() => {
    let students = studentsInClass;
    if (searchQuery) {
      students = students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterStatus !== "all" && selectedClass) {
      students = students.filter((s) => getAttendanceStatus(s, selectedClass) === filterStatus);
    }
    return students;
  }, [studentsInClass, searchQuery, filterStatus, selectedClass]);
  reactExports.useEffect(() => {
    if (displayClasses.length > 0) {
      if (isToday) {
        const current = displayClasses.find((s) => {
          const slotHour = parseInt(s.startTime.split(":")[0]);
          return slotHour >= currentHour;
        }) || displayClasses[0];
        setSelectedClass(current);
      } else {
        setSelectedClass(displayClasses[0]);
      }
    } else {
      setSelectedClass(null);
    }
  }, [displayClasses, isToday, currentHour]);
  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };
  const handleMobileClassSelect = (slot) => {
    setSelectedClass(slot);
    setMobileShowSheet(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col md:flex-row gap-4 md:gap-6 animate-fade-in pb-6 font-sans", children: [
    !mobileShowSheet && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:hidden flex flex-col gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-[var(--md-sys-color-surface)] p-2 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => changeDate(-1), className: "p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all", title: "Previous Day", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 18 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", "aria-label": "Select Attendance Date", value: selectedDateStr, onChange: (e) => {
          if (e.target.value) setSelectedDate(new Date(e.target.value));
        }, className: "w-full bg-transparent text-center text-sm font-bold text-[var(--md-sys-color-on-surface)] cursor-pointer focus:outline-none py-1" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => changeDate(1), disabled: isToday, className: clsx("p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all", isToday && "opacity-30 cursor-not-allowed"), title: "Next Day", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18 }) })
      ] }),
      displayClasses.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 custom-scrollbar", children: displayClasses.map((slot) => {
        const isActive = (selectedClass == null ? void 0 : selectedClass.id) === slot.id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleMobileClassSelect(slot), className: clsx(
          "flex-shrink-0 px-4 py-3 rounded-xl text-left border-2 transition-all min-w-[140px]",
          isActive ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-sm" : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-blue-300"
        ), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate", children: getLevelShortLabel(slot.studentGroup || "Academy", String(slot.grade)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5 flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 10 }),
            " ",
            slot.startTime,
            " • ",
            slot.subject
          ] })
        ] }, slot.id);
      }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 text-[var(--md-sys-color-secondary)] bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 24, className: "mx-auto mb-2 opacity-50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "No classes scheduled" })
      ] })
    ] }),
    mobileShowSheet && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setMobileShowSheet(false), className: "md:hidden flex items-center gap-2 px-3 py-2 text-sm font-bold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg transition-colors self-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 16 }),
      " Back to Classes"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        className: "hidden md:flex w-80 flex-shrink-0 glass-panel flex-col overflow-hidden",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 border-b border-[var(--md-sys-color-outline)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.div,
                {
                  className: "p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg shadow-green-500/30",
                  whileHover: { scale: 1.05, rotate: 5 },
                  transition: { type: "spring", stiffness: 400 },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { size: 22 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-google font-bold text-[var(--md-sys-color-on-surface)]", children: "Attendance" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium", children: today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between bg-[var(--md-sys-color-surface-variant)] p-1 rounded-xl border border-[var(--md-sys-color-outline)]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => changeDate(-1),
                  className: "p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:text-[var(--md-sys-color-on-surface)] transition-all",
                  title: "Previous Day",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 16 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "date",
                  "aria-label": "Select Attendance Date",
                  value: selectedDateStr,
                  onChange: (e) => {
                    if (e.target.value) setSelectedDate(new Date(e.target.value));
                  },
                  className: "w-full bg-transparent text-center text-sm font-bold text-[var(--md-sys-color-on-surface)] cursor-pointer focus:outline-none py-1"
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => changeDate(1),
                  className: clsx(
                    "p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:text-[var(--md-sys-color-on-surface)] transition-all",
                    isToday && "opacity-30 cursor-not-allowed"
                  ),
                  title: "Next Day",
                  disabled: isToday,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "space-y-2", children: displayClasses.length > 0 ? displayClasses.map((slot, idx) => {
            const slotHour = parseInt(slot.startTime.split(":")[0]);
            const isActive = isToday && slotHour <= currentHour && slotHour + Math.floor(slot.durationMinutes / 60) > currentHour;
            const isPast = !isToday || slotHour + Math.floor(slot.durationMinutes / 60) <= currentHour;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.button,
              {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: idx * 0.05 },
                onClick: () => setSelectedClass(slot),
                className: clsx(
                  "w-full p-4 rounded-xl text-left transition-all border-l-4",
                  (selectedClass == null ? void 0 : selectedClass.id) === slot.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-blue-600 shadow-sm" : "bg-[var(--md-sys-color-surface-variant)] border-l-transparent hover:bg-[var(--md-sys-color-surface)]",
                  slot.subject === "Solar" ? "hover:border-l-orange-500" : "hover:border-l-blue-500"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      slot.subject === "Solar" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 14, className: "text-orange-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { size: 14, className: "text-blue-500" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-secondary)]", children: slot.subject })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                      isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full", children: "LIVE" }),
                      isPast && slot.status !== "Completed" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold bg-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] px-1.5 py-0.5 rounded-full", children: "PAST" }),
                      slot.status === "Completed" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 14, className: "text-green-500" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)]", children: getLevelShortLabel(slot.studentGroup || "Academy", String(slot.grade)) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mt-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 10 }),
                    " ",
                    slot.startTime,
                    " • ",
                    slot.durationMinutes,
                    "min"
                  ] })
                ]
              },
              slot.id
            );
          }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 text-[var(--md-sys-color-secondary)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 40, className: "mx-auto mb-3 opacity-50" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "No classes scheduled" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1", children: "Select another date" })
          ] }) }, selectedDateStr) }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: selectedClass ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
        className: clsx(
          "flex-1 glass-panel flex-col overflow-hidden",
          !mobileShowSheet && "hidden md:flex"
        ),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx(
          "p-6 text-white relative overflow-hidden",
          selectedClass.subject === "Solar" ? "bg-gradient-to-br from-orange-600 to-red-600" : "bg-gradient-to-br from-blue-600 to-indigo-700"
        ), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xl font-google font-bold text-white flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 20, className: "text-white/90" }),
                getLevelShortLabel(selectedClass.studentGroup || "Academy", String(selectedClass.grade)),
                " - ",
                selectedClass.subject
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-white/80 mt-1", children: [
                getSlotDate(),
                " • ",
                selectedClass.startTime,
                " • ",
                selectedClass.durationMinutes,
                "min"
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 p-4 bg-[var(--md-sys-color-surface-variant)] border-b border-[var(--md-sys-color-outline)]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  className: "text-center",
                  initial: { scale: 0 },
                  animate: { scale: 1 },
                  transition: { delay: 0.1, type: "spring" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-green-600 dark:text-green-400", children: attendanceStats.present }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Present" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  className: "text-center",
                  initial: { scale: 0 },
                  animate: { scale: 1 },
                  transition: { delay: 0.15, type: "spring" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-red-600 dark:text-red-400", children: attendanceStats.absent }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Absent" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  className: "text-center",
                  initial: { scale: 0 },
                  animate: { scale: 1 },
                  transition: { delay: 0.2, type: "spring" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-[var(--md-sys-color-on-surface-variant)]", children: attendanceStats.unmarked }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Unmarked" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-b border-[var(--md-sys-color-outline)] flex flex-wrap gap-3 items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 relative min-w-[200px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Search students...",
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    className: "w-full pl-10 pr-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:outline-none input-glow text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 bg-[var(--md-sys-color-surface-variant)] p-1 rounded-lg", children: ["all", "present", "absent", "unmarked"].map((status) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setFilterStatus(status),
                  className: clsx(
                    "px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize",
                    filterStatus === status ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                  ),
                  children: status
                },
                status
              )) }),
              isToday && (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => handleBatchAttendance("present"),
                    className: "px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-1.5 shadow-sm",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14 }),
                      " All Present"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => handleBatchAttendance("absent"),
                    className: "px-4 py-2 bg-[var(--md-sys-color-surface)] text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 }),
                      " All Absent"
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar", children: filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
              const status = getAttendanceStatus(student, selectedClass);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: idx * 0.02 },
                  className: clsx(
                    "flex items-center justify-between p-4 rounded-xl border transition-all hover:translate-y-[-2px] hover:shadow-md",
                    status === "present" ? "bg-green-50/40 dark:bg-green-950/15 border-green-200 dark:border-green-900/30" : status === "absent" ? "bg-red-50/40 dark:bg-red-950/15 border-red-200 dark:border-red-900/30" : "glass-card border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)]"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                        status === "present" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : status === "absent" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-[var(--md-sys-color-surface)] dark:bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)]"
                      ), children: student.name.charAt(0) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)]", children: student.name }),
                          student.attendancePct < 80 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200", title: `Low attendance warning (${student.attendancePct}%)`, children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 10 }),
                            " At Risk"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium mt-0.5", children: [
                          "Lot ",
                          student.lot,
                          " • ",
                          student.attendancePct,
                          "% overall"
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
                      !isToday && (user == null ? void 0 : user.role) === "viewer" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx(
                        "flex items-center justify-center w-24 h-8 rounded-lg text-[10px] font-bold tracking-widest uppercase shadow-sm border",
                        status === "present" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" : status === "absent" ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline)]"
                      ), children: [
                        status === "present" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 12, className: "mr-1" }),
                          " Present"
                        ] }),
                        status === "absent" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 12, className: "mr-1" }),
                          " Absent"
                        ] }),
                        status === "unmarked" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 12, className: "mr-1" }),
                          " Unmarked"
                        ] })
                      ] }) : (
                        /* Action Buttons (For any Date if Instructor/Admin) */
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            motion.button,
                            {
                              whileHover: { scale: 1.05 },
                              whileTap: { scale: 0.95 },
                              onClick: () => handleAttendance(student, "present"),
                              className: clsx(
                                "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-bold border",
                                status === "present" ? "bg-green-500 text-white shadow-md border-green-600" : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline)] hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 hover:border-green-200"
                              ),
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14, strokeWidth: 3 })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            motion.button,
                            {
                              whileHover: { scale: 1.05 },
                              whileTap: { scale: 0.95 },
                              onClick: () => handleAttendance(student, "absent"),
                              className: clsx(
                                "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-bold border",
                                status === "absent" ? "bg-red-500 text-white shadow-md border-red-600" : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200"
                              ),
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14, strokeWidth: 3 })
                            }
                          )
                        ] })
                      ),
                      onNavigate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 pl-4 border-l border-[var(--md-sys-color-outline)]", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            onClick: () => onNavigate("students", student.id),
                            className: "p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:text-blue-600 transition-colors",
                            title: "View Full Profile",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 16 })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            onClick: () => onNavigate("student-analytics", student.id),
                            className: "p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:text-violet-600 transition-colors",
                            title: "View Deep Analytics",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 16 })
                          }
                        )
                      ] })
                    ] })
                  ]
                },
                student.id
              );
            }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 text-[var(--md-sys-color-secondary)]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 40, className: "mx-auto mb-3 opacity-50" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "No students found" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1", children: "Try adjusting your search or filter" })
            ] }) })
          ] })
        ] })
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "hidden md:flex flex-1 bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm items-center justify-center",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-[var(--md-sys-color-on-surface-variant)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              animate: { scale: [1, 1.05, 1] },
              transition: { repeat: Infinity, duration: 2 },
              className: "w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { size: 40, className: "text-green-500" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)]", children: "Select a Class" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-1", children: "Choose from the list to mark or view attendance" })
        ] })
      }
    ) })
  ] });
};
export {
  Attendance as default
};
