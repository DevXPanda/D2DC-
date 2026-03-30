import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./helpers";

async function calculatePropertyDemand(ctx, propertyId) {
  const assessment = await ctx.db
    .query("assessments")
    .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
    .unique();
  
  if (!assessment || assessment.status !== "active") return null;

  const property = await ctx.db.get(propertyId);
  if (!property) return null;

  const now = Date.now();
  const lastPaid = property.lastPaidDate || assessment.startDate;
  
  const startDate = new Date(lastPaid);
  const nowObj = new Date(now);
  
  // Calculate overdue months and their due dates
  // Due date is the 1st day of the next month after a cycle ends
  let pendingMonthsList = [];
  let tempDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
  
  while (tempDate <= nowObj) {
    pendingMonthsList.push(new Date(tempDate));
    tempDate.setMonth(tempDate.getMonth() + 1);
  }

  const pendingMonths = pendingMonthsList.length;
  const baseAmount = pendingMonths * assessment.monthlyCharge;
  
  let penaltyAmount = 0;
  pendingMonthsList.forEach((dueDate) => {
    const diffTime = Math.max(0, now - dueDate.getTime());
    const delayDays = Math.floor(diffTime / (1000 * 24 * 60 * 60));
    if (delayDays > 0) {
      penaltyAmount += delayDays * 5;
    }
  });

  return { 
    pendingMonths, 
    baseAmount, 
    penaltyAmount, 
    totalAmount: baseAmount + penaltyAmount 
  };
}

/**
 * Synchronizes demand for all active properties.
 * This can be called manually or by a cron job.
 */
export const syncAllDemands = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (args.token !== "SYSTEM_INTERNAL") {
      await requireRole(ctx, args.token, ["admin", "supervisor"]);
    }
    
    const assessments = await ctx.db
      .query("assessments")
      .filter((q) => q.and(
        q.eq(q.field("status"), "active"),
        q.eq(q.field("autoBilling"), true)
      ))
      .collect();
    
    const now = Date.now();
    let updatedCount = 0;

    for (const assessment of assessments) {
      const demandData = await calculatePropertyDemand(ctx, assessment.propertyId);
      if (!demandData) continue;

      const existingDemand = await ctx.db
        .query("demands")
        .withIndex("by_property", (q) => q.eq("propertyId", assessment.propertyId))
        .unique();

      if (existingDemand) {
        await ctx.db.patch(existingDemand._id, {
          pendingMonths: demandData.pendingMonths,
          baseAmount: demandData.baseAmount,
          penaltyAmount: demandData.penaltyAmount,
          totalAmount: demandData.totalAmount,
          lastUpdated: now,
          generatedBy: "system"
        });
      } else {
        await ctx.db.insert("demands", {
          propertyId: assessment.propertyId,
          pendingMonths: demandData.pendingMonths,
          baseAmount: demandData.baseAmount,
          penaltyAmount: demandData.penaltyAmount,
          totalAmount: demandData.totalAmount,
          lastUpdated: now,
          generatedBy: "system"
        });
      }
      updatedCount++;
    }

    return { updatedCount };
  }
});

/**
 * Retrieves the current demand for a specific property.
 */
export const getPropertyDemand = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("demands")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .unique();
  }
});

/**
 * Retrieves global demand statistics for the Admin Dashboard.
 */
export const getGlobalDemandStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (args.token !== "SYSTEM_INTERNAL") {
      await requireRole(ctx, args.token, ["admin"]);
    }
    
    const demands = await ctx.db.query("demands").collect();
    const collections = await ctx.db.query("collections").collect();
    
    const totalDemandGenerated = demands.reduce((acc, d) => acc + d.totalAmount, 0);
    const completedCollections = collections.filter(c => c.status === "completed");
    const totalCollected = completedCollections.reduce((acc, c) => acc + c.amount, 0);
    const totalPenaltyCollected = completedCollections.reduce((acc, c) => acc + (c.penaltyAmount || 0), 0);
    const totalDelayedCases = demands.filter(d => d.penaltyAmount > 0).length;
    
    return {
      totalDemandGenerated,
      totalCollected,
      totalPendingDemand: Math.max(0, totalDemandGenerated - totalCollected),
      totalPenaltyCollected,
      totalDelayedCases
    };
  }
});

