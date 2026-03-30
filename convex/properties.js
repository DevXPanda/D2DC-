import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { createAuditLog, hashPassword, normalizeEmail, normalizePhone, normalizeUsername, requireRole } from "./helpers";

async function ensureCitizenForProperty(ctx, { ownerName, mobile }) {
  const normalizedPhone = normalizePhone(mobile);
  if (!normalizedPhone) {
    throw new Error("Valid mobile number is required.");
  }

  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
    .unique();

  if (existingUser) {
    if (existingUser.role !== "citizen") {
      throw new Error("This mobile number is already used by a non-citizen account.");
    }

    if (existingUser.name !== ownerName.trim()) {
      await ctx.db.patch(existingUser._id, { name: ownerName.trim() });
    }

    return existingUser._id;
  }

  const generatedUsername = normalizeUsername(`citizen-${normalizedPhone}`);
  const generatedEmail = normalizeEmail(`${normalizedPhone}@citizen.local`);
  const citizenId = await ctx.db.insert("users", {
    name: ownerName.trim(),
    username: generatedUsername,
    email: generatedEmail,
    phone: normalizedPhone,
    passwordHash: await hashPassword(normalizedPhone),
    role: "citizen",
    isActive: true,
    createdAt: Date.now()
  });

  return citizenId;
}

