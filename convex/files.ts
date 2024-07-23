import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }
  return await ctx.storage.generateUploadUrl();
});

async function hasAccessToOrg(ctx: MutationCtx | QueryCtx, orgId: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();
  if (!user) {
    return null;
  }
  const hasAccess =
    user.orgIds.some((item) => item.orgId === orgId) ||
    user.tokenIdentifier.includes(orgId);
  if (!hasAccess) {
    return null;
  }
  return { user };
}

export const createFile = mutation({
  args: {
    name: v.string(),
    fileId: v.id("_storage"),
    orgId: v.string(),
    type: v.union(v.literal("image"), v.literal("pdf"), v.literal("csv")),
  },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      throw new ConvexError("you do not have access to this org");
    }

    await ctx.db.insert("files", {
      name: args.name,
      fileId: args.fileId,
      orgId: args.orgId,
      type: args.type,
      userId: hasAccess.user._id,
    });
  },
});

export const getFiles = query({
  args: {
    orgId: v.string(),
    query: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
    deleted: v.optional(v.boolean()),
    type: v.optional(
      v.union(v.literal("image"), v.literal("pdf"), v.literal("csv"))
    ),
  },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);
    if (!hasAccess) {
      return [];
    }
    let files = await ctx.db
      .query("files")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const query = args.query;
    if (query) {
      files = files.filter((file) =>
        file.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (args.favorite) {
      const favorite = await ctx.db
        .query("favorite")
        .withIndex("by_userId_orgId_fileId", (q) =>
          q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId)
        )
        .collect();
      files = files.filter((file) =>
        favorite.some((f) => f.fileId === file._id)
      );
    }
    if (args.deleted) {
      files = files.filter((file) => file.shouldDeleted);
    } else {
      files = files.filter((file) => !file.shouldDeleted);
    }

    if (args.type) {
      files = files.filter((file) => file.type === args.type);
    }
    files = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.fileId),
      }))
    );
    return files;
  },
});

export const deleteAllFiles = internalMutation({
  args: {},
  async handler(ctx, args) {
    const files = await ctx.db
      .query("files")
      .withIndex("by_shouldDeleted", (q) => q.eq("shouldDeleted", true))
      .collect();
    await Promise.all(
      files.map(async (file) => {
        await ctx.storage.delete(file.fileId);
        return await ctx.db.delete(file._id);
      })
    );
  },
});

export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  async handler(ctx, args) {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError("file not found");
    }
    const hasAccess = await hasAccessToOrg(ctx, file.orgId || "");
    if (!hasAccess) {
      throw new ConvexError("have no access to the organiztion");
    }
    const isAdmin =
      file.userId === hasAccess.user._id ||
      hasAccess.user.orgIds.find((org) => org.orgId === file.orgId)?.role ===
        "admin";
    if (!isAdmin) {
      throw new ConvexError("you do not have access to delete this file");
    }
    await ctx.db.patch(args.fileId, {
      shouldDeleted: true,
    });
  },
});

export const restoreFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  async handler(ctx, args) {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError("file not found");
    }
    const hasAccess = await hasAccessToOrg(ctx, file.orgId || "");
    if (!hasAccess) {
      throw new ConvexError("have no access to the organiztion");
    }
    const isAdmin =
      file.userId === hasAccess.user._id ||
      hasAccess.user.orgIds.find((org) => org.orgId === file.orgId)?.role ===
        "admin";
    if (!isAdmin) {
      throw new ConvexError("you do not have access to delete this file");
    }
    await ctx.db.patch(args.fileId, {
      shouldDeleted: false,
    });
  },
});

export const toggleFavorite = mutation({
  args: {
    fileId: v.id("files"),
  },
  async handler(ctx, args) {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError("file not found");
    }
    const hasAccess = await hasAccessToOrg(ctx, file.orgId || "");
    if (!hasAccess) {
      throw new ConvexError("have no access to the organiztion");
    }
    const favorite = await ctx.db
      .query("favorite")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q
          .eq("userId", hasAccess.user._id)
          .eq("orgId", file.orgId ?? "")
          .eq("fileId", file._id)
      )
      .first();
    if (!favorite) {
      await ctx.db.insert("favorite", {
        fileId: file._id,
        orgId: file.orgId ?? "",
        userId: hasAccess.user._id,
      });
    } else {
      await ctx.db.delete(favorite._id);
    }
  },
});

export const getAllFavorite = query({
  args: {
    orgId: v.string(),
  },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId || "");
    if (!hasAccess) {
      return [];
    }
    const favorite = await ctx.db
      .query("favorite")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId ?? "")
      )
      .collect();
    return favorite;
  },
});