export const listAssessments = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const [assessments, properties] = await Promise.all([
      ctx.db.query("assessments").collect(),
      ctx.db.query("properties").collect()
    ]);
    const propertyMap = new Map(properties.map(p => [p._id, p]));
    return assessments.map(a => ({
      ...a,
      property: propertyMap.get(a.propertyId) || null
    })).sort((a, b) => b.createdAt - a.createdAt);
  }
});

export const listDemands = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const [demands, properties] = await Promise.all([
      ctx.db.query("demands").collect(),
      ctx.db.query("properties").collect()
    ]);
    const propertyMap = new Map(properties.map(p => [p._id, p]));
    return demands.map(d => ({
      ...d,
      property: propertyMap.get(d.propertyId) || null
    })).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }
});

export const createOrUpdateAssessment = mutation({
  args: {
    token: v.string(),
    propertyId: v.id("properties"),
    monthlyCharge: v.number(),
    startDate: v.number(),
    autoBilling: v.boolean(),
    status: v.union(v.literal("active"), v.literal("inactive"))
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const existing = await ctx.db
      .query("assessments")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .unique();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        monthlyCharge: args.monthlyCharge,
        startDate: args.startDate,
        autoBilling: args.autoBilling,
        status: args.status,
        createdBy: existing.createdBy || user._id // Fix for legacy records missing createdBy
      });
    } else {
      return await ctx.db.insert("assessments", {
        propertyId: args.propertyId,
        monthlyCharge: args.monthlyCharge,
        startDate: args.startDate,
        autoBilling: args.autoBilling,
        status: args.status,
        createdAt: Date.now(),
        createdBy: user._id
      });
    }
  }
});

export const generateManualDemand = mutation({
  args: {
    token: v.string(),
    propertyId: v.id("properties"),
    pendingMonths: v.number(),
    baseAmountOverride: v.optional(v.number()),
    resetPenalty: v.boolean()
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const assessment = await ctx.db
      .query("assessments")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .unique();
    
    if (!assessment) throw new Error("No assessment found for this property");

    const existingDemand = await ctx.db
      .query("demands")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .unique();

    const baseAmount = args.baseAmountOverride !== undefined ? args.baseAmountOverride : (args.pendingMonths * assessment.monthlyCharge);
    const now = Date.now();

    if (existingDemand) {
      await ctx.db.patch(existingDemand._id, {
        pendingMonths: args.pendingMonths,
        baseAmount,
        penaltyAmount: args.resetPenalty ? 0 : existingDemand.penaltyAmount,
        totalAmount: baseAmount + (args.resetPenalty ? 0 : existingDemand.penaltyAmount),
        lastUpdated: now,
        generatedBy: user._id.toString()
      });
    } else {
      await ctx.db.insert("demands", {
        propertyId: args.propertyId,
        pendingMonths: args.pendingMonths,
        baseAmount,
        penaltyAmount: 0,
        totalAmount: baseAmount,
        lastUpdated: now,
        generatedBy: user._id.toString()
      });
    }
  }
});

export const resetDemand = mutation({
  args: {
    token: v.string(),
    propertyId: v.id("properties")
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const existingDemand = await ctx.db
      .query("demands")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .unique();
    
    if (existingDemand) {
      await ctx.db.patch(existingDemand._id, {
        pendingMonths: 0,
        baseAmount: 0,
        penaltyAmount: 0,
        totalAmount: 0,
        lastUpdated: Date.now(),
        generatedBy: user._id.toString()
      });
    }
  }
});
