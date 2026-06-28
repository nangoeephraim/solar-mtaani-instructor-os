import { o as createLucideIcon, a as reactExports, j as jsxRuntimeExports, m as motion, X, h as CircleCheck, c as clsx, b as useAuth, P as PageTransition, bV as Wallet, F as FileText, Q as Clock, U as Users, q as Search, bC as MessageSquare, A as AnimatePresence, O as CircleCheckBig } from "./index-D-ESeA_n.js";
import { E } from "./jspdf.es.min-DgEbczAs.js";
import { D as Download } from "./download-BAAPrgct.js";
import { P as Plus } from "./plus-d9Yse0vX.js";
import { S as Smartphone } from "./smartphone-e5GBcAzE.js";
import { C as CreditCard } from "./credit-card-BmPSg2St.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Banknote = createLucideIcon("Banknote", [
  ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2", key: "9lu3g6" }],
  ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }],
  ["path", { d: "M6 12h.01M18 12h.01", key: "113zkx" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const DollarSign = createLucideIcon("DollarSign", [
  ["line", { x1: "12", x2: "12", y1: "2", y2: "22", key: "7eqyqh" }],
  ["path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", key: "1b0p4s" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Receipt = createLucideIcon("Receipt", [
  [
    "path",
    { d: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z", key: "q3az6g" }
  ],
  ["path", { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8", key: "1h4pet" }],
  ["path", { d: "M12 17.5v-11", key: "1jc1ny" }]
]);
const ReceiptModal = ({ payment, student, balance, onClose }) => {
  const receiptRef = reactExports.useRef(null);
  const [isGenerating, setIsGenerating] = reactExports.useState(false);
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new E({
        orientation: "portrait",
        unit: "mm",
        format: "a5"
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const centerText = (text, y, font = "helvetica", style = "normal", size = 10, color = [0, 0, 0]) => {
        pdf.setFont(font, style);
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        pdf.text(text, pageWidth / 2, y, { align: "center" });
      };
      try {
        const img = new Image();
        img.src = "/logo.png";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const logoWidth = 24;
        const logoHeight = 24;
        pdf.addImage(img, "PNG", (pageWidth - logoWidth) / 2, 10, logoWidth, logoHeight);
      } catch (imgErr) {
        console.warn("Could not load logo for PDF", imgErr);
      }
      centerText("PAYMENT RECEIPT", 45, "helvetica", "bold", 18, [33, 37, 41]);
      centerText("PRISM Instructor OS", 52, "helvetica", "normal", 10, [108, 117, 125]);
      pdf.setDrawColor(222, 226, 230);
      pdf.setLineWidth(0.5);
      pdf.line(15, 60, pageWidth - 15, 60);
      const startY = 70;
      const lineH = 9;
      const addRow = (label, value, yPos, isValueBold = false) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(108, 117, 125);
        pdf.text(label.toUpperCase(), 15, yPos);
        pdf.setFont("helvetica", isValueBold ? "bold" : "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(33, 37, 41);
        pdf.text(value, pageWidth - 15, yPos, { align: "right" });
      };
      const receiptNo = payment.mpesaReceiptNumber || `REC-${payment.id.substring(0, 8).toUpperCase()}`;
      addRow("Receipt No.", receiptNo, startY, true);
      const formattedDate2 = new Date(payment.transactionDate).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      addRow("Date", formattedDate2, startY + lineH);
      addRow("Student", payment.studentName, startY + lineH * 2, true);
      if (student == null ? void 0 : student.grade) {
        addRow("Grade", student.grade, startY + lineH * 3);
      }
      const blockY = 110;
      pdf.setFillColor(248, 249, 250);
      pdf.setDrawColor(233, 236, 239);
      pdf.roundedRect(15, blockY, pageWidth - 30, 40, 4, 4, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(48);
      pdf.setTextColor(241, 243, 245);
      pdf.text("PAID", pageWidth / 2, blockY + 28, { align: "center" });
      centerText("AMOUNT PAID", blockY + 14, "helvetica", "bold", 9, [108, 117, 125]);
      centerText(`KES ${payment.amount.toLocaleString()}`, blockY + 26, "helvetica", "bold", 24, [33, 37, 41]);
      pdf.setDrawColor(222, 226, 230);
      pdf.line(20, blockY + 31, pageWidth - 20, blockY + 31);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(108, 117, 125);
      pdf.text("METHOD", 20, blockY + 36);
      pdf.setTextColor(33, 37, 41);
      pdf.text(payment.method.toUpperCase(), pageWidth - 20, blockY + 36, { align: "right" });
      const detailsY = 165;
      addRow("Term Applied", `Term ${payment.term || "N/A"}`, detailsY);
      addRow("Recorded By", payment.recordedBy, detailsY + lineH);
      pdf.setDrawColor(222, 226, 230);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.line(15, detailsY + lineH * 1.5, pageWidth - 15, detailsY + lineH * 1.5);
      pdf.setLineDashPattern([], 0);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(73, 80, 87);
      pdf.text("Outstanding Balance", 15, detailsY + lineH * 2.5);
      if (balance > 0) {
        pdf.setTextColor(239, 68, 68);
      } else {
        pdf.setTextColor(16, 185, 129);
      }
      pdf.text(`KES ${balance.toLocaleString()}`, pageWidth - 15, detailsY + lineH * 2.5, { align: "right" });
      centerText("THANK YOU", 195, "courier", "normal", 8, [173, 181, 189]);
      pdf.save(`Receipt_${receiptNo}_${payment.studentName.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error generating receipt PDF:", error);
      alert("Failed to generate PDF receipt.");
    } finally {
      setIsGenerating(false);
    }
  };
  const formattedDate = new Date(payment.transactionDate).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 20 },
      transition: { type: "spring", damping: 25, stiffness: 300 },
      className: "relative w-full max-w-sm",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onClose,
            className: "absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 24 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            ref: receiptRef,
            className: "bg-white rounded-t-2xl rounded-b-md shadow-2xl overflow-hidden relative",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-full bg-[#f8fafc] border-b border-dashed border-gray-300" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 pb-10", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 32, className: "text-emerald-500" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-google font-black text-2xl text-gray-900 tracking-tight", children: "PAYMENT RECEIPT" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-sm font-medium mt-1", children: "PRISM Instructor OS" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-px bg-gray-200 mb-6 relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -left-2 -top-1.5 w-3 h-3 bg-[#f8fafc] rounded-full" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-2 -top-1.5 w-3 h-3 bg-[#f8fafc] rounded-full" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mb-8", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs font-bold tracking-wider uppercase", children: "Receipt No." }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-900 font-mono font-bold text-sm", children: payment.mpesaReceiptNumber || `REC-${payment.id.substring(0, 8).toUpperCase()}` })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs font-bold tracking-wider uppercase", children: "Date" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-800 font-medium text-sm text-right", children: formattedDate })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs font-bold tracking-wider uppercase", children: "Student" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-900 font-bold text-sm text-right", children: payment.studentName })
                  ] }),
                  (student == null ? void 0 : student.grade) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs font-bold tracking-wider uppercase", children: "Grade" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-800 font-medium text-sm text-right", children: student.grade })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 relative overflow-hidden", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-[0.03] pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-6xl font-black tracking-tighter", children: "PAID" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-sm font-bold text-center mb-1", children: "AMOUNT PAID" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-4xl font-black text-gray-900 tabular-nums text-center tracking-tight", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg text-emerald-600 mr-1", children: "KES" }),
                    payment.amount.toLocaleString()
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-gray-200 flex justify-between items-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-xs font-bold tracking-wider uppercase", children: "Method" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-800 font-bold text-xs capitalize", children: payment.method })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500", children: "Term Applied" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-gray-900", children: [
                      "Term ",
                      payment.term || "N/A"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500", children: "Recorded By" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900", children: payment.recordedBy })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm pt-3 border-t border-gray-200 border-dashed mt-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600 font-bold", children: "Outstanding Balance" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx("font-black tabular-nums", balance > 0 ? "text-red-500" : "text-emerald-500"), children: [
                      "KES ",
                      balance.toLocaleString()
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 flex flex-col items-center justify-center opacity-60", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-48 h-10 bg-gradient-to-r from-gray-900 to-gray-800 bg-[length:4px_100%]", style: { backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 6px)" } }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-mono tracking-[0.3em] mt-2 text-gray-400", children: "THANK YOU" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-full bg-[#f8fafc]", style: {
                background: "radial-gradient(circle at 10px 0, transparent 10px, white 10px) -10px",
                backgroundSize: "20px 20px",
                backgroundRepeat: "repeat-x"
              } })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 flex gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: generatePDF,
            disabled: isGenerating,
            className: clsx(
              "flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all shadow-lg",
              isGenerating ? "bg-white/20 text-white cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-[1.02] active:scale-[0.98]"
            ),
            children: [
              isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 18 }),
              isGenerating ? "Generating..." : "Download PDF"
            ]
          }
        ) })
      ]
    }
  ) });
};
const SummaryCard = ({ icon, label, value, sub, gradient, delay = 0 }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  motion.div,
  {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, type: "spring", stiffness: 260, damping: 24 },
    whileHover: { y: -4, scale: 1.02 },
    className: "glass-card overflow-hidden cursor-pointer",
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("h-1.5 w-full", gradient) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("p-2.5 rounded-xl text-white shadow-md", gradient), children: icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-[0.12em]", children: label })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tabular-nums", children: value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium mt-1", children: sub })
      ] })
    ]
  }
);
const Fees = ({
  data,
  onAddPayment,
  onAddFeeStructure,
  onDeletePayment,
  onDeleteFeeStructure,
  onInitiateMpesa,
  onSendReminder,
  onNavigate
}) => {
  var _a;
  const { user } = useAuth();
  const [search, setSearch] = reactExports.useState("");
  const [filter, setFilter] = reactExports.useState("all");
  const [termFilter, setTermFilter] = reactExports.useState(0);
  const [showAddPayment, setShowAddPayment] = reactExports.useState(false);
  const [showAddFee, setShowAddFee] = reactExports.useState(false);
  const [tab, setTab] = reactExports.useState("overview");
  const [payStudentId, setPayStudentId] = reactExports.useState("");
  const [payAmount, setPayAmount] = reactExports.useState("");
  const [payMethod, setPayMethod] = reactExports.useState("cash");
  const [payPhone, setPayPhone] = reactExports.useState("");
  const [payNotes, setPayNotes] = reactExports.useState("");
  const [selectedReceiptPayment, setSelectedReceiptPayment] = reactExports.useState(null);
  const [payTerm, setPayTerm] = reactExports.useState(1);
  const [payFeeId, setPayFeeId] = reactExports.useState("");
  const [feeName, setFeeName] = reactExports.useState("");
  const [feeAmount, setFeeAmount] = reactExports.useState("");
  const [feeTerm, setFeeTerm] = reactExports.useState(void 0);
  const [feeRecurring, setFeeRecurring] = reactExports.useState(false);
  const [feeDesc, setFeeDesc] = reactExports.useState("");
  const payments = data.payments || [];
  const feeStructures = data.feeStructures || [];
  const students = data.students || [];
  const totalCollected = reactExports.useMemo(
    () => payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );
  const totalPending = reactExports.useMemo(
    () => payments.filter((p) => {
      var _a2;
      return ((_a2 = p.status) == null ? void 0 : _a2.toLowerCase()) === "pending";
    }).reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );
  reactExports.useMemo(
    () => feeStructures.reduce((sum, f) => sum + f.amount, 0) * students.length,
    [feeStructures, students]
  );
  const completedCount = payments.filter((p) => {
    var _a2;
    return ((_a2 = p.status) == null ? void 0 : _a2.toLowerCase()) === "completed";
  }).length;
  const mpesaCount = payments.filter((p) => {
    var _a2, _b;
    return ((_a2 = p.method) == null ? void 0 : _a2.toLowerCase()) === "mpesa" && ((_b = p.status) == null ? void 0 : _b.toLowerCase()) === "completed";
  }).length;
  const studentBalances = reactExports.useMemo(() => {
    return students.map((student) => {
      const studentPayments = payments.filter((p) => p.studentId === student.id);
      const totalPaid = studentPayments.filter((p) => {
        var _a2;
        return ((_a2 = p.status) == null ? void 0 : _a2.toLowerCase()) === "completed";
      }).reduce((s, p) => s + p.amount, 0);
      const totalFees = feeStructures.reduce((s, f) => s + f.amount, 0);
      const lastPayment = studentPayments.filter((p) => {
        var _a2;
        return ((_a2 = p.status) == null ? void 0 : _a2.toLowerCase()) === "completed";
      }).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))[0];
      return {
        studentId: student.id,
        studentName: student.name,
        totalFees,
        totalPaid,
        balance: totalFees - totalPaid,
        lastPaymentDate: lastPayment == null ? void 0 : lastPayment.transactionDate,
        payments: studentPayments
      };
    }).sort((a, b) => b.balance - a.balance);
  }, [students, payments, feeStructures]);
  const filteredPayments = reactExports.useMemo(() => {
    let list = payments;
    if (filter !== "all") {
      if (filter === "failed") {
        list = list.filter((p) => {
          var _a2, _b;
          return ((_a2 = p.status) == null ? void 0 : _a2.toLowerCase()) === "failed" || ((_b = p.status) == null ? void 0 : _b.toLowerCase()) === "cancelled";
        });
      } else {
        list = list.filter((p) => {
          var _a2;
          return ((_a2 = p.status) == null ? void 0 : _a2.toLowerCase()) === filter;
        });
      }
    }
    if (termFilter > 0) list = list.filter((p) => p.term === termFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        var _a2;
        return p.studentName.toLowerCase().includes(q) || ((_a2 = p.mpesaReceiptNumber) == null ? void 0 : _a2.toLowerCase().includes(q));
      });
    }
    return list;
  }, [payments, filter, termFilter, search]);
  const filteredBalances = reactExports.useMemo(() => {
    if (!search) return studentBalances;
    const q = search.toLowerCase();
    return studentBalances.filter((b) => b.studentName.toLowerCase().includes(q));
  }, [studentBalances, search]);
  const handleAddPayment = async () => {
    if (!payStudentId || !payAmount) return;
    const student = students.find((s) => s.id.toString() === payStudentId.toString());
    if (!student) return;
    let finalStatus = payMethod === "mpesa" ? "pending" : "completed";
    let mpesaCheckoutId = null;
    if (payMethod === "mpesa") {
      const phone = payPhone || student.guardianPhone || student.phone || "";
      if (!phone) return;
      mpesaCheckoutId = await onInitiateMpesa(phone, parseFloat(payAmount), student.id, student.name);
      if (!mpesaCheckoutId) {
        finalStatus = "failed";
      }
    }
    const finalNotes = payMethod === "mpesa" && mpesaCheckoutId ? `${payNotes ? payNotes + " | " : ""}CheckoutRequestID: ${mpesaCheckoutId}` : payNotes || void 0;
    await onAddPayment({
      studentId: student.id,
      studentName: student.name,
      amount: parseFloat(payAmount),
      method: payMethod,
      status: finalStatus,
      mpesaPhoneNumber: payMethod === "mpesa" ? payPhone : void 0,
      transactionDate: (/* @__PURE__ */ new Date()).toISOString(),
      feeStructureId: payFeeId || void 0,
      term: payTerm,
      notes: finalNotes,
      recordedBy: (user == null ? void 0 : user.name) || "System"
    });
    setShowAddPayment(false);
    setPayStudentId("");
    setPayAmount("");
    setPayPhone("");
    setPayNotes("");
    setPayFeeId("");
  };
  const handleAddFee = async () => {
    if (!feeName || !feeAmount) return;
    await onAddFeeStructure({
      name: feeName,
      amount: parseFloat(feeAmount),
      term: feeTerm,
      isRecurring: feeRecurring,
      description: feeDesc || void 0
    });
    setShowAddFee(false);
    setFeeName("");
    setFeeAmount("");
    setFeeDesc("");
    setFeeRecurring(false);
    setFeeTerm(void 0);
  };
  const methodIcon = (m) => {
    if (m === "mpesa") return /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { size: 14, className: "text-green-600" });
    if (m === "bank_transfer") return /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 14, className: "text-blue-600" });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { size: 14, className: "text-amber-600" });
  };
  const statusBadge = (status) => {
    const map = {
      completed: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
      pending: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
      failed: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
      cancelled: "bg-gray-100 dark:bg-gray-800/20 text-gray-600 dark:text-gray-400"
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg", map[status] || map.pending), children: status });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PageTransition, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 pb-12 max-w-[1400px] mx-auto font-sans", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-google font-black text-[var(--md-sys-color-on-surface)] tracking-tight flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { size: 22 }) }),
            "Fee Management"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-secondary)] mt-1", children: "Track payments, manage fees, and send M-Pesa requests" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.button,
            {
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.97 },
              onClick: () => setShowAddFee(true),
              className: "px-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 16 }),
                " Add Fee Type"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.button,
            {
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.97 },
              onClick: () => setShowAddPayment(true),
              className: "px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16 }),
                " Record Payment"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }), label: "Total Collected", value: `KES ${totalCollected.toLocaleString()}`, sub: `${completedCount} payments received`, gradient: "bg-gradient-to-r from-emerald-500 to-green-600", delay: 0.1 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 20 }), label: "Pending", value: `KES ${totalPending.toLocaleString()}`, sub: "Awaiting confirmation", gradient: "bg-gradient-to-r from-amber-400 to-orange-500", delay: 0.15 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { size: 20 }), label: "M-Pesa", value: `${mpesaCount}`, sub: "Payments via M-Pesa", gradient: "bg-gradient-to-r from-green-600 to-lime-500", delay: 0.2 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 20 }), label: "Outstanding", value: `${studentBalances.filter((b) => b.balance > 0).length}`, sub: "Students with balance", gradient: "bg-gradient-to-r from-red-400 to-rose-500", delay: 0.25 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 bg-[var(--md-sys-color-surface-variant)] p-1 rounded-2xl w-fit", children: ["overview", "payments", "structures"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setTab(t),
          className: clsx(
            "px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize",
            tab === t ? "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-sm" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
          ),
          children: t === "structures" ? "Fee Types" : t
        },
        t
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, className: "absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: "Search students or receipts...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "w-full pl-11 pr-4 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl text-sm text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-secondary)] outline-none input-glow transition-shadow"
          }
        )
      ] }),
      tab === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "glass-panel overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-google font-bold text-[var(--md-sys-color-on-surface)]", children: "Student Balances" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-[var(--md-sys-color-secondary)]", children: [
            filteredBalances.length,
            " students"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left px-6 py-3 font-bold text-[10px] uppercase tracking-widest", children: "Student" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-4 py-3 font-bold text-[10px] uppercase tracking-widest", children: "Total Fees" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-4 py-3 font-bold text-[10px] uppercase tracking-widest", children: "Paid" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-4 py-3 font-bold text-[10px] uppercase tracking-widest", children: "Balance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-6 py-3 font-bold text-[10px] uppercase tracking-widest", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: filteredBalances.length > 0 ? filteredBalances.slice(0, 20).map((bal, idx) => {
            const student = students.find((s) => s.id === bal.studentId);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.tr,
              {
                initial: { opacity: 0, x: -10 },
                animate: { opacity: 1, x: 0 },
                transition: { delay: idx * 0.02 },
                className: "border-b border-[var(--md-sys-color-outline-variant)]/50 hover:bg-[var(--md-sys-color-surface-variant)]/50 transition-colors",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)]", children: bal.studentName }),
                    bal.lastPaymentDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5", children: [
                      "Last paid: ",
                      new Date(bal.lastPaymentDate).toLocaleDateString()
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "text-right px-4 py-4 font-medium text-[var(--md-sys-color-on-surface-variant)] tabular-nums", children: [
                    "KES ",
                    bal.totalFees.toLocaleString()
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "text-right px-4 py-4 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums", children: [
                    "KES ",
                    bal.totalPaid.toLocaleString()
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-right px-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: clsx("font-black tabular-nums", bal.balance > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"), children: [
                    "KES ",
                    bal.balance.toLocaleString()
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-right px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                    bal.balance > 0 && (student == null ? void 0 : student.guardianPhone) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: () => onSendReminder(bal.studentName, student.guardianPhone, bal.balance),
                        className: "p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors tap-target",
                        title: "Send SMS Reminder",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 14 })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: () => {
                          setPayStudentId(bal.studentId);
                          setShowAddPayment(true);
                        },
                        className: "p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors tap-target",
                        title: "Record Payment",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 })
                      }
                    )
                  ] }) })
                ]
              },
              bal.studentId
            );
          }) : /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { colSpan: 5, className: "text-center py-12 text-[var(--md-sys-color-secondary)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 36, className: "mx-auto mb-3 opacity-30" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "No students found" })
          ] }) }) })
        ] }) })
      ] }),
      tab === "payments" && /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "glass-panel overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-google font-bold text-[var(--md-sys-color-on-surface)]", children: "Payment History" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 flex-wrap", children: ["all", "completed", "pending", "failed"].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setFilter(f),
              className: clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                filter === f ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
              ),
              children: f
            },
            f
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-[var(--md-sys-color-outline-variant)]/50", children: filteredPayments.length > 0 ? filteredPayments.slice(0, 30).map((payment, idx) => {
          var _a2;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { delay: idx * 0.02 },
              className: "px-6 py-4 flex items-center gap-4 hover:bg-[var(--md-sys-color-surface-variant)]/30 transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2.5 rounded-xl bg-[var(--md-sys-color-surface-variant)]", children: methodIcon(payment.method) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate", children: payment.studentName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                      new Date(payment.transactionDate).toLocaleDateString(),
                      " · ",
                      payment.method.toUpperCase()
                    ] }),
                    payment.mpesaReceiptNumber && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono", children: [
                      "#",
                      payment.mpesaReceiptNumber
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right flex-shrink-0 flex items-center gap-3", children: [
                  statusBadge(payment.status),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-black text-[var(--md-sys-color-on-surface)] tabular-nums", children: [
                    "KES ",
                    payment.amount.toLocaleString()
                  ] }),
                  ((_a2 = payment.status) == null ? void 0 : _a2.toLowerCase()) === "completed" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => setSelectedReceiptPayment(payment),
                      className: "ml-2 p-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] transition-colors tap-target",
                      title: "Generate Receipt",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14 })
                    }
                  )
                ] })
              ]
            },
            payment.id
          );
        }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 text-[var(--md-sys-color-secondary)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { size: 36, className: "mx-auto mb-3 opacity-30" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "No payments found" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1", children: "Record a payment to get started" })
        ] }) })
      ] }),
      tab === "structures" && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: feeStructures.length > 0 ? feeStructures.map((fee, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: idx * 0.05 },
          className: "glass-card p-5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-green-100 dark:bg-green-900/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 16, className: "text-green-600 dark:text-green-400" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => onDeleteFeeStructure(fee.id),
                  className: "p-1.5 rounded-lg text-[var(--md-sys-color-secondary)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors tap-target",
                  title: "Delete",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-bold text-[var(--md-sys-color-on-surface)] mb-1", children: fee.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-google font-black text-[var(--md-sys-color-on-surface)] tabular-nums", children: [
              "KES ",
              fee.amount.toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-3 flex-wrap", children: [
              fee.term && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md uppercase", children: [
                "Term ",
                fee.term
              ] }),
              fee.isRecurring && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md uppercase", children: "Recurring" }),
              fee.studentGroup && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md uppercase", children: fee.studentGroup })
            ] }),
            fee.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-secondary)] mt-2", children: fee.description })
          ]
        },
        fee.id
      )) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-full text-center py-16 text-[var(--md-sys-color-secondary)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 48, className: "mx-auto mb-4 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-lg mb-1", children: "No fee types defined" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: 'Create fee structures like "Term 1 Tuition" or "Registration Fee"' }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setShowAddFee(true),
            className: "mt-4 px-5 py-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16, className: "inline mr-1" }),
              " Add First Fee Type"
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showAddPayment && /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4",
          onClick: () => setShowAddPayment(false),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { scale: 0.95, y: 20 },
              animate: { scale: 1, y: 0 },
              exit: { scale: 0.95, y: 20 },
              className: "glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto shadow-elevation-3",
              onClick: (e) => e.stopPropagation(),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-google font-bold text-lg text-[var(--md-sys-color-on-surface)]", children: "Record Payment" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowAddPayment(false), className: "p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18 }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "Student" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "select",
                      {
                        value: payStudentId === "" ? "" : payStudentId.toString(),
                        onChange: (e) => setPayStudentId(e.target.value),
                        title: "Select student",
                        className: "w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none input-glow",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select student..." }),
                          students.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: s.id.toString(), children: [
                            s.name,
                            " (",
                            s.grade,
                            " - ",
                            s.subject,
                            ")"
                          ] }, s.id))
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "Amount (KES)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "number",
                        value: payAmount,
                        onChange: (e) => setPayAmount(e.target.value),
                        placeholder: "5000",
                        className: "w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none input-glow"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "Payment Method" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: [
                      { val: "cash", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { size: 18 }), label: "Cash", color: "amber" },
                      { val: "mpesa", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { size: 18 }), label: "M-Pesa", color: "green" },
                      { val: "bank_transfer", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 18 }), label: "Bank", color: "blue" }
                    ].map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        onClick: () => setPayMethod(m.val),
                        className: clsx(
                          "p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 text-xs font-bold transition-all",
                          payMethod === m.val ? `border-${m.color}-500 bg-${m.color}-50 dark:bg-${m.color}-900/20 text-${m.color}-700 dark:text-${m.color}-400` : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:border-[var(--md-sys-color-outline)]"
                        ),
                        children: [
                          m.icon,
                          m.label
                        ]
                      },
                      m.val
                    )) })
                  ] }),
                  payMethod === "mpesa" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "M-Pesa Phone Number" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "tel",
                        value: payPhone,
                        onChange: (e) => setPayPhone(e.target.value),
                        placeholder: "07XX XXX XXX",
                        className: "w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none input-glow"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-[var(--md-sys-color-secondary)] mt-1.5 flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { size: 10 }),
                      " An STK push will be sent to this phone"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "Fee Type" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "select",
                        {
                          value: payFeeId,
                          onChange: (e) => setPayFeeId(e.target.value),
                          title: "Fee type",
                          className: "w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm outline-none text-[var(--md-sys-color-on-surface)]",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "General" }),
                            feeStructures.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: f.id, children: f.name }, f.id))
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "Term" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "select",
                        {
                          value: payTerm.toString(),
                          onChange: (e) => setPayTerm(Number(e.target.value)),
                          title: "Term",
                          className: "w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm outline-none text-[var(--md-sys-color-on-surface)]",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "1", children: "Term 1" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "2", children: "Term 2" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "3", children: "Term 3" })
                          ]
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "Notes (Optional)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "text",
                        value: payNotes,
                        onChange: (e) => setPayNotes(e.target.value),
                        placeholder: "Additional details...",
                        className: "w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: handleAddPayment,
                      disabled: !payStudentId || !payAmount,
                      className: "w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2",
                      children: payMethod === "mpesa" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { size: 16 }),
                        " Send M-Pesa Request"
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 16 }),
                        " Record Payment"
                      ] })
                    }
                  )
                ] })
              ]
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showAddFee && /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4",
          onClick: () => setShowAddFee(false),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { scale: 0.95, y: 20 },
              animate: { scale: 1, y: 0 },
              exit: { scale: 0.95, y: 20 },
              className: "glass-panel w-full max-w-md shadow-elevation-3",
              onClick: (e) => e.stopPropagation(),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-google font-bold text-lg text-[var(--md-sys-color-on-surface)]", children: "Add Fee Type" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowAddFee(false), className: "p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18 }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "Fee Name" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "text",
                        value: feeName,
                        onChange: (e) => setFeeName(e.target.value),
                        placeholder: "e.g. Term 1 Tuition",
                        className: "w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "Amount (KES)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "number",
                        value: feeAmount,
                        onChange: (e) => setFeeAmount(e.target.value),
                        placeholder: "25000",
                        className: "w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "Term (Optional)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "select",
                      {
                        value: feeTerm === void 0 ? "" : feeTerm.toString(),
                        onChange: (e) => setFeeTerm(e.target.value ? Number(e.target.value) : void 0),
                        title: "Term",
                        className: "w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm outline-none text-[var(--md-sys-color-on-surface)]",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All terms" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "1", children: "Term 1" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "2", children: "Term 2" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "3", children: "Term 3" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer p-3 bg-[var(--md-sys-color-surface-variant)] rounded-xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: feeRecurring,
                        onChange: (e) => setFeeRecurring(e.target.checked),
                        className: "w-5 h-5 rounded-md accent-[var(--md-sys-color-primary)]"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-[var(--md-sys-color-on-surface)]", children: "Recurring every term" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block", children: "Description (Optional)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "text",
                        value: feeDesc,
                        onChange: (e) => setFeeDesc(e.target.value),
                        placeholder: "Brief description...",
                        className: "w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: handleAddFee,
                      disabled: !feeName || !feeAmount,
                      className: "w-full py-3.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all",
                      children: "Create Fee Type"
                    }
                  )
                ] })
              ]
            }
          )
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: selectedReceiptPayment && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ReceiptModal,
      {
        payment: selectedReceiptPayment,
        student: students.find((s) => s.id === selectedReceiptPayment.studentId),
        balance: ((_a = studentBalances.find((b) => b.studentId === selectedReceiptPayment.studentId)) == null ? void 0 : _a.balance) || 0,
        onClose: () => setSelectedReceiptPayment(null)
      }
    ) })
  ] });
};
export {
  Fees as default
};
