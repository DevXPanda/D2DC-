import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { buildVisitStatusFlow, createAuditLog, formatCurrency, requireRole } from "./helpers";

function withRelations({ visits, collections, notices, properties, users }) {
  const propertyMap = new Map(properties.map((item) => [item._id, item]));
  const userMap = new Map(users.map((item) => [item._id, item]));

  return visits.map((visit) => {
    const collection = collections.find(
      (item) => item.propertyId === visit.propertyId && item.collectorId === visit.collectorId && item.timestamp === visit.timestamp
    );
    const notice = notices.find((item) => item.propertyId === visit.propertyId && item.noticeDate === visit.timestamp);

    return {
      ...visit,
      id: visit._id,
      property: propertyMap.get(visit.propertyId) || null,
      collector: userMap.get(visit.collectorId) || null,
      statusFlow: buildVisitStatusFlow(visit.visitType, collection?.status, notice?.status)
    };
  });
}

function getDayStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

function getCitizenProperties(user, properties) {
  return properties.filter((property) => property.citizenId === user._id);
}

export const collectionApprovalQueue = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const [collections, properties, users] = await Promise.all([
      ctx.db.query("collections").collect(),
      ctx.db.query("properties").collect(),
      ctx.db.query("users").collect()
    ]);
    const propertyMap = new Map(properties.map((item) => [item._id, item]));
    const userMap = new Map(users.map((item) => [item._id, item]));
    const search = String(args.search || "").trim().toLowerCase();

    return collections
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((collection) => ({
        ...collection,
        id: collection._id,
        property: propertyMap.get(collection.propertyId) || null,
        collector: userMap.get(collection.collectorId) || null
      }))
      .filter((collection) => {
        if (!search) return true;
        return [
          collection.property?.propertyId,
          collection.collector?.name,
          collection.paymentMode,
          collection.status,
          collection.geoLocation
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
  }
});

export const approveCollection = mutation({
  args: {
    token: v.string(),
    collectionId: v.id("collections")
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new Error("Collection not found.");
    }

    await ctx.db.patch(args.collectionId, { status: "completed" });
    await createAuditLog(ctx, {
      action: "Collection approved",
      performedBy: user.name,
      entityType: "collection",
      details: `Collection ${args.collectionId} marked completed`
    });
  }
});

export const rejectCollection = mutation({
  args: {
    token: v.string(),
    collectionId: v.id("collections")
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new Error("Collection not found.");
    }

    await ctx.db.patch(args.collectionId, { status: "rejected" });
    await createAuditLog(ctx, {
      action: "Collection rejected",
      performedBy: user.name,
      entityType: "collection",
      details: `Collection ${args.collectionId} rejected`
    });
  }
});

export const visitMonitoring = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const [visits, collections, notices, properties, users] = await Promise.all([
      ctx.db.query("visits").collect(),
      ctx.db.query("collections").collect(),
      ctx.db.query("notices").collect(),
      ctx.db.query("properties").collect(),
      ctx.db.query("users").collect()
    ]);
    const search = String(args.search || "").trim().toLowerCase();

    return withRelations({ visits, collections, notices, properties, users })
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter((visit) => {
        if (!search) return true;
        return [
          visit.property?.propertyId,
          visit.collector?.name,
          visit.visitType,
          visit.geoLocation,
          visit.statusFlow.join(" ")
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
  }
});

export const noticesList = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const [notices, properties] = await Promise.all([ctx.db.query("notices").collect(), ctx.db.query("properties").collect()]);
    const propertyMap = new Map(properties.map((item) => [item._id, item]));
    const search = String(args.search || "").trim().toLowerCase();

    return notices
      .slice()
      .sort((a, b) => b.noticeDate - a.noticeDate)
      .map((notice) => ({
        ...notice,
        id: notice._id,
        property: propertyMap.get(notice.propertyId) || null
      }))
      .filter((notice) => {
        if (!search) return true;
        return [
          notice.property?.propertyId,
          notice.property?.ownerName,
          notice.status,
          notice.revisitStatus
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
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
    if (!notice) {
      throw new Error("Notice not found.");
    }

    await ctx.db.patch(args.noticeId, {
      status: "resolved",
      revisitStatus: "completed"
    });

    await createAuditLog(ctx, {
      action: "Notice resolved",
      performedBy: user.name,
      entityType: "notice",
      details: `Notice ${args.noticeId} resolved`
    });
  }
});

