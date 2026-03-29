import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    username: v.string(),
    email: v.string(),
    phone: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("admin"), v.literal("supervisor"), v.literal("collector"), v.literal("citizen")),
    assignedWard: v.optional(v.id("wards")),
    assignedArea: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number()
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_phone", ["phone"])
    .index("by_role", ["role"])
    .index("by_assigned_ward", ["assignedWard"]),
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number()
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),
  wards: defineTable({
    wardNumber: v.string(),
    wardName: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number()
  }),
  properties: defineTable({
    propertyId: v.string(),
    ownerName: v.string(),
    mobile: v.string(),
    address: v.string(),
    ward: v.id("wards"),
    citizenId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number()
  })
    .index("by_property_id", ["propertyId"])
    .index("by_ward", ["ward"])
    .index("by_citizen", ["citizenId"]),
  visits: defineTable({
    propertyId: v.id("properties"),
    collectorId: v.id("users"),
    visitType: v.union(v.literal("paid"), v.literal("not_paid")),
    geoLocation: v.string(),
    timestamp: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_collector", ["collectorId"]),
  collections: defineTable({
    propertyId: v.id("properties"),
    collectorId: v.id("users"),
    amount: v.number(),
    paymentMode: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("rejected")),
    geoLocation: v.string(),
    timestamp: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_collector", ["collectorId"])
    .index("by_status", ["status"]),
  notices: defineTable({
    propertyId: v.id("properties"),
    penaltyAmount: v.number(),
    noticeDate: v.number(),
    status: v.union(v.literal("pending"), v.literal("resolved")),
    revisitStatus: v.union(v.literal("pending"), v.literal("completed")),
    createdAt: v.number()
  }).index("by_property", ["propertyId"]),
  auditLogs: defineTable({
    action: v.string(),
    performedBy: v.string(),
    entityType: v.string(),
    details: v.string(),
    timestamp: v.number()
  }).index("by_timestamp", ["timestamp"])
});
