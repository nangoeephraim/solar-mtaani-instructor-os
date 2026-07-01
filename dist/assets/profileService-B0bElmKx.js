import { s as createLucideIcon, a as reactExports, j as jsxRuntimeExports, ad as supabase } from "./index-CTZ1eQC9.js";
import { u as uploadFile, l as listFiles, d as deleteFile } from "./cloudStorageService-CuUrox-L.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Palette = createLucideIcon("Palette", [
  ["circle", { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor", key: "1okk4w" }],
  ["circle", { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor", key: "f64h9f" }],
  ["circle", { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor", key: "fotxhn" }],
  ["circle", { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor", key: "qy21gx" }],
  [
    "path",
    {
      d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",
      key: "12rzf8"
    }
  ]
]);
const AVATAR_PALETTES = [
  { from: "#4285F4", to: "#1967D2" },
  // Google Blue
  { from: "#EA4335", to: "#C5221F" },
  // Google Red
  { from: "#FBBC04", to: "#F29900" },
  // Google Yellow
  { from: "#34A853", to: "#1E8E3E" },
  // Google Green
  { from: "#A142F4", to: "#7627BB" },
  // Purple
  { from: "#F538A0", to: "#D01884" },
  // Pink
  { from: "#00BCD4", to: "#00838F" },
  // Teal
  { from: "#FF6D00", to: "#E65100" }
  // Deep Orange
];
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
function getAvatarGradient(name) {
  return AVATAR_PALETTES[hashString(name) % AVATAR_PALETTES.length];
}
function getAvatarStyle(name) {
  const { from, to } = getAvatarGradient(name);
  return { background: `linear-gradient(135deg, ${from}, ${to})` };
}
function formatDateSeparator(dateStr) {
  const date = new Date(dateStr);
  const now = /* @__PURE__ */ new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric" });
}
function isSameDay(d1, d2) {
  return new Date(d1).toDateString() === new Date(d2).toDateString();
}
const UserAvatar = ({
  name,
  avatarUrl,
  size = 36,
  className = "",
  rounded = "xl"
}) => {
  const [status, setStatus] = reactExports.useState(
    avatarUrl ? "loading" : "error"
  );
  reactExports.useEffect(() => {
    if (avatarUrl) {
      setStatus("loading");
    } else {
      setStatus("error");
    }
  }, [avatarUrl]);
  const roundedClass = rounded === "full" ? "rounded-full" : "rounded-xl";
  const initial = (name || "?").charAt(0).toUpperCase();
  const sharedStyle = { width: size, height: size };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `relative flex-shrink-0 ${roundedClass} overflow-hidden ${className}`,
      style: sharedStyle,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `absolute inset-0 flex items-center justify-center font-bold text-white ${roundedClass}`,
            style: { ...getAvatarStyle(name), fontSize: size * 0.42 },
            children: initial
          }
        ),
        status === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `absolute inset-0 ${roundedClass} animate-pulse`,
            style: { background: "var(--md-sys-color-surface-variant)" }
          }
        ),
        avatarUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: avatarUrl,
            alt: name,
            draggable: false,
            onLoad: () => setStatus("loaded"),
            onError: () => setStatus("error"),
            className: `absolute inset-0 w-full h-full object-cover ${roundedClass} transition-opacity duration-300`,
            style: { opacity: status === "loaded" ? 1 : 0 }
          }
        )
      ]
    }
  );
};
async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    avatarUrl: data.avatar_url || null,
    phone: data.phone || null,
    department: data.department || null,
    bio: data.bio || null,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}
async function fetchActiveUsers(currentUserId) {
  const { data, error } = await supabase.from("profiles").select("*").neq("id", currentUserId).eq("is_active", true).order("name", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url || null,
    phone: row.phone || null,
    department: row.department || null,
    bio: row.bio || null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}
async function fetchAvatarMap(userIds) {
  if (userIds.length === 0) return {};
  const { data, error } = await supabase.from("profiles").select("id, avatar_url").in("id", userIds).not("avatar_url", "is", null);
  if (error || !data) return {};
  const map = {};
  for (const row of data) {
    if (row.avatar_url) map[row.id] = row.avatar_url;
  }
  return map;
}
async function updateProfile(payload) {
  const { error } = await supabase.rpc("update_own_profile", {
    p_name: payload.name ?? null,
    p_phone: payload.phone ?? null,
    p_department: payload.department ?? null,
    p_bio: payload.bio ?? null,
    p_avatar_url: payload.avatarUrl ?? null
  });
  if (error) {
    console.error("Failed to update profile:", error.message);
    return false;
  }
  return true;
}
async function uploadProfileAvatar(userId, file) {
  try {
    await removeAvatarFiles(userId);
  } catch {
  }
  const ext = file.name.split(".").pop() || "jpg";
  const result = await uploadFile("student_photos", file, {
    pathPrefix: "avatars",
    fileName: `${userId}.${ext}`,
    upsert: true
  });
  await supabase.from("profiles").update({ avatar_url: result.publicUrl, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", userId);
  return result.publicUrl;
}
async function removeProfileAvatar(userId) {
  await removeAvatarFiles(userId);
  await supabase.rpc("clear_own_avatar");
}
async function removeAvatarFiles(userId) {
  const files = await listFiles("student_photos", "avatars");
  const matching = files.filter((f) => f.name.startsWith(userId));
  if (matching.length > 0) {
    for (const f of matching) {
      await deleteFile("student_photos", `avatars/${f.name}`);
    }
  }
}
export {
  Palette as P,
  UserAvatar as U,
  updateProfile as a,
  fetchActiveUsers as b,
  fetchAvatarMap as c,
  formatDateSeparator as d,
  fetchProfile as f,
  getAvatarStyle as g,
  isSameDay as i,
  removeProfileAvatar as r,
  uploadProfileAvatar as u
};