export const reportsSummary = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const [visits, collections, notices] = await Promise.all([
      ctx.db.query("visits").collect(),
      ctx.db.query("collections").collect(),
      ctx.db.query("notices").collect()
    ]);

    const paidVisits = visits.filter((item) => item.visitType === "paid");
    const notPaidVisits = visits.filter((item) => item.visitType === "not_paid");
    const completedCollections = collections.filter((item) => item.status === "completed");
    const pendingCollections = collections.filter((item) => item.status === "pending");
    const rejectedCollections = collections.filter((item) => item.status === "rejected");

    return {
      totalVisits: visits.length,
      totalCollections: completedCollections.reduce((sum, item) => sum + item.amount, 0),
      totalCollectionsLabel: formatCurrency(completedCollections.reduce((sum, item) => sum + item.amount, 0)),
      totalPendingVisits: notPaidVisits.length,
      paidPercent: visits.length ? Math.round((paidVisits.length / visits.length) * 100) : 0,
      notPaidPercent: visits.length ? Math.round((notPaidVisits.length / visits.length) * 100) : 0,
      noticeServedCount: notices.length,
      penaltyCollected: 0,
      penaltyCollectedLabel: formatCurrency(0),
      completedCollections: completedCollections.length,
      pendingCollections: pendingCollections.length,
      rejectedCollections: rejectedCollections.length
    };
  }
});

export const auditLogsList = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const search = String(args.search || "").trim().toLowerCase();
    const logs = await ctx.db.query("auditLogs").collect();

    return logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((log) => ({
        ...log,
        id: log._id
      }))
      .filter((log) => {
        if (!search) return true;
        return [log.action, log.performedBy, log.entityType, log.details]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
  }
});

export const globalSearch = query({
  args: {
    token: v.string(),
    query: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin", "supervisor", "citizen"]);
    const search = args.query.trim().toLowerCase();
    if (!search) {
      return { properties: [], users: [], collections: [], visits: [] };
    }

    const [properties, users, collections, visits, notices] = await Promise.all([
      ctx.db.query("properties").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("collections").collect(),
      ctx.db.query("visits").collect(),
      ctx.db.query("notices").collect()
    ]);

    const propertyMap = new Map(properties.map((item) => [item._id, item]));
    const userMap = new Map(users.map((item) => [item._id, item]));
    const allowedProperties = user.role === "supervisor"
      ? properties.filter((item) => !user.assignedWard || item.ward === user.assignedWard)
      : user.role === "citizen"
        ? getCitizenProperties(user, properties)
        : properties;
    const allowedPropertyIds = new Set(allowedProperties.map((item) => item._id));
    const allowedUsers = user.role === "supervisor"
      ? users.filter((item) => item.role !== "admin" && (!user.assignedWard || item.assignedWard === user.assignedWard))
      : user.role === "citizen"
        ? users.filter((item) => item._id === user._id)
      : users.filter((item) => item.role !== "admin");

    return {
      properties: allowedProperties
        .filter((item) => `${item.propertyId} ${item.ownerName} ${item.address}`.toLowerCase().includes(search))
        .slice(0, 5)
        .map((item) => ({ ...item, id: item._id })),
      users: allowedUsers
        .filter((item) => `${item.name} ${item.username} ${item.email} ${item.phone} ${item.role}`.toLowerCase().includes(search))
        .slice(0, 5)
        .map((item) => ({ ...item, id: item._id })),
      collections: collections
        .filter((item) => allowedPropertyIds.has(item.propertyId))
        .map((item) => ({
          ...item,
          id: item._id,
          property: propertyMap.get(item.propertyId) || null,
          collector: userMap.get(item.collectorId) || null
        }))
        .filter((item) => `${item.property?.propertyId || ""} ${item.collector?.name || ""} ${item.status}`.toLowerCase().includes(search))
        .slice(0, 5),
      visits: withRelations({
        visits: visits.filter((item) => allowedPropertyIds.has(item.propertyId)),
        collections: collections.filter((item) => allowedPropertyIds.has(item.propertyId)),
        notices: notices.filter((item) => allowedPropertyIds.has(item.propertyId)),
        properties: allowedProperties,
        users
      })
        .filter((item) => `${item.property?.propertyId || ""} ${item.collector?.name || ""} ${item.visitType}`.toLowerCase().includes(search))
        .slice(0, 5),
      notices: notices
        .filter((item) => allowedPropertyIds.has(item.propertyId))
        .map((item) => ({
          ...item,
          id: item._id,
          property: propertyMap.get(item.propertyId) || null
        }))
        .filter((item) => `${item.property?.propertyId || ""} ${item.status}`.toLowerCase().includes(search))
        .slice(0, 5)
    };
  }
});

