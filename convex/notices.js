import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { createAuditLog, requireRole } from "./helpers";

const NOTICE_ORDER = {
  'reminder': 1,
  'demand': 2,
  'penalty': 3,
  'final_warrant': 4
};

const NOTICE_PREFIX = {
  reminder: 'NTR',
  demand: 'NTD',
  penalty: 'NTP',
  final_warrant: 'NTF'
};

/**
 * Helper to generate a notice number (e.g. NTR0010001)
 */
async function generateNoticeNumber(ctx, wardId, noticeType) {
  const ward = await ctx.db.get(wardId);
  const wardNum = ward?.wardNumber || "0";
  const prefix = NOTICE_PREFIX[noticeType] || "NTC";
  
  // Count existing notices for this ward to determine serial
  const propertiesInWard = await ctx.db
    .query("properties")
    .withIndex("by_ward", (q) => q.eq("ward", wardId))
    .collect();
  
  const propertyIds = new Set(propertiesInWard.map(p => p._id));
  const allNotices = await ctx.db.query("notices").collect();
  const wardNotices = allNotices.filter(n => propertyIds.has(n.propertyId));
  
  const serial = (wardNotices.length + 1).toString().padStart(4, '0');
  const wardCode = wardNum.padStart(3, '0');
  
  return `${prefix}${wardCode}${serial}`;
}

/**
 * Validate escalation rules
 */
async function validateEscalation(ctx, propertyId, newNoticeType) {
  // Admin requested full flexibility to generate any notice type at any time.
  const demand = await ctx.db
    .query("demands")
    .withIndex("by_property", (q) => q.eq("propertyId", propertyId))
    .unique();

  if (!demand || demand.totalAmount <= 0) {
    throw new Error('Cannot generate notice for property with no dues');
  }

  return true;
}

export const listNotices = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin", "supervisor"]);
    const notices = await ctx.db.query("notices").collect();
    const properties = await ctx.db.query("properties").collect();
    const propertyMap = new Map(properties.map(p => [p._id, p]));
    
    const search = args.search?.toLowerCase() || "";
    
    return notices
      .map(n => ({
        ...n,
        id: n._id,
        property: propertyMap.get(n.propertyId)
      }))
      .filter(n => {
        if (!search) return true;
        return (
          n.noticeNumber?.toLowerCase().includes(search) ||
          n.property?.propertyId.toLowerCase().includes(search) ||
          n.property?.ownerName.toLowerCase().includes(search) ||
          n.status.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => b.noticeDate - a.noticeDate);
  }
});

export const generateManualNotice = mutation({
  args: {
    token: v.string(),
    propertyId: v.id("properties"),
    noticeType: v.union(v.literal("reminder"), v.literal("demand"), v.literal("penalty"), v.literal("final_warrant")),
    dueDate: v.optional(v.number()),
    remarks: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found");

    await validateEscalation(ctx, args.propertyId, args.noticeType);

    const demand = await ctx.db
      .query("demands")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .unique();

    if (!demand) throw new Error("No dues found for this property");

    const timestamp = Date.now();
    const noticeNumber = await generateNoticeNumber(ctx, property.ward, args.noticeType);

    const noticeId = await ctx.db.insert("notices", {
      propertyId: args.propertyId,
      demandId: demand._id,
      noticeNumber,
      noticeType: args.noticeType,
      amountDue: demand.totalAmount,
      penaltyAmount: demand.penaltyAmount,
      noticeDate: timestamp,
      dueDate: args.dueDate || (timestamp + 15 * 24 * 60 * 60 * 1000), // Default 15 days
      status: "generated",
      revisitStatus: "pending",
      remarks: args.remarks,
      generatedBy: user._id,
      createdAt: timestamp
    });

    await createAuditLog(ctx, {
      action: "Notice generated",
      performedBy: user.name,
      entityType: "notice",
      details: `Manual ${args.noticeType} notice ${noticeNumber} generated for ${property.propertyId}`
    });

    return noticeId;
  }
});

export const resolveNotice = mutation({
  args: {
    token: v.string(),
    noticeId: v.id("notices")
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const notice = await ctx.db.get(args.noticeId);
    if (!notice) throw new Error("Notice not found");

    await ctx.db.patch(args.noticeId, {
      status: "resolved",
      revisitStatus: "completed"
    });

    await createAuditLog(ctx, {
      action: "Notice resolved",
      performedBy: user.name,
      entityType: "notice",
      details: `Notice ${notice.noticeNumber} marked as resolved`
    });
  }
});