export const listProperties = query({
  args: {
    token: v.string(),
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const [properties, wards, users] = await Promise.all([ctx.db.query("properties").collect(), ctx.db.query("wards").collect(), ctx.db.query("users").collect()]);
    const wardMap = new Map(wards.map((ward) => [ward._id, ward]));
    const userMap = new Map(users.map((user) => [user._id, user]));
    const search = String(args.search || "").trim().toLowerCase();

    return properties
      .map((property) => ({
        ...property,
        id: property._id,
        wardDetails: wardMap.get(property.ward) || null,
        citizen: userMap.get(property.citizenId) || null
      }))
      .filter((property) => {
        if (!search) return true;
        return [
          property.propertyId,
          property.ownerName,
          property.mobile,
          property.address,
          property.wardDetails?.wardName,
          property.wardDetails?.wardNumber,
          property.citizen?.name,
          property.citizen?.phone
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
  }
});

export const lookupCitizenByPhone = query({
  args: {
    token: v.string(),
    phone: v.string()
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.token, ["admin"]);
    const normalizedPhone = normalizePhone(args.phone);
    if (!normalizedPhone) return null;

    const citizen = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .unique();

    if (!citizen || citizen.role !== "citizen") {
      return {
        citizenExists: false,
        name: "",
        phone: normalizedPhone
      };
    }

    return {
      citizenExists: true,
      id: citizen._id,
      name: citizen.name,
      phone: citizen.phone
    };
  }
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  }
});

export const create = mutation({
  args: {
    token: v.string(),
    ownerName: v.string(),
    mobile: v.string(),
    address: v.string(),
    ward: v.id("wards"),
    status: v.union(v.literal("active"), v.literal("inactive")),
    propertyNumber: v.optional(v.string()),
    ownerPhotoId: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    usageType: v.optional(v.string()),
    constructionType: v.optional(v.string()),
    numberOfFloors: v.optional(v.number()),
    constructionYear: v.optional(v.number()),
    occupancyStatus: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    totalArea: v.optional(v.number()),
    builtUpArea: v.optional(v.number()),
    latitude: v.optional(v.string()),
    longitude: v.optional(v.string()),
    propertyPhotoIds: v.optional(v.array(v.string())),
    remarks: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const ward = await ctx.db.get(args.ward);
    if (!ward) {
      throw new Error("Ward not found.");
    }
    const citizenId = await ensureCitizenForProperty(ctx, {
      ownerName: args.ownerName,
      mobile: args.mobile
    });

    const existing = await ctx.db
      .query("properties")
      .withIndex("by_ward", (q) => q.eq("ward", args.ward))
      .collect();

    const propertyId = `D2DC-${ward.wardNumber}-${String(existing.length + 1).padStart(4, "0")}`;
    const now = Date.now();
    const propertyDocId = await ctx.db.insert("properties", {
      propertyId,
      ownerName: args.ownerName.trim(),
      mobile: normalizePhone(args.mobile),
      address: args.address.trim(),
      ward: args.ward,
      citizenId,
      status: args.status,
      propertyNumber: args.propertyNumber,
      ownerPhotoId: args.ownerPhotoId,
      propertyType: args.propertyType,
      usageType: args.usageType,
      constructionType: args.constructionType,
      numberOfFloors: args.numberOfFloors,
      constructionYear: args.constructionYear,
      occupancyStatus: args.occupancyStatus,
      city: args.city,
      state: args.state,
      pincode: args.pincode,
      totalArea: args.totalArea,
      builtUpArea: args.builtUpArea,
      latitude: args.latitude,
      longitude: args.longitude,
      propertyPhotoIds: args.propertyPhotoIds,
      remarks: args.remarks,
      lastPaidDate: now,
      createdAt: now
    });

    // Create Assessment
    await ctx.db.insert("assessments", {
      propertyId: propertyDocId,
      monthlyCharge: 100,
      startDate: now,
      status: "active",
      createdAt: now,
      createdBy: user._id,
      autoBilling: true
    });

    // Initial Demand
    await ctx.db.insert("demands", {
      propertyId: propertyDocId,
      totalAmount: 0,
      pendingMonths: 0,
      baseAmount: 0,
      penaltyAmount: 0,
      generatedBy: "system",
      lastUpdated: now
    });

    await createAuditLog(ctx, {
      action: "Property created",
      performedBy: user.name,
      entityType: "property",
      details: `${propertyId} created with assessment and demand`
    });

    return propertyDocId;
  }
});

export const update = mutation({
  args: {
    token: v.string(),
    propertyDocId: v.id("properties"),
    ownerName: v.string(),
    mobile: v.string(),
    address: v.string(),
    ward: v.id("wards"),
    status: v.union(v.literal("active"), v.literal("inactive")),
    propertyNumber: v.optional(v.string()),
    ownerPhotoId: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    usageType: v.optional(v.string()),
    constructionType: v.optional(v.string()),
    numberOfFloors: v.optional(v.number()),
    constructionYear: v.optional(v.number()),
    occupancyStatus: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    totalArea: v.optional(v.number()),
    builtUpArea: v.optional(v.number()),
    latitude: v.optional(v.string()),
    longitude: v.optional(v.string()),
    propertyPhotoIds: v.optional(v.array(v.string())),
    remarks: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const existing = await ctx.db.get(args.propertyDocId);
    if (!existing) {
      throw new Error("Property not found.");
    }
    const citizenId = await ensureCitizenForProperty(ctx, {
      ownerName: args.ownerName,
      mobile: args.mobile
    });

    await ctx.db.patch(args.propertyDocId, {
      ownerName: args.ownerName.trim(),
      mobile: normalizePhone(args.mobile),
      address: args.address.trim(),
      ward: args.ward,
      citizenId,
      status: args.status,
      propertyNumber: args.propertyNumber,
      ownerPhotoId: args.ownerPhotoId,
      propertyType: args.propertyType,
      usageType: args.usageType,
      constructionType: args.constructionType,
      numberOfFloors: args.numberOfFloors,
      constructionYear: args.constructionYear,
      occupancyStatus: args.occupancyStatus,
      city: args.city,
      state: args.state,
      pincode: args.pincode,
      totalArea: args.totalArea,
      builtUpArea: args.builtUpArea,
      latitude: args.latitude,
      longitude: args.longitude,
      propertyPhotoIds: args.propertyPhotoIds,
      remarks: args.remarks
    });

    await createAuditLog(ctx, {
      action: "Property updated",
      performedBy: user.name,
      entityType: "property",
      details: `${existing.propertyId} updated`
    });
  }
});

export const remove = mutation({
  args: {
    token: v.string(),
    propertyDocId: v.id("properties")
  },
  handler: async (ctx, args) => {
    const { user } = await requireRole(ctx, args.token, ["admin"]);
    const [existing, visits, collections, notices] = await Promise.all([
      ctx.db.get(args.propertyDocId),
      ctx.db.query("visits").collect(),
      ctx.db.query("collections").collect(),
      ctx.db.query("notices").collect()
    ]);

    if (!existing) {
      throw new Error("Property not found.");
    }

    if (
      visits.some((item) => item.propertyId === args.propertyDocId) ||
      collections.some((item) => item.propertyId === args.propertyDocId) ||
      notices.some((item) => item.propertyId === args.propertyDocId)
    ) {
      throw new Error("Remove related D2DC activity before deleting this property.");
    }

    await ctx.db.delete(args.propertyDocId);
    await createAuditLog(ctx, {
      action: "Property deleted",
      performedBy: user.name,
      entityType: "property",
      details: `${existing.propertyId} deleted`
    });
  }
});
