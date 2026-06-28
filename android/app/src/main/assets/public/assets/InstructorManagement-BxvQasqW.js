import { o as createLucideIcon, a9 as supabase, u as useTheme, a as reactExports, e as useToast, j as jsxRuntimeExports, m as motion, U as Users, bW as WordRotator, c as clsx, B as BookOpen, b6 as UserCheck, G as GraduationCap, A as AnimatePresence, X } from "./index-CxG9nk1k.js";
import { g as getStudentGroups, c as getLevelsForGroup } from "./educationLevels-CWONNkiO.js";
import { B as Briefcase } from "./briefcase-BrXpnO8v.js";
import { P as Plus } from "./plus-CwAYQG3c.js";
import { T as Trash2 } from "./trash-2-CjyS_af4.js";
import { S as Save } from "./save-Nx_IvaEy.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const UserX = createLucideIcon("UserX", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["line", { x1: "17", x2: "22", y1: "8", y2: "13", key: "3nzzx3" }],
  ["line", { x1: "22", x2: "17", y1: "8", y2: "13", key: "1swrse" }]
]);
async function getAllInstructors() {
  const { data, error } = await supabase.from("instructor_profiles").select("*").order("full_name");
  if (error || !data) return [];
  return data.map(mapProfile);
}
async function updateInstructorProfile(id, updates) {
  const { error } = await supabase.from("instructor_profiles").update({
    full_name: updates.fullName,
    phone: updates.phone,
    subject: updates.subject,
    qualification: updates.qualification,
    photo_url: updates.photoUrl,
    is_active: updates.isActive,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", id);
  return !error;
}
async function getAllClassAssignments() {
  const { data, error } = await supabase.from("class_assignments").select(`
      *,
      instructor_profiles!inner(full_name)
    `).eq("is_active", true).order("grade");
  if (error || !data) return [];
  return data.map((d) => {
    var _a;
    return {
      ...mapAssignment(d),
      instructorName: (_a = d.instructor_profiles) == null ? void 0 : _a.full_name
    };
  });
}
async function assignInstructorToClass(instructorId, grade, subject, studentGroup, term, academicYear) {
  const { error } = await supabase.from("class_assignments").upsert({
    instructor_id: instructorId,
    grade,
    subject,
    student_group: studentGroup,
    term: term || 1,
    academic_year: (/* @__PURE__ */ new Date()).getFullYear().toString(),
    is_active: true
  }, { onConflict: "instructor_id,grade,subject,term,academic_year" });
  return !error;
}
async function unassignInstructorFromClass(assignmentId) {
  const { error } = await supabase.from("class_assignments").update({ is_active: false }).eq("id", assignmentId);
  return !error;
}
async function getInstructorWorkloads() {
  const { data, error } = await supabase.from("instructor_workload").select("*");
  if (error || !data) return [];
  return data.map((d) => ({
    instructorId: d.instructor_id,
    fullName: d.full_name,
    primarySubject: d.primary_subject,
    isActive: d.is_active,
    totalAssignments: d.total_assignments || 0,
    uniqueGrades: d.unique_grades || 0,
    assignedGrades: d.assigned_grades || [],
    assignedSubjects: d.assigned_subjects || []
  }));
}
function mapProfile(d) {
  return {
    id: d.id,
    userId: d.user_id,
    fullName: d.full_name,
    email: d.email,
    phone: d.phone,
    subject: d.subject || "Solar",
    qualification: d.qualification,
    photoUrl: d.photo_url,
    isActive: d.is_active ?? true,
    createdAt: d.created_at,
    updatedAt: d.updated_at
  };
}
function mapAssignment(d) {
  return {
    id: d.id,
    instructorId: d.instructor_id,
    grade: d.grade,
    subject: d.subject,
    studentGroup: d.student_group,
    term: d.term,
    academicYear: d.academic_year,
    isActive: d.is_active ?? true,
    createdAt: d.created_at
  };
}
const InstructorManagement = () => {
  const { preferences } = useTheme();
  const activeSubjects = preferences.customSubjects && preferences.customSubjects.length > 0 ? preferences.customSubjects : ["Solar", "ICT"];
  const activeGroups = getStudentGroups(preferences.institutionType);
  const [instructors, setInstructors] = reactExports.useState([]);
  const [workloads, setWorkloads] = reactExports.useState([]);
  const [assignments, setAssignments] = reactExports.useState([]);
  const [selectedInstructor, setSelectedInstructor] = reactExports.useState(null);
  const [showAssignModal, setShowAssignModal] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(true);
  const { showToast } = useToast();
  const [assignForm, setAssignForm] = reactExports.useState({
    grade: "",
    subject: activeSubjects[0],
    studentGroup: activeGroups[0],
    term: 1
  });
  const loadData = reactExports.useCallback(async () => {
    setLoading(true);
    const [ins, wl, asgn] = await Promise.all([
      getAllInstructors(),
      getInstructorWorkloads(),
      getAllClassAssignments()
    ]);
    setInstructors(ins);
    setWorkloads(wl);
    setAssignments(asgn);
    setLoading(false);
  }, []);
  reactExports.useEffect(() => {
    loadData();
  }, [loadData]);
  const handleAssignClass = async () => {
    if (!selectedInstructor || !assignForm.grade) return;
    const success = await assignInstructorToClass(
      selectedInstructor.id,
      assignForm.grade,
      assignForm.subject,
      assignForm.studentGroup,
      assignForm.term
    );
    if (success) {
      showToast(`Assigned ${selectedInstructor.fullName} to ${assignForm.grade} ${assignForm.subject}`, "success");
      setShowAssignModal(false);
      loadData();
    } else {
      showToast("Failed to assign class", "error");
    }
  };
  const handleUnassign = async (assignmentId) => {
    const success = await unassignInstructorFromClass(assignmentId);
    if (success) {
      showToast("Class unassigned", "success");
      loadData();
    }
  };
  const handleToggleActive = async (instructor) => {
    const success = await updateInstructorProfile(instructor.id, { isActive: !instructor.isActive });
    if (success) {
      showToast(`${instructor.fullName} ${instructor.isActive ? "deactivated" : "activated"}`, "success");
      loadData();
    }
  };
  const levels = getLevelsForGroup(assignForm.studentGroup);
  const instructorAssignments = (instructorId) => assignments.filter((a) => a.instructorId === instructorId);
  const getWorkload = (instructorId) => workloads.find((w) => w.instructorId === instructorId);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto animate-fade-in space-y-6 pb-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 200, damping: 22 },
        className: "relative rounded-3xl overflow-hidden bg-[var(--md-sys-color-surface)]/70 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] shadow-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-6",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-16 -top-16 w-48 h-48 bg-violet-500 opacity-10 rounded-full blur-2xl pointer-events-none" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-20 -bottom-20 w-48 h-48 bg-purple-500 opacity-5 rounded-full blur-2xl pointer-events-none" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.div,
              {
                whileHover: { scale: 1.05, rotate: [0, -5, 5, 0] },
                whileTap: { scale: 0.95 },
                className: "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 text-violet-600 dark:text-violet-400 shadow-sm",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 28 })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl sm:text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tracking-tight leading-none", children: "Instructor Management" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs sm:text-sm font-semibold text-[var(--md-sys-color-secondary)] mt-2 flex items-center min-h-[18px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-1.5 select-none", children: "Configure system access and" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  WordRotator,
                  {
                    words: [
                      "Assign class workloads...",
                      "Update profile credentials...",
                      "Review active curriculum...",
                      "Authorize school access..."
                    ],
                    intervalMs: 3500,
                    className: "text-violet-600 dark:text-violet-400 font-bold"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10 flex items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-4 py-2 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl font-bold text-xs shadow-sm", children: [
            instructors.length,
            " Instructor",
            instructors.length !== 1 ? "s" : "",
            " Registered"
          ] }) })
        ]
      }
    ),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-4 space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-5 bg-[var(--md-sys-color-surface)]/60 dark:bg-[var(--md-sys-color-surface)]/20 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] shadow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-4", children: "Instructors" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5 max-h-[50vh] md:max-h-[600px] overflow-y-auto custom-scrollbar pr-1", children: [
          instructors.map((ins) => {
            const wl = getWorkload(ins.id);
            const isSelected = (selectedInstructor == null ? void 0 : selectedInstructor.id) === ins.id;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setSelectedInstructor(ins),
                className: clsx(
                  "w-full text-left p-4 rounded-2xl border transition-all duration-305 active:scale-[0.98] hover:scale-[1.01] flex flex-col gap-2.5",
                  isSelected ? "bg-gradient-to-br from-violet-600/90 to-purple-600/90 border-transparent text-white shadow-lg shadow-violet-500/20" : "bg-[var(--md-sys-color-surface)]/50 border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)]/60 hover:border-violet-500/40"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: clsx("font-bold text-sm leading-tight", isSelected ? "text-white" : "text-[var(--md-sys-color-on-surface)]"), children: ins.fullName }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: clsx("text-[10px] mt-0.5 leading-none", isSelected ? "text-violet-200" : "text-[var(--md-sys-color-secondary)]"), children: ins.email || "No email" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: ins.isActive ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide",
                      isSelected ? "bg-white/20 text-white" : "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                    ), children: "Active" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400", children: "Inactive" }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full flex items-center gap-3 text-[10px] border-t pt-2 border-[var(--md-sys-color-outline)]/20", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx("flex items-center gap-1 font-semibold", isSelected ? "text-violet-100" : "text-[var(--md-sys-color-secondary)]"), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 11 }),
                      " ",
                      ins.subject
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx("flex items-center gap-1 font-semibold", isSelected ? "text-violet-100" : "text-[var(--md-sys-color-secondary)]"), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { size: 11 }),
                      " ",
                      (wl == null ? void 0 : wl.totalAssignments) || 0,
                      " classes"
                    ] })
                  ] })
                ]
              },
              ins.id
            );
          }),
          instructors.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 text-[var(--md-sys-color-secondary)] text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 32, className: "mx-auto mb-2 opacity-40 text-violet-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "No instructors registered yet." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1", children: "Instructors are auto-created when users sign up." })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-8", children: selectedInstructor ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-6 bg-[var(--md-sys-color-surface)]/60 dark:bg-[var(--md-sys-color-surface)]/20 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] shadow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-xl font-google shadow-inner", children: selectedInstructor.fullName.split(" ").map((n) => n[0]).join("").toUpperCase() }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-[var(--md-sys-color-on-surface)] leading-tight", children: selectedInstructor.fullName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-secondary)]", children: selectedInstructor.email })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => handleToggleActive(selectedInstructor),
                className: clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border",
                  selectedInstructor.isActive ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40" : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/40"
                ),
                title: selectedInstructor.isActive ? "Deactivate" : "Activate",
                children: [
                  selectedInstructor.isActive ? /* @__PURE__ */ jsxRuntimeExports.jsx(UserX, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { size: 14 }),
                  selectedInstructor.isActive ? "Deactivate" : "Activate"
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-4", children: (() => {
            const wl = getWorkload(selectedInstructor.id);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-violet-500/5 hover:bg-violet-500/10 border-violet-500/15 hover:border-violet-500/35 rounded-2xl p-4 text-center group", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-black text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-300", children: (wl == null ? void 0 : wl.totalAssignments) || 0 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider mt-1.5", children: "Classes" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/15 hover:border-blue-500/35 rounded-2xl p-4 text-center group", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-black text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300", children: (wl == null ? void 0 : wl.uniqueGrades) || 0 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mt-1.5", children: "Grades" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/15 hover:border-emerald-500/35 rounded-2xl p-4 text-center group", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-black text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300", children: ((wl == null ? void 0 : wl.assignedSubjects) || []).length }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mt-1.5", children: "Subjects" })
              ] })
            ] });
          })() })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-panel p-6 bg-[var(--md-sys-color-surface)]/60 dark:bg-[var(--md-sys-color-surface)]/20 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] shadow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider", children: "Class Assignments" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setShowAssignModal(true),
                className: "flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-md shadow-violet-500/10 active:scale-95 transition-all",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }),
                  " Assign Class"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            instructorAssignments(selectedInstructor.id).map((asgn) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center justify-between p-4 rounded-2xl bg-[var(--md-sys-color-surface-variant)]/50 hover:bg-[var(--md-sys-color-surface-variant)]/85 border border-[var(--md-sys-color-outline-variant)] hover:border-violet-500/20 hover:shadow-sm transition-all duration-300",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { size: 20 }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: [
                        asgn.grade,
                        " — ",
                        asgn.subject
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5", children: [
                        asgn.studentGroup || "All groups",
                        " • Term ",
                        asgn.term || 1
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => handleUnassign(asgn.id),
                      className: "p-2 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all",
                      title: "Remove assignment",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14 })
                    }
                  )
                ]
              },
              asgn.id
            )),
            instructorAssignments(selectedInstructor.id).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-10 text-[var(--md-sys-color-secondary)] text-sm border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl", children: 'No classes assigned yet. Click "Assign Class" to get started.' })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glass-panel p-6 rounded-2xl bg-[var(--md-sys-color-surface)]/60 dark:bg-[var(--md-sys-color-surface)]/20 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center h-96", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-[var(--md-sys-color-secondary)] px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 48, className: "mx-auto mb-3 opacity-30 text-violet-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold font-google text-lg text-[var(--md-sys-color-on-surface)]", children: "Select an instructor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1.5 max-w-sm", children: "Select an instructor from the list to view their workload summary, manage curriculum subjects, and assign grades." })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showAssignModal && selectedInstructor && /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4",
        onClick: () => setShowAssignModal(false),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { scale: 0.95, y: 15, opacity: 0 },
            animate: { scale: 1, y: 0, opacity: 1 },
            exit: { scale: 0.95, y: 15, opacity: 0 },
            transition: { type: "spring", duration: 0.35 },
            className: "glass-card bg-[var(--md-sys-color-surface)]/90 dark:bg-[var(--md-sys-color-surface)]/45 backdrop-blur-2xl rounded-3xl p-6 w-full max-w-md border border-[var(--md-sys-color-outline)] shadow-2xl relative overflow-hidden",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-20 -top-20 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6 relative z-10", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-bold text-[var(--md-sys-color-on-surface)]", children: [
                  "Assign Class to ",
                  selectedInstructor.fullName
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setShowAssignModal(false),
                    className: "p-2 rounded-xl text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all active:scale-90",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20 })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 relative z-10", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1.5", children: "Subject" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl p-1 border border-[var(--md-sys-color-outline)] gap-1", children: activeSubjects.map((sub) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => setAssignForm((f) => ({ ...f, subject: sub })),
                      className: clsx(
                        "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95",
                        assignForm.subject === sub ? "glass-card bg-[var(--md-sys-color-surface)] text-violet-600 dark:text-violet-400 shadow-sm border border-violet-500/20" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-white/5"
                      ),
                      children: sub
                    },
                    sub
                  )) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1.5", children: "Student Group" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "select",
                    {
                      value: assignForm.studentGroup,
                      onChange: (e) => setAssignForm((f) => ({ ...f, studentGroup: e.target.value, grade: "" })),
                      className: "w-full px-3 py-2.5 bg-transparent text-sm focus:outline-none text-[var(--md-sys-color-on-surface)] cursor-pointer",
                      title: "Select student group",
                      children: activeGroups.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: g, className: "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]", children: g }, g))
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1.5", children: "Grade / Level" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: levels.map((lvl) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => setAssignForm((f) => ({ ...f, grade: lvl.id })),
                      className: clsx(
                        "px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 border",
                        assignForm.grade === lvl.id ? "bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-md shadow-violet-500/20" : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400"
                      ),
                      children: lvl.shortLabel
                    },
                    lvl.id
                  )) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1.5", children: "Term" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl p-1 border border-[var(--md-sys-color-outline)]", children: [1, 2, 3].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => setAssignForm((f) => ({ ...f, term: t })),
                      className: clsx(
                        "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95",
                        assignForm.term === t ? "glass-card bg-[var(--md-sys-color-surface)] text-violet-600 dark:text-violet-400 shadow-sm border border-violet-500/20" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-white/5"
                      ),
                      children: [
                        "Term ",
                        t
                      ]
                    },
                    t
                  )) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: handleAssignClass,
                    disabled: !assignForm.grade,
                    className: clsx(
                      "w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg mt-2",
                      assignForm.grade ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95 shadow-violet-500/20" : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none"
                    ),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 16 }),
                      " Assign Class"
                    ]
                  }
                )
              ] })
            ]
          }
        )
      }
    ) })
  ] });
};
export {
  InstructorManagement as default
};
