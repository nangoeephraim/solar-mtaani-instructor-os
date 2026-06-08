import { o as createLucideIcon, a9 as supabase, bU as logSecurityEvent } from "./index-CWZOk6sM.js";
/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Upload = createLucideIcon("Upload", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "17 8 12 3 7 8", key: "t8dd8p" }],
  ["line", { x1: "12", x2: "12", y1: "3", y2: "15", key: "widbto" }]
]);
const BUCKET_SIZE_LIMITS = {
  library_documents: 20 * 1024 * 1024,
  // 20MB (matches Supabase bucket)
  student_photos: 2 * 1024 * 1024,
  //  2MB
  certificates: 10 * 1024 * 1024,
  // 10MB
  backups: 50 * 1024 * 1024
  // 50MB
};
const BUCKET_ALLOWED_TYPES = {
  library_documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "audio/webm",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "audio/aac",
    "video/mp4",
    "video/webm",
    "video/quicktime"
  ],
  student_photos: [
    "image/jpeg",
    "image/png",
    "image/webp"
  ],
  certificates: [
    "application/pdf",
    "image/png",
    "image/jpeg"
  ],
  backups: [
    "application/json",
    "text/plain"
  ]
};
const validateFile = (file, bucket) => {
  const maxSize = BUCKET_SIZE_LIMITS[bucket];
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    return `File is too large. Maximum size for this bucket is ${maxMB}MB.`;
  }
  const allowedTypes = BUCKET_ALLOWED_TYPES[bucket];
  const fileType = (file instanceof File ? file.type : file.type) || "";
  if (fileType && allowedTypes.length > 0) {
    const isExactMatch = allowedTypes.includes(fileType);
    const isMediaType = fileType.startsWith("image/") || fileType.startsWith("audio/") || fileType.startsWith("video/");
    const bucketAcceptsMedia = bucket === "library_documents";
    if (!isExactMatch && !(isMediaType && bucketAcceptsMedia)) {
      return `File type "${fileType}" is not allowed. Accepted types: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}`;
    }
  }
  return null;
};
const generateFilePath = (fileName, prefix) => {
  const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const uniqueName = `${Date.now()}_${sanitized}`;
  return prefix ? `${prefix}/${uniqueName}` : uniqueName;
};
const uploadFile = async (bucket, file, options) => {
  const validationError = validateFile(file, bucket);
  if (validationError) {
    throw new Error(validationError);
  }
  const fileName = (options == null ? void 0 : options.fileName) || (file instanceof File ? file.name : "file");
  const filePath = generateFilePath(fileName, options == null ? void 0 : options.pathPrefix);
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: (options == null ? void 0 : options.cacheControl) || "3600",
    upsert: (options == null ? void 0 : options.upsert) || false,
    contentType: options == null ? void 0 : options.contentType
  });
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  await logSecurityEvent({
    eventType: "FILE_UPLOADED",
    severity: "info",
    resourceType: bucket,
    details: { fileName, path: data.path, size: file.size }
  });
  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
    fullPath: data.fullPath || `${bucket}/${data.path}`
  };
};
const deleteFile = async (bucket, path) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
  await logSecurityEvent({
    eventType: "FILE_DELETED",
    severity: "info",
    resourceType: bucket,
    details: { path }
  });
};
const listFiles = async (bucket, prefix, options) => {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 100,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" }
  });
  if (error) {
    throw new Error(`List failed: ${error.message}`);
  }
  return (data || []).map((item) => {
    var _a;
    return {
      name: item.name,
      id: item.id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      size: (_a = item.metadata) == null ? void 0 : _a.size,
      metadata: item.metadata
    };
  });
};
export {
  Upload as U,
  deleteFile as d,
  listFiles as l,
  uploadFile as u
};
