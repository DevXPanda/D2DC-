import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { createAuditLog, requireRole } from "./helpers";

export const list = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const search = String(args.search || "").trim().toLowerCase();
    const [wards, properties, users] = await Promise.all([
      ctx.db.query("wards").collect(),
      ctx.db.query("properties").collect(),
      ctx.db.query("users").collect()
    ]);

    return wards
      .map((ward) => ({
        ...ward,
        id: ward._id,
        propertyCount: properties.filter((property) => property.ward === ward._id).length,
        userCount: users.filter((user) => user.assignedWard === ward._id).length
      }))
      .filter((ward) => {
        if (!search) return true;
        return `${ward.wardNumber} ${ward.wardName} ${ward.description || ""}`.toLowerCase().includes(search);
      });
  }
});

export const create = mutation({
  args: {
    token: v.string(),
    wardNumber: v.string(),
    wardName: v.string(),
    description: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const wardId = await ctx.db.insert("wards", {
      wardNumber: args.wardNumber.trim(),
      wardName: args.wardName.trim(),
      description: args.description?.trim(),
      isActive: true,
      createdAt: Date.now()
    });

    await createAuditLog(ctx, {
      action: "Ward created",
      performedBy: user.name,
      entityType: "ward",
      details: `Ward ${args.wardNumber} - ${args.wardName} created`
    });

    return wardId;
  }
});

export const update = mutation({
  args: {
    token: v.string(),
    wardId: v.id("wards"),
    wardNumber: v.string(),
    wardName: v.string(),
    description: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const existing = await ctx.db.get(args.wardId);
    if (!existing) {
      throw new Error("Ward not found.");
    }

    await ctx.db.patch(args.wardId, {
      wardNumber: args.wardNumber.trim(),
      wardName: args.wardName.trim(),
      description: args.description?.trim()
    });

    await createAuditLog(ctx, {
      action: "Ward updated",
      performedBy: user.name,
      entityType: "ward",
      details: `Ward ${args.wardNumber} - ${args.wardName} updated`
    });
  }
});

export const remove = mutation({
  args: {
    token: v.string(),
    wardId: v.id("wards")
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const [existing, properties, users] = await Promise.all([
      ctx.db.get(args.wardId),
      ctx.db.query("properties").collect(),
      ctx.db.query("users").collect()
    ]);

    if (!existing) {
      throw new Error("Ward not found.");
    }

    if (properties.some((property) => property.ward === args.wardId) || users.some((entry) => entry.assignedWard === args.wardId)) {
      throw new Error("Remove linked properties and users before deleting this ward.");
    }

    await ctx.db.delete(args.wardId);
    await createAuditLog(ctx, {
      action: "Ward deleted",
      performedBy: user.name,
      entityType: "ward",
      details: `Ward ${existing.wardNumber} - ${existing.wardName} deleted`
    });
  }
});
