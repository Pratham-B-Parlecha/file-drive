import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    name: v.string(),
    type: v.union(v.literal("image"), v.literal("pdf"), v.literal("csv")),
    orgId: v.optional(v.string()),
    fileId: v.id("_storage"),
  }).index("by_orgId", ["orgId"]),
  favorite: defineTable({
    fileId: v.id("files"),
    orgId: v.string(),
    userId: v.id("users"),
  }).index("by_userId_orgId_fileId", ["userId", "orgId", "fileId"]),
  users: defineTable({
    tokenIdentifier: v.string(),
    orgIds: v.array(
      v.object({
        orgId: v.string(),
        role: v.union(v.literal("admin"), v.literal("member")),
      })
    ),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),
});
