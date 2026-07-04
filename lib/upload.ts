"use client"

import { supabaseBrowser } from "@/lib/supabase/client"
import { createSignedUploadUrl } from "@/actions/upload"

type MediaKind = "image" | "video"

export async function uploadFileDirect(file: File, kind: MediaKind) {
  const result = await createSignedUploadUrl(kind, file.name, file.type)

  if ("error" in result && result.error) {
    throw new Error(result.error)
  }

  const { bucket, path, token, publicUrl } = result as {
    bucket: string
    path: string
    token: string
    publicUrl: string
  }

  const { error } = await supabaseBrowser.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file)

  if (error) {
    throw new Error(`Error al subir el archivo: ${error.message}`)
  }

  return publicUrl
}
