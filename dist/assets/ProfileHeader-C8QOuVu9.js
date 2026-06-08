import { a as reactExports, j as jsxRuntimeExports, A as AnimatePresence, m as motion, X, bL as Send, R as React, u as useTheme, c as clsx, B as BookOpen, a3 as Award, C as Calendar, a7 as TrendingUp } from "./index-DIO7q2un.js";
import { b as getLevelShortLabel } from "./educationLevels-CWONNkiO.js";
import { notificationService } from "./notificationService-CdQIZLa7.js";
import { B as Bell } from "./bell-Bdr9qTTq.js";
import { b as getSubjectPill, g as getSubjectEmoji } from "./subjectUtils-CWZOIqn8.js";
import { P as PenLine } from "./pen-line-D1__iSQq.js";
import { T as Trash2 } from "./trash-2-k1bm3wyY.js";
import { T as TrendingDown } from "./trending-down-BUR4UCux.js";
const QuickAlertModal = ({ isOpen, onClose, student }) => {
  const [template, setTemplate] = reactExports.useState("attendance");
  const [customMessage, setCustomMessage] = reactExports.useState("");
  const [isSending, setIsSending] = reactExports.useState(false);
  const [statusIndicator, setStatusIndicator] = reactExports.useState("idle");
  const templates = {
    attendance: `Alert: ${student.name}'s attendance has dropped below 75%. Please ensure they attend the next class.`,
    fees: `Reminder: Outstanding fee balance for ${student.name}. Please settle to avoid disruption.`,
    performance: `Notice: ${student.name} may require extra tutoring in recent topics. Please review their profile.`,
    custom: customMessage
  };
  const handleSend = async () => {
    setIsSending(true);
    setStatusIndicator("idle");
    const bodyText = template === "custom" ? customMessage : templates[template];
    try {
      const success = await notificationService.sendRemoteNotification({
        userId: student.id.toString(),
        title: "Instructor Alert",
        body: bodyText,
        type: "push"
        // Could be 'sms' if Africa's Talking was fully configured
      });
      if (success) {
        setStatusIndicator("success");
        setTimeout(() => {
          onClose();
          setStatusIndicator("idle");
          setTemplate("attendance");
          setCustomMessage("");
        }, 1500);
      } else {
        setStatusIndicator("error");
      }
    } catch (error) {
      setStatusIndicator("error");
    } finally {
      setIsSending(false);
    }
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
      className: "glass-panel w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-white/10",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-5 border-b border-[var(--md-sys-color-outline)]/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-[var(--md-sys-color-primary)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 24 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold font-google text-[var(--md-sys-color-on-surface)]", children: "Quick Alert" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, title: "Close", "aria-label": "Close", className: "p-2 rounded-full hover:bg-[var(--md-sys-color-surface-variant)]/40 text-[var(--md-sys-color-on-surface-variant)] transition-all active:scale-90", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20 }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 overflow-y-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-[var(--md-sys-color-secondary)] mb-6", children: [
            "Send an immediate notification regarding ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: student.name }),
            ". This triggers the Supabase Edge Function."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-2", children: "Message Template" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]/30 px-3 py-1.5 backdrop-blur-sm relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  className: "w-full bg-transparent border-none text-[var(--md-sys-color-on-surface)] focus:outline-none py-1.5 text-sm",
                  title: "Message Template",
                  "aria-label": "Message Template",
                  value: template,
                  onChange: (e) => setTemplate(e.target.value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "attendance", className: "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]", children: "Attendance Warning" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fees", className: "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]", children: "Fee Reminder" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "performance", className: "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]", children: "Performance Notice" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "custom", className: "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]", children: "Custom Message..." })
                  ]
                }
              ) })
            ] }),
            template === "custom" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-2", children: "Custom Message" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]/30 px-4 py-3 backdrop-blur-sm relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  className: "w-full bg-transparent border-none text-[var(--md-sys-color-on-surface)] focus:outline-none min-h-[100px] resize-none text-sm",
                  placeholder: "Type your alert message here...",
                  value: customMessage,
                  onChange: (e) => setCustomMessage(e.target.value)
                }
              ) })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 glass-card border border-[var(--md-sys-color-primary)]/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider mb-1", children: "Preview" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed italic", children: [
                '"',
                templates[template],
                '"'
              ] })
            ] })
          ] }),
          statusIndicator === "success" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 p-3 bg-green-50/50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-500/20 rounded-lg text-sm font-medium text-center", children: "Alert sent successfully!" }),
          statusIndicator === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 p-3 bg-red-50/50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-500/20 rounded-lg text-sm font-medium text-center", children: "Failed to send alert. Check Edge Function logs." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 border-t border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface-variant)]/20 flex justify-end gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onClose,
              className: "px-5 py-2.5 rounded-xl font-bold text-sm text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)]/40 active:scale-95 transition-all",
              disabled: isSending,
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleSend,
              disabled: isSending || template === "custom" && !customMessage.trim(),
              className: "px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50",
              children: isSending ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 18 }),
                " Send Alert"
              ] })
            }
          )
        ] })
      ]
    }
  ) }) });
};
const ProfileHeader = ({
  student,
  studentAverage,
  performanceVsClass,
  onDeleteRequest,
  onEditRequest
}) => {
  var _a;
  const [showAlertModal, setShowAlertModal] = React.useState(false);
  const { preferences } = useTheme();
  const cohortLabel = ((_a = preferences.terminology) == null ? void 0 : _a.cohortLabel) || "Lot";
  const pill = getSubjectPill(student.subject);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full overflow-hidden glass-panel rounded-t-none rounded-b-3xl shadow-lg border-t-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-32 md:h-48 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 opacity-20", style: { backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)", backgroundSize: "24px 24px" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          animate: { backgroundPosition: ["0% 0%", "100% 100%"] },
          transition: { duration: 20, repeat: Infinity, repeatType: "reverse" },
          className: "absolute inset-0 bg-gradient-to-br from-white/10 to-transparent mix-blend-overlay"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 pb-6 relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            className: "w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-[var(--md-sys-color-surface)] shadow-[0_0_30px_rgba(99,102,241,0.25)] overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex-shrink-0 z-10 flex items-center justify-center relative group",
            initial: { y: 20, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { type: "spring", stiffness: 300, damping: 25 },
            children: [
              student.photo ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: student.photo, alt: student.name, className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-5xl md:text-6xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-sm", children: student.name.charAt(0) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2 md:pt-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { x: -20, opacity: 0 },
              animate: { x: 0, opacity: 1 },
              transition: { delay: 0.1 },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl md:text-4xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight leading-none mb-2 font-google", children: student.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5",
                    pill.bg,
                    pill.text,
                    pill.border,
                    pill.darkBg,
                    pill.darkText,
                    pill.darkBorder
                  ), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: getSubjectEmoji(student.subject) }),
                    student.subject
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                    student.studentGroup === "Campus" ? "bg-indigo-100/50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50" : student.studentGroup === "Academy" ? "bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50" : student.studentGroup === "CBC" ? "bg-cyan-100/50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50" : "bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50"
                  ), children: student.studentGroup }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] px-2 border-l-2 border-[var(--md-sys-color-outline)]", children: getLevelShortLabel(student.studentGroup, String(student.grade)) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 bg-[var(--md-sys-color-surface-variant)] px-2 py-1 rounded-md border border-[var(--md-sys-color-outline)]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[var(--md-sys-color-secondary)]", children: "ID" }),
                    " #",
                    student.id.toString().padStart(4, "0")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 14, className: "text-[var(--md-sys-color-secondary)]" }),
                    " ",
                    cohortLabel,
                    " ",
                    student.lot
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              className: "flex gap-2 w-full md:w-auto mt-4 md:mt-0",
              initial: { y: 20, opacity: 0 },
              animate: { y: 0, opacity: 1 },
              transition: { delay: 0.2 },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => setShowAlertModal(true),
                    className: "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50/70 dark:bg-indigo-500/10 hover:bg-indigo-500 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-indigo-200 rounded-xl font-bold text-sm transition-all duration-300 border border-indigo-100/50 dark:border-indigo-500/20 active:scale-95",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 16 }),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "md:hidden lg:inline", children: "Alert Flow" })
                    ]
                  }
                ),
                onEditRequest && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: onEditRequest,
                    className: "flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50/70 dark:bg-emerald-500/10 hover:bg-emerald-500 dark:hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:text-white dark:hover:text-indigo-200 rounded-xl font-bold text-sm transition-all duration-300 border border-emerald-100/50 dark:border-emerald-500/20 md:w-auto active:scale-95",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 16 }),
                      " ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "md:hidden lg:inline", children: "Edit" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: onDeleteRequest,
                    className: "flex items-center justify-center px-4 py-2.5 bg-rose-50/70 dark:bg-rose-500/10 hover:bg-rose-500 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 hover:text-white dark:hover:text-indigo-200 rounded-xl font-bold text-sm transition-all duration-300 border border-rose-100/50 dark:border-rose-500/20 md:w-12 lg:w-auto active:scale-95",
                    title: "Remove Profile",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 16 })
                  }
                )
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          className: "grid grid-cols-3 gap-4 mt-8",
          initial: { y: 20, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: { delay: 0.3 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-4 rounded-2xl border border-[var(--md-sys-color-outline)]/60 relative overflow-hidden group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[var(--md-sys-color-secondary)] mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { size: 14 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest", children: "Avg Score" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "block text-2xl md:text-3xl font-black text-[var(--md-sys-color-on-surface)]", children: [
                studentAverage.toFixed(1),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base text-[var(--md-sys-color-secondary)] font-medium", children: "/ 4" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-4 rounded-2xl border border-[var(--md-sys-color-outline)]/60 relative overflow-hidden group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                "absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500",
                student.attendancePct >= 85 ? "bg-emerald-500/10" : student.attendancePct >= 70 ? "bg-amber-500/10" : "bg-rose-500/10"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[var(--md-sys-color-secondary)] mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 14 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest", children: "Attendance" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx(
                "block text-2xl md:text-3xl font-black",
                student.attendancePct >= 85 ? "text-emerald-600 dark:text-emerald-400" : student.attendancePct >= 70 ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-400"
              ), children: [
                student.attendancePct,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-4 rounded-2xl border border-[var(--md-sys-color-outline)]/60 relative overflow-hidden group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                "absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500",
                performanceVsClass >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[var(--md-sys-color-secondary)] mb-1", children: [
                performanceVsClass >= 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 14, className: "text-emerald-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { size: 14, className: "text-rose-500" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest", children: "Vs Class" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx(
                "block text-2xl md:text-3xl font-black",
                performanceVsClass >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              ), children: [
                performanceVsClass > 0 && "+",
                performanceVsClass.toFixed(1)
              ] })
            ] })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      QuickAlertModal,
      {
        isOpen: showAlertModal,
        onClose: () => setShowAlertModal(false),
        student
      }
    )
  ] });
};
export {
  ProfileHeader
};