export const collectorDashboard = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["collector", "supervisor"]);
    if (!user.assignedWard) {
      return {
        stats: {
          totalAssignedProperties: 0,
          paidVisits: 0,
          notPaidVisits: 0,
          pendingApprovals: 0
        },
        properties: [],
        visits: []
      };
    }

    const [properties, visits, collections, notices, users] = await Promise.all([
      ctx.db.query("properties").withIndex("by_ward", (q) => q.eq("ward", user.assignedWard)).collect(),
      ctx.db.query("visits").withIndex("by_collector", (q) => q.eq("collectorId", user._id)).collect(),
      ctx.db.query("collections").withIndex("by_collector", (q) => q.eq("collectorId", user._id)).collect(),
      ctx.db.query("notices").collect(),
      ctx.db.query("users").collect()
    ]);

    const search = String(args.search || "").trim().toLowerCase();
    const now = Date.now();
    const propertyPromises = properties
      .filter((property) => property.status === "active")
      .filter((property) => {
        if (!search) return true;
        return `${property.propertyId} ${property.ownerName} ${property.address}`.toLowerCase().includes(search);
      })
      .map(async (property) => {
        const demand = await ctx.db
          .query("demands")
          .withIndex("by_property", (q) => q.eq("propertyId", property._id))
          .unique();

        return {
          ...property,
          id: property._id,
          pendingMonths: demand?.pendingMonths ?? 0,
          baseAmount: demand?.baseAmount ?? 0,
          penaltyAmount: demand?.penaltyAmount ?? 0,
          totalDue: demand?.totalAmount ?? 0
        };
      });
    
    const resolvedProperties = await Promise.all(propertyPromises);

    const relatedNotices = notices.filter((notice) => properties.some((property) => property._id === notice.propertyId));
    const recentVisits = withRelations({
      visits,
      collections,
      notices: relatedNotices,
      properties,
      users
    }).sort((a, b) => b.timestamp - a.timestamp);

    return {
      stats: {
        totalAssignedProperties: properties.filter((property) => property.status === "active").length,
        paidVisits: visits.filter((visit) => visit.visitType === "paid").length,
        notPaidVisits: visits.filter((visit) => visit.visitType === "not_paid").length,
        pendingApprovals: collections.filter((collection) => collection.status === "pending").length
      },
      properties: resolvedProperties,
      visits: recentVisits.slice(0, 5)
    };
  }
});

export const collectorVisitHistory = query({
  args: {
    token: v.string(),
    filter: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["collector", "supervisor"]);
    const [visits, collections, notices, properties, users] = await Promise.all([
      ctx.db.query("visits").withIndex("by_collector", (q) => q.eq("collectorId", user._id)).collect(),
      ctx.db.query("collections").withIndex("by_collector", (q) => q.eq("collectorId", user._id)).collect(),
      ctx.db.query("notices").collect(),
      ctx.db.query("properties").collect(),
      ctx.db.query("users").collect()
    ]);

    return withRelations({ visits, collections, notices, properties, users })
      .filter((visit) => !args.filter || args.filter === "all" || visit.visitType === args.filter)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
});

