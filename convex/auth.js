import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  buildSessionUser,
  createAuditLog,
  ensureUniqueUser,
  getUserByIdentifier,
  hashPassword,
  normalizeEmail,
  normalizePhone,
  normalizeUsername,
  requireSession,
  verifyPassword
} from "./helpers";

export const me = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session) return null;

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      await ctx.db.delete(session._id);
      return null;
    }

    return user;
  }
});

export const hasAdminAccount = query({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    return admins.length > 0;
  }
});

export const createAdminAccount = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    email: v.string(),
    phone: v.string(),
    password: v.string()
  },
  handler: async (ctx, args) => {
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    if (admins.length > 0) {
      throw new Error("Admin account already exists.");
    }

    await ensureUniqueUser(ctx, args);

    const userId = await ctx.db.insert("users", {
      name: args.name.trim(),
      username: normalizeUsername(args.username),
      email: normalizeEmail(args.email),
      phone: normalizePhone(args.phone),
      passwordHash: await hashPassword(args.password),
      role: "admin",
      isActive: true,
      createdAt: Date.now()
    });

    const user = await ctx.db.get(userId);
    const token = `${userId}-${Date.now()}`;

    await ctx.db.insert("sessions", {
      userId,
      token,
      createdAt: Date.now()
    });

    await createAuditLog(ctx, {
      action: "Admin account created",
      performedBy: user.name,
      entityType: "user",
      details: `Admin ${user.email} created from setup`
    });

    return buildSessionUser(user, token);
  }
});

export const loginAdmin = mutation({
  args: {
    identifier: v.string(),
    password: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getUserByIdentifier(ctx, args.identifier);
    if (!user || !user.isActive || user.role !== "admin") {
      throw new Error("Invalid credentials");
    }

    const passwordCheck = await verifyPassword(args.password, user.passwordHash);
    if (!passwordCheck.matches) {
      throw new Error("Invalid credentials");
    }

    if (passwordCheck.needsUpgrade) {
      await ctx.db.patch(user._id, {
        passwordHash: await hashPassword(args.password)
      });
    }

    const token = `${user._id}-${Date.now()}`;
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: Date.now()
    });

    return buildSessionUser(user, token);
  }
});

export const login = mutation({
  args: {
    identifier: v.string(),
    password: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getUserByIdentifier(ctx, args.identifier);
    if (!user || !user.isActive) {
      throw new Error("Invalid credentials");
    }

    const passwordCheck = await verifyPassword(args.password, user.passwordHash);
    if (!passwordCheck.matches) {
      throw new Error("Invalid credentials");
    }

    if (passwordCheck.needsUpgrade) {
      await ctx.db.patch(user._id, {
        passwordHash: await hashPassword(args.password)
      });
    }

    const token = `${user._id}-${Date.now()}`;
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: Date.now()
    });

    return buildSessionUser(user, token);
  }
});

export const loginCollector = mutation({
  args: {
    identifier: v.string(),
    password: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getUserByIdentifier(ctx, args.identifier);
    if (!user || !user.isActive || user.role !== "collector") {
      throw new Error("Invalid credentials");
    }

    const passwordCheck = await verifyPassword(args.password, user.passwordHash);
    if (!passwordCheck.matches) {
      throw new Error("Invalid credentials");
    }

    if (passwordCheck.needsUpgrade) {
      await ctx.db.patch(user._id, {
        passwordHash: await hashPassword(args.password)
      });
    }

    const token = `${user._id}-${Date.now()}`;
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: Date.now()
    });

    return buildSessionUser(user, token);
  }
});

export const loginSupervisor = mutation({
  args: {
    identifier: v.string(),
    password: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getUserByIdentifier(ctx, args.identifier);
    if (!user || !user.isActive || user.role !== "supervisor") {
      throw new Error("Invalid credentials");
    }

    const passwordCheck = await verifyPassword(args.password, user.passwordHash);
    if (!passwordCheck.matches) {
      throw new Error("Invalid credentials");
    }

    if (passwordCheck.needsUpgrade) {
      await ctx.db.patch(user._id, {
        passwordHash: await hashPassword(args.password)
      });
    }

    const token = `${user._id}-${Date.now()}`;
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: Date.now()
    });

    return buildSessionUser(user, token);
  }
});

export const loginCitizen = mutation({
  args: {
    identifier: v.string(),
    password: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getUserByIdentifier(ctx, args.identifier);
    if (!user || !user.isActive || user.role !== "citizen") {
      throw new Error("Invalid credentials");
    }

    const passwordCheck = await verifyPassword(args.password, user.passwordHash);
    if (!passwordCheck.matches) {
      throw new Error("Invalid credentials");
    }

    if (passwordCheck.needsUpgrade) {
      await ctx.db.patch(user._id, {
        passwordHash: await hashPassword(args.password)
      });
    }

    const token = `${user._id}-${Date.now()}`;
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: Date.now()
    });

    return buildSessionUser(user, token);
  }
});
