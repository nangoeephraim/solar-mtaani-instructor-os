import { v as objectType, w as arrayType, x as stringType, y as literalType, z as enumType, D as numberType, E as booleanType, a as reactExports, j as jsxRuntimeExports, X } from "./index-l2RTGEA9.js";
import { S as STUDENT_GROUPS, b as getLevelsForGroup } from "./educationLevels-CHjJC3HX.js";
import { C as CircleAlert } from "./circle-alert-CMgkxloe.js";
import { C as Camera } from "./camera-BDD2Ner5.js";
import { S as Save } from "./save-CIv_kv6h.js";
const kenyanPhoneRegex = /^(\+254|0)?[17]\d{8}$/;
const studentSchema = objectType({
  name: stringType().min(2, "Name must be at least 2 characters").max(100, "Name is too long").regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  grade: stringType().min(1, "Education level is required").max(10, "Invalid education level"),
  lot: stringType().regex(/^\d{4}$/, "Lot must be a 4-digit year (e.g., 2025)"),
  subject: enumType(["Solar", "ICT"]),
  email: stringType().email("Invalid email address").optional().or(literalType("")),
  phone: stringType().regex(kenyanPhoneRegex, "Invalid Kenyan phone number (e.g., 0712345678 or +254712345678)").optional().or(literalType("")),
  dateOfBirth: stringType().optional().refine((date) => {
    if (!date) return true;
    const parsed = new Date(date);
    const now = /* @__PURE__ */ new Date();
    const minAge = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    return parsed <= minAge;
  }, "Student must be at least 5 years old"),
  enrollmentDate: stringType().optional(),
  guardianName: stringType().max(100, "Guardian name is too long").optional().or(literalType("")),
  guardianPhone: stringType().regex(kenyanPhoneRegex, "Invalid Kenyan phone number").optional().or(literalType("")),
  address: stringType().max(500, "Address is too long").optional().or(literalType("")),
  notes: arrayType(stringType()).optional().default([])
});
objectType({
  dayOfWeek: numberType().int().min(1, "Day must be Monday (1) to Friday (5)").max(5, "Day must be Monday (1) to Friday (5)"),
  startTime: stringType().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (use HH:MM)"),
  durationMinutes: numberType().int().min(15, "Duration must be at least 15 minutes").max(240, "Duration cannot exceed 4 hours"),
  grade: stringType().min(1, "Education level is required").max(10),
  subject: enumType(["Solar", "ICT"]),
  status: enumType(["Pending", "Completed", "Skipped", "Cancelled"]),
  overrideDate: stringType().optional(),
  replacesSlotId: stringType().optional()
});
objectType({
  date: stringType().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  slotId: stringType().optional(),
  status: enumType(["present", "absent"]),
  notes: stringType().max(500).optional()
});
objectType({
  competencyKey: stringType().min(1, "Competency key is required"),
  level: numberType().int().min(1, "Level must be 1 (Emerging) to 4 (Mastered)").max(4, "Level must be 1 (Emerging) to 4 (Mastered)")
});
objectType({
  name: stringType().min(1, "Name is required").max(100, "Name is too long"),
  organization: stringType().max(200, "Organization name is too long").optional().or(literalType("")),
  preferences: objectType({
    theme: enumType(["light", "dark", "system"]),
    accentColor: enumType(["blue", "orange", "green", "purple"]),
    enableAI: booleanType(),
    reducedMotion: booleanType(),
    notificationsEnabled: booleanType()
  })
});
function validateWithSchema(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  });
  return { success: false, errors };
}
const EditStudentModal = ({ isOpen, onClose, student, onSave }) => {
  var _a;
  const [editForm, setEditForm] = reactExports.useState({});
  const [errors, setErrors] = reactExports.useState({});
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (student && isOpen) {
      setEditForm(student);
      setErrors({});
    }
  }, [student, isOpen]);
  if (!isOpen || !student) return null;
  const handlePhotoUpload = (e) => {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setEditForm((prev) => ({ ...prev, photo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = (e) => {
    var _a2;
    e.preventDefault();
    setIsSubmitting(true);
    const formData = {
      name: ((_a2 = editForm.name) == null ? void 0 : _a2.trim()) || "",
      grade: editForm.grade || "L3",
      lot: editForm.lot || "",
      subject: editForm.subject || "Solar"
    };
    const result = validateWithSchema(studentSchema.pick({
      name: true,
      grade: true,
      lot: true,
      subject: true
    }), formData);
    if (result.success === false) {
      setErrors(result.errors);
      setIsSubmitting(false);
      return;
    }
    onSave({ ...student, ...editForm });
    setIsSubmitting(false);
    onClose();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in flex flex-col max-h-[90vh] overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-6 border-b border-[var(--md-sys-color-outline)] flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-[var(--md-sys-color-on-surface)]", children: "Edit Student Profile" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onClose,
          className: "p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded-xl transition-colors text-[var(--md-sys-color-on-surface-variant)]",
          type: "button",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20 })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 overflow-y-auto custom-scrollbar flex-1 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "edit-student-form", onSubmit: handleSubmit, className: "space-y-6", children: [
      Object.keys(errors).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4 space-y-1", children: Object.entries(errors).filter(([_, msg]) => msg).map(([field, error]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 14 }),
        error
      ] }, field)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-24 h-24 bg-gray-200 rounded-2xl overflow-hidden border-2 border-white shadow-lg ring-1 ring-black/5", children: [
        editForm.photo ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: editForm.photo, alt: editForm.name, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-black text-slate-400", children: ((_a = editForm.name) == null ? void 0 : _a.charAt(0)) || "?" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              var _a2;
              return (_a2 = fileInputRef.current) == null ? void 0 : _a2.click();
            },
            className: "absolute bottom-1 right-1 p-1.5 bg-white rounded-full shadow-md text-violet-600 hover:bg-violet-50",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { size: 14 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", ref: fileInputRef, onChange: handlePhotoUpload, accept: "image/*", className: "hidden" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Full Name *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: editForm.name || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, name: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Subject" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: editForm.subject || "Solar",
              onChange: (e) => setEditForm((prev) => ({ ...prev, subject: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "Solar", children: "Solar" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "ICT", children: "ICT" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Group" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: editForm.studentGroup || "Academy",
              onChange: (e) => setEditForm((prev) => ({ ...prev, studentGroup: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]",
              children: STUDENT_GROUPS.map((grp) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: grp, children: grp }, grp))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Level" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: editForm.grade || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, grade: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]",
              children: getLevelsForGroup(editForm.studentGroup || "Academy").map((lvl) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: lvl.id, children: lvl.label }, lvl.id))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Lot / Cohort *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: editForm.lot || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, lot: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("hr", { className: "border-[var(--md-sys-color-outline)] border-dashed" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "email",
              value: editForm.email || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, email: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Phone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "tel",
              value: editForm.phone || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, phone: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Date of Birth" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "date",
              value: editForm.dateOfBirth || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, dateOfBirth: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-1 md:col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Address" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: editForm.address || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, address: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("hr", { className: "border-[var(--md-sys-color-outline)] border-dashed" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Guardian Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: editForm.guardianName || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, guardianName: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Guardian Phone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "tel",
              value: editForm.guardianPhone || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, guardianPhone: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("hr", { className: "border-[var(--md-sys-color-outline)] border-dashed" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Admission Number" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: editForm.admissionNumber || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, admissionNumber: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)] font-mono"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "NITA Reg No." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: editForm.nitaNumber || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, nitaNumber: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)] font-mono"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "EPRA License Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: editForm.epraLicenseStatus || "None",
              onChange: (e) => setEditForm((prev) => ({ ...prev, epraLicenseStatus: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)] font-bold",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "None", children: "None" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "T3", children: "T3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "T2", children: "T2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "T1", children: "T1" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "KCSE Grade" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: editForm.kcseGrade || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, kcseGrade: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)] font-mono"
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-6 border-t border-[var(--md-sys-color-outline)] flex-shrink-0 flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: "flex-1 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "submit",
          form: "edit-student-form",
          disabled: isSubmitting,
          className: "flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-70",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 18 }),
            isSubmitting ? "Saving..." : "Save Changes"
          ]
        }
      )
    ] })
  ] }) });
};
export {
  EditStudentModal as E,
  studentSchema as s,
  validateWithSchema as v
};