export const submitCollectorVisit = mutation({
  args: {
    token: v.string(),
    propertyId: v.id("properties"),
    visitType: v.union(v.literal("paid"), v.literal("not_paid"), v.literal("reminder"), v.literal("payment_collection"), v.literal("warning"), v.literal("final_warning")),
    citizenResponse: v.optional(v.union(v.literal("will_pay_today"), v.literal("will_pay_later"), v.literal("refused_to_pay"), v.literal("not_available"))),
    geoLocation: v.string(),
    amount: v.optional(v.number()),
    paymentMode: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    chequeNumber: v.optional(v.string()),
    chequeDate: v.optional(v.number()),
    bankName: v.optional(v.string()),
    remarks: v.optional(v.string()),
    expectedPaymentDate: v.optional(v.number()),
    proofPhotoUrl: v.optional(v.string()),
    penaltyAmount: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["collector", "supervisor"]);
    const property = await ctx.db.get(args.propertyId);
    if (!property || property.status !== "active") {
      throw new Error("Property not available.");
    }

    if (!user.assignedWard || property.ward !== user.assignedWard) {
      throw new Error("This property is not assigned to your ward.");
    }

    const timestamp = Date.now();
    const visitId = await ctx.db.insert("visits", {
      propertyId: args.propertyId,
      collectorId: user._id,
      visitType: args.visitType,
      citizenResponse: args.citizenResponse,
      expectedPaymentDate: args.expectedPaymentDate,
      remarks: args.remarks,
      proofPhotoUrl: args.proofPhotoUrl,
      geoLocation: args.geoLocation,
      timestamp
    });

    let collectionResult = null;
    let noticeResult = null;

    // Handle Payment Collection (will_pay_today)
    if (args.citizenResponse === "will_pay_today" || args.visitType === "paid") {
      const amount = Number(args.amount || 0);
      if (amount <= 0) throw new Error("Enter the collected amount.");

      const demand = await ctx.db
        .query("demands")
        .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
        .unique();

      const currentPenalty = demand?.penaltyAmount || 0;
      const penaltyCollected = Math.min(amount, currentPenalty);
      const baseCollected = amount - penaltyCollected;
      const monthsCovered = Math.floor(baseCollected / 100);

      const collectionId = await ctx.db.insert("collections", {
        propertyId: args.propertyId,
        collectorId: user._id,
        visitId,
        amount,
        baseAmount: baseCollected,
        penaltyAmount: penaltyCollected,
        paymentMode: args.paymentMode || "cash",
        transactionId: args.transactionId,
        chequeNumber: args.chequeNumber,
        chequeDate: args.chequeDate,
        bankName: args.bankName,
        status: "pending",
        monthsCovered,
        geoLocation: args.geoLocation,
        timestamp
      });

      if (monthsCovered > 0) {
        const lastPaid = property.lastPaidDate || property.createdAt;
        const date = new Date(lastPaid);
        date.setMonth(date.getMonth() + monthsCovered);
        await ctx.db.patch(args.propertyId, { lastPaidDate: date.getTime() });
      }

      if (demand) {
        await ctx.db.patch(demand._id, {
          baseAmount: Math.max(0, demand.baseAmount - baseCollected),
          penaltyAmount: Math.max(0, demand.penaltyAmount - penaltyCollected),
          totalAmount: Math.max(0, demand.totalAmount - amount),
          pendingMonths: Math.max(0, demand.pendingMonths - monthsCovered),
          lastUpdated: timestamp
        });
      }

      await createAuditLog(ctx, {
        action: "Collection submitted",
        performedBy: user.name,
        entityType: "collection",
        details: `${property.propertyId} collection of Rs ${amount} via ${args.paymentMode}`
      });

      collectionResult = {
        receiptNumber: `RCT-${timestamp}`,
        propertyId: property.propertyId,
        amount,
        paymentMode: args.paymentMode || "cash",
        status: "PENDING_ADMIN_APPROVAL"
      };
    }

    // Handle Notice Logic (escalation)
    if (args.citizenResponse === "refused_to_pay" || ["warning", "final_warning", "not_paid"].includes(args.visitType)) {
      const demand = await ctx.db
        .query("demands")
        .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
        .unique();

      // Determine notice type based on visit type or previous history
      let noticeType = "reminder";
      if (args.visitType === "final_warning") noticeType = "final_warrant";
      else if (args.visitType === "warning") noticeType = "penalty";
      else if (args.visitType === "not_paid") noticeType = "demand";

      const penaltyAmount = Number(args.penaltyAmount || 0);
      const noticeNumber = `NTC-${timestamp}-${property.propertyId.split('-').pop()}`;
      
      const nId = await ctx.db.insert("notices", {
        propertyId: args.propertyId,
        demandId: demand?._id,
        noticeNumber,
        noticeType,
        amountDue: demand?.totalAmount || 0,
        penaltyAmount,
        noticeDate: timestamp,
        status: "generated",
        revisitStatus: "pending",
        generatedBy: user._id,
        createdAt: timestamp
      });

      noticeResult = {
        id: nId,
        penaltyAmount,
        status: "NOTICE_PENDING",
        noticeType
      };

      await createAuditLog(ctx, {
        action: "Escalation notice generated",
        performedBy: user.name,
        entityType: "notice",
        details: `${property.propertyId} served ${noticeType} notice due to ${args.citizenResponse || args.visitType}`
      });
    }

    const message = collectionResult 
      ? `Rs ${collectionResult.amount} collected for Property ${property.propertyId} by Collector ${user.name}`
      : `Visit recorded for Property ${property.propertyId}. Status: ${args.citizenResponse || args.visitType}`;

    return {
      visit: { property, visitType: args.visitType, citizenResponse: args.citizenResponse, timestamp },
      receipt: collectionResult,
      notice: noticeResult,
      whatsappUrl: `https://wa.me/91${property.mobile}?text=${encodeURIComponent(message)}`
    };
  }
});

