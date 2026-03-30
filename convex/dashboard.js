import { query } from "./_generated/server";
import { v } from "convex/values";
import { buildVisitStatusFlow, formatCurrency, requireRole } from "./helpers";

export const stats = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const [properties, wards, users, visits, collections, notices] = await Promise.all([
      ctx.db.query("properties").collect(),
      ctx.db.query("wards").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("visits").collect(),
      ctx.db.query("collections").collect(),
      ctx.db.query("notices").collect()
    ]);

    const propertyMap = new Map(properties.map((item) => [item._id, item]));
    const userMap = new Map(users.map((item) => [item._id, item]));
    const completedCollections = collections.filter((item) => item.status === "completed");
    const paidVisits = visits.filter((visit) => visit.visitType === "paid");
    const notPaidVisits = visits.filter((visit) => visit.visitType === "not_paid");
    const recentVisits = visits
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map((visit) => {
        const collection = collections.find((item) => item.propertyId === visit.propertyId && item.collectorId === visit.collectorId && item.timestamp === visit.timestamp);
        const notice = notices.find((item) => item.propertyId === visit.propertyId && item.noticeDate === visit.timestamp);
        return {
          ...visit,
          id: visit._id,
          property: propertyMap.get(visit.propertyId) || null,
          collector: userMap.get(visit.collectorId) || null,
          statusFlow: buildVisitStatusFlow(visit.visitType, collection?.status, notice?.status)
        };
      });

    const totalCollected = completedCollections.reduce((sum, item) => sum + item.amount, 0);
    const demandDocs = await ctx.db.query("demands").collect();
    const totalPendingAmount = demandDocs.reduce((acc, d) => acc + d.totalAmount, 0);
    const totalDemandGenerated = totalPendingAmount + totalCollected;
    const totalPenaltyCollected = completedCollections.reduce((sum, item) => sum + (item.penaltyAmount || 0), 0);
    const totalDelayedCases = demandDocs.filter(d => d.penaltyAmount > 0).length;

    return {
      totalDemandGenerated,
      totalDemandGeneratedLabel: formatCurrency(totalDemandGenerated),
      totalProperties: properties.length,
      totalWards: wards.length,
      totalUsers: users.filter((item) => item.role !== "admin").length,
      totalVisits: visits.length,
      totalCollected,
      totalCollectedLabel: formatCurrency(totalCollected),
      totalPendingAmount,
      totalPendingLabel: formatCurrency(totalPendingAmount),
      totalPendingVisits: notPaidVisits.length,
      totalNotices: notices.length,
      totalDelayedCases,
      totalPenaltyCollected,
      totalPenaltyCollectedLabel: formatCurrency(totalPenaltyCollected),
      paidPercent: visits.length ? Math.round((paidVisits.length / visits.length) * 100) : 0,
      notPaidPercent: visits.length ? Math.round((notPaidVisits.length / visits.length) * 100) : 0,
      noticeServedCount: notices.length,
      recentVisits
    };
  }
});
