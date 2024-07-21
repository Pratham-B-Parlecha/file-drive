import { ConvexError, v } from "convex/values";
import { internalMutation, MutationCtx, QueryCtx } from "./_generated/server";

export const getUser = async (
  ctx: MutationCtx | QueryCtx,
  tokenIdentifier: string
) => {
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier)
    )
    .first();
  if (!user) {
    throw new ConvexError("User not found");
  }
  return user;
};

export const createUser = internalMutation({
  args: { tokenIdentifier: v.string() },
  async handler(ctx, args) {
    await ctx.db.insert("users", {
      tokenIdentifier: args.tokenIdentifier,
      orgIds: [],
    });
  },
});
export const addOrgIdToUser = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    orgId: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  async handler(ctx, args) {
    const user = await getUser(ctx, args.tokenIdentifier);

    await ctx.db.patch(user._id, {
      orgIds: [...user.orgIds, { orgId: args.orgId, role: args.role }],
    });
  },
});
export const updateRoleInOrg = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    orgId: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  async handler(ctx, args) {
    const user = await getUser(ctx, args.tokenIdentifier);

    const org = user.orgIds.find((org) => org.orgId === args.orgId);
    if (!org) {
      throw new ConvexError("User does not have access to this org");
    }
    org.role = args.role;

    await ctx.db.patch(user._id, {
      orgIds: user.orgIds
    });
  },
});