export const supervisorDashboard = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["supervisor"]);
    const [users, properties, visits, collections, notices, wards] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("properties").collect(),
      ctx.db.query("visits").collect(),
      ctx.db.query("collections").collect(),
      ctx.db.query("notices").collect(),
      ctx.db.query("wards").collect()
    ]);

    const propertyMap = new Map(properties.map((item) => [item._id, item]));
    const scopedProperties = properties.filter((item) => !user.assignedWard || item.ward === user.assignedWard);
    const scopedPropertyIds = new Set(scopedProperties.map((item) => item._id));
    const scopedVisits = visits.filter((item) => scopedPropertyIds.has(item.propertyId));
    const scopedCollections = collections.filter((item) => scopedPropertyIds.has(item.propertyId));
    const scopedNotices = notices.filter((item) => scopedPropertyIds.has(item.propertyId));
    const scopedUsers = users.filter((entry) => entry.role !== "admin" && (!user.assignedWard || entry.assignedWard === user.assignedWard));
    const collectors = scopedUsers.filter((entry) => entry.role === "collector");
    const todayStart = getDayStart();
    const visitsToday = scopedVisits.filter((item) => item.timestamp >= todayStart);
    const paidToday = visitsToday.filter((item) => item.visitType === "paid");
    const notPaidToday = visitsToday.filter((item) => item.visitType === "not_paid");
    const ward = wards.find((entry) => entry._id === user.assignedWard) || null;
    const recentActivity = withRelations({
      visits: scopedVisits,
      collections: scopedCollections,
      notices: scopedNotices,
      properties: scopedProperties,
      users
    }).sort((a, b) => b.timestamp - a.timestamp);

    const collectorPerformance = collectors.map((collector) => {
      const collectorVisits = scopedVisits.filter((item) => item.collectorId === collector._id);
      const paid = collectorVisits.filter((item) => item.visitType === "paid").length;
      const notPaid = collectorVisits.filter((item) => item.visitType === "not_paid").length;
      return {
        id: collector._id,
        name: collector.name,
        phone: collector.phone,
        assignedArea: collector.assignedArea || "",
        totalVisits: collectorVisits.length,
        paidVisits: paid,
        notPaidVisits: notPaid
      };
    });

    return {
      ward: ward ? { ...ward, id: ward._id } : null,
      stats: {
        totalCollectors: collectors.length,
        totalVisitsToday: visitsToday.length,
        paidVisits: paidToday.length,
        notPaidVisits: notPaidToday.length,
        pendingRevisits: scopedNotices.filter((item) => item.status === "pending" && item.revisitStatus === "pending").length
      },
      quickActions: [
        { label: "Assign Collector", href: "/supervisor/assignments" },
        { label: "View Field Activity", href: "/supervisor/activity" },
        { label: "Monitor Visits", href: "/supervisor/activity" },
        { label: "Track Notices", href: "/supervisor/notices" }
      ],
      collectorPerformance,
      recentActivity: recentActivity.slice(0, 6),
      pendingNotices: scopedNotices
        .slice()
        .sort((a, b) => b.noticeDate - a.noticeDate)
        .slice(0, 5)
        .map((notice) => ({
          ...notice,
          id: notice._id,
          property: propertyMap.get(notice.propertyId) || null
        }))
    };
  }
});

export const supervisorCollectors = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["supervisor"]);
    const [users, wards, visits] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("wards").collect(),
      ctx.db.query("visits").collect()
    ]);

    const wardMap = new Map(wards.map((ward) => [ward._id, ward]));
    return users
      .filter((entry) => entry.role === "collector")
      .filter((entry) => !user.assignedWard || !entry.assignedWard || entry.assignedWard === user.assignedWard)
      .map((collector) => ({
        ...collector,
        id: collector._id,
        wardDetails: collector.assignedWard ? wardMap.get(collector.assignedWard) || null : null,
        totalVisits: visits.filter((item) => item.collectorId === collector._id).length
      }));
  }
});

export const supervisorAssignableWards = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["supervisor"]);
    const wards = await ctx.db.query("wards").collect();
    return wards
      .filter((ward) => !user.assignedWard || ward._id === user.assignedWard)
      .map((ward) => ({ ...ward, id: ward._id }));
  }
});

