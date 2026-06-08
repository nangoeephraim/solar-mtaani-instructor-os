import { j as jsxRuntimeExports, m as motion, c as clsx } from "./index-DIO7q2un.js";
const PageHeader = ({ title, subtitle, icon: Icon, action, color = "text-[var(--md-sys-color-primary)]" }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: -10 },
      animate: { opacity: 1, y: 0 },
      className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          Icon && /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              whileHover: { scale: 1.05 },
              whileTap: { scale: 0.95 },
              className: clsx(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]",
                color
              ),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 24 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tracking-tight", children: title }),
            subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[var(--md-sys-color-secondary)] font-medium mt-1", children: subtitle })
          ] })
        ] }),
        action && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3", children: action })
      ]
    }
  );
};
export {
  PageHeader as P
};
