"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { requireUser } from "@/lib/session"
import { nanoid } from "nanoid"

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]

type MediaKind = "image" | "video"

const BUCKETS: Record<MediaKind, string> = {
  image: "post-images",
  video: "post-videos",
}

const ALLOWED_TYPES: Record<MediaKind, string[]> = {
  image: ALLOWED_IMAGE_TYPES,
  video: ALLOWED_VIDEO_TYPES,
}

export async function createSignedUploadUrl(
  kind: MediaKind,
  fileName: string,
  mimeType: string
) {
  const user = await requireUser()

  if (!ALLOWED_TYPES[kind].includes(mimeType)) {
    return { error: "Formato de archivo no soportado" }
  }

  const ext = fileName.split(".").pop()
  const path = `${user.id}/${nanoid()}.${ext}`
  const bucket = BUCKETS[kind]

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error || !data) {
    return { error: "No se pudo generar la URL de subida" }
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(path)

  return {
    success: true,
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    bucket,
    publicUrl: publicUrlData.publicUrl,
  }
}