export const assignCollector = mutation({
  args: {
    token: v.string(),
    collectorId: v.id("users"),
    assignedWard: v.id("wards"),
    assignedArea: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["supervisor"]);
    if (user.assignedWard && user.assignedWard !== args.assignedWard) {
      throw new Error("You can only assign collectors inside your ward.");
    }

    const collector = await ctx.db.get(args.collectorId);
    if (!collector || collector.role !== "collector") {
      throw new Error("Collector not found.");
    }

    await ctx.db.patch(args.collectorId, {
      assignedWard: args.assignedWard,
      assignedArea: args.assignedArea?.trim()
    });

    const ward = await ctx.db.get(args.assignedWard);
    await createAuditLog(ctx, {
      action: "Collector assigned",
      performedBy: user.name,
      entityType: "user",
      details: `${collector.name} assigned to ${ward?.wardName || "ward"}${args.assignedArea?.trim() ? ` (${args.assignedArea.trim()})` : ""}`
    });
  }
});

export const supervisorActivity = query({
  args: {
    token: v.string(),
    filter: v.optional(v.string()),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["supervisor"]);
    const [visits, collections, notices, properties, users] = await Promise.all([
      ctx.db.query("visits").collect(),
      ctx.db.query("collections").collect(),
      ctx.db.query("notices").collect(),
      ctx.db.query("properties").collect(),
      ctx.db.query("users").collect()
    ]);

    const scopedProperties = properties.filter((item) => !user.assignedWard || item.ward === user.assignedWard);
    const scopedPropertyIds = new Set(scopedProperties.map((item) => item._id));
    const search = String(args.search || "").trim().toLowerCase();

    return withRelations({
      visits: visits.filter((item) => scopedPropertyIds.has(item.propertyId)),
      collections: collections.filter((item) => scopedPropertyIds.has(item.propertyId)),
      notices: notices.filter((item) => scopedPropertyIds.has(item.propertyId)),
      properties: scopedProperties,
      users
    })
      .filter((visit) => {
        if (args.filter === "paid") return visit.visitType === "paid";
        if (args.filter === "not_paid") return visit.visitType === "not_paid";
        if (args.filter === "revisit") return visit.statusFlow.includes("REVISIT_REQUIRED");
        return true;
      })
      .filter((visit) => {
        if (!search) return true;
        return [
          visit.property?.propertyId,
          visit.collector?.name,
          visit.geoLocation,
          visit.visitType,
          visit.statusFlow.join(" ")
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }
});

export const supervisorNotices = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["supervisor"]);
    const [notices, properties] = await Promise.all([
      ctx.db.query("notices").collect(),
      ctx.db.query("properties").collect()
    ]);

    const scopedProperties = properties.filter((item) => !user.assignedWard || item.ward === user.assignedWard);
    const propertyMap = new Map(scopedProperties.map((item) => [item._id, item]));
    const search = String(args.search || "").trim().toLowerCase();

    return notices
      .filter((notice) => propertyMap.has(notice.propertyId))
      .map((notice) => ({
        ...notice,
        id: notice._id,
        property: propertyMap.get(notice.propertyId) || null
      }))
      .filter((notice) => {
        if (!search) return true;
        return [
          notice.property?.propertyId,
          notice.property?.ownerName,
          notice.status,
          notice.revisitStatus
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((a, b) => b.noticeDate - a.noticeDate);
  }
});

export const citizenDashboard = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["citizen"]);
    const [properties, visits, collections, notices, users, wards] = await Promise.all([
      ctx.db.query("properties").collect(),
      ctx.db.query("visits").collect(),
      ctx.db.query("collections").collect(),
      ctx.db.query("notices").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("wards").collect()
    ]);

    const citizenProperties = getCitizenProperties(user, properties);
    const propertyIds = new Set(citizenProperties.map((item) => item._id));
    const propertyMap = new Map(citizenProperties.map((item) => [item._id, item]));
    const wardMap = new Map(wards.map((item) => [item._id, item]));
    const citizenVisits = withRelations({
      visits: visits.filter((item) => propertyIds.has(item.propertyId)),
      collections: collections.filter((item) => propertyIds.has(item.propertyId)),
      notices: notices.filter((item) => propertyIds.has(item.propertyId)),
      properties: citizenProperties,
      users
    }).sort((a, b) => b.timestamp - a.timestamp);
    const citizenCollections = collections
      .filter((item) => propertyIds.has(item.propertyId))
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((item) => ({
        ...item,
        id: item._id,
        property: propertyMap.get(item.propertyId) || null
      }));
    const citizenNotices = notices
      .filter((item) => propertyIds.has(item.propertyId))
      .sort((a, b) => b.noticeDate - a.noticeDate)
      .map((item) => ({
        ...item,
        id: item._id,
        property: propertyMap.get(item.propertyId) || null
      }));

    // Get D2DC Dues from assessments/demands tables
    let totalPendingMonths = 0;
    let totalDue = 0;
    let monthlyCharge = 100;

    const propertyDues = await Promise.all(
      citizenProperties.map(async (property) => {
        const [assessment, demand] = await Promise.all([
          ctx.db.query("assessments").withIndex("by_property", (q) => q.eq("propertyId", property._id)).unique(),
          ctx.db.query("demands").withIndex("by_property", (q) => q.eq("propertyId", property._id)).unique()
        ]);
        
        if (assessment) monthlyCharge = assessment.monthlyCharge;
        
        return {
          propertyId: property._id,
          pendingMonths: demand?.pendingMonths ?? 0,
          baseAmount: demand?.baseAmount ?? 0,
          penaltyAmount: demand?.penaltyAmount ?? 0,
          totalAmount: demand?.totalAmount ?? 0,
          monthlyCharge: assessment?.monthlyCharge ?? 100
        };
      })
    );

    totalPendingMonths = propertyDues.reduce((acc, d) => acc + d.pendingMonths, 0);
    totalDue = propertyDues.reduce((acc, d) => acc + d.totalAmount, 0);
    const totalPenalty = propertyDues.reduce((acc, d) => acc + d.penaltyAmount, 0);
    const totalBase = propertyDues.reduce((acc, d) => acc + d.baseAmount, 0);

    return {
      stats: {
        totalVisits: citizenVisits.length,
        paidVisits: citizenVisits.filter((item) => item.visitType === "paid").length,
        notPaidVisits: citizenVisits.filter((item) => item.visitType === "not_paid").length,
        pendingNotices: citizenNotices.filter((item) => item.status === "pending").length,
        monthlyCharge: monthlyCharge,
        pendingMonths: totalPendingMonths,
        baseAmount: totalBase,
        penaltyAmount: totalPenalty,
        totalDue: totalDue,
        paymentStatus: totalDue > 0 ? "Pending" : "Up-to-date"
      },
      properties: citizenProperties.map((property) => {
        const dues = propertyDues.find(d => d.propertyId === property._id);
        return {
          ...property,
          id: property._id,
          wardDetails: wardMap.get(property.ward) || null,
          dues: dues || {
            pendingMonths: 0,
            baseAmount: 0,
            penaltyAmount: 0,
            totalAmount: 0,
            monthlyCharge: 100
          }
        };
      }),
      recentVisits: citizenVisits.slice(0, 5),
      recentCollections: citizenCollections.slice(0, 5),
      pendingNotices: citizenNotices.filter((item) => item.status === "pending").slice(0, 5),
      supportWhatsAppUrl: `https://wa.me/919999999999?text=${encodeURIComponent("I need help regarding my property")}`
    };
  }
});

