import { z } from "zod"

export const createPostSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(300),
    communityId: z.string().min(1),
    content: z.string().max(500).optional(),
    url: z.url("URL is invalid").optional(),
    imageUrls: z
      .array(z.url("Image URL is invalid"))
      .max(3, "Maximum 3 images")
      .optional(),
    videoUrl: z.url("Video URL is invalid").optional(),
    thumbnailUrl: z.url("Thumbnail URL is invalid").optional(),
    durationSeconds: z.number().int().positive().optional(),
  })
  .refine(
    (data) =>
      !!data.content ||
      !!data.url ||
      (data.imageUrls && data.imageUrls.length > 0) ||
      !!data.videoUrl,
    { message: "The post needs at least text, link, image or video" }
  )

export type CreatePostInput = z.infer<typeof createPostSchema>
