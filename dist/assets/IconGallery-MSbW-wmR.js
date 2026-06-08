import { o as createLucideIcon, R as React, b as useAuth, bX as LayoutDashboard, C as Calendar, U as Users, b6 as UserCheck, bY as ChartLine, bZ as ClipboardCheck, v as ChartColumn, b8 as Box, bV as Wallet, b_ as UsersRound, bC as MessageSquare, S as Settings, j as jsxRuntimeExports, m as motion, i as Sparkles, l as ArrowRight } from "./index-Dt5N_hgV.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Compass = createLucideIcon("Compass", [
  [
    "path",
    {
      d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
      key: "9ktpf1"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
]);
const ROLE_LEVEL = { admin: 3, instructor: 2, viewer: 1 };
const IconGallery = ({ onNavigate }) => {
  const { user } = useAuth();
  const userLevel = ROLE_LEVEL[(user == null ? void 0 : user.role) || "viewer"] || 1;
  const features = [
    {
      id: "dashboard",
      label: "Home & Dashboard",
      description: "Overview of student tallies, attendance charts, and quick-action alerts.",
      icon: LayoutDashboard,
      gradient: "from-blue-500/20 to-indigo-500/20",
      borderGlow: "rgba(59, 130, 246, 0.4)",
      minRole: "viewer",
      category: "Core"
    },
    {
      id: "schedule",
      label: "Schedule & Timetable",
      description: "Coordinate class sessions, manage calendars, and track lesson status.",
      icon: Calendar,
      gradient: "from-purple-500/20 to-pink-500/20",
      borderGlow: "rgba(168, 85, 247, 0.4)",
      minRole: "viewer",
      category: "Core"
    },
    {
      id: "students-manage",
      label: "Student Directory",
      description: "Instructor rosters, emergency contact data, and active profiles.",
      icon: Users,
      gradient: "from-emerald-500/20 to-teal-500/20",
      borderGlow: "rgba(16, 185, 129, 0.4)",
      minRole: "viewer",
      category: "Core"
    },
    {
      id: "attendance",
      label: "Attendance Register",
      description: "Log daily class status, verify sessions, and view history.",
      icon: UserCheck,
      gradient: "from-amber-500/20 to-orange-500/20",
      borderGlow: "rgba(245, 158, 11, 0.4)",
      minRole: "viewer",
      category: "Core"
    },
    {
      id: "student-analytics",
      label: "Student Insights",
      description: "Explore individual academic trajectories, trends, and progress charts.",
      icon: ChartLine,
      gradient: "from-cyan-500/20 to-blue-500/20",
      borderGlow: "rgba(6, 182, 212, 0.4)",
      minRole: "instructor",
      category: "Analytics"
    },
    {
      id: "assessment",
      label: "Grades & Assessments",
      description: "Log marks, calculate averages, and generate student report cards.",
      icon: ClipboardCheck,
      gradient: "from-violet-500/20 to-fuchsia-500/20",
      borderGlow: "rgba(139, 92, 246, 0.4)",
      minRole: "instructor",
      category: "Analytics"
    },
    {
      id: "analytics",
      label: "System Analytics",
      description: "Comprehensive data on payments, attendance distributions, and metrics.",
      icon: ChartColumn,
      gradient: "from-rose-500/20 to-red-500/20",
      borderGlow: "rgba(244, 63, 94, 0.4)",
      minRole: "admin",
      category: "Analytics"
    },
    {
      id: "resources",
      label: "Document Repository",
      description: "Class reference guides, library files, and syllabus worksheets.",
      icon: Box,
      gradient: "from-sky-500/20 to-indigo-500/20",
      borderGlow: "rgba(14, 165, 233, 0.4)",
      minRole: "viewer",
      category: "Utilities"
    },
    {
      id: "fees",
      label: "Financials & Fees",
      description: "Track outstanding balances, audit records, and initiate instant M-Pesa STK push.",
      icon: Wallet,
      gradient: "from-green-500/20 to-emerald-500/20",
      borderGlow: "rgba(34, 197, 94, 0.4)",
      minRole: "admin",
      category: "Utilities"
    },
    {
      id: "instructors",
      label: "Instructor Directory",
      description: "Manage staff credentials, assigned classes, and administrative access levels.",
      icon: UsersRound,
      gradient: "from-teal-500/20 to-sky-500/20",
      borderGlow: "rgba(20, 184, 166, 0.4)",
      minRole: "admin",
      category: "Utilities"
    },
    {
      id: "communications",
      label: "Communications",
      description: "Real-time instructor messaging, chat rooms, and automated notifications.",
      icon: MessageSquare,
      gradient: "from-indigo-500/20 to-purple-500/20",
      borderGlow: "rgba(99, 102, 241, 0.4)",
      minRole: "viewer",
      category: "Utilities"
    },
    {
      id: "settings",
      label: "System Settings",
      description: "Configure PWA Push Notifications, toggle Dark Mode, and monitor Supabase sync.",
      icon: Settings,
      gradient: "from-slate-500/20 to-zinc-500/20",
      borderGlow: "rgba(100, 116, 139, 0.4)",
      minRole: "viewer",
      category: "Utilities"
    }
  ];
  const authorizedFeatures = features.filter((f) => userLevel >= (ROLE_LEVEL[f.minRole] || 1));
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-28 md:pb-8 custom-scrollbar", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        className: "glassmorphic-card-premium p-6 md:p-8 mb-8 overflow-hidden bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 10 }),
              " Control Hub"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl md:text-3xl font-google font-bold text-[var(--md-sys-color-on-surface)]", children: "Command Center" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-secondary)] mt-1 max-w-xl", children: "A responsive, high-fidelity visual directory mapping all PRISM OS modules. Navigate smoothly to any feature from here." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-2 bg-white/20 dark:bg-black/25 rounded-2xl border border-[var(--md-sys-color-outline)] self-start md:self-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Compass, { className: "text-indigo-500 animate-spin", style: { animationDuration: "20s" }, size: 24 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] px-1", children: [
              "Active Session: ",
              user == null ? void 0 : user.role.toUpperCase()
            ] })
          ] })
        ] })
      }
    ),
    ["Core", "Analytics", "Utilities"].map((cat) => {
      const catFeatures = authorizedFeatures.filter((f) => f.category === cat);
      if (catFeatures.length === 0) return null;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-base font-google font-bold text-[var(--md-sys-color-on-surface-variant)] mb-4 tracking-wider uppercase text-xs flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-indigo-500" }),
          cat,
          " Modules"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.div,
          {
            variants: containerVariants,
            initial: "hidden",
            animate: "show",
            className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
            children: catFeatures.map((item) => {
              const IconComponent = item.icon;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  variants: itemVariants,
                  onClick: () => onNavigate(item.id),
                  className: "group relative cursor-pointer overflow-hidden rounded-[28px] p-5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--glass-bg)] hover:bg-white/40 dark:hover:bg-black/40 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-lg hover:border-indigo-500/30 flex flex-col justify-between tap-target-premium",
                  style: { minHeight: "160px" },
                  whileHover: { scale: 1.02 },
                  whileTap: { scale: 0.98 },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10` }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: "p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 flex items-center justify-center bg-white/50 dark:bg-black/30 shadow-inner",
                            style: { boxShadow: `0 0 15px -2px ${item.borderGlow}` },
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(IconComponent, { className: "text-[var(--md-sys-color-primary)] transition-transform duration-300 group-hover:rotate-6", size: 24 })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-indigo-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 18 }) })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-google font-bold text-sm text-[var(--md-sys-color-on-surface)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors", children: item.label }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1.5 line-clamp-3 leading-relaxed", children: item.description })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--md-sys-color-secondary)] uppercase", children: item.id.replace("-manage", "") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] font-bold text-emerald-500 flex items-center gap-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" }),
                        " Active"
                      ] })
                    ] })
                  ]
                },
                item.id
              );
            })
          }
        )
      ] }, cat);
    })
  ] });
};
const IconGallery_default = React.memo(IconGallery);
export {
  IconGallery_default as default
};