export const citizenVisitHistory = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["citizen"]);
    const [properties, visits, collections, notices, users] = await Promise.all([
      ctx.db.query("properties").collect(),
      ctx.db.query("visits").collect(),
      ctx.db.query("collections").collect(),
      ctx.db.query("notices").collect(),
      ctx.db.query("users").collect()
    ]);

    const citizenProperties = getCitizenProperties(user, properties);
    const propertyIds = new Set(citizenProperties.map((item) => item._id));

    return withRelations({
      visits: visits.filter((item) => propertyIds.has(item.propertyId)),
      collections: collections.filter((item) => propertyIds.has(item.propertyId)),
      notices: notices.filter((item) => propertyIds.has(item.propertyId)),
      properties: citizenProperties,
      users
    }).sort((a, b) => b.timestamp - a.timestamp);
  }
});

export const citizenNotices = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["citizen"]);
    const [properties, notices] = await Promise.all([
      ctx.db.query("properties").collect(),
      ctx.db.query("notices").collect()
    ]);

    const citizenProperties = getCitizenProperties(user, properties);
    const propertyMap = new Map(citizenProperties.map((item) => [item._id, item]));

    return notices
      .filter((item) => propertyMap.has(item.propertyId))
      .map((item) => ({
        ...item,
        id: item._id,
        property: propertyMap.get(item.propertyId) || null
      }))
      .sort((a, b) => b.noticeDate - a.noticeDate);
  }
});

