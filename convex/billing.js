import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./helpers";

const MONTHLY_CHARGE = 100;

export const getPropertyDues = query({
  args: {
    propertyId: v.id("properties")
  },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.propertyId);
    if (!property) return { pendingMonths: 0, totalDue: 0, monthlyCharge: MONTHLY_CHARGE };

    const lastPaid = property.lastPaidDate || property.createdAt;
    const now = Date.now();
    
    // Calculate difference in months
    const startDate = new Date(lastPaid);
    const endDate = new Date(now);
    
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months -= startDate.getMonth();
    months += endDate.getMonth();
    
    const pendingMonths = Math.max(0, months);
    const totalDue = pendingMonths * MONTHLY_CHARGE;

    return {
      pendingMonths,
      totalDue,
      monthlyCharge: MONTHLY_CHARGE,
      lastPaidDate: lastPaid
    };
  }
});

export const collectPayment = mutation({
  args: {
    token: v.string(),
    propertyId: v.id("properties"),
    amount: v.number(),
    paymentMode: v.string(),
    geoLocation: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["collector", "admin"]);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found");

    const monthsCovered = Math.floor(args.amount / MONTHLY_CHARGE);
    if (monthsCovered < 1 && args.amount > 0) {
       // Allow partial payments but warn? 
       // User said "full or partial payment collect kar sake"
       // and "monthsCovered = amount / 100 auto calculate ho"
    }

    const paymentId = await ctx.db.insert("collections", {
      propertyId: args.propertyId,
      collectorId: user._id,
      amount: args.amount,
      paymentMode: args.paymentMode,
      status: "completed",
      monthsCovered: monthsCovered,
      geoLocation: args.geoLocation,
      timestamp: Date.now()
    });

    // Update property lastPaidDate
    // We increment the lastPaidDate by monthsCovered
    const lastPaid = property.lastPaidDate || property.createdAt;
    const date = new Date(lastPaid);
    date.setMonth(date.getMonth() + monthsCovered);
    
    await ctx.db.patch(args.propertyId, {
      lastPaidDate: date.getTime()
    });

    return paymentId;
  }
});

export const getGlobalStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    
    const [properties, collections] = await Promise.all([
      ctx.db.query("properties").collect(),
      ctx.db.query("collections").collect()
    ]);

    const totalCollected = collections.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate total pending across all properties
    const now = Date.now();
    let totalPending = 0;
    
    for (const property of properties) {
      const lastPaid = property.lastPaidDate || property.createdAt;
      const startDate = new Date(lastPaid);
      const endDate = new Date(now);
      
      let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
      months -= startDate.getMonth();
      months += endDate.getMonth();
      
      const pendingMonths = Math.max(0, months);
      totalPending += pendingMonths * MONTHLY_CHARGE;
    }

    return {
      totalCollected,
      totalPending
    };
  }
});
