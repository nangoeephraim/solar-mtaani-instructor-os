const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/StudentList-CQz2iazV.js","assets/index-D-ESeA_n.js","assets/index-CJ5TCxwm.css","assets/subjectUtils-CWZOIqn8.js","assets/phone-D2MBrLzp.js","assets/ProfileHeader-sZNiWiL8.js","assets/educationLevels-CWONNkiO.js","assets/notificationService-hpmnNSSU.js","assets/bell-Jd2cEbAP.js","assets/pen-line-CdPPrtW3.js","assets/trash-2-DJDrtl5D.js","assets/trending-down-CAjcCfQk.js","assets/OverviewTab-t36TgPjm.js","assets/map-pin-EMZIH8ZV.js","assets/AnalyticsTab-B_6QYcw2.js","assets/AttendanceTab-CQStn-Ez.js","assets/plus-d9Yse0vX.js","assets/circle-alert-CGb8Sipw.js","assets/BillingTab-Bc_0-7bZ.js","assets/credit-card-BmPSg2St.js","assets/smartphone-e5GBcAzE.js","assets/history-Dwct5wdv.js"])))=>i.map(i=>d[i]);
import { a as reactExports, e as useToast, R as React, j as jsxRuntimeExports, P as PageTransition, G as GraduationCap, c as clsx, n as User, B as BookOpen, F as FileText, T as TriangleAlert, _ as __vitePreload } from "./index-D-ESeA_n.js";
import { A as AddStudentModal, E as EditStudentModal } from "./AddStudentModal-B_LKstZU.js";
import { P as Plus } from "./plus-d9Yse0vX.js";
import { A as ArrowLeft } from "./arrow-left-su-nlKGb.js";
import { C as CreditCard } from "./credit-card-BmPSg2St.js";
import "./educationLevels-CWONNkiO.js";
import "./circle-alert-CGb8Sipw.js";
import "./camera-BxCNR7EE.js";
import "./save-D7v85wbD.js";
const StudentList = reactExports.lazy(() => __vitePreload(() => import("./StudentList-CQz2iazV.js"), true ? __vite__mapDeps([0,1,2,3,4]) : void 0).then((module) => ({ default: module.StudentList })));
const ProfileHeader = reactExports.lazy(() => __vitePreload(() => import("./ProfileHeader-sZNiWiL8.js"), true ? __vite__mapDeps([5,1,2,6,7,8,3,9,10,11]) : void 0).then((module) => ({ default: module.ProfileHeader })));
const OverviewTab = reactExports.lazy(() => __vitePreload(() => import("./OverviewTab-t36TgPjm.js"), true ? __vite__mapDeps([12,1,2,4,13]) : void 0).then((module) => ({ default: module.OverviewTab })));
const AnalyticsTab = reactExports.lazy(() => __vitePreload(() => import("./AnalyticsTab-B_6QYcw2.js"), true ? __vite__mapDeps([14,1,2]) : void 0).then((module) => ({ default: module.AnalyticsTab })));
const AttendanceTab = reactExports.lazy(() => __vitePreload(() => import("./AttendanceTab-CQStn-Ez.js"), true ? __vite__mapDeps([15,1,2,16,17]) : void 0).then((module) => ({ default: module.AttendanceTab })));
const BillingTab = reactExports.lazy(() => __vitePreload(() => import("./BillingTab-Bc_0-7bZ.js"), true ? __vite__mapDeps([18,1,2,19,20,21]) : void 0).then((module) => ({ default: module.BillingTab })));
const StudentProfile = ({ data, onUpdateStudent, onAddStudent, onDeleteStudent, selectedStudentId: externalStudentId }) => {
  var _a;
  const [selectedStudentId, setSelectedStudentId] = reactExports.useState(externalStudentId || ((_a = data.students[0]) == null ? void 0 : _a.id) || 0);
  const [mobileShowDetail, setMobileShowDetail] = reactExports.useState(!!externalStudentId);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [subjectFilter, setSubjectFilter] = reactExports.useState("All");
  const [showAddModal, setShowAddModal] = reactExports.useState(false);
  const [showEditModal, setShowEditModal] = reactExports.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState("overview");
  const { showToast } = useToast();
  const selectedStudent = reactExports.useMemo(
    () => data.students.find((s) => s.id === selectedStudentId),
    [data.students, selectedStudentId]
  );
  React.useEffect(() => {
    const handleBackButton = (e) => {
      if (showAddModal) {
        e.preventDefault();
        setShowAddModal(false);
      } else if (showEditModal) {
        e.preventDefault();
        setShowEditModal(false);
      } else if (showDeleteConfirm) {
        e.preventDefault();
        setShowDeleteConfirm(false);
      } else if (mobileShowDetail) {
        e.preventDefault();
        setMobileShowDetail(false);
      }
    };
    window.addEventListener("app-back-button", handleBackButton);
    return () => window.removeEventListener("app-back-button", handleBackButton);
  }, [mobileShowDetail, showAddModal, showEditModal, showDeleteConfirm]);
  const classStudents = reactExports.useMemo(() => {
    if (!selectedStudent) return [];
    return data.students.filter(
      (s) => s.subject === selectedStudent.subject && s.grade === selectedStudent.grade
    );
  }, [data.students, selectedStudent]);
  const getStudentAvg = reactExports.useCallback((student) => {
    const vals = Object.values(student.competencies);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, []);
  const studentAverage = reactExports.useMemo(
    () => selectedStudent ? getStudentAvg(selectedStudent) : 0,
    [selectedStudent, getStudentAvg]
  );
  const classAverage = reactExports.useMemo(
    () => classStudents.length > 0 ? classStudents.reduce((acc, s) => acc + getStudentAvg(s), 0) / classStudents.length : 0,
    [classStudents, getStudentAvg]
  );
  const performanceVsClass = studentAverage - classAverage;
  const handleAddNote = reactExports.useCallback((note) => {
    if (!selectedStudent || !note.trim()) return;
    const updatedStudent = {
      ...selectedStudent,
      notes: [note, ...selectedStudent.notes]
    };
    onUpdateStudent(updatedStudent, true);
    showToast("Note added successfully!", "success");
  }, [selectedStudent, onUpdateStudent, showToast]);
  const handleDeleteStudent = reactExports.useCallback(() => {
    var _a2;
    if (!selectedStudent) return;
    onDeleteStudent(selectedStudent.id);
    setShowDeleteConfirm(false);
    const remaining = data.students.filter((s) => s.id !== selectedStudent.id);
    setSelectedStudentId(((_a2 = remaining[0]) == null ? void 0 : _a2.id) || 0);
  }, [selectedStudent, onDeleteStudent, data.students]);
  const handleAddStudentClick = reactExports.useCallback(() => setShowAddModal(true), []);
  const handleDeleteRequest = reactExports.useCallback(() => setShowDeleteConfirm(true), []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PageTransition, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col font-sans", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900/30 overflow-hidden p-6 md:p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 opacity-20 dark:opacity-10 mix-blend-overlay pointer-events-none", style: { backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-black/50 to-transparent -translate-x-full" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border border-indigo-100 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-900/80 text-indigo-600 dark:text-indigo-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { size: 24 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2", children: [
              "Student Profiles ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] rounded uppercase tracking-widest font-bold", children: "CRM" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5", children: "Manage rosters and analyze administrative records" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleAddStudentClick,
            className: "px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16 }),
              " Add Record"
            ]
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col md:flex-row gap-6 min-h-0 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl p-2 border border-slate-100 dark:border-slate-800", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
        "w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col h-full",
        mobileShowDetail ? "hidden md:flex" : "flex"
      ), children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full md:w-80 lg:w-96 glass-panel animate-pulse" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        StudentList,
        {
          students: data.students,
          selectedStudentId,
          onSelectStudent: (id) => {
            setSelectedStudentId(id);
            setMobileShowDetail(true);
          },
          searchTerm,
          onSearchChange: setSearchTerm,
          subjectFilter,
          onFilterChange: setSubjectFilter,
          onAddStudent: handleAddStudentClick
        }
      ) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
        "flex-1 glass-panel backdrop-blur-md bg-[var(--md-sys-color-surface)]/80 overflow-hidden flex flex-col rounded-2xl border border-[var(--md-sys-color-outline)] shadow-lg shadow-slate-200/20 dark:shadow-none",
        mobileShowDetail ? "flex" : "hidden md:flex"
      ), children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" }) }), children: selectedStudent ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        mobileShowDetail && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:hidden p-3 bg-[var(--md-sys-color-surface-variant)]/50 border-b border-[var(--md-sys-color-outline)] flex items-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setMobileShowDetail(false),
            className: "flex items-center gap-2 text-sm font-bold text-[var(--md-sys-color-primary)] active:scale-95 transition-all",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 16 }),
              " Back to Roster"
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ProfileHeader,
          {
            student: selectedStudent,
            studentAverage,
            performanceVsClass,
            onDeleteRequest: handleDeleteRequest,
            onEditRequest: () => setShowEditModal(true)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]/30 p-1.5 gap-1", children: [
          { id: "overview", label: "General Info", icon: User },
          { id: "analytics", label: "Academic History", icon: BookOpen },
          { id: "attendance", label: "Behavior & Notes", icon: FileText },
          { id: "billing", label: "Billing", icon: CreditCard }
        ].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setActiveTab(tab.id),
            className: clsx(
              "flex-1 py-2.5 text-xs sm:text-sm font-bold transition-all rounded-lg flex items-center justify-center gap-2 active:scale-[0.98]",
              activeTab === tab.id ? "glass-card bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-sm" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-white/5"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { size: 16 }),
              tab.label
            ]
          },
          tab.id
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-6 custom-scrollbar", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-64 flex items-center justify-center text-gray-400", children: "Loading tab..." }), children: [
          activeTab === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            OverviewTab,
            {
              student: selectedStudent,
              classAvgStudents: classStudents,
              onAddNote: handleAddNote,
              studentAverage
            }
          ),
          activeTab === "analytics" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            AnalyticsTab,
            {
              student: selectedStudent,
              classAvgStudents: classStudents
            }
          ),
          activeTab === "attendance" && /* @__PURE__ */ jsxRuntimeExports.jsx(AttendanceTab, { student: selectedStudent, onAddNote: handleAddNote }),
          activeTab === "billing" && /* @__PURE__ */ jsxRuntimeExports.jsx(BillingTab, { student: selectedStudent })
        ] }) })
      ] }) : data.students.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-[var(--md-sys-color-on-surface-variant)] p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/40 dark:to-violet-900/40 rounded-2xl flex items-center justify-center mb-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { size: 36, className: "text-blue-600 dark:text-blue-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-google font-bold text-[var(--md-sys-color-on-surface)] mb-2", children: "Welcome to Student Profiles" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-sm text-[var(--md-sys-color-secondary)] mb-6", children: "Start by adding your first student to unlock performance tracking, competency analytics, and attendance management." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 mb-6 text-left max-w-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold", children: "1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--md-sys-color-on-surface-variant)]", children: "Add students with their details" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold", children: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--md-sys-color-on-surface-variant)]", children: "Track competencies and attendance" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold", children: "3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--md-sys-color-on-surface-variant)]", children: "View analytics and generate reports" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleAddStudentClick,
            className: "px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16 }),
              "Add First Student"
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-[var(--md-sys-color-on-surface-variant)] p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-24 bg-[var(--md-sys-color-surface-variant)] rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { size: 40, className: "opacity-40" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-google font-bold text-[var(--md-sys-color-on-surface)]", children: "No Student Selected" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xs mt-2 text-[var(--md-sys-color-secondary)]", children: "Select a student from the roster to view their profile and performance analytics." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleAddStudentClick,
            className: "mt-6 px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16 }),
              "Add Student"
            ]
          }
        )
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AddStudentModal,
        {
          isOpen: showAddModal,
          onClose: () => setShowAddModal(false),
          onAdd: onAddStudent
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        EditStudentModal,
        {
          isOpen: showEditModal,
          onClose: () => setShowEditModal(false),
          student: selectedStudent || null,
          onSave: (updated) => {
            onUpdateStudent(updated, true);
            setShowEditModal(false);
          }
        }
      ),
      showDeleteConfirm && selectedStudent && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-red-600 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 24 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-google font-bold text-lg text-[var(--md-sys-color-on-surface)]", children: "Delete Student" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[var(--md-sys-color-on-surface-variant)] text-sm mb-6", children: [
          "Are you sure you want to delete ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: selectedStudent.name }),
          "? This action cannot be undone."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setShowDeleteConfirm(false),
              className: "flex-1 py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:opacity-80 transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleDeleteStudent,
              className: "flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors",
              children: "Delete"
            }
          )
        ] })
      ] }) })
    ] })
  ] }) });
};
export {
  StudentProfile as default
};
