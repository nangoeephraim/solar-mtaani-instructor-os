import { J as generateCategoricalChart, K as XAxis, Y as YAxis, L as formatAxisMap, a as reactExports, j as jsxRuntimeExports, n as User, m as motion, Z as Zap, M as Monitor, c as clsx, v as ChartColumn, N as Target, C as Calendar, F as FileText, A as AnimatePresence, i as Sparkles, T as TriangleAlert, O as CircleCheckBig, Q as Clock, V as Trophy, W as ResponsiveContainer, $ as Tooltip, a0 as Activity, a1 as AreaChart, a2 as Area, a3 as Award, a4 as Cell, g as ChevronRight, B as BookOpen, a5 as COMPETENCY_COLORS, a6 as COMPETENCY_LABELS, a7 as TrendingUp, k as CircleX, a8 as Bar } from "./index-Dt5N_hgV.js";
import { b as getLevelShortLabel } from "./educationLevels-X5jx7clp.js";
import html2canvas from "./html2canvas.esm-C3USjTtR.js";
import { E } from "./jspdf.es.min-Cx_Gd2mi.js";
import { A as ArrowLeft } from "./arrow-left-Dn-Wu7i4.js";
import { L as Line, S as Star, R as RadarChart, P as PolarGrid, a as PolarAngleAxis, b as PolarRadiusAxis, c as Radar, C as CartesianGrid, d as PieChart, e as Pie, B as BarChart } from "./RadarChart-DkrLbmXy.js";
import { T as TrendingDown } from "./trending-down-91xSBhXI.js";
import { P as Printer } from "./printer-BrEepFzN.js";
var LineChart = generateCategoricalChart({
  chartName: "LineChart",
  GraphicalChild: Line,
  axisComponents: [{
    axisType: "xAxis",
    AxisComp: XAxis
  }, {
    axisType: "yAxis",
    AxisComp: YAxis
  }],
  formatAxisMap
});
const useAnimatedCounter = (end, duration = 1e3) => {
  const [value, setValue] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startValue + (end - startValue) * eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return value;
};
const StatCard = ({ title, value, suffix = "", icon, color, trend, delay = 0 }) => {
  const animatedValue = useAnimatedCounter(value, 1500);
  const glows = {
    violet: "shadow-violet-500/5 border-violet-500/20 hover:border-violet-500/40",
    green: "shadow-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40",
    orange: "shadow-orange-500/5 border-orange-500/20 hover:border-orange-500/40",
    blue: "shadow-blue-500/5 border-blue-500/20 hover:border-blue-500/40",
    red: "shadow-red-500/5 border-red-500/20 hover:border-red-500/40"
  };
  const iconBgs = {
    violet: "bg-violet-500/15 text-violet-500 dark:bg-violet-500/25 dark:text-violet-400",
    green: "bg-emerald-500/15 text-emerald-500 dark:bg-emerald-500/25 dark:text-emerald-400",
    orange: "bg-orange-500/15 text-orange-500 dark:bg-orange-500/25 dark:text-orange-400",
    blue: "bg-blue-500/15 text-blue-500 dark:bg-blue-500/25 dark:text-blue-400",
    red: "bg-red-500/15 text-red-500 dark:bg-red-500/25 dark:text-red-400"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { delay, type: "spring", stiffness: 300 },
      className: clsx(
        "glass-card p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 shadow-lg",
        glows[color]
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br opacity-[0.03] rounded-full blur-2xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.div,
          {
            className: clsx("p-2.5 rounded-xl w-fit flex items-center justify-center shadow-sm", iconBgs[color]),
            whileHover: { scale: 1.1, rotate: 10 },
            transition: { type: "spring", stiffness: 400 },
            children: icon
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mt-4", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 mt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-black text-[var(--md-sys-color-on-surface)]", children: suffix === "%" ? animatedValue.toFixed(0) : animatedValue.toFixed(1) }),
          suffix && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-[var(--md-sys-color-outline)]", children: suffix }),
          trend !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx(
            "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ml-auto border",
            trend >= 0 ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/10" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10"
          ), children: [
            trend >= 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 12 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { size: 12 }),
            trend >= 0 ? "+" : "",
            trend.toFixed(1)
          ] })
        ] })
      ]
    }
  );
};
const StudentAnalytics = ({ data, studentId, onNavigate }) => {
  var _a;
  const student = data.students.find((s) => s.id === studentId);
  const [activeTab, setActiveTab] = reactExports.useState("overview");
  const reportRef = reactExports.useRef(null);
  const [dateRange, setDateRange] = reactExports.useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    end: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  });
  const handlePrint = reactExports.useCallback(() => {
    window.print();
  }, []);
  const handleDownloadPDF = reactExports.useCallback(async () => {
    if (!reportRef.current) return;
    try {
      const originalTab = activeTab;
      if (activeTab !== "reports") {
        setActiveTab("reports");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new E({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = canvas.height * pdfWidth / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${student == null ? void 0 : student.name.replace(/\s+/g, "_")}_Performance_Report.pdf`);
      if (originalTab !== "reports") {
        setActiveTab(originalTab);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  }, [activeTab, student]);
  if (!student) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 bg-[var(--md-sys-color-surface-variant)] rounded-2xl flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 32, className: "text-[var(--md-sys-color-secondary)]" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-[var(--md-sys-color-on-surface)]", children: "Student not found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onNavigate("students-manage"),
          className: "mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium text-sm",
          children: "Back to Students"
        }
      )
    ] }) });
  }
  const effectiveCompetencies = reactExports.useMemo(() => {
    var _a2;
    const fromCompetencies = student.competencies || {};
    const fromAssessment = {};
    if ((_a2 = student.assessment) == null ? void 0 : _a2.units) {
      Object.entries(student.assessment.units).forEach(([unitKey, unit]) => {
        if (unit.system === "KNEC" && unit.finalScore !== void 0) {
          fromAssessment[unitKey] = unit.finalScore >= 80 ? 4 : unit.finalScore >= 60 ? 3 : unit.finalScore >= 40 ? 2 : 1;
        } else if (unit.system === "CBET" && unit.practicalChecks) {
          const total = unit.practicalChecks.length;
          fromAssessment[unitKey] = total >= 4 ? 4 : total >= 3 ? 3 : total >= 2 ? 2 : 1;
          if (unit.verdict === "Competent") fromAssessment[unitKey] = 4;
        }
      });
    }
    return { ...fromCompetencies, ...fromAssessment };
  }, [student.competencies, student.assessment]);
  const classStudents = data.students.filter(
    (s) => s.subject === student.subject && s.grade === student.grade
  );
  const getStudentAvg = (s) => {
    var _a2;
    const comp = s.competencies || {};
    const fromAssess = {};
    if ((_a2 = s.assessment) == null ? void 0 : _a2.units) {
      Object.entries(s.assessment.units).forEach(([unitKey, unit]) => {
        if (unit.system === "KNEC" && unit.finalScore !== void 0) {
          fromAssess[unitKey] = unit.finalScore >= 80 ? 4 : unit.finalScore >= 60 ? 3 : unit.finalScore >= 40 ? 2 : 1;
        } else if (unit.system === "CBET" && unit.verdict) {
          fromAssess[unitKey] = unit.verdict === "Competent" ? 4 : 2;
        }
      });
    }
    const merged = { ...comp, ...fromAssess };
    const vals = Object.values(merged);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const studentAvg = (() => {
    const vals = Object.values(effectiveCompetencies);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  })();
  const classAvg = classStudents.length > 0 ? classStudents.reduce((acc, s) => acc + getStudentAvg(s), 0) / classStudents.length : 0;
  const periodAttendanceHistory = reactExports.useMemo(() => {
    return (student.attendanceHistory || []).filter((h) => h.date >= dateRange.start && h.date <= dateRange.end);
  }, [student.attendanceHistory, dateRange]);
  const sessionsAttended = periodAttendanceHistory.filter((h) => h.status === "present").length;
  const totalSessions = periodAttendanceHistory.length;
  const dynamicAttendancePct = totalSessions > 0 ? Math.round(sessionsAttended / totalSessions * 100) : student.attendancePct;
  const classAttendanceAvg = classStudents.length > 0 ? classStudents.reduce((acc, s) => acc + s.attendancePct, 0) / classStudents.length : 0;
  const radarData = Object.entries(effectiveCompetencies).map(([key, value]) => {
    const classAvgForSkill = classStudents.length > 0 ? classStudents.reduce((acc, s) => acc + ((s.competencies || {})[key] || 0), 0) / classStudents.length : 0;
    return {
      skill: key.length > 12 ? key.substring(0, 10) + "..." : key,
      fullSkill: key,
      student: value,
      class: parseFloat(classAvgForSkill.toFixed(1)),
      fullMark: 4
    };
  });
  const attendanceTrendData = reactExports.useMemo(() => {
    const trendMap = /* @__PURE__ */ new Map();
    periodAttendanceHistory.forEach((record) => {
      const d = new Date(record.date);
      const month = d.toLocaleString("default", { month: "short" });
      const weekNum = Math.ceil(d.getDate() / 7);
      const key = `${month} W${weekNum}`;
      const current = trendMap.get(key) || { present: 0, total: 0 };
      trendMap.set(key, { present: current.present + (record.status === "present" ? 1 : 0), total: current.total + 1 });
    });
    const result = Array.from(trendMap.keys()).map((key) => ({
      period: key,
      rate: Math.round(trendMap.get(key).present / trendMap.get(key).total * 100)
    }));
    if (result.length === 0) return [{ period: "Current", rate: dynamicAttendancePct }];
    return result;
  }, [periodAttendanceHistory, dynamicAttendancePct]);
  reactExports.useMemo(() => {
    return periodAttendanceHistory.slice(-30).map((record) => {
      const d = new Date(record.date);
      return {
        date: record.date,
        day: d.getDate(),
        weekday: d.getDay(),
        status: record.status || "none"
      };
    });
  }, [periodAttendanceHistory]);
  const competencyDistribution = reactExports.useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    Object.values(effectiveCompetencies).forEach((v) => {
      counts[v]++;
    });
    return [
      { name: "Emerging", value: counts[1], color: "#f87171" },
      { name: "Developing", value: counts[2], color: "#fbbf24" },
      { name: "Competent", value: counts[3], color: "#3b82f6" },
      { name: "Mastered", value: counts[4], color: "#10b981" }
    ].filter((d) => d.value > 0);
  }, [effectiveCompetencies]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-fade-in pb-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        className: "bg-[#0f172a] rounded-3xl shadow-2xl overflow-hidden relative border border-[#1e293b]",
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-[#0f172a] to-[#0f172a]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0", style: { backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "24px 24px" } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 relative z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row items-start md:items-center gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.button,
                {
                  onClick: () => onNavigate("students-manage"),
                  whileHover: { scale: 1.05 },
                  whileTap: { scale: 0.95 },
                  className: "p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 20, className: "text-white" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg flex-shrink-0", children: student.photo ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: student.photo, alt: student.name, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full bg-white/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold text-white", children: student.name.charAt(0) }) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl md:text-3xl font-black text-white tracking-tight", children: student.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mt-1 5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx(
                      "px-2 5 py-1 rounded flex items-center gap-1 5 text-xs font-bold uppercase tracking-wider border",
                      student.subject === "Solar" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    ), children: [
                      student.subject === "Solar" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 12 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { size: 12 }),
                      student.subject
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-400 text-xs font-medium", children: [
                      "Lot ",
                      student.lot
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-500 text-xs hidden md:inline font-mono bg-slate-800/50 px-2 py-0.5 rounded", children: [
                      "ID_",
                      student.id.toString().padStart(4, "0")
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 md:gap-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-violet-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]", children: studentAvg.toFixed(1) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1", children: "Avg Score" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-12 bg-slate-800 hidden md:block self-center" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: clsx(
                  "text-3xl md:text-4xl font-black text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]",
                  dynamicAttendancePct >= 85 ? "bg-gradient-to-br from-emerald-400 to-cyan-400" : "bg-gradient-to-br from-amber-400 to-orange-400"
                ), children: [
                  dynamicAttendancePct,
                  "%"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1", children: "Attendance" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm hidden md:block", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl md:text-3xl font-black text-amber-300", children: [
                  "#",
                  classStudents.sort((a, b) => getStudentAvg(b) - getStudentAvg(a)).findIndex((s) => s.id === student.id) + 1
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-white/70 uppercase font-bold tracking-wider", children: "Class Rank" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 pb-6 relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 mx-auto lg:mx-0 overflow-x-auto hide-scrollbar custom-scrollbar w-full lg:w-auto pb-2 lg:pb-0", children: [
              { id: "overview", label: "Overview", icon: ChartColumn },
              { id: "competencies", label: "Skill Map", icon: Target },
              { id: "attendance", label: "Attendance", icon: Calendar },
              { id: "reports", label: "Reports", icon: FileText }
            ].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setActiveTab(tab.id),
                className: clsx(
                  "px-5 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 relative rounded-full whitespace-nowrap",
                  activeTab === tab.id ? "text-white bg-indigo-500/20 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "text-slate-400 bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:text-slate-200"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { size: 16, className: activeTab === tab.id ? "text-indigo-400" : "" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tab.label })
                ]
              },
              tab.id
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-slate-900/40 border border-slate-700/50 rounded-xl px-3 py-2 shadow-sm text-white w-full lg:w-auto justify-center lg:justify-end input-glow", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 14, className: "text-indigo-400" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "date",
                  title: "Start Date",
                  "aria-label": "Start Date",
                  placeholder: "Start Date",
                  value: dateRange.start,
                  onChange: (e) => setDateRange((prev) => ({ ...prev, start: e.target.value })),
                  className: "bg-transparent text-xs font-medium border-none outline-none w-[110px] cursor-pointer"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: "›" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "date",
                  title: "End Date",
                  "aria-label": "End Date",
                  placeholder: "End Date",
                  value: dateRange.end,
                  onChange: (e) => setDateRange((prev) => ({ ...prev, end: e.target.value })),
                  className: "bg-transparent text-xs font-medium border-none outline-none w-[110px] cursor-pointer"
                }
              )
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AnimatePresence, { mode: "wait", children: [
      activeTab === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          className: "space-y-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.05 },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card border border-emerald-500/20 dark:border-emerald-500/10 shadow-sm shadow-emerald-500/5 p-5 transition-transform duration-300 hover:scale-[1.01]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-2 flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 16 }),
                      " Strengths"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed", children: studentAvg >= classAvg ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      "Performing ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: "above class average" }),
                      " (+",
                      (studentAvg - classAvg).toFixed(1),
                      " pts). Shows exceptional mastery in practical skills."
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Consistent attendance record shows dedication despite academic challenges." }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card border border-amber-500/20 dark:border-amber-500/10 shadow-sm shadow-amber-500/5 p-5 transition-transform duration-300 hover:scale-[1.01]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-amber-600 dark:text-amber-400 text-sm mb-2 flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 16 }),
                      " Areas of Concern"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed", children: dynamicAttendancePct < 85 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      "Attendance has dropped to ",
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-red-500 dark:text-red-400", children: [
                        dynamicAttendancePct,
                        "%"
                      ] }),
                      " in the selected period. This may impact upcoming assessments."
                    ] }) : studentAvg < classAvg ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Theoretical understanding is lagging behind practical performance." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "No major concerns detected in the current period." }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card border border-indigo-500/20 dark:border-indigo-500/10 shadow-sm shadow-indigo-500/5 p-5 transition-transform duration-300 hover:scale-[1.01]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-2 flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { size: 16 }),
                      " Recommended Action"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed", children: studentAvg >= classAvg ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Consider assigning advanced peer-mentoring roles or challenging supplementary projects." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Schedule a 1-on-1 check-in to review foundational theory concepts." }) })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                StatCard,
                {
                  title: "Avg Competency",
                  value: studentAvg,
                  suffix: "/4",
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { size: 20 }),
                  color: "violet",
                  trend: studentAvg - classAvg,
                  delay: 0
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                StatCard,
                {
                  title: "Attendance Rate",
                  value: dynamicAttendancePct,
                  suffix: "%",
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 20 }),
                  color: dynamicAttendancePct >= 85 ? "green" : "orange",
                  trend: dynamicAttendancePct - classAttendanceAvg,
                  delay: 0.1
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                StatCard,
                {
                  title: "Sessions Attended",
                  value: sessionsAttended,
                  suffix: `/${totalSessions}`,
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 20 }),
                  color: "blue",
                  delay: 0.2
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                StatCard,
                {
                  title: "Skills Mastered",
                  value: Object.values(effectiveCompetencies).filter((v) => v === 4).length,
                  suffix: `/${Object.keys(effectiveCompetencies).length}`,
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { size: 20 }),
                  color: "orange",
                  delay: 0.3
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  className: "glass-card p-6 shadow-lg border border-[var(--md-sys-color-outline)]/10 hover:scale-[1.01] transition-transform duration-300",
                  initial: { opacity: 0, scale: 0.95 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { delay: 0.2 },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "text-indigo-500 dark:text-indigo-400", size: 18 }),
                      "Competency Profile vs Class"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(RadarChart, { cx: "50%", cy: "50%", outerRadius: "70%", data: radarData, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(PolarGrid, { stroke: "var(--md-sys-color-outline)", opacity: 0.2 }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(PolarAngleAxis, { dataKey: "skill", tick: { fill: "var(--md-sys-color-secondary)", fontSize: 11 } }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(PolarRadiusAxis, { angle: 30, domain: [0, 4], tick: false, axisLine: false }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Tooltip,
                        {
                          contentStyle: { backgroundColor: "var(--md-sys-color-surface-container)", borderColor: "var(--md-sys-color-outline)", borderRadius: "12px", backdropFilter: "blur(8px)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)" },
                          itemStyle: { fontWeight: "bold" },
                          labelStyle: { color: "var(--md-sys-color-on-surface)", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid var(--md-sys-color-outline)", paddingBottom: "4px" }
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Radar, { name: "Student", dataKey: "student", stroke: "#6366f1", fill: "#6366f1", fillOpacity: 0.4, strokeWidth: 2, activeDot: { r: 6, fill: "#6366f1", stroke: "white", strokeWidth: 2 } }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Radar, { name: "Class Avg", dataKey: "class", stroke: "#06b6d4", fill: "#06b6d4", fillOpacity: 0.15, strokeDasharray: "5 5", activeDot: { r: 6, fill: "#06b6d4", stroke: "white", strokeWidth: 2 } })
                    ] }) }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-center gap-6 mt-2 text-xs text-[var(--md-sys-color-secondary)]", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-3 h-3 rounded bg-indigo-500" }),
                        " ",
                        student.name
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-3 h-3 rounded bg-cyan-500 opacity-50" }),
                        " Class Average"
                      ] })
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  className: "glass-card p-6 shadow-lg border border-[var(--md-sys-color-outline)]/10 hover:scale-[1.01] transition-transform duration-300",
                  initial: { opacity: 0, scale: 0.95 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { delay: 0.3 },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "text-indigo-500 dark:text-indigo-400", size: 18 }),
                      "Attendance Trend"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: attendanceTrendData, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "colorScore", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "#6366f1", stopOpacity: 0.3 }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "#6366f1", stopOpacity: 0 })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--md-sys-color-outline)", opacity: 0.2, vertical: false }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "period", tick: { fill: "var(--md-sys-color-secondary)", fontSize: 12 }, axisLine: false, tickLine: false }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { domain: [0, 100], tick: { fill: "var(--md-sys-color-secondary)", fontSize: 12 }, axisLine: false, tickLine: false }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Tooltip,
                        {
                          contentStyle: {
                            background: "var(--md-sys-color-surface-container)",
                            border: "1px solid var(--md-sys-color-outline)",
                            borderRadius: "12px",
                            color: "var(--md-sys-color-on-surface)",
                            backdropFilter: "blur(8px)",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
                          }
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Area,
                        {
                          type: "monotone",
                          dataKey: "rate",
                          stroke: "#6366f1",
                          strokeWidth: 3,
                          fillOpacity: 1,
                          fill: "url(#colorScore)",
                          dot: { fill: "#6366f1", strokeWidth: 2, r: 4 },
                          activeDot: { r: 6, fill: "#6366f1" }
                        }
                      )
                    ] }) }) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                className: "glass-card p-6 shadow-lg border border-[var(--md-sys-color-outline)]/10 hover:scale-[1.01] transition-transform duration-300",
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.4 },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "text-indigo-500 dark:text-indigo-400", size: 18 }),
                    "Competency Level Distribution"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col lg:flex-row items-center justify-between gap-6", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-48 h-48 flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Pie,
                        {
                          data: competencyDistribution,
                          cx: "50%",
                          cy: "50%",
                          innerRadius: 50,
                          outerRadius: 75,
                          paddingAngle: 4,
                          dataKey: "value",
                          children: competencyDistribution.map((entry, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: entry.color }, `cell-${index}`))
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Tooltip,
                        {
                          contentStyle: {
                            background: "var(--md-sys-color-surface-container)",
                            border: "1px solid var(--md-sys-color-outline)",
                            borderRadius: "12px",
                            color: "var(--md-sys-color-on-surface)",
                            backdropFilter: "blur(8px)"
                          }
                        }
                      )
                    ] }) }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 w-full lg:pl-8 space-y-3", children: competencyDistribution.map((level, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 rounded-full", style: { background: level.color } }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-[var(--md-sys-color-secondary)] flex-1", children: level.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold text-[var(--md-sys-color-on-surface)]", children: level.value }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-[var(--md-sys-color-outline)]", children: [
                        "(",
                        (level.value / (Object.keys(effectiveCompetencies).length || 1) * 100).toFixed(0),
                        "%)"
                      ] })
                    ] }, level.name)) })
                  ] })
                ]
              }
            )
          ]
        },
        "overview"
      ),
      activeTab === "competencies" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          className: "space-y-4",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 items-center", children: [
              [
                { label: "Mastered", count: Object.values(effectiveCompetencies).filter((v) => v === 4).length, color: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
                { label: "Competent", count: Object.values(effectiveCompetencies).filter((v) => v === 3).length, color: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
                { label: "Developing", count: Object.values(effectiveCompetencies).filter((v) => v === 2).length, color: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
                { label: "Emerging", count: Object.values(effectiveCompetencies).filter((v) => v === 1).length, color: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800" }
              ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx("flex items-center gap-2 px-4 py-2.5 rounded-xl border", item.bg), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("w-3 h-3 rounded-full", item.color) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: item.count }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-[var(--md-sys-color-secondary)]", children: item.label })
              ] }, item.label)),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => setActiveTab("reports"),
                  className: "ml-auto flex items-center gap-2 px-4 py-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-xl text-sm font-bold border border-violet-200 dark:border-violet-800 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14 }),
                    " View Full Report ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 14 })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6 shadow-lg border border-[var(--md-sys-color-outline)]/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "text-violet-500 dark:text-violet-400", size: 18 }),
                "Detailed Competency Breakdown"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: Object.entries(effectiveCompetencies).map(([key, value], index) => {
                const classAvgForSkill = classStudents.length > 0 ? classStudents.reduce((acc, s) => acc + ((s.competencies || {})[key] || 0), 0) / classStudents.length : 0;
                const diff = value - classAvgForSkill;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  motion.div,
                  {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { delay: index * 0.05 },
                    className: "p-4 glass-panel hover:scale-[1.01] transition-transform duration-300",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md",
                            COMPETENCY_COLORS[value]
                          ), children: value }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-bold text-[var(--md-sys-color-on-surface)] capitalize", children: key.replace(/([A-Z])/g, " $1").trim() }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-secondary)]", children: COMPETENCY_LABELS[value] })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx(
                          "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border",
                          diff >= 0 ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/10" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10"
                        ), children: [
                          diff >= 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 12 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { size: 12 }),
                          diff >= 0 ? "+" : "",
                          diff.toFixed(1),
                          " vs class"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-2.5 bg-[var(--md-sys-color-surface-container-highest)]/40 rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        motion.div,
                        {
                          initial: { width: 0 },
                          animate: { width: `${value / 4 * 100}%` },
                          transition: { delay: 0.3 + index * 0.05, duration: 0.8, type: "spring" },
                          className: clsx(
                            "h-full rounded-full bg-gradient-to-r",
                            value === 4 ? "from-emerald-500 to-teal-400" : value === 3 ? "from-blue-500 to-cyan-400" : value === 2 ? "from-amber-500 to-orange-400" : "from-rose-500 to-red-400"
                          )
                        }
                      ) })
                    ]
                  },
                  key
                );
              }) })
            ] })
          ]
        },
        "competencies"
      ),
      activeTab === "attendance" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          className: "space-y-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  initial: { scale: 0 },
                  animate: { scale: 1 },
                  className: "glass-card border border-green-500/20 shadow-green-500/5 p-6 rounded-2xl text-center hover:scale-[1.02] transition-transform duration-300",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "text-green-500 mx-auto mb-2", size: 28 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-black text-green-600 dark:text-green-400", children: sessionsAttended }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider", children: "Present" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  initial: { scale: 0 },
                  animate: { scale: 1 },
                  transition: { delay: 0.1 },
                  className: "glass-card border border-red-500/20 shadow-red-500/5 p-6 rounded-2xl text-center hover:scale-[1.02] transition-transform duration-300",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "text-red-500 mx-auto mb-2", size: 28 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-black text-red-500 dark:text-red-400", children: periodAttendanceHistory.filter((h) => h.status === "absent").length }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider", children: "Absent" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  initial: { scale: 0 },
                  animate: { scale: 1 },
                  transition: { delay: 0.2 },
                  className: "glass-card border border-violet-500/20 shadow-violet-500/5 p-6 rounded-2xl text-center hover:scale-[1.02] transition-transform duration-300",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "text-violet-500 mx-auto mb-2", size: 28 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-black text-violet-600 dark:text-violet-400", children: [
                      dynamicAttendancePct,
                      "%"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider", children: "Rate" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                className: "glass-card p-6 shadow-lg border border-[var(--md-sys-color-outline)]/10",
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { delay: 0.2 },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "text-violet-500 dark:text-violet-400", size: 18 }),
                    "Weekly Attendance Trend"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-56", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: attendanceTrendData, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "attGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "#22c55e", stopOpacity: 0.3 }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "#22c55e", stopOpacity: 0 })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--md-sys-color-outline)", opacity: 0.2, vertical: false }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "period", tick: { fill: "var(--md-sys-color-secondary)", fontSize: 11 }, axisLine: false, tickLine: false }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { domain: [0, 100], tick: { fill: "var(--md-sys-color-secondary)", fontSize: 11 }, axisLine: false, tickLine: false }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Tooltip,
                      {
                        contentStyle: { background: "var(--md-sys-color-surface-container)", border: "1px solid var(--md-sys-color-outline)", borderRadius: "12px", color: "var(--md-sys-color-on-surface)", backdropFilter: "blur(8px)" },
                        formatter: (value) => [`${value}%`, "Attendance"]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Area, { type: "monotone", dataKey: "rate", stroke: "#22c55e", strokeWidth: 2.5, fillOpacity: 1, fill: "url(#attGrad)", dot: { fill: "#22c55e", r: 3 } })
                  ] }) }) })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                className: "glass-card p-6 shadow-lg",
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { delay: 0.3 },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "text-violet-500 dark:text-violet-400", size: 18 }),
                    "Attendance History Log",
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto text-xs font-normal text-[var(--md-sys-color-secondary)]", children: [
                      periodAttendanceHistory.length,
                      " records"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-[var(--md-sys-color-outline)]/20 glass-panel", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[360px] overflow-y-auto custom-scrollbar", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-[var(--md-sys-color-surface-variant)]/40 backdrop-blur-md sticky top-0 z-10 border-b border-[var(--md-sys-color-outline)]/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Date" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Day" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-center text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Status" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 text-left text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Notes" })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-[var(--md-sys-color-outline)]/10", children: periodAttendanceHistory.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 4, className: "p-8 text-center text-[var(--md-sys-color-secondary)]", children: "No records found in selected date range." }) }) : [...periodAttendanceHistory].reverse().map((record, i) => {
                      const d = new Date(record.date);
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-[var(--md-sys-color-surface-variant)]/20 transition-colors", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]", children: record.date }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-[var(--md-sys-color-secondary)]", children: d.toLocaleDateString("en-US", { weekday: "short" }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx(
                          "px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border",
                          record.status === "present" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/10" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10"
                        ), children: [
                          record.status === "present" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 12 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { size: 12 }),
                          record.status === "present" ? "Present" : "Absent"
                        ] }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-[var(--md-sys-color-secondary)] text-xs", children: record.notes || "—" })
                      ] }, i);
                    }) })
                  ] }) }) })
                ]
              }
            )
          ]
        },
        "attendance"
      ),
      activeTab === "reports" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          className: "space-y-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
                            @media print {
                                body { background: white !important; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                body * { visibility: hidden !important; }
                                #premium-report-card, #premium-report-card * { visibility: visible !important; }
                                #premium-report-card { 
                                    position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important;
                                    background: white !important; color: #1e293b !important; font-size: 11px !important;
                                    box-shadow: none !important; border: none !important; border-radius: 0 !important;
                                    padding: 0 !important; margin: 0 !important;
                                }
                                .print-hidden { display: none !important; }
                                .page-break-avoid { page-break-inside: avoid !important; }
                                .print-bar { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
                            }
                        ` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full overflow-x-auto hide-scrollbar custom-scrollbar pb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { id: "premium-report-card", ref: reportRef, className: "bg-white mx-auto text-slate-800 overflow-hidden relative font-sans shrink-0 shadow-lg", style: { width: "210mm", minHeight: "297mm", padding: "12mm" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 bg-white flex items-center justify-center print:print-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 100 100", className: "w-full h-full", fill: "none", stroke: "url(#brainGrad)", strokeWidth: "2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "brainGrad", x1: "0", y1: "0", x2: "1", y2: "1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#3b82f6" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#8b5cf6" })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M50 10 L80 30 L80 70 L50 90 L20 70 L20 30 Z" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M50 10 L50 90 M20 30 L80 70 M20 70 L80 30" })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-black tracking-widest text-[#0f172a] uppercase", style: { fontFamily: "'Montserrat', sans-serif" }, children: "PRISM" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-black uppercase text-[#0f172a] tracking-wider mb-1", children: "PRISM ACADEMY" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg text-slate-500 uppercase tracking-widest font-normal", children: "STUDENT REPORT" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 page-break-avoid", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "bg-[#0f172a] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-3 mb-0 print:print-bar", children: "STUDENT DETAILS" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 border border-slate-300 bg-slate-100", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border-b border-r border-slate-300", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 bg-slate-200/50 p-2 text-xs font-bold text-slate-700 print:print-bar", children: "Name:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-2 text-xs font-medium bg-white border-l border-slate-300 print:print-bar", children: student.name })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border-b border-slate-300", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 bg-slate-200/50 p-2 text-xs font-bold text-slate-700 print:print-bar", children: "Grade:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-2 text-xs font-medium bg-white border-l border-slate-300 print:print-bar", children: getLevelShortLabel(student.studentGroup, String(student.grade)) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border-r border-slate-300", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 bg-slate-200/50 p-2 text-xs font-bold text-slate-700 print:print-bar", children: "ID:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-2 text-xs font-medium bg-white border-l border-slate-300 print:print-bar", children: student.admissionNumber || `01001${student.id}00` })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 bg-slate-200/50 p-2 text-xs font-bold text-slate-700 print:print-bar", children: "Term:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-2 text-xs font-medium bg-white border-l border-slate-300 print:print-bar", children: "Term 3, 2026" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 page-break-avoid border border-slate-300", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "bg-[#0f172a] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-3 print:print-bar", children: "ACADEMIC PERFORMANCE SUMMARY" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 p-4 bg-white", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-bold text-slate-800 mb-2", children: "Grade Distribution" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: (() => {
                        var _a2;
                        const counts = { "A": 0, "B": 0, "C": 0, "D": 0 };
                        Object.values(((_a2 = student.assessment) == null ? void 0 : _a2.units) || {}).forEach((u) => {
                          var _a3, _b, _c, _d;
                          const s = u.finalScore || (((_a3 = u.cat1) == null ? void 0 : _a3.score) || 0) + (((_b = u.cat2) == null ? void 0 : _b.score) || 0) + (((_c = u.practical) == null ? void 0 : _c.score) || 0) + (((_d = u.finalExam) == null ? void 0 : _d.score) || 0);
                          if (s >= 80) counts["A"]++;
                          else if (s >= 60) counts["B"]++;
                          else if (s >= 40) counts["C"]++;
                          else if (s > 0) counts["D"]++;
                        });
                        const data2 = Object.values(counts).some((c) => c > 0) ? [
                          { name: "A+", value: counts["A"] },
                          { name: "B-", value: counts["B"] },
                          { name: "C+", value: counts["C"] },
                          { name: "D+", value: counts["D"] }
                        ] : [
                          { name: "A+", value: 20 },
                          { name: "A", value: 30 },
                          { name: "B-", value: 35 },
                          { name: "C+", value: 25 },
                          { name: "D+", value: 10 }
                        ];
                        const colors = ["#38bdf8", "#3b82f6", "#4f46e5", "#8b5cf6", "#a855f7"];
                        return /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: data2, margin: { top: 5, right: 10, left: -20, bottom: 0 }, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", tick: { fontSize: 9 }, axisLine: false, tickLine: false }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tick: { fontSize: 9 }, axisLine: false, tickLine: false }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "value", radius: [2, 2, 0, 0], children: data2.map((entry, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: colors[index % colors.length] }, `cell-${index}`)) })
                        ] });
                      })() }) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-bold text-slate-800 mb-2", children: "Overall Progress" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PieChart, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Pie,
                        {
                          data: [
                            { name: "P1", value: 400, color: "#3b82f6" },
                            { name: "P2", value: 300, color: "#0ea5e9" },
                            { name: "P3", value: 300, color: "#8b5cf6" },
                            { name: "P4", value: 200, color: "#c084fc" }
                          ],
                          cx: "50%",
                          cy: "50%",
                          innerRadius: 0,
                          outerRadius: 45,
                          dataKey: "value",
                          stroke: "none",
                          children: [{ color: "#3b82f6" }, { color: "#0ea5e9" }, { color: "#8b5cf6" }, { color: "#c084fc" }].map((entry, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: entry.color }, `cell-${index}`))
                        }
                      ) }) }) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-bold text-slate-800 mb-2", children: "Subject Trends" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        LineChart,
                        {
                          data: [
                            { name: "Jan", Math: 50, Eng: 10 },
                            { name: "Feb", Math: 30, Eng: 40 },
                            { name: "Mar", Math: 50, Eng: 30 },
                            { name: "Apr", Math: 50, Eng: 70 },
                            { name: "May", Math: 60, Eng: 40 },
                            { name: "Jun", Math: 50, Eng: 80 }
                          ],
                          margin: { top: 5, right: 10, left: -20, bottom: 0 },
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", tick: { fontSize: 9 }, axisLine: false, tickLine: false }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tick: { fontSize: 9 }, axisLine: false, tickLine: false }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "linear", dataKey: "Math", stroke: "#0ea5e9", strokeWidth: 2, dot: { r: 2, fill: "#0ea5e9" } }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "linear", dataKey: "Eng", stroke: "#a855f7", strokeWidth: 2, dot: { r: 2, fill: "#a855f7" } })
                          ]
                        }
                      ) }) })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 page-break-avoid border border-slate-300", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "bg-[#0f172a] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-3 mb-0 print:print-bar", children: "SUBJECT GRADES" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-[11px]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-[#0f172a] text-white border-b border-t border-slate-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5 text-left font-normal print:print-bar", children: "Subject" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 py-1.5 text-center font-normal border-l border-slate-600 print:print-bar w-16", children: "Score" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 py-1.5 text-center font-normal border-l border-slate-600 print:print-bar w-16", children: "Grade" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-2 py-1.5 text-center font-normal border-l border-slate-600 print:print-bar w-20", children: "Class Rank" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5 text-left font-normal border-l border-slate-600 print:print-bar", children: "Teacher Comments" })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-300", children: Object.keys(((_a = student.assessment) == null ? void 0 : _a.units) || {}).length > 0 ? Object.entries(student.assessment.units).map(([unitId, unit], idx) => {
                      var _a2, _b, _c, _d, _e;
                      const totalScore = unit.finalScore || (((_a2 = unit.cat1) == null ? void 0 : _a2.score) || 0) + (((_b = unit.cat2) == null ? void 0 : _b.score) || 0) + (((_c = unit.practical) == null ? void 0 : _c.score) || 0) + (((_d = unit.finalExam) == null ? void 0 : _d.score) || 0);
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-white", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-bold text-slate-800 border-r border-slate-300 truncate max-w-[120px]", children: unitId.replace(/_/g, " ") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 py-2 text-center text-slate-700 border-r border-slate-300", children: totalScore || "-" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 py-2 text-center text-slate-700 border-r border-slate-300", children: ((_e = unit.finalGrade) == null ? void 0 : _e.replace("Distinction", "A+").replace("Credit", "B").replace("Pass", "C").replace("Fail", "D")) || "A+" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-2 py-2 text-center text-slate-700 border-r border-slate-300", children: [
                          idx + 1,
                          "st"
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-slate-700", children: unit.instructorRemarks || `Teacher comments for ${unitId.toLowerCase()} students.` })
                      ] }, unitId);
                    }) : [
                      { sub: "English", score: 90, grade: "A+", rank: "1st", comm: "Teacher comments for summary students." },
                      { sub: "Geometry", score: 80, grade: "A+", rank: "2nd", comm: "Teacher comments for learning students." },
                      { sub: "Mathematics", score: 80, grade: "B", rank: "3rd", comm: "Teacher comments for roach students." },
                      { sub: "Button", score: 95, grade: "A+", rank: "4th", comm: "Teacher comments for vurion students." },
                      { sub: "Scientist", score: 90, grade: "A+", rank: "5th", comm: "Teacher comments for noining students." },
                      { sub: "Coal", score: 70, grade: "C", rank: "6th", comm: "Teacher comments for vution students." }
                    ].map((row, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-white", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-bold text-slate-800 border-r border-slate-300", children: row.sub }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 py-2 text-center text-slate-700 border-r border-slate-300", children: row.score }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 py-2 text-center text-slate-700 border-r border-slate-300", children: row.grade }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-2 py-2 text-center text-slate-700 border-r border-slate-300", children: row.rank }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-slate-700", children: row.comm })
                    ] }, idx)) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 page-break-avoid", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "bg-[#0f172a] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-3 mb-4 print:print-bar", children: "SKILLS & LEARNING OUTCOMES" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-8 px-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1/2 h-32 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(RadarChart, { cx: "50%", cy: "50%", outerRadius: "70%", data: [
                        { subject: "Sab", A: 120, fullMark: 150 },
                        { subject: "Coi", A: 98, fullMark: 150 },
                        { subject: "Skills", A: 86, fullMark: 150 },
                        { subject: "Da", A: 99, fullMark: 150 },
                        { subject: "Ini", A: 85, fullMark: 150 },
                        { subject: "Nov", A: 65, fullMark: 150 }
                      ], children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(PolarGrid, { stroke: "#e2e8f0" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(PolarAngleAxis, { dataKey: "subject", tick: { fontSize: 8, fill: "#64748b" } }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Radar, { dataKey: "A", stroke: "#38bdf8", fill: "#38bdf8", fillOpacity: 0.5 })
                      ] }) }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1/2 h-32 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(RadarChart, { cx: "50%", cy: "50%", outerRadius: "70%", data: [
                        { subject: "Sab", A: 110, fullMark: 150 },
                        { subject: "Coi", A: 88, fullMark: 150 },
                        { subject: "Skills", A: 100, fullMark: 150 },
                        { subject: "Da", A: 120, fullMark: 150 },
                        { subject: "Inl", A: 90, fullMark: 150 },
                        { subject: "Nov", A: 85, fullMark: 150 }
                      ], children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(PolarGrid, { stroke: "#e2e8f0" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(PolarAngleAxis, { dataKey: "subject", tick: { fontSize: 8, fill: "#64748b" } }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Radar, { dataKey: "A", stroke: "#c084fc", fill: "#c084fc", fillOpacity: 0.5 })
                      ] }) }) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4", children: [
                      { label: "Positive Learning", score: 80, gradient: "from-blue-500 to-cyan-400" },
                      { label: "Skills & Learning Outcomes", score: 50, gradient: "from-purple-600 to-indigo-500" },
                      { label: "Skills Attreation", score: 70, gradient: "from-blue-400 to-indigo-300" },
                      { label: "Skill Meters", score: 70, gradient: "from-purple-500 to-fuchsia-400" }
                    ].map((gauge, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-end h-full pt-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-20 h-10 overflow-hidden mb-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 w-20 h-20 rounded-full border-[10px] border-slate-100" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: `absolute top-0 left-0 w-20 h-20 rounded-full border-[10px] border-transparent border-t-[color:var(--tw-gradient-from)] border-l-[color:var(--tw-gradient-from)] print:print-bar bg-gradient-to-r ${gauge.gradient} !bg-clip-border`,
                            style: {
                              transform: `rotate(${-45 + gauge.score / 100 * 180}deg)`,
                              maskImage: "linear-gradient(white, white)",
                              borderStyle: "solid"
                            }
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute top-0 left-0 w-full h-full", viewBox: "0 0 100 50", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M 10 50 A 40 40 0 0 1 90 50", fill: "none", stroke: "#f1f5f9", strokeWidth: "20" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M 10 50 A 40 40 0 0 1 90 50", fill: "none", stroke: `url(#grad${idx})`, strokeWidth: "20", strokeDasharray: `${gauge.score / 100 * 125.6} 125.6` }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: `grad${idx}`, x1: "0", y1: "0", x2: "1", y2: "0", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: idx % 2 === 0 ? "#3b82f6" : "#8b5cf6" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: idx % 2 === 0 ? "#0ea5e9" : "#c084fc" })
                          ] }) })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 w-full text-center font-bold text-slate-800", children: gauge.score })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-center font-medium text-slate-800 leading-tight w-24", children: gauge.label })
                    ] }, idx)) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-12 left-12 right-12 flex justify-between page-break-avoid", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-1/3 text-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-black mb-1 w-full print:print-bar", style: { height: "1px" } }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-black uppercase", children: "PARENT/GUARDIAN SIGNATURE" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-1/3 text-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-black mb-1 w-full print:print-bar", style: { height: "1px" } }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-black uppercase", children: "TEACHER SIGNATURE" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-200 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 page-break-avoid", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 flex-wrap", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-50 px-2 py-1 rounded border border-slate-100", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-slate-700", children: "KNEC:" }),
                    " Distinction (80+), Credit (60+), Pass (50+)"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-50 px-2 py-1 rounded border border-slate-100", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-slate-700", children: "CBET:" }),
                    " C (Competent), NYC (Not Yet)"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "uppercase tracking-widest font-bold flex items-center gap-1.5 whitespace-nowrap", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-amber-400" }),
                  "Powered by PRISM"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 print-hidden", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handlePrint,
                    className: "px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-all active:scale-95",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { size: 16 }),
                      " Print Official Report"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handleDownloadPDF,
                    className: "px-5 py-2.5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 flex items-center gap-2 transition-all active:scale-95",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 16 }),
                      " Save as PDF"
                    ]
                  }
                )
              ] })
            ] })
          ]
        },
        "reports"
      )
    ] })
  ] });
};
export {
  StudentAnalytics as default
};