export const citizenCollections = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["citizen"]);
    const [properties, collections] = await Promise.all([
      ctx.db.query("properties").collect(),
      ctx.db.query("collections").collect()
    ]);

    const citizenProperties = getCitizenProperties(user, properties);
    const propertyMap = new Map(citizenProperties.map((item) => [item._id, item]));

    return collections
      .filter((item) => propertyMap.has(item.propertyId))
      .map((item) => ({
        ...item,
        id: item._id,
        property: propertyMap.get(item.propertyId) || null
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }
});

export const citizenPayCollection = mutation({
  args: {
    token: v.string(),
    propertyId: v.id("properties"),
    amount: v.number(),
    paymentMode: v.union(v.literal("cash"), v.literal("upi"))
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["citizen"]);
    const properties = await ctx.db.query("properties").collect();
    const allowedProperties = getCitizenProperties(user, properties);
    const property = allowedProperties.find((item) => item._id === args.propertyId);

    if (!property) {
      throw new Error("Property not available for this citizen.");
    }
    if (args.amount <= 0) {
      throw new Error("Enter a valid amount.");
    }

    const collectionId = await ctx.db.insert("collections", {
      propertyId: args.propertyId,
      collectorId: user._id,
      amount: args.amount,
      paymentMode: args.paymentMode,
      status: "pending",
      geoLocation: "Citizen Payment",
      timestamp: Date.now()
    });

    await createAuditLog(ctx, {
      action: "Citizen payment submitted",
      performedBy: user.name,
      entityType: "collection",
      details: `${property.propertyId} payment submitted by citizen`
    });

    return collectionId;
  }
});
export const generateManualNotice = mutation({
  args: {
    token: v.string(),
    propertyId: v.id("properties"),
    noticeType: v.union(v.literal("reminder"), v.literal("demand"), v.literal("penalty"), v.literal("final_warrant")),
    penaltyAmount: v.number(),
    remarks: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin", "supervisor"]);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found.");

    const demand = await ctx.db
      .query("demands")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .unique();

    const timestamp = Date.now();
    const noticeNumber = `NTC-MAN-${timestamp}-${property.propertyId.split('-').pop()}`;
    
    const noticeId = await ctx.db.insert("notices", {
      propertyId: args.propertyId,
      demandId: demand?._id,
      noticeNumber,
      noticeType: args.noticeType,
      amountDue: demand?.totalAmount || 0,
      penaltyAmount: args.penaltyAmount,
      noticeDate: timestamp,
      status: "generated",
      revisitStatus: "pending",
      remarks: args.remarks,
      generatedBy: user._id,
      createdAt: timestamp
    });

    // Update demand table with new penalty if applicable
    if (demand && args.penaltyAmount > 0) {
       await ctx.db.patch(demand._id, {
          penaltyAmount: (demand.penaltyAmount || 0) + args.penaltyAmount,
          totalAmount: (demand.totalAmount || 0) + args.penaltyAmount,
          lastUpdated: timestamp
       });
    }

    await createAuditLog(ctx, {
      action: "Manual notice generated",
      performedBy: user.name,
      entityType: "notice",
      details: `${property.propertyId} manual ${args.noticeType} notice of Rs ${args.penaltyAmount} penalty`
    });

    const message = `Official ${args.noticeType.toUpperCase()} Notice issued for Property ${property.propertyId}. Please clear dues immediately.`;
    return {
      id: noticeId,
      whatsappUrl: `https://wa.me/91${property.mobile}?text=${encodeURIComponent(message)}`
    };
  }
});

export const collectorCollections = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["collector", "supervisor"]);
    const [collections, properties] = await Promise.all([
      ctx.db.query("collections").withIndex("by_collector", (q) => q.eq("collectorId", user._id)).collect(),
      ctx.db.query("properties").collect()
    ]);
    const propertyMap = new Map(properties.map((item) => [item._id, item]));
    const search = String(args.search || "").trim().toLowerCase();

    return collections
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((collection) => ({
        ...collection,
        id: collection._id,
        property: propertyMap.get(collection.propertyId) || null
      }))
      .filter((collection) => {
        if (!search) return true;
        return [
          collection.property?.propertyId,
          collection.property?.ownerName,
          collection.paymentMode,
          collection.status,
          collection.transactionId,
          collection.chequeNumber
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
  }
});
