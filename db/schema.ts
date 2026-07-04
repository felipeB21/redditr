import { relations } from "drizzle-orm"
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  smallint,
  pgEnum,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core"

// ============================================================
// AUTH (Better Auth) + campos custom de perfil
// ============================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  username: text("username").notNull().unique(),
  displayUsername: text("display_username"),
  bio: text("bio"),
  banner: text("banner"),
  karma: integer("karma").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
)

// ============================================================
// USER FOLLOW (seguidores entre usuarios)
// ============================================================

export const userFollow = pgTable(
  "user_follow",
  {
    id: text("id").primaryKey(),
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_follow_unique_idx").on(
      table.followerId,
      table.followingId
    ),
    index("user_follow_followerId_idx").on(table.followerId),
    index("user_follow_followingId_idx").on(table.followingId),
  ]
)

// ============================================================
// COMMUNITY (/r/group-name)
// ============================================================

export const communityMemberRole = pgEnum("community_member_role", [
  "member",
  "moderator",
  "admin",
])

export const community = pgTable(
  "community",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(), // slug -> r/nextjs
    displayName: text("display_name").notNull(),
    description: text("description"),
    icon: text("icon"),
    banner: text("banner"),
    memberCount: integer("member_count").default(0).notNull(),
    postCount: integer("post_count").default(0).notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("community_name_idx").on(table.name)]
)

export const communityMember = pgTable(
  "community_member",
  {
    id: text("id").primaryKey(),
    communityId: text("community_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: communityMemberRole("role").default("member").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("community_member_unique_idx").on(
      table.communityId,
      table.userId
    ),
    index("community_member_userId_idx").on(table.userId),
    index("community_member_communityId_idx").on(table.communityId),
  ]
)

// ============================================================
// POST
// Un post puede combinar texto + link + imágenes + video,
// no son mutuamente excluyentes. Todos los campos de contenido
// son opcionales; se valida "al menos uno" a nivel de aplicación (Zod).
// ============================================================

export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content"), // texto opcional
    url: text("url"), // link opcional
    videoUrl: text("video_url"), // video opcional (uno solo por post)
    thumbnailUrl: text("thumbnail_url"), // preview del video
    durationSeconds: integer("duration_seconds"), // duración del video
    communityId: text("community_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    upvotes: integer("upvotes").default(0).notNull(),
    downvotes: integer("downvotes").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("post_communityId_idx").on(table.communityId),
    index("post_authorId_idx").on(table.authorId),
    index("post_createdAt_idx").on(table.createdAt),
  ]
)

// Imágenes en tabla aparte porque un post puede tener varias (galería)
export const postImage = pgTable(
  "post_image",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    order: integer("order").default(0).notNull(), // orden dentro de la galería
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("post_image_postId_idx").on(table.postId)]
)

// ============================================================
// COMMENT (anidados con parentId auto-referenciado)
// ============================================================

export const comment = pgTable(
  "comment",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references((): AnyPgColumn => comment.id, {
      onDelete: "cascade",
    }),
    depth: integer("depth").default(0).notNull(),
    upvotes: integer("upvotes").default(0).notNull(),
    downvotes: integer("downvotes").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("comment_postId_idx").on(table.postId),
    index("comment_authorId_idx").on(table.authorId),
    index("comment_parentId_idx").on(table.parentId),
  ]
)

// ============================================================
// VOTES (value: 1 = upvote, -1 = downvote)
// ============================================================

export const postVote = pgTable(
  "post_vote",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    value: smallint("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("post_vote_unique_idx").on(table.postId, table.userId),
    index("post_vote_postId_idx").on(table.postId),
  ]
)

export const commentVote = pgTable(
  "comment_vote",
  {
    id: text("id").primaryKey(),
    commentId: text("comment_id")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    value: smallint("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("comment_vote_unique_idx").on(table.commentId, table.userId),
    index("comment_vote_commentId_idx").on(table.commentId),
  ]
)

// ============================================================
// RELATIONS
// ============================================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  communities: many(communityMember),
  posts: many(post),
  comments: many(comment),
  postVotes: many(postVote),
  commentVotes: many(commentVote),
  createdCommunities: many(community),
  followers: many(userFollow, { relationName: "followers" }),
  following: many(userFollow, { relationName: "following" }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const userFollowRelations = relations(userFollow, ({ one }) => ({
  follower: one(user, {
    fields: [userFollow.followerId],
    references: [user.id],
    relationName: "following",
  }),
  following: one(user, {
    fields: [userFollow.followingId],
    references: [user.id],
    relationName: "followers",
  }),
}))

export const communityRelations = relations(community, ({ one, many }) => ({
  creator: one(user, {
    fields: [community.createdBy],
    references: [user.id],
  }),
  members: many(communityMember),
  posts: many(post),
}))

export const communityMemberRelations = relations(
  communityMember,
  ({ one }) => ({
    community: one(community, {
      fields: [communityMember.communityId],
      references: [community.id],
    }),
    user: one(user, {
      fields: [communityMember.userId],
      references: [user.id],
    }),
  })
)

export const postRelations = relations(post, ({ one, many }) => ({
  community: one(community, {
    fields: [post.communityId],
    references: [community.id],
  }),
  author: one(user, {
    fields: [post.authorId],
    references: [user.id],
  }),
  comments: many(comment),
  votes: many(postVote),
  images: many(postImage),
}))

export const postImageRelations = relations(postImage, ({ one }) => ({
  post: one(post, { fields: [postImage.postId], references: [post.id] }),
}))

export const commentRelations = relations(comment, ({ one, many }) => ({
  post: one(post, {
    fields: [comment.postId],
    references: [post.id],
  }),
  author: one(user, {
    fields: [comment.authorId],
    references: [user.id],
  }),
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "commentReplies",
  }),
  replies: many(comment, {
    relationName: "commentReplies",
  }),
  votes: many(commentVote),
}))

export const postVoteRelations = relations(postVote, ({ one }) => ({
  post: one(post, { fields: [postVote.postId], references: [post.id] }),
  user: one(user, { fields: [postVote.userId], references: [user.id] }),
}))

export const commentVoteRelations = relations(commentVote, ({ one }) => ({
  comment: one(comment, {
    fields: [commentVote.commentId],
    references: [comment.id],
  }),
  user: one(user, { fields: [commentVote.userId], references: [user.id] }),
}))
