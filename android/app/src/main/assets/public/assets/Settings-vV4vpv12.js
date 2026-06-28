import { o as createLucideIcon, b as useAuth, a as reactExports, e as useToast, a9 as supabase, j as jsxRuntimeExports, m as motion, aa as Shield, X, U as Users, c as clsx, a0 as Activity, q as Search, f as RefreshCw, ab as LoaderCircle, A as AnimatePresence, O as CircleCheckBig, u as useTheme, S as Settings$1, n as User, F as FileText, g as ChevronRight, ac as Sun, ad as Moon, B as BookOpen, G as GraduationCap, i as Sparkles, R as React, T as TriangleAlert, Z as Zap, ae as exportDataAsCSV, af as exportFullBackup, ag as importFullBackup, ah as resetData } from "./index-CWZOk6sM.js";
import { P as PageHeader } from "./PageHeader-B3fUzkFR.js";
import { f as fetchProfile, U as UserAvatar, P as Palette, u as uploadProfileAvatar, r as removeProfileAvatar, a as updateProfile } from "./profileService-BjTPTgSS.js";
import { u as useLocalStorage } from "./useLocalStorage-BEUeXsSo.js";
import { notificationService } from "./notificationService-DzXbje6V.js";
import { C as Camera } from "./camera-BE23yLZy.js";
import { P as Phone } from "./phone-BblhE0EH.js";
import { B as Building2, S as School } from "./school-D6iTB7P7.js";
import { S as Save } from "./save-egituPWj.js";
import { C as Check } from "./check-BbC8ELKL.js";
import { B as Briefcase } from "./briefcase-Bq_jgrl3.js";
import { P as Plus } from "./plus-CAiaV-Kd.js";
import { B as Bell } from "./bell-DPngBihw.js";
import { E as Eye } from "./eye-C8KKiYqj.js";
import { F as FileDown } from "./file-down-jw9SpUVI.js";
import { D as Download } from "./download-C7s4dTGf.js";
import { U as Upload } from "./cloudStorageService-4tJKXikO.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Ban = createLucideIcon("Ban", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m4.9 4.9 14.2 14.2", key: "1m5liu" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const BellRing = createLucideIcon("BellRing", [
  ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
  ["path", { d: "M22 8c0-2.3-.8-4.3-2-6", key: "5bb3ad" }],
  [
    "path",
    {
      d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
      key: "11g9vi"
    }
  ],
  ["path", { d: "M4 2C2.8 3.7 2 5.7 2 8", key: "tap9e0" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CircleArrowDown = createLucideIcon("CircleArrowDown", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 8v8", key: "napkw2" }],
  ["path", { d: "m8 12 4 4 4-4", key: "k98ssh" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CircleArrowUp = createLucideIcon("CircleArrowUp", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m16 12-4-4-4 4", key: "177agl" }],
  ["path", { d: "M12 16V8", key: "1sbj14" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Database = createLucideIcon("Database", [
  ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
  ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
  ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const HardDrive = createLucideIcon("HardDrive", [
  ["line", { x1: "22", x2: "2", y1: "12", y2: "12", key: "1y58io" }],
  [
    "path",
    {
      d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
      key: "oot6mr"
    }
  ],
  ["line", { x1: "6", x2: "6.01", y1: "16", y2: "16", key: "sgf278" }],
  ["line", { x1: "10", x2: "10.01", y1: "16", y2: "16", key: "1l4acy" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Keyboard = createLucideIcon("Keyboard", [
  ["path", { d: "M10 8h.01", key: "1r9ogq" }],
  ["path", { d: "M12 12h.01", key: "1mp3jc" }],
  ["path", { d: "M14 8h.01", key: "1primd" }],
  ["path", { d: "M16 12h.01", key: "1l6xoz" }],
  ["path", { d: "M18 8h.01", key: "emo2bl" }],
  ["path", { d: "M6 8h.01", key: "x9i8wu" }],
  ["path", { d: "M7 16h10", key: "wp8him" }],
  ["path", { d: "M8 12h.01", key: "czm47f" }],
  ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2", key: "18n3k1" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Laptop = createLucideIcon("Laptop", [
  [
    "path",
    {
      d: "M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16",
      key: "tarvll"
    }
  ]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const LogOut = createLucideIcon("LogOut", [
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }],
  ["polyline", { points: "16 17 21 12 16 7", key: "1gabdz" }],
  ["line", { x1: "21", x2: "9", y1: "12", y2: "12", key: "1uyos4" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const RotateCcw = createLucideIcon("RotateCcw", [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const SlidersVertical = createLucideIcon("SlidersVertical", [
  ["line", { x1: "4", x2: "4", y1: "21", y2: "14", key: "1p332r" }],
  ["line", { x1: "4", x2: "4", y1: "10", y2: "3", key: "gb41h5" }],
  ["line", { x1: "12", x2: "12", y1: "21", y2: "12", key: "hf2csr" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "3", key: "1kfi7u" }],
  ["line", { x1: "20", x2: "20", y1: "21", y2: "16", key: "1lhrwl" }],
  ["line", { x1: "20", x2: "20", y1: "12", y2: "3", key: "16vvfq" }],
  ["line", { x1: "2", x2: "6", y1: "14", y2: "14", key: "1uebub" }],
  ["line", { x1: "10", x2: "14", y1: "8", y2: "8", key: "1yglbp" }],
  ["line", { x1: "18", x2: "22", y1: "16", y2: "16", key: "1jxqpz" }]
]);
function UserManagement({ onClose }) {
  const { user: currentUser } = useAuth();
  const [view, setView] = reactExports.useState("users");
  const { showToast } = useToast();
  const [users, setUsers] = reactExports.useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = reactExports.useState(true);
  const [actionLoading, setActionLoading] = reactExports.useState(null);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  if ((currentUser == null ? void 0 : currentUser.role) !== "admin") return null;
  const fetchUsers = reactExports.useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase.rpc("get_all_users");
      if (error) {
        console.error("[UserMgmt] Failed to fetch users:", error);
        showToast("Failed to load users", "error");
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error("[UserMgmt] Unexpected error:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);
  reactExports.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  const handleChangeRole = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc("admin_update_user_role", {
        target_user_id: userId,
        new_role: newRole
      });
      if (error) {
        showToast(`Failed: ${error.message}`, "error");
      } else {
        showToast(`Role updated to ${newRole}`, "success");
        await fetchUsers();
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setActionLoading(null);
    }
  };
  const handleToggleActive = async (userId, active) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc("admin_set_user_active", {
        target_user_id: userId,
        active
      });
      if (error) {
        showToast(`Failed: ${error.message}`, "error");
      } else {
        showToast(active ? "User unblocked" : "User blocked", "success");
        await fetchUsers();
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setActionLoading(null);
    }
  };
  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", children: "🛡️ Admin" });
      case "instructor":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", children: "📘 Instructor" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", children: "👁️ Viewer" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
      className: "bg-[var(--md-sys-color-surface)] w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border-b border-[var(--md-sys-color-outline)] flex justify-between items-center bg-[var(--md-sys-color-surface-variant)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 24 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-[var(--md-sys-color-on-surface)]", children: "Security & Users" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-secondary)]", children: "Manage access, roles, and permissions" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onClose,
              className: "p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors tap-target",
              "aria-label": "Close",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border-b border-[var(--md-sys-color-outline)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setView("users"),
              className: clsx(
                "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                view === "users" ? "text-violet-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 16 }),
                " Active Users (",
                users.length,
                ")",
                view === "users" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setView("logs"),
              className: clsx(
                "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                view === "logs" ? "text-violet-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 16 }),
                " Audit Logs",
                view === "logs" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-auto p-6 bg-[var(--md-sys-color-background)]", children: [
          view === "users" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    placeholder: "Search users...",
                    className: "w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-secondary)] focus:outline-none focus:border-violet-500 transition-colors"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: fetchUsers,
                  disabled: isLoadingUsers,
                  className: "p-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors disabled:opacity-50",
                  title: "Refresh",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 16, className: clsx(isLoadingUsers && "animate-spin") })
                }
              )
            ] }),
            isLoadingUsers ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 32, className: "animate-spin mx-auto text-violet-500 mb-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-secondary)]", children: "Loading users..." })
            ] }) : filteredUsers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 text-[var(--md-sys-color-secondary)]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 48, className: "mx-auto mb-4 opacity-20" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: searchQuery ? "No users match your search." : "No users found." })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "popLayout", children: filteredUsers.map((u) => {
              const isCurrentUser = u.id === (currentUser == null ? void 0 : currentUser.id);
              const isBlocked = !u.is_active;
              const isActing = actionLoading === u.id;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  layout: true,
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, scale: 0.95 },
                  className: clsx(
                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                    isBlocked ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30" : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)]"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0",
                        isBlocked ? "bg-red-400" : u.role === "admin" ? "bg-gradient-to-br from-violet-500 to-fuchsia-500" : u.role === "instructor" ? "bg-gradient-to-br from-blue-500 to-cyan-500" : "bg-gradient-to-br from-slate-400 to-slate-500"
                      ), children: u.name.charAt(0).toUpperCase() }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 text-sm", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: u.name }),
                          isCurrentUser && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-1.5 py-0.5 rounded-full flex-shrink-0", children: "You" }),
                          isBlocked && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-1.5 py-0.5 rounded-full flex-shrink-0", children: "Blocked" })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-secondary)] truncate", children: u.email }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                          getRoleBadge(u.role),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] text-[var(--md-sys-color-secondary)]", children: [
                            "Joined ",
                            new Date(u.created_at).toLocaleDateString()
                          ] })
                        ] })
                      ] })
                    ] }),
                    !isCurrentUser && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1.5 ml-3 flex-shrink-0", children: isActing ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 18, className: "animate-spin text-violet-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      u.role === "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          onClick: () => handleChangeRole(u.id, "instructor"),
                          className: "p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors tap-target",
                          title: "Promote to Instructor",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleArrowUp, { size: 16 })
                        }
                      ),
                      u.role === "instructor" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          onClick: () => handleChangeRole(u.id, "viewer"),
                          className: "p-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-600 rounded-lg transition-colors tap-target",
                          title: "Demote to Viewer",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleArrowDown, { size: 16 })
                        }
                      ),
                      u.role !== "admin" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          onClick: () => handleToggleActive(u.id, !u.is_active),
                          className: clsx(
                            "p-2.5 rounded-lg transition-colors tap-target",
                            isBlocked ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 text-emerald-600" : "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600"
                          ),
                          title: isBlocked ? "Unblock User" : "Block User",
                          children: isBlocked ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 16 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 16 })
                        }
                      )
                    ] }) })
                  ]
                },
                u.id
              );
            }) })
          ] }),
          view === "logs" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 text-[var(--md-sys-color-secondary)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 48, className: "mx-auto mb-4 opacity-20" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Detailed Audit logs are being migrated to Supabase." })
          ] }) })
        ] })
      ]
    }
  ) });
}
const sizes = {
  sm: { width: "w-10", height: "h-5", knob: "w-3 h-3", translate: "translate-x-5" },
  md: { width: "w-14", height: "h-7", knob: "w-5 h-5", translate: "translate-x-7" },
  lg: { width: "w-16", height: "h-8", knob: "w-6 h-6", translate: "translate-x-8" }
};
const ToggleSwitch = ({
  checked,
  onChange,
  size = "md",
  label,
  description,
  disabled = false,
  iconOn,
  iconOff
}) => {
  const s = sizes[size];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: clsx("flex items-center justify-between cursor-pointer w-full", disabled && "opacity-50 cursor-not-allowed"), children: [
    (label || description) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col pr-4", children: [
      label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)]", children: label }),
      description && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-[var(--md-sys-color-secondary)]", children: description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "checkbox",
          className: "sr-only",
          checked,
          onChange: (e) => !disabled && onChange(e.target.checked),
          disabled
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          className: clsx(
            s.width,
            s.height,
            "rounded-full flex items-center px-1 transition-colors duration-300 ease-in-out shadow-inner",
            checked ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-surface-variant)]"
          ),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              className: clsx(
                s.knob,
                "bg-white rounded-full shadow-md flex items-center justify-center relative overflow-hidden",
                checked ? "shadow-[var(--md-sys-color-primary)]" : "shadow-gray-300"
              ),
              initial: false,
              animate: {
                x: checked ? size === "sm" ? 20 : size === "md" ? 28 : 32 : 0,
                scale: 1
              },
              transition: { type: "spring", stiffness: 500, damping: 30 },
              whileHover: { scale: disabled ? 1 : 1.1 },
              whileTap: { scale: disabled ? 1 : 0.9 },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  motion.div,
                  {
                    className: "absolute inset-0 flex items-center justify-center text-[var(--md-sys-color-primary)]",
                    initial: false,
                    animate: { opacity: checked ? 1 : 0, scale: checked ? 1 : 0.5 },
                    children: iconOn || /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", fill: "none", className: "w-3/4 h-3/4 stroke-current stroke-[3] stroke-linecap-round stroke-linejoin-round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  motion.div,
                  {
                    className: "absolute inset-0 flex items-center justify-center text-gray-400",
                    initial: false,
                    animate: { opacity: checked ? 0 : 1, scale: checked ? 0.5 : 1 },
                    children: iconOff || /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", fill: "none", className: "w-3/4 h-3/4 stroke-current stroke-[3] stroke-linecap-round stroke-linejoin-round", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                    ] })
                  }
                )
              ]
            }
          )
        }
      )
    ] })
  ] });
};
const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } })
};
const SettingsRow = ({ icon, iconBg, title, subtitle, action }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 p-4 rounded-2xl transition-colors duration-200 hover:bg-[var(--md-sys-color-surface-variant)] group", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105", iconBg), children: icon }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)] font-google", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 truncate", children: subtitle })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: action })
] });
const SectionHeader = ({ icon, title, iconColor, badge }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-2 pt-2 pb-3", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: iconColor, children: icon }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-google font-bold text-base text-[var(--md-sys-color-on-surface)]", children: title }),
  badge && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]", children: badge })
] });
const SHORTCUTS = [
  { keys: ["Ctrl", "K"], desc: "Command palette / Search" },
  { keys: ["Esc"], desc: "Close modals and panels" },
  { keys: ["Enter"], desc: "Send message in chat" },
  { keys: ["Shift", "Enter"], desc: "New line in message" }
];
function getStorageUsage() {
  let totalUsed = 0;
  const items = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || "";
        const size = new Blob([val]).size;
        totalUsed += size;
        if (key.startsWith("prism")) items.push({ key, size });
      }
    }
  } catch {
  }
  const total = 5 * 1024 * 1024;
  return { used: totalUsed, total, percentage: Math.min(100, Math.round(totalUsed / total * 100)), items };
}
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(2) + " MB";
}
const Settings = ({ onDataReset }) => {
  var _a, _b, _c;
  const { preferences, settings, setPreference, setSetting } = useTheme();
  const { user, logout } = useAuth();
  const [localName, setLocalName] = reactExports.useState((user == null ? void 0 : user.name) || settings.name);
  const [localOrg, setLocalOrg] = reactExports.useState(settings.organization);
  const [localPhone, setLocalPhone] = reactExports.useState("");
  const [localDepartment, setLocalDepartment] = reactExports.useState("");
  const [localBio, setLocalBio] = reactExports.useState("");
  const [localAvatarUrl, setLocalAvatarUrl] = reactExports.useState((user == null ? void 0 : user.avatarUrl) || null);
  const [avatarFile, setAvatarFile] = reactExports.useState(null);
  const [avatarPreview, setAvatarPreview] = reactExports.useState(null);
  const [hasChanges, setHasChanges] = reactExports.useState(false);
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const [showResetConfirm, setShowResetConfirm] = reactExports.useState(false);
  const [showUserManagement, setShowUserManagement] = reactExports.useState(false);
  const { showToast } = useToast();
  const fileInputRef = reactExports.useRef(null);
  const avatarInputRef = reactExports.useRef(null);
  const [uploadLimitMB, setUploadLimitMB] = useLocalStorage("admin_upload_limit_mb", 2);
  const [permissionStatus, setPermissionStatus] = reactExports.useState("default");
  const [testNotificationDelay, setTestNotificationDelay] = reactExports.useState(3);
  const [isSchedulingTest, setIsSchedulingTest] = reactExports.useState(false);
  const [newSubjectInput, setNewSubjectInput] = reactExports.useState("");
  const INSTITUTION_CONFIGS = {
    primary: {
      assessmentSystem: "CBET",
      customSubjects: ["Mathematics", "Kiswahili", "English", "Science & Tech", "Social Studies", "Agriculture", "Creative Arts", "Religious Ed"],
      terminology: { cohortLabel: "Stream", classLabel: "Class", periodLabel: "Term" },
      enabledFields: {
        nemisNumber: true,
        upi: true,
        nitaNumber: false,
        epraLicenseStatus: false,
        kcseGrade: false,
        kcpeMarks: false,
        nationalId: false,
        guardianDetails: true,
        admissionNumber: true
      }
    },
    jss: {
      assessmentSystem: "CBET",
      customSubjects: ["Mathematics", "Kiswahili", "English", "Integrated Science", "Pre-Technical", "Social Studies", "Agriculture", "Creative Arts"],
      terminology: { cohortLabel: "Stream", classLabel: "Class", periodLabel: "Term" },
      enabledFields: {
        nemisNumber: true,
        upi: true,
        nitaNumber: false,
        epraLicenseStatus: false,
        kcseGrade: false,
        kcpeMarks: true,
        nationalId: false,
        guardianDetails: true,
        admissionNumber: true
      }
    },
    highschool: {
      assessmentSystem: "KNEC",
      customSubjects: ["Mathematics", "English", "Kiswahili", "Biology", "Chemistry", "Physics", "History", "Geography", "CRE", "Agriculture", "Business", "Computer"],
      terminology: { cohortLabel: "Stream", classLabel: "Form", periodLabel: "Term" },
      enabledFields: {
        nemisNumber: true,
        upi: true,
        nitaNumber: false,
        epraLicenseStatus: false,
        kcseGrade: true,
        kcpeMarks: true,
        nationalId: false,
        guardianDetails: true,
        admissionNumber: true
      }
    },
    tvet: {
      assessmentSystem: "CBET",
      customSubjects: ["Solar", "ICT", "Electrical", "Plumbing", "Masonry"],
      terminology: { cohortLabel: "Lot", classLabel: "Course", periodLabel: "Module" },
      enabledFields: {
        nemisNumber: false,
        upi: false,
        nitaNumber: true,
        epraLicenseStatus: true,
        kcseGrade: true,
        kcpeMarks: false,
        nationalId: true,
        guardianDetails: true,
        admissionNumber: true
      }
    },
    university: {
      assessmentSystem: "KNEC",
      customSubjects: ["Computer Science", "Business Admin", "Engineering Maths", "Communication Skills"],
      terminology: { cohortLabel: "Cohort", classLabel: "Year", periodLabel: "Semester" },
      enabledFields: {
        nemisNumber: false,
        upi: false,
        nitaNumber: false,
        epraLicenseStatus: false,
        kcseGrade: true,
        kcpeMarks: false,
        nationalId: true,
        guardianDetails: false,
        admissionNumber: true
      }
    },
    custom: {
      assessmentSystem: "CBET",
      customSubjects: ["Solar", "ICT"],
      terminology: { cohortLabel: "Cohort", classLabel: "Class", periodLabel: "Term" },
      enabledFields: {
        nemisNumber: true,
        upi: true,
        nitaNumber: true,
        epraLicenseStatus: true,
        kcseGrade: true,
        kcpeMarks: true,
        nationalId: true,
        guardianDetails: true,
        admissionNumber: true
      }
    }
  };
  const handleConfigureInstitution = (type) => {
    const config = INSTITUTION_CONFIGS[type];
    if (!config) return;
    setPreference("institutionType", type);
    setPreference("assessmentSystem", config.assessmentSystem);
    setPreference("customSubjects", config.customSubjects);
    setPreference("terminology", config.terminology);
    setPreference("enabledFields", config.enabledFields);
    setPreference("defaultSubject", config.customSubjects[0] || "All");
    showToast(`Workspace configured for ${type.toUpperCase()} standards!`, "success");
  };
  const handleAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;
    const currentSubjects = preferences.customSubjects || ["Solar", "ICT"];
    if (currentSubjects.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      showToast("Subject already exists", "warning");
      return;
    }
    const updated = [...currentSubjects, trimmed];
    setPreference("customSubjects", updated);
    setNewSubjectInput("");
    showToast(`Subject "${trimmed}" added!`, "success");
  };
  const handleRemoveSubject = (subToRemove) => {
    const currentSubjects = preferences.customSubjects || ["Solar", "ICT"];
    if (currentSubjects.length <= 1) {
      showToast("Must have at least one subject", "warning");
      return;
    }
    const updated = currentSubjects.filter((s) => s !== subToRemove);
    setPreference("customSubjects", updated);
    if (preferences.defaultSubject === subToRemove) {
      setPreference("defaultSubject", updated[0]);
    }
    showToast(`Subject "${subToRemove}" removed!`, "info");
  };
  const handleUpdateTerminology = (key, value) => {
    const currentTerminology = preferences.terminology || { cohortLabel: "Lot", classLabel: "Course", periodLabel: "Module" };
    setPreference("terminology", {
      ...currentTerminology,
      [key]: value
    });
  };
  const handleToggleField = (fieldKey, isEnabled) => {
    const currentFields = preferences.enabledFields || {
      nemisNumber: false,
      upi: false,
      nitaNumber: true,
      epraLicenseStatus: true,
      kcseGrade: true,
      kcpeMarks: false,
      nationalId: true,
      guardianDetails: true,
      admissionNumber: true
    };
    setPreference("enabledFields", {
      ...currentFields,
      [fieldKey]: isEnabled
    });
  };
  reactExports.useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);
  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
    if (granted) {
      showToast("Notification permission granted!", "success");
    } else {
      showToast("Notification permission denied. Please enable them in browser settings.", "error");
    }
  };
  const handleSendTestNotification = () => {
    setIsSchedulingTest(true);
    const success = notificationService.scheduleTestNotification(
      "PRISM OS Class Alert 🔔",
      `This is a test PWA notification from PRISM OS! Scheduled for ${testNotificationDelay}s.`,
      testNotificationDelay * 1e3
    );
    if (success) {
      showToast(`Test notification scheduled in ${testNotificationDelay}s. Lock your screen or minimize the app now!`, "success");
    } else {
      setTimeout(() => {
        notificationService.showLocalNotification("PRISM OS Class Alert 🔔", {
          body: `This is a foreground test notification since Service Worker is not active yet!`
        });
        setIsSchedulingTest(false);
      }, testNotificationDelay * 1e3);
      showToast(`Fallback test notification scheduled in ${testNotificationDelay}s.`, "info");
    }
    setTimeout(() => {
      setIsSchedulingTest(false);
    }, testNotificationDelay * 1e3 + 500);
  };
  const storageInfo = reactExports.useMemo(() => getStorageUsage(), []);
  reactExports.useEffect(() => {
    if (!(user == null ? void 0 : user.id)) return;
    fetchProfile(user.id).then((profile) => {
      if (profile) {
        setLocalName(profile.name);
        setLocalPhone(profile.phone || "");
        setLocalDepartment(profile.department || "");
        setLocalBio(profile.bio || "");
        setLocalAvatarUrl(profile.avatarUrl);
      }
    });
  }, [user == null ? void 0 : user.id]);
  reactExports.useEffect(() => {
    setLocalOrg(settings.organization);
  }, [settings.organization]);
  const markChanged = () => setHasChanges(true);
  const handleAvatarSelect = (e) => {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Please select a JPEG, PNG, or WebP image.", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2MB.", "error");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    markChanged();
  };
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setLocalAvatarUrl(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    markChanged();
  };
  const handleSaveProfile = async () => {
    if (!(user == null ? void 0 : user.id)) return;
    setIsSaving(true);
    try {
      let newAvatarUrl = localAvatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadProfileAvatar(user.id, avatarFile);
        setLocalAvatarUrl(newAvatarUrl);
        setAvatarFile(null);
        setAvatarPreview(null);
      } else if (localAvatarUrl === null && user.avatarUrl) {
        await removeProfileAvatar(user.id);
      }
      await updateProfile({
        name: localName,
        phone: localPhone || void 0,
        department: localDepartment || void 0,
        bio: localBio || void 0,
        avatarUrl: newAvatarUrl || void 0
      });
      setSetting("name", localName);
      setSetting("organization", localOrg);
      setHasChanges(false);
      showToast("Profile saved successfully!", "success");
    } catch (err) {
      showToast(`Failed to save profile: ${err.message}`, "error");
    }
    setIsSaving(false);
  };
  const handleExportCSV = async () => {
    const csv = await exportDataAsCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `prism_export_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Data exported successfully!", "success");
  };
  const handleExportBackup = async () => {
    const backup = await exportFullBackup();
    const blob = new Blob([backup], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `prism_backup_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Backup created successfully!", "success");
  };
  const handleImportBackup = (e) => {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      var _a3;
      const success = await importFullBackup((_a3 = event.target) == null ? void 0 : _a3.result);
      if (success) {
        showToast("Backup restored! Reloading...", "success");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast("Failed to restore backup", "error");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleReset = () => {
    resetData();
    setHasChanges(false);
    setShowResetConfirm(false);
    onDataReset();
    showToast("All data has been reset to defaults", "info");
    setTimeout(() => window.location.reload(), 1e3);
  };
  const handleThemeChange = (theme) => {
    setPreference("theme", theme);
    showToast(`Theme changed to ${theme}`, "success");
  };
  const handleAccentChange = (color) => {
    setPreference("accentColor", color);
    showToast(`Accent color changed to ${color}`, "success");
  };
  const themeOptions = [
    { id: "light", label: "Light", icon: Sun, desc: "Always light" },
    { id: "dark", label: "Dark", icon: Moon, desc: "Always dark" },
    { id: "system", label: "System", icon: Laptop, desc: "Match device" }
  ];
  const accentColors = [
    { id: "blue", label: "Google Blue", hex: "#4285f4" },
    { id: "orange", label: "Sunset", hex: "#ea8600" },
    { id: "green", label: "Forest", hex: "#34a853" },
    { id: "purple", label: "Galaxy", hex: "#9334e6" }
  ];
  const displayAvatar = avatarPreview || localAvatarUrl;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto pb-24 space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PageHeader, { title: "Settings", subtitle: "Manage your profile, preferences, and app controls", icon: Settings$1 }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "glass-panel rounded-3xl overflow-hidden", custom: 0, initial: "hidden", animate: "visible", variants: cardVariant, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 18 }), title: "Profile", iconColor: "text-orange-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 pb-5 space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
            displayAvatar ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: displayAvatar,
                alt: "Profile",
                className: "w-20 h-20 rounded-2xl object-cover shadow-lg ring-2 ring-[var(--md-sys-color-outline-variant)]"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(UserAvatar, { name: localName || "U", size: 80, rounded: "xl", className: "shadow-lg ring-2 ring-[var(--md-sys-color-outline-variant)]" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  var _a2;
                  return (_a2 = avatarInputRef.current) == null ? void 0 : _a2.click();
                },
                className: "absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { size: 22, className: "text-white drop-shadow" })
              }
            ),
            displayAvatar && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleRemoveAvatar,
                className: "absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-rose-600",
                title: "Remove photo",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 12, strokeWidth: 3 })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: avatarInputRef,
                type: "file",
                accept: "image/jpeg,image/png,image/webp",
                className: "hidden",
                onChange: handleAvatarSelect
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)] text-base truncate font-google", children: localName || "Your Name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-secondary)] mt-0.5", children: user == null ? void 0 : user.email }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mt-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", (user == null ? void 0 : user.role) === "admin" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" : (user == null ? void 0 : user.role) === "instructor" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"), children: user == null ? void 0 : user.role }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1", children: "Display Name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", value: localName, onChange: (e) => {
              setLocalName(e.target.value);
              markChanged();
            }, placeholder: "Your name", className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1", children: "Organization" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", value: localOrg, onChange: (e) => {
              setLocalOrg(e.target.value);
              markChanged();
            }, placeholder: "Organization name", className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 11, className: "inline mr-1 -mt-0.5" }),
              "Phone"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "tel", value: localPhone, onChange: (e) => {
              setLocalPhone(e.target.value);
              markChanged();
            }, placeholder: "+254 700 000000", className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 11, className: "inline mr-1 -mt-0.5" }),
              "Department"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", value: localDepartment, onChange: (e) => {
              setLocalDepartment(e.target.value);
              markChanged();
            }, placeholder: "e.g. Solar Installation", className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 11, className: "inline mr-1 -mt-0.5" }),
            "Bio"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: localBio,
              onChange: (e) => {
                if (e.target.value.length <= 160) {
                  setLocalBio(e.target.value);
                  markChanged();
                }
              },
              placeholder: "A brief description about yourself...",
              rows: 2,
              className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google resize-none"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] text-right mt-0.5 px-1", children: [
            localBio.length,
            "/160"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: hasChanges && /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.button,
          {
            initial: { opacity: 0, height: 0 },
            animate: { opacity: 1, height: "auto" },
            exit: { opacity: 0, height: 0 },
            onClick: handleSaveProfile,
            disabled: isSaving,
            className: "w-full py-3 bg-[var(--accent-primary)] text-white rounded-2xl font-google font-bold text-sm shadow-md hover:shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60",
            children: isSaving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }),
              " Saving..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 16 }),
              " Save Profile"
            ] })
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "glass-panel rounded-3xl overflow-hidden", custom: 1, initial: "hidden", animate: "visible", variants: cardVariant, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 18 }), title: "Account & Security", iconColor: "text-violet-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 p-4 rounded-2xl bg-[var(--md-sys-color-surface-variant)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserAvatar, { name: localName || "U", avatarUrl: displayAvatar, size: 48, rounded: "xl", className: "shadow-md" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)] text-sm truncate font-google", children: localName || "Instructor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", (user == null ? void 0 : user.role) === "admin" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"), children: user == null ? void 0 : user.role }),
            (user == null ? void 0 : user.lastLoginAt) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-[var(--md-sys-color-secondary)]", children: [
              "Last: ",
              new Date(user.lastLoginAt).toLocaleDateString()
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: logout, className: "p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all text-[var(--md-sys-color-on-surface-variant)]", title: "Lock App", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { size: 18 }) })
      ] }) }),
      (user == null ? void 0 : user.role) === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 pb-5 pt-1 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setShowUserManagement(true), className: "w-full flex items-center gap-4 p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 18, className: "text-white" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-violet-900 dark:text-violet-200 font-google", children: "Manage Users" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-violet-600 dark:text-violet-400", children: "Invites, roles, and access control" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 18, className: "text-violet-400 group-hover:translate-x-1 transition-transform" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-[var(--md-sys-color-outline-variant)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold text-violet-900 dark:text-violet-200 uppercase tracking-widest pl-2 mb-3", children: "Global Constraints" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-violet-50/50 dark:bg-violet-900/10 rounded-2xl p-4 border border-violet-100/50 dark:border-violet-800/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest mb-1", children: "Max Document Upload Size" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "range",
                  min: "1",
                  max: "50",
                  step: "1",
                  value: uploadLimitMB,
                  onChange: (e) => setUploadLimitMB(parseInt(e.target.value)),
                  className: "flex-1 accent-violet-600"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-violet-700 dark:text-violet-300 w-12 text-right", children: [
                uploadLimitMB,
                " MB"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] mt-2", children: "Higher limits consume more local storage and may cause quota errors if over 5MB in some browsers." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "glass-panel rounded-3xl overflow-hidden", custom: 2, initial: "hidden", animate: "visible", variants: cardVariant, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Palette, { size: 18 }), title: "Appearance", iconColor: "text-purple-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 pb-5 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-3 px-1", children: "Theme Mode" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: themeOptions.map((t) => {
            const isActive = preferences.theme === t.id;
            const Icon = t.icon;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleThemeChange(t.id),
                className: clsx(
                  "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
                  isActive ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] shadow-sm" : "border-transparent bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)]"
                ),
                children: [
                  isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 12, className: "text-white", strokeWidth: 3 }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 22, className: isActive ? "text-[var(--accent-primary)]" : "text-[var(--md-sys-color-on-surface-variant)]" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("text-xs font-bold block", isActive ? "text-[var(--accent-primary)]" : "text-[var(--md-sys-color-on-surface)]"), children: t.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-[var(--md-sys-color-secondary)]", children: t.desc })
                  ] })
                ]
              },
              t.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-3 px-1", children: "Accent Color" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-4 justify-center", children: accentColors.map((c) => {
            const isActive = preferences.accentColor === c.id;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => handleAccentChange(c.id),
                className: "relative flex flex-col items-center gap-2 group cursor-pointer",
                title: c.label,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: clsx(
                        "w-14 h-14 rounded-2xl transition-all duration-200 shadow-sm flex items-center justify-center",
                        isActive ? "ring-2 ring-offset-2 ring-[var(--md-sys-color-on-surface)] scale-110" : "hover:scale-105"
                      ),
                      style: { backgroundColor: c.hex },
                      children: isActive && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 20, className: "text-white drop-shadow-md", strokeWidth: 3 })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)]", children: c.label })
                ]
              },
              c.id
            );
          }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "glass-panel rounded-3xl overflow-hidden animate-fade-in", custom: 2.5, initial: "hidden", animate: "visible", variants: cardVariant, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 18 }), title: "Institution Configurator", iconColor: "text-emerald-500", badge: "Kenyan Standards" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 pb-5 pt-1 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed", children: "Configure this workspace for your learning institution. Switching your niche adapts terminology, assessment models (CBET vs KNEC), subjects, and student profile fields." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block px-1", children: "Choose Institution Niche" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3", children: [
            { id: "primary", label: "Primary School (CBC)", desc: "PP1 to Grade 6, CBC Competencies, NEMIS & UPI, Class/Stream terminology", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(School, { size: 20, className: "text-blue-500" }) },
            { id: "jss", label: "Junior Secondary (JSS)", desc: "Grade 7 to 9, CBC Competencies, KCPE Marks, Class/Stream terminology", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 20, className: "text-teal-500" }) },
            { id: "highschool", label: "High School", desc: "Form 1 to 4, KNEC Exam Grades, KCPE/KCSE Fields, Form/Stream terminology", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { size: 20, className: "text-purple-500" }) },
            { id: "tvet", label: "TVET College", desc: "KNQF Levels, CBET Competencies, NITA/EPRA/National ID, Course/Lot terminology", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { size: 20, className: "text-orange-500" }) },
            { id: "university", label: "University / Tertiary", desc: "Years 1 to 4, Semester system, GPA Grades, Course/Cohort terminology", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 20, className: "text-indigo-500" }) },
            { id: "custom", label: "Custom / Generic", desc: "Fully customizable trade school, custom subjects, and field toggles", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { size: 20, className: "text-pink-500" }) }
          ].map((niche) => {
            const isSelected = preferences.institutionType === niche.id;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => handleConfigureInstitution(niche.id),
                className: clsx(
                  "flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 relative group cursor-pointer h-full select-none justify-between",
                  isSelected ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.15)] ring-1 ring-[var(--accent-primary)]" : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)] hover:border-[var(--md-sys-color-outline)]"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-xl bg-[var(--md-sys-color-surface-1)] border border-[var(--md-sys-color-outline-variant)] group-hover:scale-110 transition-transform duration-200", children: niche.icon }),
                    isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center animate-scale-in", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 12, strokeWidth: 3 }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: clsx("text-xs font-bold font-google", isSelected ? "text-[var(--md-sys-color-primary)] font-black" : "text-[var(--md-sys-color-on-surface)]"), children: niche.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-relaxed", children: niche.desc })
                  ] })
                ] })
              },
              niche.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { size: 14 }),
              " Terminology Overrides"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed", children: "Customize the names used for cohorts, groups, and academic sessions." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1", children: "Cohort (e.g. Lot, Stream)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: ((_a = preferences.terminology) == null ? void 0 : _a.cohortLabel) || "",
                    onChange: (e) => handleUpdateTerminology("cohortLabel", e.target.value),
                    placeholder: "e.g. Lot",
                    className: "w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1", children: "Class (e.g. Grade, Form)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: ((_b = preferences.terminology) == null ? void 0 : _b.classLabel) || "",
                    onChange: (e) => handleUpdateTerminology("classLabel", e.target.value),
                    placeholder: "e.g. Course",
                    className: "w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1", children: "Period (e.g. Term, Semester)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    value: ((_c = preferences.terminology) == null ? void 0 : _c.periodLabel) || "",
                    onChange: (e) => handleUpdateTerminology("periodLabel", e.target.value),
                    placeholder: "e.g. Module",
                    className: "w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all"
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 14 }),
              " Dynamic Subjects / Units"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed", children: "Manage the courses or subjects available in your school system." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border border-[var(--md-sys-color-outline-variant)] rounded-xl bg-[var(--md-sys-color-surface-variant)]", children: (preferences.customSubjects || ["Solar", "ICT"]).map((sub) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)] hover:scale-105 transition-transform duration-150",
                children: [
                  sub,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleRemoveSubject(sub),
                      className: "text-[var(--md-sys-color-primary)] hover:text-red-500 transition-colors cursor-pointer",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 10, strokeWidth: 3 })
                    }
                  )
                ]
              },
              sub
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: newSubjectInput,
                  onChange: (e) => setNewSubjectInput(e.target.value),
                  placeholder: "Add new subject name...",
                  onKeyDown: (e) => e.key === "Enter" && handleAddSubject(),
                  className: "flex-1 px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: handleAddSubject,
                  className: "px-3 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all shadow-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }),
                    " Add"
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-[var(--md-sys-color-outline-variant)] space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { size: 14 }),
            " Student Profile Field Controls"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed", children: "Configure which input fields are visible on the student registry registration and edit forms." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 px-1", children: [
            { key: "admissionNumber", label: "Admission Number" },
            { key: "nemisNumber", label: "NEMIS ID" },
            { key: "upi", label: "UPI (Unique Personal Identifier)" },
            { key: "nationalId", label: "National ID / Alien ID" },
            { key: "nitaNumber", label: "NITA Registration No" },
            { key: "epraLicenseStatus", label: "EPRA License Status" },
            { key: "kcseGrade", label: "KCSE Mean Grade" },
            { key: "kcpeMarks", label: "KCPE Marks" },
            { key: "guardianDetails", label: "Guardian Details" }
          ].map((field) => {
            const currentFields = preferences.enabledFields || {
              nemisNumber: false,
              upi: false,
              nitaNumber: true,
              epraLicenseStatus: true,
              kcseGrade: true,
              kcpeMarks: false,
              nationalId: true,
              guardianDetails: true,
              admissionNumber: true
            };
            const isChecked = !!currentFields[field.key];
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)] transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-[var(--md-sys-color-on-surface)] font-medium pl-1", children: field.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ToggleSwitch,
                {
                  checked: isChecked,
                  onChange: (v) => handleToggleField(field.key, v)
                }
              )
            ] }, field.key);
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-[var(--md-sys-color-outline-variant)] space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 14 }),
            " Regional Localization"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-2 px-1", children: "Training Center / Branch" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: ["Kibera", "Mathare", "Mukuru", "Kawangware", "Mombasa", "Kisumu", "Other"].map((center) => {
                const isSelected = preferences.mtaaniCenter === center || center === "Other" && !["Kibera", "Mathare", "Mukuru", "Kawangware", "Mombasa", "Kisumu"].includes(preferences.mtaaniCenter || "");
                return /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      if (center !== "Other") {
                        setPreference("mtaaniCenter", center);
                      } else {
                        setPreference("mtaaniCenter", "");
                      }
                    },
                    className: clsx(
                      "py-2 px-3 rounded-xl border text-xs font-bold font-google transition-all tap-target-premium cursor-pointer",
                      isSelected ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-black animate-scale-in" : "border-transparent bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)]"
                    ),
                    children: center
                  },
                  center
                );
              }) }),
              !["Kibera", "Mathare", "Mukuru", "Kawangware", "Mombasa", "Kisumu"].includes(preferences.mtaaniCenter || "") && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { opacity: 0, y: -5 }, animate: { opacity: 1, y: 0 }, className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: preferences.mtaaniCenter || "",
                  onChange: (e) => setPreference("mtaaniCenter", e.target.value),
                  placeholder: "Enter custom center name (e.g. Kangemi, Nakuru)",
                  className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google animate-fade-in"
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-2 px-1", children: "Default Subject Focus" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setPreference("defaultSubject", "All"),
                    className: clsx(
                      "py-2 px-3 rounded-xl border text-xs font-bold font-google transition-all tap-target-premium cursor-pointer",
                      preferences.defaultSubject === "All" || !preferences.defaultSubject ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-black" : "border-transparent bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)]"
                    ),
                    children: "All Subjects"
                  }
                ),
                (preferences.customSubjects || ["Solar", "ICT"]).map((sub) => {
                  const isSelected = preferences.defaultSubject === sub;
                  return /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setPreference("defaultSubject", sub),
                      className: clsx(
                        "py-2 px-3 rounded-xl border text-xs font-bold font-google transition-all tap-target-premium cursor-pointer",
                        isSelected ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-black" : "border-transparent bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)]"
                      ),
                      children: sub
                    },
                    sub
                  );
                })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2 border-t border-[var(--md-sys-color-outline-variant)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SettingsRow,
              {
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 18, className: "text-white" }),
                iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
                title: "Swahili Localization & Greetings",
                subtitle: "Use localized greetings and Swahili phrases in banners",
                action: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ToggleSwitch,
                  {
                    checked: preferences.enableSwahiliGreeting ?? true,
                    onChange: (v) => setPreference("enableSwahiliGreeting", v)
                  }
                )
              }
            ) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "glass-panel rounded-3xl overflow-hidden", custom: 3, initial: "hidden", animate: "visible", variants: cardVariant, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 18 }), title: "Features & Controls", iconColor: "text-indigo-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 pb-3 divide-y divide-[var(--md-sys-color-outline-variant)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 18, className: "text-white" }), iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600", title: "Smart AI Insights", subtitle: "Predictive analytics and intelligent data trends", action: /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleSwitch, { checked: preferences.enableAI, onChange: (v) => setPreference("enableAI", v) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 18, className: "text-white" }), iconBg: "bg-gradient-to-br from-amber-400 to-orange-500", title: "Notifications", subtitle: "Toast notifications for actions and events", action: /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleSwitch, { checked: preferences.notificationsEnabled, onChange: (v) => setPreference("notificationsEnabled", v) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 18, className: "text-white" }), iconBg: "bg-gradient-to-br from-teal-400 to-emerald-600", title: "Reduced Motion", subtitle: "Minimize animations for accessibility", action: /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleSwitch, { checked: preferences.reducedMotion, onChange: (v) => setPreference("reducedMotion", v) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "glass-panel rounded-3xl overflow-hidden", custom: 3.5, initial: "hidden", animate: "visible", variants: cardVariant, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BellRing, { size: 18 }), title: "PWA & Mobile Push Notifications", iconColor: "text-pink-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 pb-5 pt-1 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed", children: "Enable native phone notifications from the PRISM Web App. This allows you to receive instant local schedule reminders, M-Pesa STK payment statuses, and chat alerts even when the app is minimized or the screen is locked." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-[var(--md-sys-color-surface-variant)] gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-secondary)]", children: "Permission Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
                "h-2 w-2 rounded-full",
                permissionStatus === "granted" ? "bg-emerald-500 animate-pulse" : permissionStatus === "denied" ? "bg-rose-500" : "bg-amber-500"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-google font-bold capitalize text-[var(--md-sys-color-on-surface)]", children: permissionStatus === "default" ? "Not Requested (Default)" : permissionStatus })
            ] })
          ] }),
          permissionStatus !== "granted" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleEnableNotifications,
              className: "w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-xl text-xs font-google font-bold shadow-md hover:brightness-110 active:scale-95 transition-all",
              children: "Enable Notifications"
            }
          )
        ] }),
        permissionStatus === "granted" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 14, className: "text-indigo-500 animate-pulse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-google font-bold text-indigo-600 dark:text-indigo-400", children: "Background Delayed Test Alert" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-[var(--md-sys-color-secondary)] leading-relaxed", children: "Schedule a mock notification, lock your screen or put the app in the background, and verify that the notification arrives natively on your device." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-3 py-1.5 input-glow transition-shadow", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-[var(--md-sys-color-secondary)]", children: "Delay:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  min: "1",
                  max: "60",
                  value: testNotificationDelay,
                  onChange: (e) => setTestNotificationDelay(Math.max(1, parseInt(e.target.value) || 1)),
                  className: "w-12 bg-transparent text-center text-xs font-bold text-[var(--md-sys-color-on-surface)] focus:outline-none"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-[var(--md-sys-color-secondary)]", children: "sec" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: handleSendTestNotification,
                disabled: isSchedulingTest,
                className: "flex-1 min-w-[140px] py-2 px-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-xs font-google font-bold shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5",
                children: isSchedulingTest ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Scheduling..." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 13 }),
                  " Test Notification"
                ] })
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "glass-panel rounded-3xl overflow-hidden", custom: 4, initial: "hidden", animate: "visible", variants: cardVariant, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { size: 18 }), title: "Data Management", iconColor: "text-blue-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-2xl bg-[var(--md-sys-color-surface-variant)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(HardDrive, { size: 14, className: "text-[var(--md-sys-color-secondary)]" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-[var(--md-sys-color-on-surface)] font-google", children: "Local Storage" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold", style: { color: storageInfo.percentage > 80 ? "var(--md-sys-color-error)" : "var(--md-sys-color-primary)" }, children: [
            formatBytes(storageInfo.used),
            " / ",
            formatBytes(storageInfo.total)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-2 rounded-full bg-[var(--md-sys-color-surface-3)] overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.div,
          {
            initial: { width: 0 },
            animate: { width: `${storageInfo.percentage}%` },
            transition: { duration: 0.8, delay: 0.3 },
            className: "h-full rounded-full",
            style: { background: storageInfo.percentage > 80 ? "var(--md-sys-color-error)" : storageInfo.percentage > 50 ? "var(--google-yellow)" : "var(--md-sys-color-primary)" }
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] mt-1.5", children: [
          storageInfo.percentage,
          "% used • ",
          storageInfo.items.length,
          " PRISM data keys"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 pb-3 divide-y divide-[var(--md-sys-color-outline-variant)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { size: 18, className: "text-white" }), iconBg: "bg-gradient-to-br from-blue-400 to-blue-600", title: "Export CSV", subtitle: "Download student data as spreadsheet", action: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleExportCSV, className: "px-4 py-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-bold hover:bg-[var(--md-sys-color-surface-1)] transition-colors border border-[var(--md-sys-color-outline)]", children: "Export" }) }),
        (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 18, className: "text-white" }), iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600", title: "Full Backup", subtitle: "Export all data + settings as JSON", action: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleExportBackup, className: "px-4 py-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-bold hover:bg-[var(--md-sys-color-surface-1)] transition-colors border border-[var(--md-sys-color-outline)]", children: "Backup" }) }),
        (user == null ? void 0 : user.role) === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { size: 18, className: "text-white" }), iconBg: "bg-gradient-to-br from-indigo-400 to-indigo-600", title: "Restore Backup", subtitle: "Import a previously saved backup file", action: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "px-4 py-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-bold hover:bg-[var(--md-sys-color-surface-1)] transition-colors border border-[var(--md-sys-color-outline)] cursor-pointer", children: [
          "Restore",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", accept: ".json", className: "hidden", onChange: handleImportBackup })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "glass-panel rounded-3xl overflow-hidden", custom: 5, initial: "hidden", animate: "visible", variants: cardVariant, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Keyboard, { size: 18 }), title: "Keyboard Shortcuts", iconColor: "text-teal-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 pb-5 space-y-2", children: SHORTCUTS.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-[var(--md-sys-color-on-surface)] font-medium", children: s.desc }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1", children: s.keys.map((k, j) => /* @__PURE__ */ jsxRuntimeExports.jsxs(React.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "px-2 py-1 rounded-lg bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] text-[11px] font-bold text-[var(--md-sys-color-on-surface)] font-google shadow-sm min-w-[28px] text-center", children: k }),
          j < s.keys.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-[var(--md-sys-color-secondary)]", children: "+" })
        ] }, j)) })
      ] }, i)) })
    ] }),
    (user == null ? void 0 : user.role) === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "glass-panel rounded-3xl overflow-hidden", custom: 6, initial: "hidden", animate: "visible", variants: cardVariant, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 18 }), title: "Administration", iconColor: "text-violet-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 18, className: "text-white" }), iconBg: "bg-gradient-to-br from-violet-400 to-violet-600", title: "Security & Users", subtitle: "Manage roles, block users, and control access permissions", action: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setShowUserManagement(true), className: "px-4 py-2 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-600 transition-colors shadow-sm flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 13 }),
        " Manage"
      ] }) }) })
    ] }),
    (user == null ? void 0 : user.role) === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "rounded-3xl overflow-hidden border-2 border-rose-200 dark:border-rose-800/50", custom: 7, initial: "hidden", animate: "visible", variants: cardVariant, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionHeader, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 18 }), title: "Danger Zone", iconColor: "text-rose-500" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 18, className: "text-white" }), iconBg: "bg-gradient-to-br from-rose-400 to-rose-600", title: "Reset All Data", subtitle: "Permanently delete everything and return to factory defaults", action: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowResetConfirm(true), className: "px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors shadow-sm", children: "Reset" }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { className: "glass-panel rounded-3xl overflow-hidden", custom: 7, initial: "hidden", animate: "visible", variants: cardVariant, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-indigo-600 flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-black text-2xl", children: "P" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-google font-bold text-lg text-[var(--md-sys-color-on-surface)]", children: "PRISM Instructor OS" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)]", children: "v2.1.0 • NITA‑compliant CBT Management" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid grid-cols-3 gap-3", children: [
        { label: "Theme", value: preferences.theme, icon: Palette },
        { label: "Accent", value: preferences.accentColor, icon: Zap },
        { label: "AI", value: preferences.enableAI ? "On" : "Off", icon: Sparkles }
      ].map((stat, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-2xl bg-[var(--md-sys-color-surface-variant)] text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(stat.icon, { size: 14, className: "mx-auto mb-1 text-[var(--md-sys-color-secondary)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-[var(--md-sys-color-secondary)]", children: stat.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface)] font-google capitalize", children: stat.value })
      ] }, i)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] mt-4 px-1", children: "© 2025 PRISM. Built with ❤️ for instructors. All rights reserved." })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showResetConfirm && /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "fixed inset-0 z-50 flex items-center justify-center p-4", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm", onClick: () => setShowResetConfirm(false) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { className: "relative bg-[var(--md-sys-color-surface)] rounded-3xl shadow-2xl w-full max-w-sm p-6", initial: { scale: 0.9, y: 20 }, animate: { scale: 1, y: 0 }, exit: { scale: 0.9, y: 20 }, transition: { type: "spring", stiffness: 400, damping: 25 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-rose-600 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-google font-bold text-lg", children: "Reset All Data?" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[var(--md-sys-color-on-surface-variant)] text-sm mb-6 leading-relaxed", children: "This will permanently delete all students, attendance records, and competency data. This action cannot be undone." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowResetConfirm(false), className: "flex-1 py-3 rounded-2xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] font-bold text-sm hover:brightness-95 transition-all", children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleReset, className: "flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-md", children: "Reset All" })
        ] })
      ] })
    ] }) }),
    showUserManagement && /* @__PURE__ */ jsxRuntimeExports.jsx(UserManagement, { onClose: () => setShowUserManagement(false) })
  ] });
};
export {
  Settings as default
};
