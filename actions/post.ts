"use server"

import { db } from "@/db"
import { post, postImage, communityMember } from "@/db/schema"
import { createPostSchema, type CreatePostInput } from "@/lib/validations/post"
import { requireUser } from "@/lib/session"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

export async function createPost(input: CreatePostInput) {
  const user = await requireUser()

  const parsed = createPostSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const data = parsed.data

  const membership = await db.query.communityMember.findFirst({
    where: and(
      eq(communityMember.communityId, data.communityId),
      eq(communityMember.userId, user.id)
    ),
  })

  if (!membership) {
    return { error: "You must join the community before posting" }
  }

  const postId = nanoid()

  await db.transaction(async (tx) => {
    await tx.insert(post).values({
      id: postId,
      title: data.title,
      communityId: data.communityId,
      authorId: user.id,
      content: data.content ?? null,
      url: data.url ?? null,
      videoUrl: data.videoUrl ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      durationSeconds: data.durationSeconds ?? null,
    })

    if (data.imageUrls && data.imageUrls.length > 0) {
      await tx.insert(postImage).values(
        data.imageUrls.map((url, i) => ({
          id: nanoid(),
          postId,
          url,
          order: i,
        }))
      )
    }
  })

  revalidatePath(`/r/${data.communityId}`)

  return { success: true, postId }
}
