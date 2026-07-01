import { a as reactExports, j as jsxRuntimeExports, m as motion, p as CreditCard, af as LoaderCircle, h as CircleCheck, ad as supabase } from "./index-CTZ1eQC9.js";
import { S as Smartphone } from "./smartphone-BYkdpwqA.js";
import { H as History } from "./history-Db95Zjgj.js";
const BillingTab = ({ student }) => {
  const [isSimulating, setIsSimulating] = reactExports.useState(false);
  const [promptStatus, setPromptStatus] = reactExports.useState("idle");
  const [amount, setAmount] = reactExports.useState("500");
  const [phone] = reactExports.useState("0768453314");
  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    setPromptStatus("idle");
    try {
      const { data, error } = await supabase.functions.invoke("mpesa-webhook", {
        body: {
          Body: {
            stkCallback: {
              MerchantRequestID: "12345-Simulated",
              CheckoutRequestID: `ws_CO_${Date.now()}`,
              ResultCode: 0,
              ResultDesc: "The service request is processed successfully.",
              CallbackMetadata: {
                Item: [
                  { Name: "Amount", Value: Number(amount) },
                  { Name: "MpesaReceiptNumber", Value: "TEST" + Math.floor(Math.random() * 1e5) },
                  { Name: "PhoneNumber", Value: Number(phone) }
                ]
              }
            }
          }
        }
      });
      if (error) {
        console.error("Webhook simulation failed:", error);
        setPromptStatus("error");
      } else {
        setPromptStatus("success");
        setTimeout(() => setPromptStatus("idle"), 4e3);
      }
    } catch (err) {
      console.error("Error triggering simulation", err);
      setPromptStatus("error");
    } finally {
      setIsSimulating(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      className: "h-full flex flex-col gap-6",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 pb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6 relative overflow-hidden hover:scale-[1.01] transition-transform duration-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 p-6 opacity-10 text-[var(--md-sys-color-primary)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 100 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest mb-2", children: "Outstanding Balance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-baseline gap-2 mb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-4xl font-black font-google tracking-tight text-[var(--md-sys-color-on-surface)]", children: [
              "KES ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "2,400" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-secondary)]", children: "Current Term: Q3 2026" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6 relative overflow-hidden border border-emerald-500/20 dark:border-emerald-900/40 shadow-sm shadow-emerald-500/5 hover:scale-[1.01] transition-transform duration-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { size: 20 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-[var(--md-sys-color-on-surface)]", children: "Simulate M-Pesa Payment" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-secondary)]", children: "Send push to test recipient" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-bold text-[var(--md-sys-color-secondary)] mb-1 uppercase tracking-wider", children: "Test Phone" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]/30 px-4 py-2 backdrop-blur-sm relative opacity-70", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      value: phone,
                      disabled: true,
                      className: "w-full bg-transparent border-none text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none"
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-[0.5]", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-xs font-bold text-[var(--md-sys-color-secondary)] mb-1 uppercase tracking-wider", children: "Amount" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "input-glow rounded-xl border border-emerald-500/30 transition-all bg-[var(--md-sys-color-surface-variant)]/20 px-4 py-2 backdrop-blur-sm relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "number",
                      value: amount,
                      onChange: (e) => setAmount(e.target.value),
                      className: "w-full bg-transparent border-none text-sm font-bold text-[var(--md-sys-color-on-surface)] focus:outline-none"
                    }
                  ) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: handleSimulatePayment,
                  disabled: isSimulating,
                  className: "w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2",
                  children: isSimulating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 18, className: "animate-spin" }),
                    " Pinging Webhook..."
                  ] }) : "Send Test Payment Prompt"
                }
              ),
              promptStatus === "success" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20 backdrop-blur-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 16 }),
                "STK Push simulated successfully to Edge Function!"
              ] }),
              promptStatus === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-red-500 text-xs font-bold bg-red-50/50 dark:bg-red-950/20 p-3 rounded-lg border border-red-500/20 backdrop-blur-sm", children: "Webhook call failed. Edge Function returned an error (likely invalid JWT in simulation). See console." })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 glass-card p-6 flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "text-[var(--md-sys-color-secondary)]", size: 20 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-[var(--md-sys-color-on-surface)]", children: "Recent Transactions" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col items-center justify-center py-10 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 glass-panel rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 24, className: "text-[var(--md-sys-color-secondary)] opacity-50" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)] mb-1", children: "No payment history yet" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-[var(--md-sys-color-secondary)] max-w-sm", children: [
              "When M-Pesa integration goes live, DARaja callbacks received by the ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "mpesa-webhook" }),
              " edge function will appear here."
            ] })
          ] })
        ] })
      ]
    }
  );
};
export {
  BillingTab
};
