import { s as createLucideIcon, b as useAuth, e as useToast, a as reactExports, F as FileText, $ as Clock, n as BookOpen, bc as CircleHelp, j as jsxRuntimeExports, v as Search, A as AnimatePresence, m as motion, c as clsx, W as CircleCheckBig, T as Trash2, X, bd as Box, M as Monitor, U as Users, g as ChevronRight, C as Calendar } from "./index-CTZ1eQC9.js";
import { P as PageHeader } from "./PageHeader-D8byMYqA.js";
import { U as Upload, u as uploadFile, d as deleteFile } from "./cloudStorageService-CuUrox-L.js";
import { u as useLocalStorage } from "./useLocalStorage-CBZXsDJG.js";
import { C as ClipboardList } from "./clipboard-list-Cq0F6BY7.js";
import { S as ShieldAlert } from "./shield-alert-BI8CF-Y3.js";
import { D as Download } from "./download-BotpE1Pa.js";
import { b as getSubjectPill } from "./subjectUtils-CWZOIqn8.js";
import { P as Plus } from "./plus-D3yFq6RD.js";
import { C as CircleAlert } from "./circle-alert-Be-OeDUH.js";
import { P as PenLine } from "./pen-line-78u3QdsD.js";
import { M as MapPin } from "./map-pin-BEkLhwxj.js";
import { H as History } from "./history-Db95Zjgj.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const File = createLucideIcon("File", [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Filter = createLucideIcon("Filter", [
  ["polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3", key: "1yg77f" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FolderOpen = createLucideIcon("FolderOpen", [
  [
    "path",
    {
      d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
      key: "usdka0"
    }
  ]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Link2 = createLucideIcon("Link2", [
  ["path", { d: "M9 17H7A5 5 0 0 1 7 7h2", key: "8i5ue5" }],
  ["path", { d: "M15 7h2a5 5 0 1 1 0 10h-2", key: "1b9ql8" }],
  ["line", { x1: "8", x2: "16", y1: "12", y2: "12", key: "1jonct" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const PanelsTopLeft = createLucideIcon("PanelsTopLeft", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M3 9h18", key: "1pudct" }],
  ["path", { d: "M9 21V9", key: "1oto5p" }]
]);
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Wrench = createLucideIcon("Wrench", [
  [
    "path",
    {
      d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
      key: "cbrjhi"
    }
  ]
]);
const CATEGORIES = [
  { value: "lesson-plan", label: "Lesson Plans", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", icon: FileText },
  { value: "session-plan", label: "Session Plans", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", icon: Clock },
  { value: "notes", label: "Notes", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20", icon: BookOpen },
  { value: "guide", label: "Guides / Manuals", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20", icon: FolderOpen },
  { value: "report", label: "Reports", color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20", icon: ClipboardList },
  { value: "question-paper", label: "Question Papers", color: "text-teal-600 bg-teal-50 dark:bg-teal-900/20", icon: CircleHelp },
  { value: "other", label: "Other", color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20", icon: File }
];
function LibraryTab({ data, onAddLibraryResource, onDeleteLibraryResource, onUpdateLibraryResource }) {
  var _a;
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [filterCategory, setFilterCategory] = reactExports.useState("all");
  const [showUploadModal, setShowUploadModal] = reactExports.useState(false);
  const [uploadLimitMB] = useLocalStorage("admin_upload_limit_mb", 2);
  const [uploadTitle, setUploadTitle] = reactExports.useState("");
  const [uploadCategory, setUploadCategory] = reactExports.useState("lesson-plan");
  const [selectedFile, setSelectedFile] = reactExports.useState(null);
  const [isUploading, setIsUploading] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  const filteredResources = reactExports.useMemo(() => {
    return (data.library || []).filter((res) => {
      if (filterCategory !== "all" && res.category !== filterCategory) return false;
      if (searchQuery && !res.title.toLowerCase().includes(searchQuery.toLowerCase()) && !res.fileName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [data.library, filterCategory, searchQuery]);
  reactExports.useMemo(() => {
    const groups = {};
    CATEGORIES.forEach((cat) => {
      const items = filteredResources.filter((r) => r.category === cat.value);
      if (items.length > 0) {
        groups[cat.value] = items;
      }
    });
    return groups;
  }, [filteredResources]);
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > uploadLimitMB * 1024 * 1024) {
        showToast(`File is too large. Max ${uploadLimitMB}MB.`, "error");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !uploadTitle) return;
    setIsUploading(true);
    try {
      const result = await uploadFile("library_documents", selectedFile, {
        fileName: selectedFile.name
      });
      onAddLibraryResource({
        title: uploadTitle,
        fileName: selectedFile.name,
        fileType: selectedFile.type || "application/octet-stream",
        category: uploadCategory,
        uploadedBy: (user == null ? void 0 : user.name) || "Unknown Instructor",
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        size: selectedFile.size,
        isApproved: (user == null ? void 0 : user.role) === "admin",
        // Auto-approve if Admin
        downloadUrl: result.publicUrl
      });
      showToast("File uploaded successfully", "success");
      setUploadTitle("");
      setUploadCategory("lesson-plan");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowUploadModal(false);
    } catch (err) {
      console.error("Supabase upload failed:", err);
      showToast(`Upload failed: ${err.message || "Unknown error"}`, "error");
    } finally {
      setIsUploading(false);
    }
  };
  const handleDownload = async (resource) => {
    if (!resource.isApproved && (user == null ? void 0 : user.role) !== "admin") {
      showToast("Cannot download! Document is pending Admin approval.", "error");
      return;
    }
    if (resource.downloadUrl) {
      window.open(resource.downloadUrl, "_blank");
      showToast("Download started", "success");
    } else {
      showToast("Download URL not available for this document.", "error");
    }
  };
  const handleToggleApproval = (resource) => {
    if ((user == null ? void 0 : user.role) !== "admin") return;
    onUpdateLibraryResource({
      ...resource,
      isApproved: !resource.isApproved
    });
  };
  const handleDelete = async (resource) => {
    if (window.confirm("Are you sure you want to delete this document forever?")) {
      if (resource.downloadUrl) {
        try {
          const urlParts = resource.downloadUrl.split("/library_documents/");
          if (urlParts[1]) {
            await deleteFile("library_documents", decodeURIComponent(urlParts[1]));
          }
        } catch (err) {
          console.warn("Could not delete file from storage:", err);
        }
      }
      onDeleteLibraryResource(resource.id);
    }
  };
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full animate-fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-shrink-0 p-4 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)] flex flex-wrap gap-4 items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 16 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-bold", children: [
            ((_a = data.library) == null ? void 0 : _a.length) || 0,
            " Documents"
          ] })
        ] }),
        (user == null ? void 0 : user.role) === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 16 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-bold", children: [
            (data.library || []).filter((r) => !r.isApproved).length,
            " Pending Approval"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 ml-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "Search documents...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "pl-9 pr-3 py-2 text-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] w-48 focus:w-64 transition-all outline-none input-glow shadow-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg shadow-sm overflow-hidden input-glow transition-shadow", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pl-3 py-2 border-r border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { size: 14 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: filterCategory,
              onChange: (e) => setFilterCategory(e.target.value),
              className: "px-3 py-2 text-sm bg-transparent border-none text-[var(--md-sys-color-on-surface)] font-medium outline-none cursor-pointer",
              "aria-label": "Filter documents by category",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Categories" }),
                CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c.value, children: c.label }, c.value))
              ]
            }
          )
        ] }),
        (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setShowUploadModal(true),
            className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md font-bold flex items-center gap-2 transition-all hover:scale-[1.02]",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { size: 16 }),
              " Upload Document"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-6", children: filteredResources.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "popLayout", children: filteredResources.map((resource, idx) => {
      const catInfo = CATEGORIES.find((c) => c.value === resource.category) || CATEGORIES[6];
      const CatFileIcon = catInfo.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          layout: true,
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.85 },
          transition: { delay: idx * 0.02 },
          className: "relative group glass-card rounded-xl overflow-hidden shadow-elevation-1 hover:shadow-elevation-3 transition-all cursor-pointer",
          title: `${resource.title}
${resource.fileName}
Category: ${catInfo.label}
${formatBytes(resource.size)} · ${resource.uploadedBy}
${new Date(resource.uploadedAt).toLocaleDateString()}`,
          children: [
            !resource.isApproved && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg z-20 flex items-center gap-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 8 }),
              " PENDING"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("flex items-center justify-center py-4", catInfo.color.split(" ").filter((c) => c.startsWith("bg-")).join(" ")), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CatFileIcon, { size: 32, className: catInfo.color.split(" ").find((c) => c.startsWith("text-")) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-2 pt-1.5 pb-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] truncate leading-tight", title: resource.title, children: resource.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] text-[var(--md-sys-color-secondary)] truncate mt-0.5", children: [
                formatBytes(resource.size),
                " · ",
                new Date(resource.uploadedAt).toLocaleDateString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full", catInfo.color), children: catInfo.label })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden md:flex absolute inset-0 bg-[var(--md-sys-color-surface)]/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex-col items-center justify-center gap-1.5 p-2 z-10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold text-[var(--md-sys-color-on-surface)] text-center truncate w-full mb-1", children: resource.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    handleDownload(resource);
                  },
                  disabled: !resource.isApproved && (user == null ? void 0 : user.role) !== "admin",
                  className: "w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 rounded-lg text-[10px] font-bold transition-colors tap-target",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 12 }),
                    " Download"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 w-full", children: [
                (user == null ? void 0 : user.role) === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      handleToggleApproval(resource);
                    },
                    className: clsx(
                      "flex-1 py-1 rounded-lg text-white text-[9px] font-bold flex items-center justify-center gap-0.5 transition-colors tap-target",
                      resource.isApproved ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
                    ),
                    children: [
                      resource.isApproved ? /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 10 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 10 }),
                      resource.isApproved ? "Revoke" : "Approve"
                    ]
                  }
                ),
                ((user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.name) === resource.uploadedBy) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      handleDelete(resource);
                    },
                    className: "flex-1 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 rounded-lg text-[9px] font-bold flex items-center justify-center gap-0.5 transition-colors tap-target",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 10 }),
                      " Delete"
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex md:hidden flex-col gap-1.5 px-2 pb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    handleDownload(resource);
                  },
                  disabled: !resource.isApproved && (user == null ? void 0 : user.role) !== "admin",
                  className: "w-full flex items-center justify-center gap-1 px-2 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 rounded-lg text-[12px] font-bold transition-colors tap-target",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14 }),
                    " Download"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 w-full", children: [
                (user == null ? void 0 : user.role) === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      handleToggleApproval(resource);
                    },
                    className: clsx(
                      "flex-1 py-2 rounded-lg text-white text-[10px] font-bold flex items-center justify-center transition-colors tap-target",
                      resource.isApproved ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
                    ),
                    title: resource.isApproved ? "Revoke" : "Approve",
                    children: resource.isApproved ? /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 14 })
                  }
                ),
                ((user == null ? void 0 : user.role) === "admin" || (user == null ? void 0 : user.name) === resource.uploadedBy) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      handleDelete(resource);
                    },
                    className: "flex-1 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 rounded-lg flex items-center justify-center transition-colors tap-target",
                    title: "Delete",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14 })
                  }
                )
              ] })
            ] })
          ]
        },
        resource.id
      );
    }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 48, className: "text-indigo-300 dark:text-indigo-700" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-2", children: "No Documents Found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[var(--md-sys-color-secondary)] max-w-md", children: searchQuery || filterCategory !== "all" ? "Try adjusting your filters to find what you're looking for." : "The digital library is currently empty. Upload a lesson plan or manual to get started." }),
      (user == null ? void 0 : user.role) !== "viewer" && !(searchQuery || filterCategory !== "all") && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setShowUploadModal(true),
          className: "mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { size: 18 }),
            " Upload First Document"
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showUploadModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { scale: 0.95, y: 20 },
            animate: { scale: 1, y: 0 },
            exit: { scale: 0.95, y: 20 },
            className: "glass-panel shadow-elevation-3 w-full max-w-md overflow-hidden flex flex-col",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 border-b border-[var(--md-sys-color-outline)] flex items-center justify-between bg-indigo-600 text-white rounded-t-3xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { size: 20 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-lg", children: "Upload to Library" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setShowUploadModal(false),
                    className: "p-1 hover:bg-white/20 rounded-full text-white transition-colors",
                    "aria-label": "Close upload modal",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20 })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleUploadSubmit, className: "p-6 space-y-5", children: [
                (user == null ? void 0 : user.role) !== "admin" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-400 text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 18, className: "flex-shrink-0 mt-0.5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Security Notice:" }),
                    " All uploaded files must be approved by an Administrator before they are accessible to others."
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1", children: "Document File *" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative border-2 border-dashed border-[var(--md-sys-color-outline)] rounded-xl p-6 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors text-center cursor-pointer", onClick: () => {
                    var _a2;
                    return (_a2 = fileInputRef.current) == null ? void 0 : _a2.click();
                  }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        ref: fileInputRef,
                        type: "file",
                        className: "hidden",
                        accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt",
                        onChange: handleFileSelect,
                        "aria-label": "Select document file to upload"
                      }
                    ),
                    selectedFile ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 24 }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)] text-sm break-all", children: selectedFile.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-secondary)] mt-1", children: formatBytes(selectedFile.size) })
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 bg-gray-100 dark:bg-gray-800 text-[var(--md-sys-color-secondary)] rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { size: 24 }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-[var(--md-sys-color-on-surface)] text-sm", children: "Click to browse files" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-[var(--md-sys-color-secondary)] mt-1", children: [
                        "PDF, DOC, DOCX (Max ",
                        uploadLimitMB,
                        "MB)"
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1", children: "Document Title *" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "text",
                      required: true,
                      placeholder: "e.g. Week 4 Introduction to Solar",
                      className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow text-[var(--md-sys-color-on-surface)] transition-all font-google",
                      value: uploadTitle,
                      onChange: (e) => setUploadTitle(e.target.value)
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-2", children: "Category *" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: CATEGORIES.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setUploadCategory(cat.value),
                      className: clsx(
                        "px-3 py-2.5 rounded-xl border font-medium text-sm transition-all",
                        uploadCategory === cat.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm" : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]"
                      ),
                      children: cat.label
                    },
                    cat.value
                  )) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 flex gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      disabled: isUploading,
                      onClick: () => setShowUploadModal(false),
                      className: "flex-1 px-4 py-2.5 border border-[var(--md-sys-color-outline)] rounded-xl font-bold hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] transition-all",
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "submit",
                      disabled: !selectedFile || !uploadTitle || isUploading,
                      className: "flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                      children: isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }),
                        " Uploading..."
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: "Upload Securely" })
                    }
                  )
                ] })
              ] })
            ]
          }
        )
      }
    ) })
  ] });
}
const RESOURCE_TYPES = [
  { value: "room", label: "Room / Hall", icon: PanelsTopLeft },
  { value: "equipment", label: "Equipment", icon: Monitor },
  { value: "other", label: "Other", icon: Box }
];
const STATUS_OPTIONS = [
  { value: "available", label: "Available", icon: CircleCheckBig, color: "text-green-600 bg-green-50 dark:bg-green-900/30" },
  { value: "in-use", label: "In Use", icon: CircleAlert, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/30" }
];
function Resources({
  data,
  onAddResource,
  onDeleteResource,
  onUpdateResource,
  onAddLibraryResource,
  onDeleteLibraryResource,
  onUpdateLibraryResource
}) {
  var _a, _b, _c, _d;
  const [mainTab, setMainTab] = reactExports.useState("physical");
  const [showAddModal, setShowAddModal] = reactExports.useState(false);
  const [filterType, setFilterType] = reactExports.useState("all");
  const [filterStatus, setFilterStatus] = reactExports.useState("all");
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [selectedResource, setSelectedResource] = reactExports.useState(null);
  const [drawerTab, setDrawerTab] = reactExports.useState("edit");
  const [editForm, setEditForm] = reactExports.useState({});
  const [newResource, setNewResource] = reactExports.useState({
    name: "",
    type: "room",
    capacity: void 0,
    location: "",
    status: "available",
    notes: ""
  });
  const { showToast } = useToast();
  const { user } = useAuth();
  const generateId = () => `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const createLogEntry = (action, note, slotId) => ({
    id: generateId(),
    date: (/* @__PURE__ */ new Date()).toISOString(),
    action,
    note,
    slotId
  });
  const handleCreate = (e) => {
    e.preventDefault();
    if (!newResource.name) return;
    const initialLog = createLogEntry("created", `Resource "${newResource.name}" was created`);
    onAddResource({
      name: newResource.name,
      type: newResource.type || "room",
      capacity: newResource.capacity,
      location: newResource.location,
      status: newResource.status || "available",
      notes: newResource.notes,
      usageHistory: [initialLog]
    });
    setNewResource({ name: "", type: "room", capacity: void 0, location: "", status: "available", notes: "" });
    setShowAddModal(false);
    showToast("Resource created successfully", "success");
  };
  const handleOpenDrawer = (resource) => {
    setSelectedResource(resource);
    setEditForm({ ...resource });
    setDrawerTab("edit");
  };
  const handleCloseDrawer = () => {
    setSelectedResource(null);
    setEditForm({});
  };
  const handleSaveEdit = () => {
    if (!selectedResource || !editForm.name) return;
    const hasChanges = JSON.stringify(selectedResource) !== JSON.stringify(editForm);
    if (!hasChanges) {
      handleCloseDrawer();
      return;
    }
    const updateLog = createLogEntry("updated", "Resource details updated");
    const existingHistory = selectedResource.usageHistory || [];
    let statusLog = null;
    if (editForm.status !== selectedResource.status) {
      if (editForm.status === "maintenance") {
        statusLog = createLogEntry("maintenance-start", "Marked for maintenance");
      } else if (selectedResource.status === "maintenance") {
        statusLog = createLogEntry("maintenance-end", "Maintenance completed");
      }
    }
    const updatedResource = {
      ...selectedResource,
      ...editForm,
      usageHistory: statusLog ? [...existingHistory, updateLog, statusLog] : [...existingHistory, updateLog]
    };
    onUpdateResource(updatedResource);
    handleCloseDrawer();
  };
  const handleQuickStatusChange = (resource, newStatus) => {
    if (resource.status === newStatus) return;
    let statusLog;
    if (newStatus === "maintenance") {
      statusLog = createLogEntry("maintenance-start", "Marked for maintenance");
    } else if (resource.status === "maintenance") {
      statusLog = createLogEntry("maintenance-end", "Maintenance completed");
    } else {
      statusLog = createLogEntry("updated", `Status changed to ${newStatus}`);
    }
    const updatedResource = {
      ...resource,
      status: newStatus,
      usageHistory: [...resource.usageHistory || [], statusLog]
    };
    onUpdateResource(updatedResource);
    showToast(`Status updated to ${newStatus}`, "success");
  };
  const IconMap = {
    "room": PanelsTopLeft,
    "equipment": Monitor,
    "other": Box
  };
  const StatusIcon = {
    "available": CircleCheckBig,
    "in-use": CircleAlert,
    "maintenance": Wrench
  };
  const filteredResources = reactExports.useMemo(() => {
    return (data.resources || []).filter((resource) => {
      if (filterType !== "all" && resource.type !== filterType) return false;
      if (filterStatus !== "all" && resource.status !== filterStatus) return false;
      if (searchQuery && !resource.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [data.resources, filterType, filterStatus, searchQuery]);
  const getResourceScheduleSlots = (resourceId) => {
    return (data.schedule || []).filter((slot) => {
      var _a2;
      return (_a2 = slot.resourceIds) == null ? void 0 : _a2.includes(resourceId);
    });
  };
  const totalResources = ((_a = data.resources) == null ? void 0 : _a.length) || 0;
  const availableCount = ((_b = data.resources) == null ? void 0 : _b.filter((r) => r.status === "available" || !r.status).length) || 0;
  const inUseCount = ((_c = data.resources) == null ? void 0 : _c.filter((r) => r.status === "in-use").length) || 0;
  const maintenanceCount = ((_d = data.resources) == null ? void 0 : _d.filter((r) => r.status === "maintenance").length) || 0;
  const getDayName = (dayOfWeek) => {
    const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayOfWeek] || "Unknown";
  };
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const getActionLabel = (action) => {
    const labels = {
      "created": { text: "Created", color: "text-blue-600 bg-blue-50" },
      "updated": { text: "Updated", color: "text-purple-600 bg-purple-50" },
      "assigned": { text: "Assigned", color: "text-green-600 bg-green-50" },
      "released": { text: "Released", color: "text-gray-600 bg-gray-50" },
      "maintenance-start": { text: "Maintenance Started", color: "text-orange-600 bg-orange-50" },
      "maintenance-end": { text: "Maintenance Ended", color: "text-green-600 bg-green-50" }
    };
    return labels[action] || { text: action, color: "text-gray-600 bg-gray-50" };
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-[var(--md-sys-color-background)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-shrink-0 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline)] p-6 z-20 pb-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PageHeader,
        {
          title: "Resources & Library",
          subtitle: "Manage physical assets and digital learning materials",
          icon: Box,
          color: "text-amber-500",
          action: (user == null ? void 0 : user.role) !== "viewer" && mainTab === "physical" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setShowAddModal(true),
              className: "px-5 py-2.5 bg-[var(--md-sys-color-primary)] hover:bg-amber-600 text-white rounded-xl shadow-md font-bold flex items-center gap-2 transition-all hover:-translate-y-0.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 18 }),
                " Add Resource"
              ]
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex mt-6 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setMainTab("physical"),
            className: clsx(
              "pb-4 font-bold text-sm transition-colors border-b-2",
              mainTab === "physical" ? "border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]" : "border-transparent text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { size: 16 }),
              " Physical Resources"
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setMainTab("library"),
            className: clsx(
              "pb-4 font-bold text-sm transition-colors border-b-2",
              mainTab === "library" ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" : "border-transparent text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { size: 16 }),
              " Digital Library"
            ] })
          }
        )
      ] })
    ] }),
    mainTab === "physical" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 p-4 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { size: 16, className: "text-amber-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium text-[var(--md-sys-color-on-surface)]", children: [
            totalResources,
            " Total"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 16, className: "text-green-600" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium text-green-700 dark:text-green-400", children: [
            availableCount,
            " Available"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 16, className: "text-blue-600" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium text-blue-700 dark:text-blue-400", children: [
            inUseCount,
            " In Use"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { size: 16, className: "text-orange-600" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium text-orange-700 dark:text-orange-400", children: [
            maintenanceCount,
            " Maintenance"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 ml-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                placeholder: "Search...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-3 py-1.5 text-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] w-40 focus:w-56 transition-all outline-none input-glow"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { size: 14, className: "text-[var(--md-sys-color-secondary)]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: filterType,
              onChange: (e) => setFilterType(e.target.value),
              className: "px-3 py-1.5 text-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all",
              "aria-label": "Filter by resource type",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Types" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "room", children: "Rooms" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "equipment", children: "Equipment" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "other", children: "Other" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: filterStatus,
              onChange: (e) => setFilterStatus(e.target.value),
              className: "px-3 py-1.5 text-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all",
              "aria-label": "Filter by status",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Status" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "available", children: "Available" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "in-use", children: "In Use" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "maintenance", children: "Maintenance" })
              ]
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "popLayout", children: filteredResources.map((resource, idx) => {
          const Icon = IconMap[resource.type] || Box;
          const StatusIconComponent = StatusIcon[resource.status || "available"] || CircleCheckBig;
          const statusColor = resource.status === "in-use" ? "text-blue-600" : resource.status === "maintenance" ? "text-orange-600" : "text-green-600";
          const assignedSlots = getResourceScheduleSlots(resource.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              layout: true,
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, scale: 0.9 },
              transition: { delay: idx * 0.05 },
              onClick: () => handleOpenDrawer(resource),
              className: "glass-card p-6 shadow-elevation-1 hover:shadow-elevation-3 transition-all group cursor-pointer",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                      "p-3 rounded-xl",
                      resource.type === "room" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : resource.type === "equipment" ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    ), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 24 }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-[var(--md-sys-color-on-surface)]", children: resource.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-semibold", children: resource.type })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1", children: (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          handleOpenDrawer(resource);
                        },
                        className: "p-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
                        "aria-label": "Edit resource",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 16 })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete this resource?")) onDeleteResource(resource.id);
                        },
                        className: "p-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
                        "aria-label": "Delete resource",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 16 })
                      }
                    )
                  ] }) })
                ] }),
                resource.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3 line-clamp-2 italic", children: [
                  '"',
                  resource.notes,
                  '"'
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 border-t border-[var(--md-sys-color-outline)] pt-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(StatusIconComponent, { size: 14, className: statusColor }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("text-sm font-medium capitalize", statusColor), children: resource.status || "Available" })
                    ] }),
                    (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: STATUS_OPTIONS.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          handleQuickStatusChange(resource, opt.value);
                        },
                        className: clsx(
                          "p-1 rounded transition-colors",
                          resource.status === opt.value ? opt.color : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        ),
                        title: opt.label,
                        "aria-label": `Set status to ${opt.label}`,
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(opt.icon, { size: 12 })
                      },
                      opt.value
                    )) })
                  ] }),
                  resource.location && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 14 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: resource.location })
                  ] }),
                  resource.capacity && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 14 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
                      "Capacity: ",
                      resource.capacity
                    ] })
                  ] }),
                  assignedSlots.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded-lg w-fit", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { size: 12 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium", children: [
                      assignedSlots.length,
                      " class",
                      assignedSlots.length > 1 ? "es" : ""
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end mt-3 text-xs text-[var(--md-sys-color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity", children: [
                  "Click to view details ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 14 })
                ] })
              ]
            },
            resource.id
          );
        }) }),
        filteredResources.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-full py-12 text-center text-[var(--md-sys-color-on-surface-variant)] flex flex-col items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { size: 48, className: "mb-4 opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "No resources found" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: filterType !== "all" || filterStatus !== "all" || searchQuery ? "Try adjusting your filters" : "Add one to get started" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: selectedResource && /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          className: "fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end",
          onClick: handleCloseDrawer,
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { x: "100%" },
              animate: { x: 0 },
              exit: { x: "100%" },
              transition: { type: "spring", damping: 25, stiffness: 200 },
              onClick: (e) => e.stopPropagation(),
              className: "w-full max-w-lg glass-panel h-full shadow-elevation-3 flex flex-col rounded-none rounded-l-3xl border-y-0 border-r-0",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border-b border-[var(--md-sys-color-outline)] flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 rounded-tl-3xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white", children: selectedResource.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/80 text-sm capitalize", children: selectedResource.type })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: handleCloseDrawer,
                      className: "p-2 hover:bg-white/20 rounded-full transition-colors",
                      "aria-label": "Close drawer",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20, className: "text-white" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex border-b border-[var(--md-sys-color-outline)]", children: [
                  { id: "edit", label: (user == null ? void 0 : user.role) === "viewer" ? "Details" : "Edit", icon: PenLine },
                  { id: "schedule", label: "Schedule", icon: Calendar },
                  { id: "history", label: "History", icon: History }
                ].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => setDrawerTab(tab.id),
                    className: clsx(
                      "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                      drawerTab === tab.id ? "text-amber-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                    ),
                    "aria-label": tab.label,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { size: 16 }),
                      tab.label,
                      drawerTab === tab.id && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        motion.div,
                        {
                          layoutId: "activeDrawerTab",
                          className: "absolute bottom-0 left-4 right-4 h-[2px] bg-amber-500"
                        }
                      )
                    ]
                  },
                  tab.id
                )) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-auto p-6", children: [
                  drawerTab === "edit" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1", children: "Resource Name" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "text",
                          disabled: (user == null ? void 0 : user.role) === "viewer",
                          className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 font-google",
                          value: editForm.name || "",
                          onChange: (e) => setEditForm({ ...editForm, name: e.target.value }),
                          "aria-label": "Resource Name"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-2", children: "Type" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: RESOURCE_TYPES.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          type: "button",
                          disabled: (user == null ? void 0 : user.role) === "viewer",
                          onClick: () => setEditForm({ ...editForm, type: type.value }),
                          className: clsx(
                            "p-3 border rounded-xl flex flex-col items-center gap-1 transition-all",
                            editForm.type === type.value ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm" : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-on-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]",
                            (user == null ? void 0 : user.role) === "viewer" && "opacity-70 cursor-not-allowed"
                          ),
                          "aria-label": `Type: ${type.label}`,
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(type.icon, { size: 20 }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium", children: type.label })
                          ]
                        },
                        type.value
                      )) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1", children: "Capacity" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "number",
                              min: "0",
                              disabled: (user == null ? void 0 : user.role) === "viewer",
                              className: "w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 font-google",
                              value: editForm.capacity || "",
                              onChange: (e) => setEditForm({ ...editForm, capacity: e.target.value ? parseInt(e.target.value) : void 0 }),
                              "aria-label": "Capacity"
                            }
                          )
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1", children: "Location" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "input",
                            {
                              type: "text",
                              disabled: (user == null ? void 0 : user.role) === "viewer",
                              className: "w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 font-google",
                              value: editForm.location || "",
                              onChange: (e) => setEditForm({ ...editForm, location: e.target.value }),
                              "aria-label": "Location"
                            }
                          )
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-2", children: "Status" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: STATUS_OPTIONS.map((status) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          type: "button",
                          disabled: (user == null ? void 0 : user.role) === "viewer",
                          onClick: () => setEditForm({ ...editForm, status: status.value }),
                          className: clsx(
                            "p-2.5 border rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium",
                            editForm.status === status.value ? clsx("border-2", status.color) : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]",
                            (user == null ? void 0 : user.role) === "viewer" && "opacity-70 cursor-not-allowed"
                          ),
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(status.icon, { size: 14 }),
                            status.label
                          ]
                        },
                        status.value
                      )) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "inline mr-1" }),
                        "Notes / Description"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "textarea",
                        {
                          rows: 4,
                          disabled: (user == null ? void 0 : user.role) === "viewer",
                          className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] resize-none disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 font-google",
                          placeholder: "Add notes about this resource...",
                          value: editForm.notes || "",
                          onChange: (e) => setEditForm({ ...editForm, notes: e.target.value })
                        }
                      )
                    ] })
                  ] }),
                  drawerTab === "schedule" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-secondary)] mb-4", children: "Classes that use this resource are shown below. Assign resources from the Schedule tab." }),
                    getResourceScheduleSlots(selectedResource.id).length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: getResourceScheduleSlots(selectedResource.id).map((slot) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "p-4 bg-[var(--md-sys-color-surface-variant)] rounded-xl border border-[var(--md-sys-color-outline)]",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                            "p-2 rounded-lg",
                            getSubjectPill(slot.subject || "").bg,
                            getSubjectPill(slot.subject || "").text
                          ), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 18 }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-[var(--md-sys-color-on-surface)]", children: [
                              slot.subject,
                              " - Grade ",
                              slot.grade
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-[var(--md-sys-color-secondary)]", children: [
                              getDayName(slot.dayOfWeek),
                              " at ",
                              slot.startTime,
                              " (",
                              slot.durationMinutes,
                              "min)"
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
                            "px-2 py-1 rounded text-xs font-medium",
                            slot.status === "Completed" ? "bg-green-100 text-green-700" : slot.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                          ), children: slot.status })
                        ] })
                      },
                      slot.id
                    )) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 text-[var(--md-sys-color-on-surface-variant)]", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 48, className: "mx-auto mb-4 opacity-20" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "No scheduled classes" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "This resource isn't assigned to any classes yet" })
                    ] })
                  ] }),
                  drawerTab === "history" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-secondary)] mb-4", children: "Usage history and activity log for this resource." }),
                    (selectedResource.usageHistory || []).length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--md-sys-color-outline)]" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: [...selectedResource.usageHistory || []].reverse().map((log, idx) => {
                        const actionInfo = getActionLabel(log.action);
                        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative pl-10", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
                            "absolute left-2 top-2 w-4 h-4 rounded-full border-2 border-[var(--md-sys-color-surface)]",
                            actionInfo.color.replace("text-", "bg-").split(" ")[0]
                          ) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase", actionInfo.color), children: actionInfo.text }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-[var(--md-sys-color-secondary)]", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 10, className: "inline mr-1" }),
                                formatDate(log.date)
                              ] })
                            ] }),
                            log.note && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-[var(--md-sys-color-on-surface)]", children: log.note })
                          ] })
                        ] }, log.id || idx);
                      }) })
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 text-[var(--md-sys-color-on-surface-variant)]", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 48, className: "mx-auto mb-4 opacity-20" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "No history yet" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Activity will be logged here" })
                    ] })
                  ] })
                ] }),
                drawerTab === "edit" && (user == null ? void 0 : user.role) !== "viewer" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-t border-[var(--md-sys-color-outline)] flex gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: handleCloseDrawer,
                      className: "flex-1 px-4 py-2.5 border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-xl font-semibold hover:bg-[var(--md-sys-color-surface-variant)] transition-colors",
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: handleSaveEdit,
                      disabled: !editForm.name,
                      className: "flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                      children: "Save Changes"
                    }
                  )
                ] })
              ]
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: showAddModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          className: "fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { scale: 0.95, opacity: 0 },
              animate: { scale: 1, opacity: 1 },
              exit: { scale: 0.95, opacity: 0 },
              className: "glass-panel shadow-elevation-3 w-full max-w-lg overflow-hidden",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border-b border-[var(--md-sys-color-outline)] flex justify-between items-center bg-[var(--md-sys-color-surface-variant)] rounded-t-3xl", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-[var(--md-sys-color-on-surface)]", children: "Add New Resource" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => setShowAddModal(false),
                      className: "p-2 hover:bg-[var(--md-sys-color-surface)] rounded-full text-[var(--md-sys-color-on-surface-variant)]",
                      "aria-label": "Close modal",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 20 })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleCreate, className: "p-6 space-y-5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1", children: "Resource Name *" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        autoFocus: true,
                        type: "text",
                        className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] font-google",
                        placeholder: "e.g. Projector A, Lab 1",
                        value: newResource.name,
                        onChange: (e) => setNewResource({ ...newResource, name: e.target.value })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-2", children: "Type" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: RESOURCE_TYPES.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setNewResource({ ...newResource, type: type.value }),
                        className: clsx(
                          "p-3 border rounded-xl flex flex-col items-center gap-1 transition-all",
                          newResource.type === type.value ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm" : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-on-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
                        ),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(type.icon, { size: 20 }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium", children: type.label })
                        ]
                      },
                      type.value
                    )) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1", children: "Capacity" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "number",
                            min: "0",
                            className: "w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] font-google",
                            placeholder: "e.g. 30",
                            value: newResource.capacity || "",
                            onChange: (e) => setNewResource({ ...newResource, capacity: e.target.value ? parseInt(e.target.value) : void 0 })
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1", children: "Location" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "text",
                            className: "w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] font-google",
                            placeholder: "e.g. Building A",
                            value: newResource.location || "",
                            onChange: (e) => setNewResource({ ...newResource, location: e.target.value })
                          }
                        )
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-2", children: "Status" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: STATUS_OPTIONS.map((status) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setNewResource({ ...newResource, status: status.value }),
                        className: clsx(
                          "p-2.5 border rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium",
                          newResource.status === status.value ? clsx("border-2", status.color) : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]"
                        ),
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(status.icon, { size: 14 }),
                          status.label
                        ]
                      },
                      status.value
                    )) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "inline mr-1" }),
                      "Notes / Description"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "textarea",
                      {
                        rows: 3,
                        className: "w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] resize-none font-google",
                        placeholder: "Add notes about this resource...",
                        value: newResource.notes || "",
                        onChange: (e) => setNewResource({ ...newResource, notes: e.target.value })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4 flex gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setShowAddModal(false),
                        className: "flex-1 px-4 py-2.5 border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-xl font-semibold hover:bg-[var(--md-sys-color-surface-variant)] transition-colors",
                        children: "Cancel"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "submit",
                        disabled: !newResource.name,
                        className: "flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                        children: "Create Resource"
                      }
                    )
                  ] })
                ] })
              ]
            }
          )
        }
      ) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      LibraryTab,
      {
        data,
        onAddLibraryResource,
        onDeleteLibraryResource,
        onUpdateLibraryResource
      }
    )
  ] });
}
export {
  Resources as default
};
