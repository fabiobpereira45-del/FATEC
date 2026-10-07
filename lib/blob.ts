import { put, del } from "@vercel/blob"

const MAX_SIZES: Record<string, number> = {
  avatar: 2 * 1024 * 1024,
  material: 25 * 1024 * 1024,
  testimonial: 2 * 1024 * 1024,
}

const ALLOWED_TYPES: Record<string, (type: string) => boolean> = {
  avatar: (t) => t.startsWith("image/"),
  testimonial: (t) => t.startsWith("image/"),
  material: (t) => t.startsWith("image/") || t === "application/pdf" ||
    t.startsWith("application/vnd.openxmlformats") || t === "application/msword",
}

export class UploadError extends Error {}

export async function uploadToBlob(file: File, folder: string, kind: keyof typeof MAX_SIZES) {
  if (file.size > MAX_SIZES[kind]) {
    throw new UploadError(`Arquivo muito grande (máx. ${Math.round(MAX_SIZES[kind] / 1024 / 1024)}MB).`)
  }
  if (!ALLOWED_TYPES[kind](file.type)) {
    throw new UploadError("Tipo de arquivo não permitido.")
  }
  const ext = file.name.split(".").pop() || "bin"
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  // Token passado explicitamente: em desenvolvimento, a detecção automática do
  // SDK tenta usar OIDC (não habilitado para este ambiente) antes do token fixo.
  const blob = await put(path, file, { access: "public", addRandomSuffix: false, token: process.env.BLOB_READ_WRITE_TOKEN })
  return blob.url
}

export async function deleteFromBlob(url: string) {
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {})
}
