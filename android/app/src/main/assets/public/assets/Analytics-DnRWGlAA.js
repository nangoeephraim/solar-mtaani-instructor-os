import { o as createLucideIcon, R as React, u as useTheme, a as reactExports, ai as DEFAULT_SETTINGS, e as useToast, aj as getSettings, ak as analyzeData, j as jsxRuntimeExports, v as ChartColumn, c as clsx, f as RefreshCw, i as Sparkles, A as AnimatePresence, m as motion, F as FileText, a3 as Award, U as Users, T as TriangleAlert, N as Target, a0 as Activity, C as Calendar, W as ResponsiveContainer, K as XAxis, Y as YAxis, $ as Tooltip, a8 as Bar, Z as Zap, a4 as Cell, al as ArrowUpRight, a1 as AreaChart, am as Legend, a2 as Area, X, an as fetchAnalyticsSummary, a9 as supabase, a7 as TrendingUp, ao as Lightbulb } from "./index-D-ESeA_n.js";
import { b as getLevelShortLabel } from "./educationLevels-CWONNkiO.js";
import { E } from "./jspdf.es.min-DgEbczAs.js";
import html2canvas from "./html2canvas.esm-C3USjTtR.js";
import { g as getSubjectEmoji, c as getSubjectHex } from "./subjectUtils-CWZOIqn8.js";
import { D as Download } from "./download-BAAPrgct.js";
import { C as ChevronDown } from "./chevron-down-B4mbL8XK.js";
import { P as Printer } from "./printer-CZjzKWRG.js";
import { S as Star, B as BarChart, C as CartesianGrid, d as PieChart, e as Pie, L as Line, R as RadarChart, P as PolarGrid, a as PolarAngleAxis, c as Radar } from "./RadarChart-8HY2OwBl.js";
import { T as TrendingDown } from "./trending-down-CAjcCfQk.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Brain = createLucideIcon("Brain", [
  [
    "path",
    {
      d: "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",
      key: "l5xja"
    }
  ],
  [
    "path",
    {
      d: "M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",
      key: "ep3f8r"
    }
  ],
  ["path", { d: "M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4", key: "1p4c4q" }],
  ["path", { d: "M17.599 6.5a3 3 0 0 0 .399-1.375", key: "tmeiqw" }],
  ["path", { d: "M6.003 5.125A3 3 0 0 0 6.401 6.5", key: "105sqy" }],
  ["path", { d: "M3.477 10.896a4 4 0 0 1 .585-.396", key: "ql3yin" }],
  ["path", { d: "M19.938 10.5a4 4 0 0 1 .585.396", key: "1qfode" }],
  ["path", { d: "M6 18a4 4 0 0 1-1.967-.516", key: "2e4loj" }],
  ["path", { d: "M19.967 17.484A4 4 0 0 1 18 18", key: "159ez6" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ChartPie = createLucideIcon("ChartPie", [
  [
    "path",
    {
      d: "M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z",
      key: "pzmjnu"
    }
  ],
  ["path", { d: "M21.21 15.89A10 10 0 1 1 8 2.83", key: "k2fpak" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const GitCompare = createLucideIcon("GitCompare", [
  ["circle", { cx: "18", cy: "18", r: "3", key: "1xkwt0" }],
  ["circle", { cx: "6", cy: "6", r: "3", key: "1lh9wr" }],
  ["path", { d: "M13 6h3a2 2 0 0 1 2 2v7", key: "1yeb86" }],
  ["path", { d: "M11 18H8a2 2 0 0 1-2-2V9", key: "19pyzm" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const PartyPopper = createLucideIcon("PartyPopper", [
  ["path", { d: "M5.8 11.3 2 22l10.7-3.79", key: "gwxi1d" }],
  ["path", { d: "M4 3h.01", key: "1vcuye" }],
  ["path", { d: "M22 8h.01", key: "1mrtc2" }],
  ["path", { d: "M15 2h.01", key: "1cjtqr" }],
  ["path", { d: "M22 20h.01", key: "1mrys2" }],
  [
    "path",
    {
      d: "m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10",
      key: "hbicv8"
    }
  ],
  [
    "path",
    { d: "m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17", key: "1i94pl" }
  ],
  ["path", { d: "m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7", key: "1cofks" }],
  [
    "path",
    {
      d: "M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z",
      key: "4kbmks"
    }
  ]
]);
const GOOGLE_COLORS = ["#4285f4", "#ea4335", "#fbbc04", "#34a853", "#9333ea", "#f97316"];
const useAnimatedCounter = (end, duration = 1e3) => {
  const [count, setCount] = reactExports.useState(0);
  const countRef = reactExports.useRef(0);
  const startTimeRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const currentCount = Math.floor(progress * end);
      if (countRef.current !== currentCount) {
        countRef.current = currentCount;
        setCount(currentCount);
      }
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [end, duration]);
  return count;
};
const MiniSparkline = React.memo(({ data, color }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 100 30", className: "w-full h-8 mt-2", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: `spark-${color}`, x1: "0", y1: "0", x2: "0", y2: "1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: color, stopOpacity: "0.3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: color, stopOpacity: "0" })
  ] }) }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      d: `M ${data.map((v, i) => `${i / (data.length - 1) * 100},${30 - v / Math.max(...data) * 25}`).join(" L ")}`,
      fill: "none",
      stroke: color,
      strokeWidth: "2",
      strokeLinecap: "round"
    }
  ),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      d: `M 0,30 L ${data.map((v, i) => `${i / (data.length - 1) * 100},${30 - v / Math.max(...data) * 25}`).join(" L ")} L 100,30 Z`,
      fill: `url(#spark-${color})`
    }
  )
] }));
const MetricCard = React.memo(({ title, value, suffix = "", subtitle, trend, color, icon, delay = 0, sparklineData }) => {
  const animatedValue = useAnimatedCounter(value, 1500);
  const gradients = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-emerald-500 to-teal-600",
    yellow: "from-amber-400 to-orange-500",
    red: "from-red-500 to-rose-600",
    purple: "from-purple-500 to-indigo-600"
  };
  const colorHex = {
    blue: "#4f46e5",
    green: "#0d9488",
    yellow: "#f59e0b",
    red: "#ef4444",
    purple: "#8b5cf6"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { delay, type: "spring", stiffness: 300, damping: 25 },
      whileHover: { y: -5, scale: 1.02, transition: { duration: 0.25 } },
      className: "relative bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden group",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-0 group-hover:opacity-[0.08] blur-2xl transition-opacity duration-500 pointer-events-none",
            style: { background: colorHex[color] }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.div,
              {
                className: clsx("p-2.5 rounded-xl bg-gradient-to-br text-white shadow-lg", gradients[color]),
                whileHover: { rotate: [0, -10, 10, 0], scale: 1.1, transition: { duration: 0.5 } },
                children: icon
              }
            ),
            trend && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                initial: { scale: 0 },
                animate: { scale: 1 },
                transition: { delay: delay + 0.3 },
                className: clsx(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold",
                  trend === "up" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                ),
                children: [
                  trend === "up" ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 10 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { size: 10 }),
                  trend === "up" ? "+5%" : "-3%"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest mb-1", children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-black text-[var(--md-sys-color-on-surface)] tabular-nums font-google", children: animatedValue }),
            suffix && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]", children: suffix })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium mt-0.5", children: subtitle }),
          sparklineData && /* @__PURE__ */ jsxRuntimeExports.jsx(MiniSparkline, { data: sparklineData, color: colorHex[color] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("h-1.5 w-full bg-gradient-to-r", gradients[color]) })
      ]
    }
  );
});
const InsightChip = React.memo(({ type, message, delay = 0 }) => {
  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    prediction: "bg-purple-50 border-purple-200 text-purple-800"
  };
  const icons = {
    success: /* @__PURE__ */ jsxRuntimeExports.jsx(PartyPopper, { size: 14, className: "text-green-600" }),
    warning: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 14, className: "text-amber-600" }),
    info: /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { size: 14, className: "text-blue-600" }),
    prediction: /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { size: 14, className: "text-purple-600" })
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { delay },
      className: clsx("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium", styles[type]),
      children: [
        icons[type],
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--md-sys-color-on-surface)]", children: message })
      ]
    }
  );
});
const ChartCard = React.memo(({ title, icon, children, delay = 0, className, action }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  motion.div,
  {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, type: "spring", stiffness: 200, damping: 25 },
    className: clsx("bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm p-6 hover:shadow-lg transition-shadow", className),
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-[var(--md-sys-color-surface-variant)] rounded-lg text-[var(--md-sys-color-on-surface-variant)]", children: icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-google font-bold text-[var(--md-sys-color-on-surface)]", children: title })
        ] }),
        action
      ] }),
      children
    ]
  }
));
const Analytics = ({ data, onNavigate }) => {
  var _a;
  const { preferences } = useTheme();
  const [selectedMetric, setSelectedMetric] = reactExports.useState("overview");
  const [hoveredStudent, setHoveredStudent] = reactExports.useState(null);
  const [timePeriod, setTimePeriod] = reactExports.useState("month");
  const [showExportMenu, setShowExportMenu] = reactExports.useState(false);
  const [dateRange, setDateRange] = reactExports.useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
    end: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  });
  const [comparisonStudents, setComparisonStudents] = reactExports.useState([]);
  const [showComparisonPicker, setShowComparisonPicker] = reactExports.useState(false);
  const analyticsRef = reactExports.useRef(null);
  const [settings, setSettings] = reactExports.useState(DEFAULT_SETTINGS);
  const [classAvg, setClassAvg] = reactExports.useState({ overall_avg_score: 0, overall_avg_attendance: 0, total_students: 0 });
  const [subjectComp, setSubjectComp] = reactExports.useState([]);
  const [atRiskList, setAtRiskList] = reactExports.useState([]);
  const [gradeDist, setGradeDist] = reactExports.useState([]);
  const [isLoadingStats, setIsLoadingStats] = reactExports.useState(true);
  const [isGeneratingCloud, setIsGeneratingCloud] = reactExports.useState(false);
  const { showToast } = useToast();
  reactExports.useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      const stats = await fetchAnalyticsSummary();
      setClassAvg(stats.classAverages);
      setSubjectComp(stats.subjectComparison);
      setAtRiskList(stats.atRiskStudents);
      setGradeDist(stats.gradeDistribution);
      setIsLoadingStats(false);
    };
    loadStats();
  }, []);
  reactExports.useEffect(() => {
    const loaded = getSettings();
    if (!loaded.preferences) {
      setSettings({ ...loaded, preferences: DEFAULT_SETTINGS.preferences });
    } else {
      setSettings(loaded);
    }
  }, []);
  const gradeData = reactExports.useMemo(() => gradeDist.map((g) => ({
    grade: `${g.grade}`,
    shortGrade: `${g.grade}`,
    students: g.student_count,
    avgScore: g.avg_score,
    attendance: g.avg_attendance
  })), [gradeDist]);
  const subjectData = reactExports.useMemo(() => subjectComp.map((s) => ({
    name: s.subject,
    score: s.avg_score,
    students: s.student_count,
    color: getSubjectHex(s.subject),
    icon: getSubjectEmoji(s.subject)
  })), [subjectComp]);
  const getAvgCompetency = reactExports.useMemo(() => (students) => {
    if (students.length === 0) return 0;
    const total = students.reduce((acc, s) => {
      const vals = Object.values(s.competencies);
      return acc + vals.reduce((a, b) => a + b, 0) / vals.length;
    }, 0);
    return parseFloat((total / students.length).toFixed(2));
  }, []);
  const attendanceTrend = reactExports.useMemo(() => [
    { week: "W1", fullWeek: "Week 1", rate: 92, target: 90 },
    { week: "W2", fullWeek: "Week 2", rate: 88, target: 90 },
    { week: "W3", fullWeek: "Week 3", rate: 95, target: 90 },
    { week: "W4", fullWeek: "Week 4", rate: 91, target: 90 },
    { week: "W5", fullWeek: "Week 5", rate: data.students.length > 0 ? Math.round(data.students.reduce((acc, s) => acc + s.attendancePct, 0) / data.students.length) : 0, target: 90 }
  ], [data.students]);
  const performanceSparkline = reactExports.useMemo(() => [2.8, 3, 2.9, 3.1, 3.2, getAvgCompetency(data.students)], [data.students, getAvgCompetency]);
  const attendanceSparkline = reactExports.useMemo(() => attendanceTrend.map((w) => w.rate), [attendanceTrend]);
  const studentsSparkline = reactExports.useMemo(() => [8, 10, 12, 14, 16, classAvg.total_students], [classAvg.total_students]);
  const atRiskSparkline = reactExports.useMemo(() => [5, 4, 3, 4, 2, atRiskList.length], [atRiskList.length]);
  const topPerformers = reactExports.useMemo(() => [...data.students].map((student) => ({
    ...student,
    avgScore: Object.values(student.competencies).reduce((x, y) => x + y, 0) / Object.values(student.competencies).length
  })).sort((a, b) => b.avgScore - a.avgScore).slice(0, 5), [data.students]);
  const atRiskStudents = atRiskList;
  const competencyDistribution = reactExports.useMemo(() => [
    { name: "Mastery (3.5-4)", value: data.students.filter((s) => getAvgCompetency([s]) >= 3.5).length, color: "#22c55e" },
    { name: "Proficient (2.5-3.4)", value: data.students.filter((s) => getAvgCompetency([s]) >= 2.5 && getAvgCompetency([s]) < 3.5).length, color: "#3b82f6" },
    { name: "Developing (1.5-2.4)", value: data.students.filter((s) => getAvgCompetency([s]) >= 1.5 && getAvgCompetency([s]) < 2.5).length, color: "#f59e0b" },
    { name: "Needs Support (<1.5)", value: data.students.filter((s) => getAvgCompetency([s]) < 1.5).length, color: "#ef4444" }
  ], [data.students, getAvgCompetency]);
  const overallAvg = classAvg.overall_avg_score;
  const overallAttendance = classAvg.overall_avg_attendance;
  const activeData = reactExports.useMemo(() => {
    var _a2;
    if (((_a2 = settings.preferences) == null ? void 0 : _a2.enableAI) === false) return [];
    return analyzeData(data);
  }, [data, (_a = settings.preferences) == null ? void 0 : _a.enableAI]);
  activeData.length > 0 ? activeData[0] : null;
  const exportToCSV = () => {
    var _a2, _b;
    const cohortLabel = ((_a2 = preferences.terminology) == null ? void 0 : _a2.cohortLabel) || "Lot";
    const classLabel = ((_b = preferences.terminology) == null ? void 0 : _b.classLabel) || "Grade";
    const headers = ["Name", "Subject", classLabel, cohortLabel, "Attendance %", "Avg Competency"];
    const rows = data.students.map((s) => [
      s.name,
      s.subject,
      s.grade,
      s.lot,
      s.attendancePct,
      (Object.values(s.competencies).reduce((a2, b) => a2 + b, 0) / Object.values(s.competencies).length).toFixed(2)
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `slyc_analytics_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    a.click();
    setShowExportMenu(false);
  };
  const exportToPDF = async () => {
    if (!analyticsRef.current) return;
    setShowExportMenu(false);
    try {
      const canvas = await html2canvas(analyticsRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new E("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.setFontSize(20);
      pdf.setTextColor(59, 130, 246);
      pdf.text("Analytics Report", 14, 20);
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`, 14, 28);
      pdf.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 34);
      pdf.addImage(imgData, "PNG", 0, 45, imgWidth, Math.min(imgHeight, 240));
      pdf.save(`analytics_report_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
    }
  };
  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };
  const handleCloudReportGeneration = async () => {
    setIsGeneratingCloud(true);
    try {
      const { data: data2, error } = await supabase.functions.invoke("generate-report", {
        body: { reportType: "cohort_summary", filters: { dateRange, timePeriod } }
      });
      if (!error && (data2 == null ? void 0 : data2.downloadUrl)) {
        showToast("Cloud Report generated on server! Opening...", "success");
        setTimeout(() => window.open(data2.downloadUrl, "_blank"), 800);
        return;
      }
      console.warn("[CloudReport] Edge Function unavailable, falling back to client-side:", (error == null ? void 0 : error.message) || "No download URL");
      const pdf = new E("p", "mm", "a4");
      const W = pdf.internal.pageSize.getWidth();
      let y = 14;
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, W, 36, "F");
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 36, W, 2, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("PRISM Analytics Report", 14, 20);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(148, 163, 184);
      pdf.text("Generated: " + (/* @__PURE__ */ new Date()).toLocaleDateString() + "  |  Period: " + dateRange.start + " to " + dateRange.end, 14, 30);
      y = 46;
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("KEY METRICS", 14, y);
      y += 6;
      const metricsArr = [
        { label: "Class Average", value: (classAvg.overall_avg_score || 0).toFixed(2) + " / 4.0" },
        { label: "Attendance", value: (classAvg.overall_avg_attendance || 0) + "%" },
        { label: "Total Students", value: "" + classAvg.total_students },
        { label: "At-Risk", value: "" + atRiskStudents.length }
      ];
      const bxW = (W - 28 - 12) / 4;
      metricsArr.forEach((m, i) => {
        const bx = 14 + i * (bxW + 4);
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(bx, y, bxW, 22, 3, 3, "F");
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(107, 114, 128);
        pdf.text(m.label, bx + 4, y + 8);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 30, 30);
        pdf.text(m.value, bx + 4, y + 18);
      });
      y += 30;
      if (subjectComp.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 30, 30);
        pdf.text("SUBJECT PERFORMANCE", 14, y);
        y += 6;
        pdf.setFillColor(59, 130, 246);
        pdf.rect(14, y, W - 28, 8, "F");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("Subject", 18, y + 5.5);
        pdf.text("Students", 80, y + 5.5);
        pdf.text("Avg Score", 120, y + 5.5);
        y += 8;
        subjectComp.forEach((s, idx) => {
          const bg = idx % 2 === 0 ? [255, 255, 255] : [245, 247, 250];
          pdf.setFillColor(bg[0], bg[1], bg[2]);
          pdf.rect(14, y, W - 28, 7, "F");
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(40, 40, 40);
          pdf.text(s.subject, 18, y + 5);
          pdf.text("" + s.student_count, 80, y + 5);
          pdf.text(s.avg_score.toFixed(2), 120, y + 5);
          y += 7;
        });
        y += 4;
      }
      if (gradeDist.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 30, 30);
        pdf.text("GRADE DISTRIBUTION", 14, y);
        y += 6;
        pdf.setFillColor(59, 130, 246);
        pdf.rect(14, y, W - 28, 8, "F");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("Grade", 18, y + 5.5);
        pdf.text("Students", 60, y + 5.5);
        pdf.text("Avg Score", 100, y + 5.5);
        pdf.text("Attendance", 140, y + 5.5);
        y += 8;
        gradeDist.forEach((g, idx) => {
          const bg = idx % 2 === 0 ? [255, 255, 255] : [245, 247, 250];
          pdf.setFillColor(bg[0], bg[1], bg[2]);
          pdf.rect(14, y, W - 28, 7, "F");
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(40, 40, 40);
          pdf.text("" + g.grade, 18, y + 5);
          pdf.text("" + g.student_count, 60, y + 5);
          pdf.text(g.avg_score.toFixed(2), 100, y + 5);
          pdf.text(g.avg_attendance.toFixed(0) + "%", 140, y + 5);
          y += 7;
        });
        y += 4;
      }
      if (atRiskStudents.length > 0) {
        if (y > 230) {
          pdf.addPage();
          y = 14;
        }
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(239, 68, 68);
        pdf.text("AT-RISK STUDENTS", 14, y);
        y += 6;
        pdf.setFillColor(239, 68, 68);
        pdf.rect(14, y, W - 28, 8, "F");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("Name", 18, y + 5.5);
        pdf.text("Avg Score", 90, y + 5.5);
        pdf.text("Attendance", 140, y + 5.5);
        y += 8;
        atRiskStudents.forEach((s, idx) => {
          if (y > 275) {
            pdf.addPage();
            y = 14;
          }
          const bg = idx % 2 === 0 ? [255, 255, 255] : [254, 242, 242];
          pdf.setFillColor(bg[0], bg[1], bg[2]);
          pdf.rect(14, y, W - 28, 7, "F");
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(40, 40, 40);
          pdf.text(s.name, 18, y + 5);
          pdf.text(s.avg_score.toFixed(2), 90, y + 5);
          pdf.text(s.attendance_pct.toFixed(0) + "%", 140, y + 5);
          y += 7;
        });
      }
      const pageCount = pdf.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        pdf.setPage(p);
        pdf.setDrawColor(229, 231, 235);
        pdf.line(14, 284, W - 14, 284);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(156, 163, 175);
        pdf.text("PRISM OS  |  Client-Generated Fallback", 14, 289);
        pdf.text("Page " + p + " of " + pageCount, W - 14, 289, { align: "right" });
      }
      pdf.save("PRISM_Analytics_Report_" + (/* @__PURE__ */ new Date()).toISOString().split("T")[0] + ".pdf");
      showToast("Report saved locally (server unavailable)", "info");
    } catch (err) {
      console.error("[CloudReport] Generation failed:", err);
      showToast("Report generation failed. Please try again.", "error");
    } finally {
      setIsGeneratingCloud(false);
    }
  };
  const toggleComparisonStudent = (studentId) => {
    setComparisonStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), studentId];
      }
      return [...prev, studentId];
    });
  };
  const getComparisonData = () => {
    const selectedStudents = data.students.filter((s) => comparisonStudents.includes(s.id));
    if (selectedStudents.length === 0) return [];
    const allCompetencies = /* @__PURE__ */ new Set();
    selectedStudents.forEach((s) => Object.keys(s.competencies).forEach((k) => allCompetencies.add(k)));
    return Array.from(allCompetencies).slice(0, 6).map((comp) => {
      const entry = { competency: comp.substring(0, 15) + (comp.length > 15 ? "..." : "") };
      selectedStudents.forEach((s) => {
        entry[s.name] = s.competencies[comp] || 0;
      });
      return entry;
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 animate-fade-in pb-10 font-sans", ref: analyticsRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "text-[var(--md-sys-color-primary)]" }),
          " Analytics Dashboard"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[var(--md-sys-color-secondary)] text-sm font-medium", children: "Real-time performance metrics and insights" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 bg-[var(--md-sys-color-surface-variant)] p-1 rounded-full border border-[var(--md-sys-color-outline)]", children: [
          { id: "week", label: "Week" },
          { id: "month", label: "Month" },
          { id: "term", label: "Term" }
        ].map((period, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setTimePeriod(period.id),
            className: clsx(
              "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
              timePeriod === period.id ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
            ),
            children: period.label
          },
          idx
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:block h-6 border-l border-[var(--md-sys-color-outline)] mx-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleCloudReportGeneration,
            disabled: isGeneratingCloud,
            className: "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-70",
            children: [
              isGeneratingCloud ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 14, className: "text-purple-200" }),
              isGeneratingCloud ? "Generating..." : "Cloud Report"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setShowExportMenu(!showExportMenu),
              className: "flex items-center gap-2 px-4 py-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-full text-sm font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] hover:shadow-sm transition-all",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14 }),
                "Export",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14 })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showExportMenu && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: 10 },
              className: "absolute right-0 mt-2 w-48 bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline)] shadow-xl z-50 overflow-hidden",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: exportToCSV,
                    className: "w-full px-4 py-3 text-left text-sm font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] flex items-center gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14 }),
                      "Export as CSV"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: exportToPDF,
                    className: "w-full px-4 py-3 text-left text-sm font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] flex items-center gap-2 border-t border-[var(--md-sys-color-outline)]",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14 }),
                      "Export as PDF"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handlePrint,
                    className: "w-full px-4 py-3 text-left text-sm font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] flex items-center gap-2 border-t border-[var(--md-sys-color-outline)]",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { size: 14 }),
                      "Print Report"
                    ]
                  }
                )
              ]
            }
          ) })
        ] })
      ] })
    ] }),
    activeData.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.1 },
        className: "flex flex-wrap gap-3",
        children: activeData.map((insight, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(InsightChip, { type: insight.type, message: insight.message, delay: 0.1 + idx * 0.05 }, idx))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          title: "Class Average",
          value: Math.round(overallAvg * 100) / 100,
          suffix: "/4",
          subtitle: "Competency Score",
          trend: overallAvg >= 2.5 ? "up" : "down",
          color: "blue",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { size: 20 }),
          delay: 0,
          sparklineData: performanceSparkline
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          title: "Attendance",
          value: overallAttendance,
          suffix: "%",
          subtitle: "Monthly Average",
          trend: overallAttendance >= 85 ? "up" : "down",
          color: "green",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 20 }),
          delay: 0.1,
          sparklineData: attendanceSparkline
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          title: "Total Students",
          value: classAvg.total_students,
          subtitle: "Currently Enrolled",
          color: "purple",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { size: 20 }),
          delay: 0.2,
          sparklineData: studentsSparkline
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetricCard,
        {
          title: "At-Risk",
          value: atRiskStudents.length,
          subtitle: "Need Attention",
          trend: atRiskStudents.length > 3 ? "down" : "up",
          color: "red",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 20 }),
          delay: 0.3,
          sparklineData: atRiskSparkline
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          className: "flex gap-1 bg-[var(--md-sys-color-surface-variant)] p-1.5 rounded-full border border-[var(--md-sys-color-outline)] shadow-inner overflow-x-auto hide-scrollbar custom-scrollbar w-full sm:w-auto",
          children: [
            { id: "overview", label: "Overview", icon: Target },
            { id: "performance", label: "Performance", icon: ChartColumn },
            { id: "attendance", label: "Attendance", icon: Activity },
            { id: "comparison", label: "Compare", icon: GitCompare }
          ].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setSelectedMetric(tab.id),
              className: clsx(
                "px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                selectedMetric === tab.id ? "bg-[var(--md-sys-color-surface)] shadow-md text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { size: 16 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: tab.label })
              ]
            },
            tab.id
          ))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 sm:gap-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl px-2 sm:px-3 py-2 w-full sm:w-auto justify-center mt-2 sm:mt-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 14, className: "text-[var(--md-sys-color-secondary)] flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "date",
            value: dateRange.start,
            onChange: (e) => setDateRange((prev) => ({ ...prev, start: e.target.value })),
            className: "bg-transparent text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] border-none outline-none w-[100px] sm:w-32"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--md-sys-color-secondary)] flex-shrink-0", children: "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "date",
            value: dateRange.end,
            onChange: (e) => setDateRange((prev) => ({ ...prev, end: e.target.value })),
            className: "bg-transparent text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] border-none outline-none w-[100px] sm:w-32"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AnimatePresence, { mode: "wait", children: [
      selectedMetric === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(ChartCard, { title: "Program Performance", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 18 }), delay: 0.1, className: "lg:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6", children: subjectData.map((subject, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  initial: { opacity: 0, scale: 0.9 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { delay: 0.2 + idx * 0.1 },
                  className: "p-4 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:shadow-md transition-all cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-lg flex items-center justify-center text-xl", style: { backgroundColor: subject.color + "20" }, children: subject.icon }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)] text-sm", children: subject.name }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)]", children: [
                          subject.students,
                          " students"
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-3 bg-[var(--md-sys-color-surface)] rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      motion.div,
                      {
                        initial: { width: 0 },
                        animate: { width: `${subject.score / 4 * 100}%` },
                        transition: { delay: 0.4, duration: 1, ease: "easeOut" },
                        className: "absolute inset-y-0 left-0 rounded-full",
                        style: { backgroundColor: subject.color }
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-right text-sm font-bold mt-2", style: { color: subject.color }, children: [
                      subject.score.toFixed(1),
                      "/4.0"
                    ] })
                  ]
                },
                subject.name
              )) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-48 overflow-x-auto hide-scrollbar custom-scrollbar w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-[500px] h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: gradeData, barGap: 8, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--md-sys-color-outline)", vertical: false }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "shortGrade", tick: { fill: "var(--md-sys-color-secondary)", fontSize: 12, fontWeight: 600 }, axisLine: false, tickLine: false }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { domain: [0, 4], tick: { fill: "var(--md-sys-color-secondary)", fontSize: 12 }, axisLine: false, tickLine: false }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Tooltip,
                  {
                    contentStyle: {
                      background: "var(--md-sys-color-surface)",
                      border: "1px solid var(--md-sys-color-outline)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                      padding: "12px 16px",
                      color: "var(--md-sys-color-on-surface)"
                    },
                    cursor: { fill: "rgba(59, 130, 246, 0.05)" },
                    itemStyle: { color: "var(--md-sys-color-on-surface)" }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "avgScore", fill: "url(#premiumBarGradient)", radius: [8, 8, 0, 0], name: "Avg Score" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "premiumBarGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#818cf8" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "50%", stopColor: "#6366f1" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#4f46e5" })
                ] }) })
              ] }) }) }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(ChartCard, { title: "Skill Levels", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { size: 18 }), delay: 0.2, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-48", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Pie,
                  {
                    data: competencyDistribution,
                    cx: "50%",
                    cy: "50%",
                    innerRadius: 50,
                    outerRadius: 70,
                    paddingAngle: 4,
                    dataKey: "value",
                    strokeWidth: 0,
                    children: competencyDistribution.map((entry, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: entry.color }, `cell-${index}`))
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Tooltip,
                  {
                    contentStyle: {
                      background: "var(--md-sys-color-surface)",
                      border: "1px solid var(--md-sys-color-outline)",
                      borderRadius: "16px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                      padding: "12px 16px",
                      color: "var(--md-sys-color-on-surface)"
                    },
                    itemStyle: { color: "var(--md-sys-color-on-surface)" }
                  }
                )
              ] }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mt-4", children: competencyDistribution.map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: item.color } }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 font-medium", children: item.name })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-gray-900", children: item.value })
              ] }, idx)) })
            ] })
          ]
        },
        "overview"
      ),
      selectedMetric === "performance" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ChartCard,
              {
                title: "Top Performers",
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { size: 18 }),
                delay: 0.1,
                action: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => onNavigate("students"), className: "text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1", children: [
                  "View All ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { size: 12 })
                ] }),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: topPerformers.map((student, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  motion.div,
                  {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { delay: 0.1 + idx * 0.05 },
                    onMouseEnter: () => setHoveredStudent(student.id),
                    onMouseLeave: () => setHoveredStudent(null),
                    className: clsx(
                      "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                      hoveredStudent === student.id ? "bg-blue-50 dark:bg-blue-900/20 shadow-sm" : "bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface)]"
                    ),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                        "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black",
                        idx === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md" : idx === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" : idx === 2 ? "bg-gradient-to-br from-orange-400 to-red-500 text-white" : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-secondary)]"
                      ), children: idx + 1 }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)] text-sm truncate", children: student.name }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: getSubjectEmoji(student.subject) }),
                          student.subject,
                          " • ",
                          getLevelShortLabel(student.studentGroup, String(student.grade))
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-black text-lg text-[var(--md-sys-color-on-surface)]", children: student.avgScore.toFixed(1) }) })
                    ]
                  },
                  student.id
                )) })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChartCard, { title: "Attention Required", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 18 }), delay: 0.2, className: "border-l-4 border-l-red-400", children: atRiskStudents.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: atRiskStudents.slice(0, 5).map((student, idx) => {
              const avg = student.avg_score;
              const isLowScore = avg < 2.5;
              const isLowAttendance = student.attendance_pct < 80;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  initial: { opacity: 0, x: 20 },
                  animate: { opacity: 1, x: 0 },
                  transition: { delay: 0.1 + idx * 0.05 },
                  className: "flex items-center gap-3 p-3 bg-red-50/50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold", children: student.name.charAt(0) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)] text-sm truncate", children: student.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 mt-1 flex-wrap", children: [
                        isLowScore && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-bold", children: [
                          "Score: ",
                          avg.toFixed(1)
                        ] }),
                        isLowAttendance && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold", children: [
                          student.attendance_pct,
                          "%"
                        ] })
                      ] })
                    ] })
                  ]
                },
                student.id
              );
            }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-10 text-gray-400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.div,
                {
                  animate: { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] },
                  transition: { repeat: Infinity, duration: 2 },
                  className: "w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(PartyPopper, { className: "text-green-500", size: 32 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-gray-700", children: "All students on track!" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "No immediate concerns" })
            ] }) })
          ]
        },
        "performance"
      ),
      selectedMetric === "attendance" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          className: "space-y-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChartCard, { title: "Weekly Attendance Trend", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 18 }), delay: 0.1, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: attendanceTrend, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "attendanceGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#10b981", stopOpacity: 0.35 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "50%", stopColor: "#14b8a6", stopOpacity: 0.15 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#0d9488", stopOpacity: 0 })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--md-sys-color-outline-variant)", vertical: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "fullWeek", tick: { fill: "var(--md-sys-color-secondary)", fontSize: 12, fontWeight: 600 }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { domain: [70, 100], tick: { fill: "var(--md-sys-color-secondary)", fontSize: 12 }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Tooltip,
                {
                  contentStyle: {
                    background: "var(--md-sys-color-surface)",
                    border: "1px solid var(--md-sys-color-outline)",
                    borderRadius: "16px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                    padding: "12px 16px",
                    color: "var(--md-sys-color-on-surface)"
                  },
                  itemStyle: { color: "var(--md-sys-color-on-surface)" }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Area,
                {
                  type: "monotone",
                  dataKey: "rate",
                  stroke: "#10b981",
                  strokeWidth: 3,
                  fill: "url(#attendanceGradient)",
                  dot: { fill: "#10b981", strokeWidth: 2, r: 5, stroke: "var(--md-sys-color-surface)" },
                  activeDot: { r: 8, fill: "#10b981", stroke: "var(--md-sys-color-surface)", strokeWidth: 3 },
                  name: "Attendance %"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Line,
                {
                  type: "monotone",
                  dataKey: "target",
                  stroke: "#f43f5e",
                  strokeWidth: 2,
                  strokeDasharray: "8 4",
                  dot: false,
                  name: "Target (90%)"
                }
              )
            ] }) }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4", children: gradeData.map((grade, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.2 + idx * 0.05 },
                className: "bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] p-5 text-center hover:shadow-lg transition-all",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest mb-2", children: grade.grade }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-black text-[var(--md-sys-color-on-surface)]", children: [
                    grade.attendance,
                    "%"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 h-2 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    motion.div,
                    {
                      initial: { width: 0 },
                      animate: { width: `${grade.attendance}%` },
                      transition: { delay: 0.4 + idx * 0.1, duration: 1 },
                      className: clsx(
                        "h-full rounded-full",
                        grade.attendance >= 90 ? "bg-green-500" : grade.attendance >= 80 ? "bg-yellow-500" : "bg-red-500"
                      )
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] mt-2", children: [
                    grade.students,
                    " students"
                  ] })
                ]
              },
              grade.grade
            )) })
          ]
        },
        "attendance"
      ),
      selectedMetric === "comparison" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          className: "space-y-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(ChartCard, { title: "Select Students to Compare", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(GitCompare, { size: 18 }), delay: 0.1, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4", children: "Select up to 3 students to compare their competencies side-by-side" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2 max-h-48 overflow-y-auto", children: data.students.map((student) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => toggleComparisonStudent(student.id),
                  className: clsx(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    comparisonStudents.includes(student.id) ? "bg-[var(--md-sys-color-primary)] text-white shadow-md" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]"
                  ),
                  children: [
                    student.name,
                    comparisonStudents.includes(student.id) && /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 })
                  ]
                },
                student.id
              )) })
            ] }),
            comparisonStudents.length >= 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs(ChartCard, { title: "Competency Comparison", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { size: 18 }), delay: 0.2, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-80", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(RadarChart, { data: getComparisonData(), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PolarGrid, { stroke: "var(--md-sys-color-outline)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  PolarAngleAxis,
                  {
                    dataKey: "competency",
                    tick: { fill: "var(--md-sys-color-on-surface)", fontSize: 11 }
                  }
                ),
                comparisonStudents.map((studentId, idx) => {
                  const student = data.students.find((s) => s.id === studentId);
                  if (!student) return null;
                  return /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Radar,
                    {
                      name: student.name,
                      dataKey: student.name,
                      stroke: GOOGLE_COLORS[idx % GOOGLE_COLORS.length],
                      fill: GOOGLE_COLORS[idx % GOOGLE_COLORS.length],
                      fillOpacity: 0.2,
                      strokeWidth: 2
                    },
                    studentId
                  );
                }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, {}),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Tooltip,
                  {
                    contentStyle: {
                      background: "var(--md-sys-color-surface)",
                      border: "1px solid var(--md-sys-color-outline)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
                    }
                  }
                )
              ] }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-[var(--md-sys-color-outline)]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-3 px-2 font-bold text-[var(--md-sys-color-on-surface)]", children: "Metric" }),
                  comparisonStudents.map((id) => {
                    const s = data.students.find((st) => st.id === id);
                    return /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center py-3 px-2 font-bold text-[var(--md-sys-color-on-surface)]", children: s == null ? void 0 : s.name }, id);
                  })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-[var(--md-sys-color-outline)]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-2 text-[var(--md-sys-color-on-surface-variant)]", children: "Avg Score" }),
                    comparisonStudents.map((id) => {
                      const s = data.students.find((st) => st.id === id);
                      const avg = s ? (Object.values(s.competencies).reduce((a, b) => a + b, 0) / Object.values(s.competencies).length).toFixed(2) : "â€”";
                      return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-center py-3 px-2 font-bold text-[var(--md-sys-color-on-surface)]", children: avg }, id);
                    })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-[var(--md-sys-color-outline)]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-2 text-[var(--md-sys-color-on-surface-variant)]", children: "Attendance" }),
                    comparisonStudents.map((id) => {
                      const s = data.students.find((st) => st.id === id);
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "text-center py-3 px-2 font-bold text-[var(--md-sys-color-on-surface)]", children: [
                        (s == null ? void 0 : s.attendancePct) || 0,
                        "%"
                      ] }, id);
                    })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-2 text-[var(--md-sys-color-on-surface-variant)]", children: "Subject" }),
                    comparisonStudents.map((id) => {
                      const s = data.students.find((st) => st.id === id);
                      return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-center py-3 px-2 text-[var(--md-sys-color-on-surface)]", children: s == null ? void 0 : s.subject }, id);
                    })
                  ] })
                ] })
              ] }) })
            ] }),
            comparisonStudents.length < 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-[var(--md-sys-color-on-surface-variant)]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(GitCompare, { size: 48, className: "mb-4 opacity-30" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold", children: "Select at least 2 students to compare" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Click on student names above to add them" })
            ] })
          ]
        },
        "comparison"
      )
    ] })
  ] });
};
const Analytics_default = React.memo(Analytics);
export {
  Analytics_default as default
};
