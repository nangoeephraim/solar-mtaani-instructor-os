const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/reportCardService-B61fkzej.js","assets/jspdf.es.min-DcELESd8.js","assets/index-DIO7q2un.js","assets/index-DDAnmZh1.css"])))=>i.map(i=>d[i]);
import { o as createLucideIcon, u as useTheme, a as reactExports, e as useToast, j as jsxRuntimeExports, a3 as Award, h as CircleCheck, c as clsx, _ as __vitePreload, g as ChevronRight, G as GraduationCap, m as motion, B as BookOpen, A as AnimatePresence, X } from "./index-DIO7q2un.js";
import { g as getStudentGroups, a as getDefaultLevel, c as getLevelsForGroup } from "./educationLevels-CWONNkiO.js";
import { P as PageHeader } from "./PageHeader-CXxYo8AC.js";
import { D as Download } from "./download-DpMpZo9k.js";
import { F as FileDown } from "./file-down-Y5BycxRJ.js";
import { S as Save } from "./save-CeZEp0q1.js";
import { C as CircleAlert } from "./circle-alert-aZa_aZh_.js";
import { C as Check } from "./check-BstP73Ev.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Scale = createLucideIcon("Scale", [
  ["path", { d: "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z", key: "7g6ntu" }],
  ["path", { d: "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z", key: "ijws7r" }],
  ["path", { d: "M7 21h10", key: "1b0cd5" }],
  ["path", { d: "M12 3v18", key: "108xh3" }],
  ["path", { d: "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2", key: "3gwbw2" }]
]);
const SOLAR_COMPETENCIES = {
  siteAssessment: {
    name: "Site Assessment",
    description: "Energy audits, load analysis, site surveys",
    outcomes: ["Conduct site surveys", "Perform energy audits", "Calculate load requirements", "Assess roof/ground suitability"]
  },
  panelInstallation: {
    name: "Panel Installation",
    description: "Mounting, orientation, connection modes",
    outcomes: ["Mount solar panels correctly", "Optimize panel orientation", "Connect panels in series/parallel", "Secure mounting structures"]
  },
  electricalWiring: {
    name: "Electrical Wiring",
    description: "Cable specs, voltage drop, safety protocols",
    outcomes: ["Select appropriate cables", "Calculate voltage drop", "Install wiring safely", "Connect to distribution board"]
  },
  systemTesting: {
    name: "System Testing",
    description: "Commissioning, troubleshooting, maintenance",
    outcomes: ["Commission PV systems", "Use multimeter for testing", "Troubleshoot common faults", "Perform routine maintenance"]
  },
  batterySetup: {
    name: "Battery Setup",
    description: "Technologies, installation, connection",
    outcomes: ["Identify battery types", "Install batteries safely", "Connect charge controllers", "Configure inverter settings"]
  },
  safetyProtocols: {
    name: "Safety Protocols",
    description: "PPE usage, electrical safety, first aid",
    outcomes: ["Use appropriate PPE", "Follow electrical safety rules", "Handle emergencies", "Maintain safe work environment"]
  }
};
const ICT_COMPETENCIES = {
  msWord: {
    name: "Microsoft Word",
    description: "Document formatting, tables, mail merge",
    outcomes: ["Format documents professionally", "Create and edit tables", "Perform mail merge", "Insert headers/footers/graphics"]
  },
  msExcel: {
    name: "Microsoft Excel",
    description: "Formulas, functions, data management",
    outcomes: ["Create and edit worksheets", "Apply formulas and functions", "Use cell referencing", "Create charts and graphs"]
  },
  msPowerPoint: {
    name: "Microsoft PowerPoint",
    description: "Presentations, transitions, animations",
    outcomes: ["Design professional slides", "Apply transitions/animations", "Insert multimedia content", "Present effectively"]
  },
  msAccess: {
    name: "Microsoft Access",
    description: "Database creation, queries, reports",
    outcomes: ["Create database tables", "Design forms", "Write basic queries", "Generate reports"]
  },
  computerBasics: {
    name: "Computer Basics",
    description: "Hardware, OS, file management",
    outcomes: ["Identify hardware components", "Navigate operating system", "Manage files and folders", "Install basic software"]
  }
};
const SOLAR_PRACTICAL = [
  { id: "wiring", label: "Wire solar panel connections correctly", category: "Electrical" },
  { id: "mounting", label: "Mount panels at correct angle", category: "Installation" },
  { id: "inverter", label: "Configure inverter settings", category: "System" },
  { id: "safety", label: "Use PPE throughout installation", category: "Safety" },
  { id: "testing", label: "Test system with multimeter", category: "Testing" },
  { id: "battery", label: "Connect battery bank safely", category: "Storage" }
];
const ICT_PRACTICAL = [
  { id: "document", label: "Format a business letter in Word", category: "Word" },
  { id: "formula", label: "Create SUM/AVERAGE formulas in Excel", category: "Excel" },
  { id: "chart", label: "Generate chart from data in Excel", category: "Excel" },
  { id: "presentation", label: "Design 5-slide presentation", category: "PowerPoint" },
  { id: "database", label: "Create table and run query in Access", category: "Access" },
  { id: "typing", label: "Complete typing test (30+ WPM)", category: "Typing" }
];
const CBC_COMPETENCIES = {
  communication_collaboration: {
    name: "Communication and Collaboration",
    description: "Speaking, writing, active listening, and working in teams effectively",
    outcomes: ["Express ideas clearly", "Listen to others attentively", "Work harmoniously in groups", "Resolve team conflicts peacefully"]
  },
  critical_thinking: {
    name: "Critical Thinking and Problem Solving",
    description: "Analyzing situations, evaluating options, and designing solutions",
    outcomes: ["Analyze problems systematically", "Identify multiple solutions", "Evaluate outcomes objectively", "Apply logical reasoning"]
  },
  creativity_imagination: {
    name: "Creativity and Imagination",
    description: "Generating novel ideas, creating artistic products, and thinking outside the box",
    outcomes: ["Develop original concepts", "Express creativity through arts", "Adapt to new challenges resourcefully", "Explore unique perspectives"]
  },
  citizenship: {
    name: "Citizenship",
    description: "Understanding rights, duties, community service, and national values",
    outcomes: ["Demonstrate civic awareness", "Respect diverse cultural identities", "Participate in community service", "Uphold national values and laws"]
  },
  self_efficacy: {
    name: "Self-efficacy",
    description: "Building confidence, setting goals, and managing emotions",
    outcomes: ["Set personal learning goals", "Manage emotions and behavior", "Demonstrate self-reliance", "Show resilience under pressure"]
  },
  digital_literacy: {
    name: "Digital Literacy",
    description: "Accessing, analyzing, and communicating information using digital devices",
    outcomes: ["Operate digital devices confidently", "Access educational resources online", "Understand internet safety and ethics", "Create simple digital content"]
  },
  learning_to_learn: {
    name: "Learning to Learn",
    description: "Developing curiosity, self-directed learning, and continuous improvement",
    outcomes: ["Seek new knowledge independently", "Reflect on personal learning progress", "Apply study strategies effectively", "Embrace feedback for growth"]
  }
};
const CBC_PRACTICAL = [
  { id: "teamwork", label: "Collaborates productively in group tasks", category: "Collaboration" },
  { id: "problem_solving", label: "Solves situational problems logically", category: "Thinking" },
  { id: "artistic_expression", label: "Creates a piece of art or unique craft", category: "Creativity" },
  { id: "community_respect", label: "Helps clean the classroom or environment", category: "Citizenship" },
  { id: "digital_use", label: "Types a paragraph or plays educational game on tablet", category: "Digital" },
  { id: "independent_study", label: "Completes a self-guided workbook session", category: "Learning" }
];
const getDynamicCompetencies = (subject, instType) => {
  if (instType === "primary" || instType === "jss") {
    return CBC_COMPETENCIES;
  }
  if (subject === "Solar") return SOLAR_COMPETENCIES;
  if (subject === "ICT") return ICT_COMPETENCIES;
  const baseKey = subject.toLowerCase().replace(/[^a-z0-9]/g, "_");
  return {
    [`${baseKey}_foundations`]: {
      name: `${subject} Foundations`,
      description: `Basic principles, concepts, and terminologies in ${subject}`,
      outcomes: [`Explain fundamental concepts of ${subject}`, `Identify key elements and terminology`, `Demonstrate safety and introductory theory`]
    },
    [`${baseKey}_practical`]: {
      name: `${subject} Practical Application`,
      description: `Hands-on practice, tools handling, and practical exercises`,
      outcomes: [`Utilize tools and equipment correctly`, `Execute practical procedures in ${subject}`, `Maintain clean and secure workshop environment`]
    },
    [`${baseKey}_advanced`]: {
      name: `${subject} Core Specialization`,
      description: `Core techniques, troubleshooting, and advanced operations`,
      outcomes: [`Perform complex procedures independently`, `Troubleshoot common issues and errors`, `Apply specialized standards to tasks`]
    },
    [`${baseKey}_assessment`]: {
      name: `${subject} Project & Evaluation`,
      description: `Final project deliverables, presentations, or exam outcomes`,
      outcomes: [`Complete final project specifications`, `Present outcomes clearly to instructor`, `Evaluate quality of final deliverables`]
    }
  };
};
const getDynamicPractical = (subject, instType) => {
  if (instType === "primary" || instType === "jss") {
    return CBC_PRACTICAL;
  }
  if (subject === "Solar") return SOLAR_PRACTICAL;
  if (subject === "ICT") return ICT_PRACTICAL;
  const labelSubject = subject || "Unit";
  return [
    { id: "theory_check", label: `Passes written theory check for ${labelSubject}`, category: "Theory" },
    { id: "tools_check", label: `Handles workspace tools and resources safely`, category: "Practical" },
    { id: "procedure_check", label: `Executes core procedural task correctly`, category: "Practical" },
    { id: "troubleshoot_check", label: `Identifies and fixes basic faults in a setup`, category: "Trouble" },
    { id: "final_check", label: `Completes final project work according to rubrics`, category: "Final" }
  ];
};
const Assessment = ({ data, onUpdateStudent }) => {
  var _a;
  const { preferences } = useTheme();
  const [selectedGrade, setSelectedGrade] = reactExports.useState("");
  const [selectedGroup, setSelectedGroup] = reactExports.useState("Academy");
  const [selectedSubject, setSelectedSubject] = reactExports.useState("");
  const [selectedStudentId, setSelectedStudentId] = reactExports.useState(null);
  const [assessmentSystem, setAssessmentSystem] = reactExports.useState("CBET");
  const [activeUnit, setActiveUnit] = reactExports.useState(null);
  const { showToast } = useToast();
  const [marks, setMarks] = reactExports.useState({
    cat1: 0,
    cat2: 0,
    practical: 0,
    exam: 0,
    remarks: ""
  });
  reactExports.useEffect(() => {
    var _a2;
    if (preferences) {
      const instType = preferences.institutionType || "tvet";
      const groups = getStudentGroups(instType);
      const defaultGroup = groups[0] || "Academy";
      const defaultGrade = getDefaultLevel(defaultGroup, instType);
      const defaultSub = preferences.defaultSubject && preferences.defaultSubject !== "All" ? preferences.defaultSubject : ((_a2 = preferences.customSubjects) == null ? void 0 : _a2[0]) || "Solar";
      const defaultSystem = preferences.assessmentSystem || "CBET";
      setSelectedGroup(defaultGroup);
      setSelectedGrade(defaultGrade);
      setSelectedSubject(defaultSub);
      setAssessmentSystem(defaultSystem);
    }
  }, [preferences]);
  const studentsInClass = data.students.filter((s) => s.grade === selectedGrade && s.subject === selectedSubject);
  const selectedStudent = data.students.find((s) => s.id === selectedStudentId);
  const competencies = getDynamicCompetencies(selectedSubject, preferences.institutionType || "tvet");
  getDynamicPractical(selectedSubject, preferences.institutionType || "tvet");
  const [cbetChecks, setCbetChecks] = reactExports.useState([]);
  reactExports.useEffect(() => {
    var _a2, _b, _c, _d, _e, _f;
    if (selectedStudent && activeUnit) {
      const unitData = (_b = (_a2 = selectedStudent.assessment) == null ? void 0 : _a2.units) == null ? void 0 : _b[activeUnit];
      if (unitData) {
        setMarks({
          cat1: ((_c = unitData.cat1) == null ? void 0 : _c.score) || 0,
          cat2: ((_d = unitData.cat2) == null ? void 0 : _d.score) || 0,
          practical: ((_e = unitData.practical) == null ? void 0 : _e.score) || 0,
          exam: ((_f = unitData.finalExam) == null ? void 0 : _f.score) || 0,
          remarks: unitData.instructorRemarks || ""
        });
        setCbetChecks(unitData.practicalChecks || []);
      } else {
        setMarks({ cat1: 0, cat2: 0, practical: 0, exam: 0, remarks: "" });
        setCbetChecks([]);
      }
    }
  }, [selectedStudentId, activeUnit]);
  const calculateKNECGrade = (score) => {
    if (score >= 80) return "Distinction";
    if (score >= 60) return "Credit";
    if (score >= 40) return "Pass";
    if (score >= 30) return "Referral";
    return "Fail";
  };
  const handleSaveAssessment = () => {
    if (!selectedStudent || !activeUnit) return;
    const finalScore = marks.cat1 * 0.15 + marks.cat2 * 0.15 + marks.practical * 0.4 + marks.exam * 0.3;
    const finalGrade = calculateKNECGrade(finalScore);
    const updatedStudent = { ...selectedStudent };
    if (!updatedStudent.assessment) updatedStudent.assessment = { units: {}, termStats: [] };
    updatedStudent.assessment.units[activeUnit] = {
      ...updatedStudent.assessment.units[activeUnit],
      // Preserve existing data if any
      unitId: activeUnit,
      system: "KNEC",
      // Explicitly set system for this save
      cat1: { score: marks.cat1, maxScore: 100, weight: 15 },
      cat2: { score: marks.cat2, maxScore: 100, weight: 15 },
      practical: { score: marks.practical, maxScore: 100, weight: 40 },
      finalExam: { score: marks.exam, maxScore: 100, weight: 30 },
      finalScore: Math.round(finalScore),
      finalGrade,
      instructorRemarks: marks.remarks
    };
    const competencyLevel = finalScore >= 80 ? 4 : finalScore >= 60 ? 3 : finalScore >= 40 ? 2 : 1;
    if (!updatedStudent.competencies) updatedStudent.competencies = {};
    updatedStudent.competencies[activeUnit] = competencyLevel;
    onUpdateStudent(updatedStudent, true);
    showToast(`KNEC Grade Saved for ${activeUnit}`, "success");
    setActiveUnit(null);
  };
  const toggleCBETCheck = (outcome) => {
    setCbetChecks(
      (prev) => prev.includes(outcome) ? prev.filter((p) => p !== outcome) : [...prev, outcome]
    );
  };
  const handleSaveCBET = () => {
    if (!selectedStudent || !activeUnit) return;
    const updatedStudent = { ...selectedStudent };
    if (!updatedStudent.assessment) updatedStudent.assessment = { units: {}, termStats: [] };
    const totalOutcomes = competencies[activeUnit].outcomes.length;
    const checkedOutcomes = cbetChecks.length;
    const verdict = checkedOutcomes === totalOutcomes ? "Competent" : "Not Yet Competent";
    updatedStudent.assessment.units[activeUnit] = {
      ...updatedStudent.assessment.units[activeUnit],
      unitId: activeUnit,
      system: "CBET",
      practicalChecks: cbetChecks,
      verdict,
      instructorRemarks: `Competency Check: ${checkedOutcomes}/${totalOutcomes} outcomes achieved.`
    };
    const pct = totalOutcomes > 0 ? checkedOutcomes / totalOutcomes : 0;
    const competencyLevel = pct >= 1 ? 4 : pct >= 0.75 ? 3 : pct >= 0.5 ? 2 : 1;
    if (!updatedStudent.competencies) updatedStudent.competencies = {};
    updatedStudent.competencies[activeUnit] = competencyLevel;
    onUpdateStudent(updatedStudent, true);
    showToast(`CBET Progress Saved: ${verdict}`, "success");
    setActiveUnit(null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto animate-fade-in space-y-6 pb-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: "Academic Assessment",
        subtitle: assessmentSystem === "KNEC" ? "KNEC Standard Grading" : "Competency Based Assessment (CBC/CBET)",
        icon: Award,
        color: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-[var(--md-sys-color-surface-variant)] p-1 rounded-full border border-[var(--md-sys-color-outline)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setAssessmentSystem("CBET"),
              className: clsx(
                "px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                assessmentSystem === "CBET" ? "bg-[var(--md-sys-color-surface)] shadow text-violet-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 14 }),
                " CBC / CBET"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setAssessmentSystem("KNEC"),
              className: clsx(
                "px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                assessmentSystem === "KNEC" ? "bg-[var(--md-sys-color-surface)] shadow text-blue-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Scale, { size: 14 }),
                " KNEC Exam"
              ]
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-3 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-5 rounded-[28px] shadow-elevation-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-3", children: "Filter Candidates" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-[var(--md-sys-color-surface-variant)]/60 border border-[var(--md-sys-color-outline-variant)] rounded-xl p-1 overflow-x-auto custom-scrollbar", children: (preferences.customSubjects || ["Solar", "ICT"]).map((sub) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  setSelectedSubject(sub);
                  setSelectedStudentId(null);
                  setActiveUnit(null);
                },
                className: clsx(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all px-3 whitespace-nowrap",
                  selectedSubject === sub ? "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-sm" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                ),
                children: sub
              },
              sub
            )) }),
            getStudentGroups(preferences.institutionType).length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-[var(--md-sys-color-surface-variant)]/60 border border-[var(--md-sys-color-outline-variant)] rounded-xl p-1 overflow-x-auto custom-scrollbar", children: getStudentGroups(preferences.institutionType).map((grp) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  setSelectedGroup(grp);
                  setSelectedGrade(getDefaultLevel(grp, preferences.institutionType));
                  setSelectedStudentId(null);
                },
                className: clsx(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap px-3",
                  selectedGroup === grp ? "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-sm" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                ),
                children: grp
              },
              grp
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-[var(--md-sys-color-surface-variant)]/60 border border-[var(--md-sys-color-outline-variant)] rounded-xl p-1 overflow-x-auto custom-scrollbar", children: getLevelsForGroup(selectedGroup, preferences.institutionType).map((lvl) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  setSelectedGrade(lvl.id);
                  setSelectedStudentId(null);
                },
                className: clsx(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all min-w-[30px] px-2",
                  selectedGrade === lvl.id ? "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-sm" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                ),
                children: lvl.shortLabel
              },
              lvl.id
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-5 rounded-[28px] h-[300px] md:h-[500px] flex flex-col shadow-elevation-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider", children: [
              "Candidates (",
              studentsInClass.length,
              ")"
            ] }),
            studentsInClass.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: async () => {
                  const { generateBulkReportCards } = await __vitePreload(async () => {
                    const { generateBulkReportCards: generateBulkReportCards2 } = await import("./reportCardService-B61fkzej.js");
                    return { generateBulkReportCards: generateBulkReportCards2 };
                  }, true ? __vite__mapDeps([0,1,2,3]) : void 0);
                  generateBulkReportCards(studentsInClass, data, { term: 1 });
                  showToast(`Downloading ${studentsInClass.length} report cards...`, "success");
                },
                className: "flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-[10px] font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all",
                title: "Download all report cards",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 12 }),
                  " All PDFs"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1", children: studentsInClass.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setSelectedStudentId(s.id),
              className: clsx(
                "w-full text-left p-3.5 rounded-2xl border transition-all text-sm font-medium flex items-center justify-between group",
                selectedStudentId === s.id ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white shadow-elevation-2 scale-[1.01]" : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-blue-500/50 hover:bg-[var(--md-sys-color-surface-variant)]/45"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold", children: s.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: clsx("text-[10px] transition-colors", selectedStudentId === s.id ? "text-blue-100" : "text-[var(--md-sys-color-secondary)]"), children: s.admissionNumber || "No Adm No" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16, className: clsx("transition-transform group-hover:translate-x-1", selectedStudentId === s.id ? "text-white" : "text-[var(--md-sys-color-secondary)]") })
              ]
            },
            s.id
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-9", children: selectedStudent ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel rounded-[28px] overflow-hidden min-h-[600px] flex flex-col shadow-elevation-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 md:p-8 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]/30 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider", children: "Candidate Dashboard" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)] mt-1", children: selectedStudent.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-4 mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { size: 15, className: "text-[var(--md-sys-color-primary)]" }),
                " ",
                selectedStudent.admissionNumber || "N/A"
              ] }),
              selectedStudent.nitaNumber && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 15, className: "text-green-500" }),
                " ",
                selectedStudent.nitaNumber
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 self-end sm:self-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: async () => {
                  const { generateReportCard } = await __vitePreload(async () => {
                    const { generateReportCard: generateReportCard2 } = await import("./reportCardService-B61fkzej.js");
                    return { generateReportCard: generateReportCard2 };
                  }, true ? __vite__mapDeps([0,1,2,3]) : void 0);
                  generateReportCard(selectedStudent, data, { term: 1 });
                },
                className: "flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95",
                title: "Download Report Card PDF",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { size: 14 }),
                  " Report Card"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right hidden sm:block", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase", children: "Overall Status" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold text-[var(--md-sys-color-on-surface)] mt-0.5", children: [
                Object.keys(((_a = selectedStudent.assessment) == null ? void 0 : _a.units) || {}).length,
                " / ",
                Object.keys(competencies).length,
                " Units"
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 p-6 bg-[var(--md-sys-color-surface-variant)]/10 overflow-y-auto custom-scrollbar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: Object.entries(competencies).map(([key, comp]) => {
          var _a2, _b;
          const unitData = (_b = (_a2 = selectedStudent.assessment) == null ? void 0 : _a2.units) == null ? void 0 : _b[key];
          const isCompleteKNEC = (unitData == null ? void 0 : unitData.system) === "KNEC" && !!(unitData == null ? void 0 : unitData.finalGrade);
          const isCompleteCBET = (unitData == null ? void 0 : unitData.system) === "CBET" && (unitData == null ? void 0 : unitData.verdict) === "Competent";
          const isComplete = assessmentSystem === "KNEC" ? isCompleteKNEC : isCompleteCBET;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              whileHover: { y: -4, scale: 1.01 },
              onClick: () => setActiveUnit(key),
              className: clsx(
                "p-6 rounded-[24px] cursor-pointer transition-all relative overflow-hidden flex flex-col min-h-[230px] glass-card",
                isComplete ? "border-green-500/30 bg-green-500/5 hover:border-green-500/50" : "hover:border-[var(--md-sys-color-primary)]"
              ),
              children: [
                isComplete && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-[100px] z-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-[var(--md-sys-color-surface-variant)] rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 18, className: isComplete ? "text-green-600 dark:text-green-400" : "text-[var(--md-sys-color-primary)]" }) }),
                    isComplete ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 12 }),
                      " Completed"
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-1 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] text-[10px] font-bold rounded uppercase tracking-wider", children: "Pending" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-[var(--md-sys-color-on-surface)] leading-tight mb-2", children: comp.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2", children: comp.description })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-auto relative z-10", children: assessmentSystem === "KNEC" && (unitData == null ? void 0 : unitData.finalScore) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between pt-4 mt-4 border-t border-[var(--md-sys-color-outline)] border-dashed", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold mb-1", children: "Score" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black text-[var(--md-sys-color-on-surface)] leading-none", children: [
                      unitData.finalScore,
                      "%"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold mb-1", children: "Grade" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: clsx("text-lg font-bold leading-none", unitData.finalGrade === "Fail" ? "text-red-500" : "text-blue-500"), children: unitData.finalGrade })
                  ] })
                ] }) : assessmentSystem === "CBET" && (unitData == null ? void 0 : unitData.practicalChecks) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 mt-4 border-t border-[var(--md-sys-color-outline)] border-dashed", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs mb-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--md-sys-color-secondary)] font-medium", children: "Outcomes Achieved" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
                      unitData.practicalChecks.length,
                      " / ",
                      comp.outcomes.length
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-full bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: clsx("h-full transition-all duration-500", unitData.practicalChecks.length === comp.outcomes.length ? "bg-green-500" : "bg-violet-500"),
                      style: { width: `${unitData.practicalChecks.length / comp.outcomes.length * 100}%` }
                    }
                  ) })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-4 mt-4 border-t border-[var(--md-sys-color-outline)] border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-center text-[var(--md-sys-color-secondary)] font-medium text-blue-500 hover:underline", children: "Click to Grade" }) }) })
              ]
            },
            key
          );
        }) }) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glass-panel h-96 rounded-[28px] flex items-center justify-center text-[var(--md-sys-color-secondary)] shadow-elevation-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold font-google", children: "Select a candidate to begin assessment" }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: activeUnit && selectedStudent && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
        className: "bg-[var(--md-sys-color-surface)] w-full max-w-2xl max-h-[90vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden border border-[var(--md-sys-color-outline)] relative glass-panel",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              title: "Close Grading Modal",
              "aria-label": "Close Grading Modal",
              onClick: () => setActiveUnit(null),
              className: "absolute top-4 right-4 p-2.5 rounded-full bg-black/20 hover:bg-black/40 hover:scale-105 transition-all text-white z-10",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx(
            "px-8 py-7 text-white shrink-0 shadow-md",
            assessmentSystem === "KNEC" ? "bg-gradient-to-br from-blue-600 to-indigo-700" : "bg-gradient-to-br from-violet-600 to-fuchsia-700"
          ), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded", children: [
                assessmentSystem,
                " Assessment"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 bg-black/20 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-wider rounded", children: selectedSubject })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-google font-bold mb-1", children: competencies[activeUnit].name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/80 text-sm font-medium", children: [
              "Candidate: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold", children: selectedStudent.name }),
              " • ",
              selectedStudent.admissionNumber || "No Adm No"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-8 custom-scrollbar", children: assessmentSystem === "KNEC" ? (
            // KNEC Form Layout
            (() => {
              const liveScore = Math.round(marks.cat1 * 0.15 + marks.cat2 * 0.15 + marks.practical * 0.4 + marks.exam * 0.3);
              const liveGrade = calculateKNECGrade(liveScore);
              const liveColor = liveGrade === "Distinction" ? "bg-green-500" : liveGrade === "Credit" ? "bg-blue-500" : liveGrade === "Pass" ? "bg-yellow-500" : liveGrade === "Referral" ? "bg-orange-500" : "bg-red-500";
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--md-sys-color-surface-variant)] rounded-2xl p-5 flex items-center justify-between border border-[var(--md-sys-color-outline)] shadow-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-secondary)] font-bold uppercase tracking-wider mb-1", children: "Projected Grade" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-4xl font-black text-[var(--md-sys-color-on-surface)]", children: [
                        liveScore,
                        "%"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("text-xl font-bold", liveColor.replace("bg-", "text-")), children: liveGrade })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-1/2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-full bg-[var(--md-sys-color-surface)] rounded-full overflow-hidden border border-[var(--md-sys-color-outline)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: clsx("h-full transition-all duration-500", liveColor),
                        style: { width: `${liveScore}%` }
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 font-bold", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "0" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Pass (40)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Distinction (80)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "100" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: "CAT 1 (15%)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "number",
                          title: "CAT 1 Score",
                          "aria-label": "CAT 1 Score",
                          placeholder: "0",
                          value: marks.cat1,
                          onChange: (e) => setMarks({ ...marks, cat1: parseFloat(e.target.value) || 0 }),
                          className: "w-full pl-4 pr-12 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-mono text-lg focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)]"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] text-sm", children: "/ 100" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: "CAT 2 (15%)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "number",
                          title: "CAT 2 Score",
                          "aria-label": "CAT 2 Score",
                          placeholder: "0",
                          value: marks.cat2,
                          onChange: (e) => setMarks({ ...marks, cat2: parseFloat(e.target.value) || 0 }),
                          className: "w-full pl-4 pr-12 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-mono text-lg focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)]"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] text-sm", children: "/ 100" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: "Practical (40%)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "number",
                          title: "Practical Score",
                          "aria-label": "Practical Score",
                          placeholder: "0",
                          value: marks.practical,
                          onChange: (e) => setMarks({ ...marks, practical: parseFloat(e.target.value) || 0 }),
                          className: "w-full pl-4 pr-12 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-mono text-lg focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)]"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] text-sm", children: "/ 100" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: "Final Exam (30%)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "number",
                          title: "Final Exam Score",
                          "aria-label": "Final Exam Score",
                          placeholder: "0",
                          value: marks.exam,
                          onChange: (e) => setMarks({ ...marks, exam: parseFloat(e.target.value) || 0 }),
                          className: "w-full pl-4 pr-12 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-mono text-lg focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)]"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] text-sm", children: "/ 100" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-2", children: "Instructor Remarks" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      value: marks.remarks,
                      onChange: (e) => setMarks({ ...marks, remarks: e.target.value }),
                      className: "w-full p-4 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm min-h-[100px] focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] resize-none",
                      placeholder: "Enter qualitative feedback..."
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-6 border-t border-[var(--md-sys-color-outline)] flex justify-end gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => setActiveUnit(null),
                      className: "px-6 py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold transition-all hover:bg-[var(--md-sys-color-outline)]",
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: handleSaveAssessment,
                      className: "px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 18 }),
                        " Save Grade"
                      ]
                    }
                  )
                ] })
              ] });
            })()
          ) : (
            // CBET Form Layout
            (() => {
              const currentComp = competencies[activeUnit];
              const liveOutcomes = cbetChecks.length;
              const totalOutcomes = (currentComp == null ? void 0 : currentComp.outcomes.length) || 0;
              const liveVerdict = liveOutcomes === totalOutcomes ? "Competent" : "Not Yet Competent";
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--md-sys-color-surface-variant)] rounded-2xl p-5 flex items-center justify-between border border-[var(--md-sys-color-outline)] shadow-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-secondary)] font-bold uppercase tracking-wider mb-1", children: "Current Verdict" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      liveVerdict === "Competent" ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "text-green-500", size: 24 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "text-amber-500", size: 24 }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("text-2xl font-black", liveVerdict === "Competent" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"), children: liveVerdict })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-secondary)] font-bold uppercase tracking-wider mb-1", children: "Outcomes Met" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-black text-[var(--md-sys-color-on-surface)]", children: [
                      liveOutcomes,
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-lg text-[var(--md-sys-color-on-surface-variant)]", children: [
                        "/ ",
                        totalOutcomes
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 mt-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-4", children: "Select outcomes demonstrated by candidate:" }),
                  currentComp == null ? void 0 : currentComp.outcomes.map((outcome, idx) => {
                    const isChecked = cbetChecks.includes(outcome);
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        onClick: () => toggleCBETCheck(outcome),
                        className: clsx(
                          "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group select-none",
                          isChecked ? "bg-violet-50 border-violet-200 shadow-sm dark:bg-violet-900/20 dark:border-violet-800" : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-violet-300"
                        ),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                            "mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                            isChecked ? "bg-violet-600 border-violet-600" : "border-gray-300 dark:border-gray-600 group-hover:border-violet-400"
                          ), children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isChecked && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, exit: { scale: 0 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14, className: "text-white", strokeWidth: 4 }) }) }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
                            "text-sm font-medium transition-colors",
                            isChecked ? "text-violet-900 dark:text-violet-300" : "text-[var(--md-sys-color-on-surface)]"
                          ), children: outcome })
                        ]
                      },
                      idx
                    );
                  })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-6 mt-8 border-t border-[var(--md-sys-color-outline)] flex justify-end gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => setActiveUnit(null),
                      className: "px-6 py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold transition-all",
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: handleSaveCBET,
                      className: "px-6 py-3 bg-violet-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-violet-700 transition-all flex items-center gap-2 active:scale-95",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 18 }),
                        " Update Competency Status"
                      ]
                    }
                  )
                ] })
              ] });
            })()
          ) })
        ]
      }
    ) }) })
  ] });
};
export {
  Assessment as default
};
