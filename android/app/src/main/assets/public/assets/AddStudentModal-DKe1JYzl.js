import { w as objectType, x as arrayType, y as stringType, z as literalType, D as enumType, E as preprocessType, H as numberType, I as booleanType, u as useTheme, a as reactExports, j as jsxRuntimeExports, X, R as React, p as UserPlus, c as clsx } from "./index-CWZOk6sM.js";
import { g as getStudentGroups, c as getLevelsForGroup, a as getDefaultLevel } from "./educationLevels-CWONNkiO.js";
import { C as CircleAlert } from "./circle-alert-CIuELtRP.js";
import { C as Camera } from "./camera-BE23yLZy.js";
import { S as Save } from "./save-egituPWj.js";
const kenyanPhoneRegex = /^(\+254|0)?[17]\d{8}$/;
const studentSchema = objectType({
  name: stringType().min(2, "Name must be at least 2 characters").max(100, "Name is too long").regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  grade: stringType().min(1, "Education level is required").max(10, "Invalid education level"),
  lot: stringType().regex(/^\d{4}$/, "Lot must be a 4-digit year (e.g., 2025)"),
  subject: stringType().min(1, "Subject is required"),
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
  // Regulatory / System Fields (NEMIS, UPI, NITA, EPRA)
  admissionNumber: stringType().optional().or(literalType("")),
  nemisNumber: stringType().max(50, "NEMIS number is too long").optional().or(literalType("")),
  upi: stringType().max(50, "UPI is too long").optional().or(literalType("")),
  kcpeMarks: preprocessType((val) => val === "" || val === void 0 ? void 0 : Number(val), numberType().min(0, "KCPE marks must be at least 0").max(500, "KCPE marks cannot exceed 500").optional()),
  nationalId: stringType().max(50, "National ID is too long").optional().or(literalType("")),
  nitaNumber: stringType().optional().or(literalType("")),
  epraLicenseStatus: enumType(["None", "T1", "T2", "T3"]).optional().default("None"),
  kcseGrade: stringType().optional().or(literalType("")),
  notes: arrayType(stringType()).optional().default([])
});
objectType({
  dayOfWeek: numberType().int().min(1, "Day must be Monday (1) to Friday (5)").max(5, "Day must be Monday (1) to Friday (5)"),
  startTime: stringType().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (use HH:MM)"),
  durationMinutes: numberType().int().min(15, "Duration must be at least 15 minutes").max(240, "Duration cannot exceed 4 hours"),
  grade: stringType().min(1, "Education level is required").max(10),
  subject: stringType().min(1, "Subject is required"),
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
  const { preferences } = useTheme();
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
    var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2, _k2, _l2;
    e.preventDefault();
    setIsSubmitting(true);
    const formData = {
      ...student,
      ...editForm,
      name: ((_a2 = editForm.name) == null ? void 0 : _a2.trim()) || "",
      grade: editForm.grade || "",
      lot: editForm.lot || "",
      subject: editForm.subject || "",
      email: ((_b2 = editForm.email) == null ? void 0 : _b2.trim()) || void 0,
      phone: ((_c2 = editForm.phone) == null ? void 0 : _c2.trim()) || void 0,
      dateOfBirth: editForm.dateOfBirth || void 0,
      admissionNumber: ((_d2 = editForm.admissionNumber) == null ? void 0 : _d2.trim()) || void 0,
      nemisNumber: ((_e2 = editForm.nemisNumber) == null ? void 0 : _e2.trim()) || void 0,
      upi: ((_f2 = editForm.upi) == null ? void 0 : _f2.trim()) || void 0,
      kcpeMarks: editForm.kcpeMarks ? Number(editForm.kcpeMarks) : void 0,
      nationalId: ((_g2 = editForm.nationalId) == null ? void 0 : _g2.trim()) || void 0,
      nitaNumber: ((_h2 = editForm.nitaNumber) == null ? void 0 : _h2.trim()) || void 0,
      epraLicenseStatus: editForm.epraLicenseStatus || "None",
      kcseGrade: ((_i2 = editForm.kcseGrade) == null ? void 0 : _i2.trim()) || void 0,
      guardianName: ((_j2 = editForm.guardianName) == null ? void 0 : _j2.trim()) || void 0,
      guardianPhone: ((_k2 = editForm.guardianPhone) == null ? void 0 : _k2.trim()) || void 0,
      address: ((_l2 = editForm.address) == null ? void 0 : _l2.trim()) || void 0
    };
    const result = validateWithSchema(studentSchema, formData);
    if (result.success === false) {
      setErrors(result.errors);
      setIsSubmitting(false);
      return;
    }
    onSave({ ...student, ...result.data });
    setIsSubmitting(false);
    onClose();
  };
  const hasEnabledFields = !!(((_a = preferences.enabledFields) == null ? void 0 : _a.admissionNumber) || ((_b = preferences.enabledFields) == null ? void 0 : _b.nemisNumber) || ((_c = preferences.enabledFields) == null ? void 0 : _c.upi) || ((_d = preferences.enabledFields) == null ? void 0 : _d.nationalId) || ((_e = preferences.enabledFields) == null ? void 0 : _e.nitaNumber) || ((_f = preferences.enabledFields) == null ? void 0 : _f.epraLicenseStatus) || ((_g = preferences.enabledFields) == null ? void 0 : _g.kcseGrade) || ((_h = preferences.enabledFields) == null ? void 0 : _h.kcpeMarks) || ((_i = preferences.enabledFields) == null ? void 0 : _i.guardianDetails));
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
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-24 h-24 bg-gray-200 rounded-2xl overflow-hidden border-2 border-white shadow-lg ring-1 ring-black/5 animate-scale-in", children: [
        editForm.photo ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: editForm.photo, alt: editForm.name, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-black text-slate-400", children: ((_j = editForm.name) == null ? void 0 : _j.charAt(0)) || "?" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              var _a2;
              return (_a2 = fileInputRef.current) == null ? void 0 : _a2.click();
            },
            className: "absolute bottom-1 right-1 p-1.5 bg-white rounded-full shadow-md text-violet-600 hover:bg-violet-50 transition-transform duration-200 hover:scale-110",
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
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:border-transparent text-[var(--md-sys-color-on-surface)]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: [
            ((_k = preferences.terminology) == null ? void 0 : _k.classLabel) || "Subject",
            " / Course *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: editForm.subject || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, subject: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-semibold",
              children: (preferences.customSubjects || ["Solar", "ICT"]).map((sub) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: sub, children: sub }, sub))
            }
          )
        ] }),
        getStudentGroups(preferences.institutionType).length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Group" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: editForm.studentGroup || "Academy",
              onChange: (e) => {
                const grp = e.target.value;
                setEditForm((prev) => {
                  var _a2;
                  return { ...prev, studentGroup: grp, grade: ((_a2 = getLevelsForGroup(grp, preferences.institutionType)[0]) == null ? void 0 : _a2.id) || "" };
                });
              },
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]",
              children: getStudentGroups(preferences.institutionType).map((grp) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: grp, children: grp }, grp))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: ((_l = preferences.terminology) == null ? void 0 : _l.classLabel) || "Level" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: editForm.grade || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, grade: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]",
              children: getLevelsForGroup(editForm.studentGroup || "Academy", preferences.institutionType).map((lvl) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: lvl.id, children: lvl.label }, lvl.id))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: [
            ((_m = preferences.terminology) == null ? void 0 : _m.cohortLabel) || "Lot",
            " / Cohort *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: editForm.lot || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, lot: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]",
              children: ["2024", "2025", "2026", "2027"].map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: l, children: l }, l))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("hr", { className: "border-[var(--md-sys-color-outline-variant)]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "email",
              value: editForm.email || "",
              onChange: (e) => setEditForm((prev) => ({ ...prev, email: e.target.value })),
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
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
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
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
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
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
              className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
            }
          )
        ] })
      ] }),
      hasEnabledFields && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("hr", { className: "border-[var(--md-sys-color-outline-variant)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider", children: "Regulatory & Academic Profile" }),
          ((_n = preferences.enabledFields) == null ? void 0 : _n.admissionNumber) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Admission Number" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: editForm.admissionNumber || "",
                onChange: (e) => setEditForm((prev) => ({ ...prev, admissionNumber: e.target.value })),
                className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-mono"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            ((_o = preferences.enabledFields) == null ? void 0 : _o.nemisNumber) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "NEMIS ID" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: editForm.nemisNumber || "",
                  onChange: (e) => setEditForm((prev) => ({ ...prev, nemisNumber: e.target.value })),
                  className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-mono"
                }
              )
            ] }),
            ((_p = preferences.enabledFields) == null ? void 0 : _p.upi) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "UPI (Unique Personal Identifier)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: editForm.upi || "",
                  onChange: (e) => setEditForm((prev) => ({ ...prev, upi: e.target.value })),
                  className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-mono"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            ((_q = preferences.enabledFields) == null ? void 0 : _q.nationalId) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "National ID / Alien ID" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: editForm.nationalId || "",
                  onChange: (e) => setEditForm((prev) => ({ ...prev, nationalId: e.target.value })),
                  className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                }
              )
            ] }),
            ((_r = preferences.enabledFields) == null ? void 0 : _r.nitaNumber) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "NITA Registration No." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: editForm.nitaNumber || "",
                  onChange: (e) => setEditForm((prev) => ({ ...prev, nitaNumber: e.target.value })),
                  className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-mono"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            ((_s = preferences.enabledFields) == null ? void 0 : _s.epraLicenseStatus) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "EPRA License Status" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: editForm.epraLicenseStatus || "None",
                  onChange: (e) => setEditForm((prev) => ({ ...prev, epraLicenseStatus: e.target.value })),
                  className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-semibold",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "None", children: "None" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "T1", children: "T1 (Artisan)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "T2", children: "T2 (Technician)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "T3", children: "T3 (Engineer)" })
                  ]
                }
              )
            ] }),
            ((_t = preferences.enabledFields) == null ? void 0 : _t.kcseGrade) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "KCSE Mean Grade" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: editForm.kcseGrade || "",
                  onChange: (e) => setEditForm((prev) => ({ ...prev, kcseGrade: e.target.value })),
                  className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-semibold",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select Grade" }),
                    ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"].map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: g, children: g }, g))
                  ]
                }
              )
            ] })
          ] }),
          ((_u = preferences.enabledFields) == null ? void 0 : _u.kcpeMarks) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "KCPE Marks" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: editForm.kcpeMarks === void 0 ? "" : editForm.kcpeMarks,
                onChange: (e) => setEditForm((prev) => ({ ...prev, kcpeMarks: e.target.value ? Number(e.target.value) : void 0 })),
                className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
              }
            )
          ] }),
          ((_v = preferences.enabledFields) == null ? void 0 : _v.guardianDetails) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Guardian Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: editForm.guardianName || "",
                  onChange: (e) => setEditForm((prev) => ({ ...prev, guardianName: e.target.value })),
                  className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Guardian Phone" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: editForm.guardianPhone || "",
                  onChange: (e) => setEditForm((prev) => ({ ...prev, guardianPhone: e.target.value })),
                  className: "w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                }
              )
            ] })
          ] })
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
          className: "flex-1 py-3 bg-[var(--accent-primary)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-75",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 18 }),
            isSubmitting ? "Saving..." : "Save Changes"
          ]
        }
      )
    ] })
  ] }) });
};
const AddStudentModal = ({ isOpen, onClose, onAdd }) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
  const { preferences } = useTheme();
  const [name, setName] = reactExports.useState("");
  const [grade, setGrade] = reactExports.useState("");
  const [lot, setLot] = reactExports.useState("2025");
  const [subject, setSubject] = reactExports.useState("");
  const [studentGroup, setStudentGroup] = reactExports.useState("Academy");
  const [email, setEmail] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [dateOfBirth, setDateOfBirth] = reactExports.useState("");
  const [admissionNumber, setAdmissionNumber] = reactExports.useState("");
  const [nemisNumber, setNemisNumber] = reactExports.useState("");
  const [upi, setUpi] = reactExports.useState("");
  const [kcpeMarks, setKcpeMarks] = reactExports.useState("");
  const [nationalId, setNationalId] = reactExports.useState("");
  const [nitaNumber, setNitaNumber] = reactExports.useState("");
  const [epraLicenseStatus, setEpraLicenseStatus] = reactExports.useState("None");
  const [kcseGrade, setKcseGrade] = reactExports.useState("");
  const [guardianName, setGuardianName] = reactExports.useState("");
  const [guardianPhone, setGuardianPhone] = reactExports.useState("");
  const [errors, setErrors] = reactExports.useState({});
  const [touched, setTouched] = reactExports.useState(/* @__PURE__ */ new Set());
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  React.useEffect(() => {
    var _a2;
    if (isOpen && preferences) {
      const groups = getStudentGroups(preferences.institutionType);
      const defaultGroup = groups[0] || "Academy";
      const defaultGrade = getDefaultLevel(defaultGroup, preferences.institutionType);
      const defaultSub = preferences.defaultSubject && preferences.defaultSubject !== "All" ? preferences.defaultSubject : ((_a2 = preferences.customSubjects) == null ? void 0 : _a2[0]) || "Solar";
      setStudentGroup(defaultGroup);
      setGrade(defaultGrade);
      setSubject(defaultSub);
      setLot(String((/* @__PURE__ */ new Date()).getFullYear()));
      setName("");
      setEmail("");
      setPhone("");
      setDateOfBirth("");
      setAdmissionNumber("");
      setNemisNumber("");
      setUpi("");
      setKcpeMarks("");
      setNationalId("");
      setNitaNumber("");
      setEpraLicenseStatus("None");
      setKcseGrade("");
      setGuardianName("");
      setGuardianPhone("");
      setErrors({});
      setTouched(/* @__PURE__ */ new Set());
    }
  }, [isOpen, preferences]);
  const getDefaultCompetencies = (sub) => {
    const instType = preferences.institutionType || "tvet";
    if (instType === "primary" || instType === "jss") {
      return {
        communication_collaboration: 1,
        critical_thinking: 1,
        creativity_imagination: 1,
        citizenship: 1,
        self_efficacy: 1,
        digital_literacy: 1,
        learning_to_learn: 1
      };
    }
    if (sub.toLowerCase().includes("solar")) {
      return { safety: 1, tools: 1, principles: 1, installation: 1, maintenance: 1 };
    }
    if (sub.toLowerCase().includes("ict") || sub.toLowerCase().includes("computer") || sub.toLowerCase().includes("software")) {
      return { hardware: 1, software: 1, typing: 1, formatting: 1, data: 1 };
    }
    return {
      [`${sub.toLowerCase()}_basics`]: 1,
      [`${sub.toLowerCase()}_theory`]: 1,
      [`${sub.toLowerCase()}_practical`]: 1,
      [`${sub.toLowerCase()}_assessment`]: 1,
      [`${sub.toLowerCase()}_project`]: 1
    };
  };
  const validateField = reactExports.useCallback((field, value) => {
    const partialData = { [field]: value };
    const result = studentSchema.partial().safeParse(partialData);
    if (!result.success) {
      const fieldError = result.error.issues.find((e) => e.path[0] === field);
      return (fieldError == null ? void 0 : fieldError.message) || "";
    }
    return "";
  }, []);
  const handleBlur = (field, value) => {
    setTouched((prev) => new Set(prev).add(field));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = {
      name: name.trim(),
      grade,
      lot,
      subject,
      email: email.trim() || void 0,
      phone: phone.trim() || void 0,
      dateOfBirth: dateOfBirth || void 0,
      admissionNumber: admissionNumber.trim() || void 0,
      nemisNumber: nemisNumber.trim() || void 0,
      upi: upi.trim() || void 0,
      kcpeMarks: kcpeMarks ? Number(kcpeMarks) : void 0,
      nationalId: nationalId.trim() || void 0,
      nitaNumber: nitaNumber.trim() || void 0,
      epraLicenseStatus,
      kcseGrade: kcseGrade.trim() || void 0,
      guardianName: guardianName.trim() || void 0,
      guardianPhone: guardianPhone.trim() || void 0
    };
    const result = validateWithSchema(studentSchema, formData);
    if (result.success === false) {
      setErrors(result.errors);
      setIsSubmitting(false);
      return;
    }
    const newStudent = {
      ...result.data,
      studentGroup,
      competencies: getDefaultCompetencies(subject),
      attendancePct: 100,
      attendanceHistory: [],
      notes: [],
      assessment: { units: {}, termStats: [] }
    };
    onAdd(newStudent);
    handleClose();
    setIsSubmitting(false);
  };
  const handleClose = () => {
    onClose();
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-6 border-b border-[var(--md-sys-color-outline)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-[var(--md-sys-color-primary-container)] rounded-xl text-[var(--md-sys-color-primary)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-[var(--md-sys-color-on-surface)]", children: "Add New Student" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: handleClose,
          className: "p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded-xl transition-colors text-[var(--md-sys-color-on-surface-variant)]",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20 })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-5", children: [
      Object.keys(errors).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4 space-y-1", children: Object.entries(errors).filter(([_, msg]) => msg).map(([field, error]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 14 }),
        error
      ] }, field)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-[55vh] overflow-y-auto pr-1 space-y-4 scrollbar-thin", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2", children: "Full Name *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: name,
              onChange: (e) => setName(e.target.value),
              onBlur: () => handleBlur("name", name),
              placeholder: "Enter student's full name",
              className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all placeholder-[var(--md-sys-color-secondary)]",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2", children: [
            ((_a = preferences.terminology) == null ? void 0 : _a.classLabel) || "Subject",
            " / Program *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: subject,
              onChange: (e) => setSubject(e.target.value),
              className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]",
              children: (preferences.customSubjects || ["Solar", "ICT"]).map((sub) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: sub, children: sub }, sub))
            }
          )
        ] }),
        getStudentGroups(preferences.institutionType).length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2", children: "Student System / Group" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-[var(--md-sys-color-surface-variant)] rounded-xl p-1", children: getStudentGroups(preferences.institutionType).map((grp) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setStudentGroup(grp);
                setGrade(getDefaultLevel(grp, preferences.institutionType));
              },
              className: clsx(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                studentGroup === grp ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
              ),
              children: grp
            },
            grp
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2", children: [
              "Education ",
              ((_b = preferences.terminology) == null ? void 0 : _b.classLabel) || "Level"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                value: grade,
                onChange: (e) => setGrade(e.target.value),
                className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]",
                children: getLevelsForGroup(studentGroup, preferences.institutionType).map((lvl) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: lvl.id, children: lvl.label }, lvl.id))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2", children: [
              ((_c = preferences.terminology) == null ? void 0 : _c.cohortLabel) || "Lot",
              " / Cohort"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                value: lot,
                onChange: (e) => setLot(e.target.value),
                className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]",
                children: ["2024", "2025", "2026", "2027"].map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: l, children: l }, l))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2", children: "Phone Number" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: phone,
                onChange: (e) => setPhone(e.target.value),
                onBlur: () => handleBlur("phone", phone),
                placeholder: "e.g. 0712345678",
                className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all placeholder-[var(--md-sys-color-secondary)]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2", children: "Date of Birth" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "date",
                value: dateOfBirth,
                onChange: (e) => setDateOfBirth(e.target.value),
                onBlur: () => handleBlur("dateOfBirth", dateOfBirth),
                className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2", children: "Email Address" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              onBlur: () => handleBlur("email", email),
              placeholder: "e.g. student@school.ac.ke",
              className: "w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all placeholder-[var(--md-sys-color-secondary)]"
            }
          )
        ] }),
        (((_d = preferences.enabledFields) == null ? void 0 : _d.admissionNumber) || ((_e = preferences.enabledFields) == null ? void 0 : _e.nemisNumber) || ((_f = preferences.enabledFields) == null ? void 0 : _f.upi) || ((_g = preferences.enabledFields) == null ? void 0 : _g.nationalId) || ((_h = preferences.enabledFields) == null ? void 0 : _h.nitaNumber) || ((_i = preferences.enabledFields) == null ? void 0 : _i.epraLicenseStatus) || ((_j = preferences.enabledFields) == null ? void 0 : _j.kcseGrade) || ((_k = preferences.enabledFields) == null ? void 0 : _k.kcpeMarks) || ((_l = preferences.enabledFields) == null ? void 0 : _l.guardianDetails)) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 border-t border-[var(--md-sys-color-outline-variant)] space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider", children: "Regulatory & Academic Profile" }),
          ((_m = preferences.enabledFields) == null ? void 0 : _m.admissionNumber) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Admission Number" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: admissionNumber,
                onChange: (e) => setAdmissionNumber(e.target.value),
                placeholder: "Enter Admission Number",
                className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            ((_n = preferences.enabledFields) == null ? void 0 : _n.nemisNumber) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "NEMIS Number" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: nemisNumber,
                  onChange: (e) => setNemisNumber(e.target.value),
                  placeholder: "NEMIS ID",
                  className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                }
              )
            ] }),
            ((_o = preferences.enabledFields) == null ? void 0 : _o.upi) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "UPI Number" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: upi,
                  onChange: (e) => setUpi(e.target.value),
                  placeholder: "UPI Code",
                  className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            ((_p = preferences.enabledFields) == null ? void 0 : _p.nationalId) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "National ID" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: nationalId,
                  onChange: (e) => setNationalId(e.target.value),
                  placeholder: "ID Number",
                  className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                }
              )
            ] }),
            ((_q = preferences.enabledFields) == null ? void 0 : _q.nitaNumber) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "NITA Number" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: nitaNumber,
                  onChange: (e) => setNitaNumber(e.target.value),
                  placeholder: "NITA Reg No",
                  className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            ((_r = preferences.enabledFields) == null ? void 0 : _r.epraLicenseStatus) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "EPRA License" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: epraLicenseStatus,
                  onChange: (e) => setEpraLicenseStatus(e.target.value),
                  className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "None", children: "None" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "T1", children: "T1 (Artisan)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "T2", children: "T2 (Technician)" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "T3", children: "T3 (Engineer)" })
                  ]
                }
              )
            ] }),
            ((_s = preferences.enabledFields) == null ? void 0 : _s.kcseGrade) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "KCSE Grade" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: kcseGrade,
                  onChange: (e) => setKcseGrade(e.target.value),
                  className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select Grade" }),
                    ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"].map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: g, children: g }, g))
                  ]
                }
              )
            ] })
          ] }),
          ((_t = preferences.enabledFields) == null ? void 0 : _t.kcpeMarks) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "KCPE Marks" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: kcpeMarks,
                onChange: (e) => setKcpeMarks(e.target.value),
                onBlur: () => handleBlur("kcpeMarks", kcpeMarks ? Number(kcpeMarks) : void 0),
                placeholder: "Score out of 500",
                className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
              }
            )
          ] }),
          ((_u = preferences.enabledFields) == null ? void 0 : _u.guardianDetails) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Guardian Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: guardianName,
                  onChange: (e) => setGuardianName(e.target.value),
                  onBlur: () => handleBlur("guardianName", guardianName),
                  placeholder: "Guardian Full Name",
                  className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1", children: "Guardian Phone" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: guardianPhone,
                  onChange: (e) => setGuardianPhone(e.target.value),
                  onBlur: () => handleBlur("guardianPhone", guardianPhone),
                  placeholder: "e.g. 0712345678",
                  className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleClose,
            className: "flex-1 py-3 px-4 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] rounded-xl font-bold text-sm hover:opacity-80 transition-opacity",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "submit",
            disabled: isSubmitting,
            className: "flex-1 py-3 px-4 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 16 }),
              "Add Student"
            ]
          }
        )
      ] })
    ] })
  ] }) });
};
export {
  AddStudentModal as A,
  EditStudentModal as E
};
