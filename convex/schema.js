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
    collectorId: v.optional(v.id("users")),
    isActive: v.boolean(),
    createdAt: v.number()
  }),
  properties: defineTable({
    propertyId: v.string(), // Auto-generated ID (like D2DC-45-0001)
    propertyNumber: v.optional(v.string()),
    ownerName: v.string(),
    mobile: v.string(),
    ownerPhotoId: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    usageType: v.optional(v.string()),
    constructionType: v.optional(v.string()),
    numberOfFloors: v.optional(v.number()),
    constructionYear: v.optional(v.number()),
    occupancyStatus: v.optional(v.string()),
    address: v.string(),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    totalArea: v.optional(v.number()),
    builtUpArea: v.optional(v.number()),
    latitude: v.optional(v.string()),
    longitude: v.optional(v.string()),
    propertyPhotoIds: v.optional(v.array(v.string())),
    remarks: v.optional(v.string()),
    ward: v.id("wards"),
    citizenId: v.optional(v.id("users")), // Link to citizen user if exists
    status: v.union(v.literal("active"), v.literal("inactive")),
    lastPaidDate: v.optional(v.number()),
    createdAt: v.number()
  })
    .index("by_property_id", ["propertyId"])
    .index("by_ward", ["ward"])
    .index("by_citizen", ["citizenId"]),
  visits: defineTable({
    propertyId: v.id("properties"),
    collectorId: v.id("users"),
    visitType: v.union(v.literal("paid"), v.literal("not_paid"), v.literal("reminder"), v.literal("payment_collection"), v.literal("warning"), v.literal("final_warning")),
    citizenResponse: v.optional(v.union(v.literal("will_pay_today"), v.literal("will_pay_later"), v.literal("refused_to_pay"), v.literal("not_available"))),
    expectedPaymentDate: v.optional(v.number()),
    remarks: v.optional(v.string()),
    proofPhotoUrl: v.optional(v.string()),
    geoLocation: v.string(),
    timestamp: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_collector", ["collectorId"]),
  collections: defineTable({
    propertyId: v.id("properties"),
    collectorId: v.id("users"),
    visitId: v.optional(v.id("visits")),
    amount: v.number(),
    baseAmount: v.optional(v.number()),
    penaltyAmount: v.optional(v.number()),
    paymentMode: v.string(),
    transactionId: v.optional(v.string()),
    chequeNumber: v.optional(v.string()),
    chequeDate: v.optional(v.number()),
    bankName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("rejected")),
    monthsCovered: v.optional(v.number()),
    geoLocation: v.string(),
    timestamp: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_collector", ["collectorId"])
    .index("by_status", ["status"])
    .index("by_visit", ["visitId"]),
  notices: defineTable({
    propertyId: v.id("properties"),
    demandId: v.optional(v.id("demands")),
    noticeNumber: v.string(),
    noticeType: v.union(v.literal("reminder"), v.literal("demand"), v.literal("penalty"), v.literal("final_warrant")),
    amountDue: v.number(),
    penaltyAmount: v.number(),
    noticeDate: v.number(),
    dueDate: v.optional(v.number()),
    status: v.union(v.literal("generated"), v.literal("sent"), v.literal("resolved"), v.literal("escalated")),
    revisitStatus: v.union(v.literal("pending"), v.literal("completed")),
    remarks: v.optional(v.string()),
    generatedBy: v.string(), // "system" or userID
    sentDate: v.optional(v.number()),
    createdAt: v.number()
  })
    .index("by_property", ["propertyId"])
    .index("by_demand", ["demandId"])
    .index("by_notice_number", ["noticeNumber"]),
  auditLogs: defineTable({
    action: v.string(),
    performedBy: v.string(),
    entityType: v.string(),
    details: v.string(),
    timestamp: v.number()
  }).index("by_timestamp", ["timestamp"]),
  assessments: defineTable({
    propertyId: v.id("properties"),
    monthlyCharge: v.number(),
    startDate: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
    createdBy: v.id("users"),
    autoBilling: v.boolean(),
  }).index("by_property", ["propertyId"]),
  demands: defineTable({
    propertyId: v.id("properties"),
    pendingMonths: v.number(),
    baseAmount: v.number(),
    penaltyAmount: v.number(),
    totalAmount: v.number(),
    lastUpdated: v.number(),
    generatedBy: v.string(), // "system" or userID
  }).index("by_property", ["propertyId"])
});
