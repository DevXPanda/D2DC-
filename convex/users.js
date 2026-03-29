import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  createAuditLog,
  ensureUniqueUser,
  hashPassword,
  normalizeEmail,
  normalizePhone,
  normalizeUsername,
  requireRole
} from "./helpers";

export const list = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);

    const [users, wards] = await Promise.all([ctx.db.query("users").collect(), ctx.db.query("wards").collect()]);
    const wardMap = new Map(wards.map((ward) => [ward._id, ward]));
    const search = String(args.search || "").trim().toLowerCase();

    return users
      .filter((user) => user.role !== "admin")
      .map((user) => ({
        ...user,
        id: user._id,
        wardDetails: user.assignedWard ? wardMap.get(user.assignedWard) || null : null
      }))
      .filter((user) => {
        if (!search) return true;
        return [
          user.name,
          user.username,
          user.email,
          user.phone,
          user.role,
          user.wardDetails?.wardName,
          user.wardDetails?.wardNumber
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
  }
});

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    username: v.string(),
    email: v.string(),
    phone: v.string(),
    password: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("supervisor"), v.literal("collector"), v.literal("citizen")),
    assignedWard: v.optional(v.id("wards")),
    assignedArea: v.optional(v.string()),
    isActive: v.boolean()
  },
  handler: async (ctx, args) => {
    const { user: adminUser } = await requireRole(ctx, args.token, ["admin"]);
    if (args.role === "admin") {
      throw new Error("Admin accounts are created only from the auth setup.");
    }

    await ensureUniqueUser(ctx, args);

    const userId = await ctx.db.insert("users", {
      name: args.name.trim(),
      username: normalizeUsername(args.username),
      email: normalizeEmail(args.email),
      phone: normalizePhone(args.phone),
      passwordHash: await hashPassword(args.password || "changeme123"),
      role: args.role,
      assignedWard: args.assignedWard,
      assignedArea: args.assignedArea?.trim(),
      isActive: args.isActive,
      createdAt: Date.now()
    });

    await createAuditLog(ctx, {
      action: "User created",
      performedBy: adminUser.name,
      entityType: "user",
      details: `${args.role} ${args.name} created`
    });

    return userId;
  }
});

export const update = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    name: v.string(),
    username: v.string(),
    email: v.string(),
    phone: v.string(),
    password: v.optional(v.string()),
    role: v.union(v.literal("supervisor"), v.literal("collector"), v.literal("citizen")),
    assignedWard: v.optional(v.id("wards")),
    assignedArea: v.optional(v.string()),
    isActive: v.boolean()
  },
  handler: async (ctx, args) => {
    const { user: adminUser } = await requireRole(ctx, args.token, ["admin"]);
    const existing = await ctx.db.get(args.userId);
    if (!existing || existing.role === "admin") {
      throw new Error("User not found.");
    }

    await ensureUniqueUser(ctx, args, args.userId);

    await ctx.db.patch(args.userId, {
      name: args.name.trim(),
      username: normalizeUsername(args.username),
      email: normalizeEmail(args.email),
      phone: normalizePhone(args.phone),
      role: args.role,
      assignedWard: args.assignedWard,
      assignedArea: args.assignedArea?.trim(),
      isActive: args.isActive,
      ...(args.password ? { passwordHash: await hashPassword(args.password) } : {})
    });

    await createAuditLog(ctx, {
      action: "User updated",
      performedBy: adminUser.name,
      entityType: "user",
      details: `${args.role} ${args.name} updated`
    });
  }
});

export const remove = mutation({
  args: {
    token: v.string(),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const { user: adminUser } = await requireRole(ctx, args.token, ["admin"]);
    const existing = await ctx.db.get(args.userId);
    if (!existing || existing.role === "admin") {
      throw new Error("User not found.");
    }

    await ctx.db.delete(args.userId);

    await createAuditLog(ctx, {
      action: "User deleted",
      performedBy: adminUser.name,
      entityType: "user",
      details: `${existing.role} ${existing.name} deleted`
    });
  }
});
