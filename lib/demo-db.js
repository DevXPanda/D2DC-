"use client";

const DB_KEY = "d2dc-demo-db";
const DB_VERSION = 4;

const seedData = {
  schemaVersion: DB_VERSION,
  users: [],
  wards: [],
  properties: [],
  visits: [],
  collections: [],
  notices: [],
  auditLogs: []
};

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function toCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedData));
}

export function getDb() {
  if (typeof window === "undefined") return cloneSeed();
  const raw = window.localStorage.getItem(DB_KEY);
  if (!raw) {
    const seed = cloneSeed();
    window.localStorage.setItem(DB_KEY, JSON.stringify(seed));
    return seed;
  }
  const parsed = JSON.parse(raw);
  if (
    parsed.schemaVersion !== DB_VERSION ||
    !Array.isArray(parsed.visits) ||
    !Array.isArray(parsed.collections) ||
    !Array.isArray(parsed.notices) ||
    !Array.isArray(parsed.auditLogs)
  ) {
    const seed = cloneSeed();
    window.localStorage.setItem(DB_KEY, JSON.stringify(seed));
    return seed;
  }
  parsed.users = (parsed.users || []).map((user) => ({
    ...user,
    name: String(user.name || "").trim(),
    username: String(user.username || "").trim(),
    email: String(user.email || "").trim().toLowerCase(),
    phone: normalizePhone(user.phone),
    password: String(user.password || "").trim(),
    role: String(user.role || "").trim().toLowerCase(),
    assignedWard: String(user.assignedWard || "").trim()
  }));
  return parsed;
}

function saveDb(db) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function wardById(db, wardId) {
  return db.wards.find((ward) => ward.id === wardId) || null;
}

function userById(db, userId) {
  return db.users.find((user) => user.id === userId) || null;
}

function propertyById(db, id) {
  return db.properties.find((property) => property.id === id) || null;
}

function enrichProperty(db, property) {
  return {
    ...property,
    wardDetails: wardById(db, property.ward)
  };
}

function enrichVisit(db, visit) {
  return {
    ...visit,
    property: propertyById(db, visit.propertyId),
    collector: userById(db, visit.collectorId)
  };
}

function enrichCollection(db, collection) {
  return {
    ...collection,
    property: propertyById(db, collection.propertyId),
    collector: userById(db, collection.collectorId),
    visit: db.visits.find((visit) => visit.id === collection.visitId) || null
  };
}

function enrichNotice(db, notice) {
  return {
    ...notice,
    property: propertyById(db, notice.propertyId),
    visit: db.visits.find((visit) => visit.id === notice.visitId) || null
  };
}

function addAuditLog(db, { action, performedBy, entityType, entityId, details }) {
  db.auditLogs.unshift({
    id: makeId("audit"),
    action,
    performedBy,
    timestamp: new Date().toISOString(),
    entityType,
    entityId,
    details
  });
}

function nextPropertyId(db, wardId) {
  const ward = wardById(db, wardId);
  const wardNumber = ward?.wardNumber || "000";
  const wardProperties = db.properties.filter((property) => property.ward === wardId).length + 1;
  return `D2DC-${wardNumber}-${String(wardProperties).padStart(4, "0")}`;
}

function matchesSearch(term, ...values) {
  if (!term) return true;
  return values.some((value) => String(value || "").toLowerCase().includes(term));
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function phoneMatches(left, right) {
  const a = normalizePhone(left);
  const b = normalizePhone(right);
  if (!a || !b) return false;
  return a === b || a.slice(-10) === b.slice(-10);
}

function calculateInsights(db) {
  const totalCollectionsAmount = db.collections
    .filter((collection) => collection.status === "completed")
    .reduce((sum, collection) => sum + collection.amount, 0);
  const totalPendingVisits = db.visits.filter((visit) => visit.visitType === "not_paid").length;
  const paidVisits = db.visits.filter((visit) => visit.visitType === "paid").length;
  const notPaidVisits = db.visits.filter((visit) => visit.visitType === "not_paid").length;
  const totalVisits = db.visits.length;
  const noticeServedCount = db.notices.length;
  const penaltyCollected = db.notices
    .filter((notice) => notice.status === "resolved")
    .reduce((sum, notice) => sum + notice.penaltyAmount, 0);

  return {
    totalProperties: db.properties.length,
    totalVisits,
    totalCollectionsAmount,
    totalCollectionEntries: db.collections.length,
    totalPendingVisits,
    totalNotices: db.notices.length,
    noticeServedCount,
    penaltyCollected,
    paidPercent: totalVisits ? Math.round((paidVisits / totalVisits) * 100) : 0,
    notPaidPercent: totalVisits ? Math.round((notPaidVisits / totalVisits) * 100) : 0
  };
}

export function loginAdmin(identifier, password) {
  return loginUserByRole(identifier, password, ["admin"]);
}

export function loginCollector(identifier, password) {
  return loginUserByRole(identifier, password, ["collector"]);
}

export function hasAdminAccount() {
  const db = getDb();
  return db.users.some((user) => user.role === "admin" && user.isActive);
}

export function createAdminAccount(payload) {
  const db = getDb();
  const hasAdmin = db.users.some((user) => user.role === "admin" && user.isActive);
  if (hasAdmin) {
    throw new Error("Admin account already exists");
  }

  const email = String(payload.email || "").trim().toLowerCase();
  const username = String(payload.username || "").trim();
  const phone = normalizePhone(payload.phone);

  if (!payload.name || !username || !email || !phone || !payload.password) {
    throw new Error("All admin account fields are required");
  }

  const duplicate = db.users.some(
    (user) =>
      normalizeText(user.email) === email ||
      normalizeText(user.username) === normalizeText(username) ||
      phoneMatches(user.phone, phone)
  );
  if (duplicate) {
    throw new Error("An account with this email, username, or phone already exists");
  }

  const admin = {
    id: makeId("user"),
    name: String(payload.name).trim(),
    username,
    email,
    phone,
    password: String(payload.password).trim(),
    role: "admin",
    assignedWard: "",
    isActive: true,
    createdAt: new Date().toISOString()
  };

  db.users.unshift(admin);
  saveDb(db);
  return admin;
}

function loginUserByRole(identifier, password, roles) {
  const db = getDb();
  const normalizedIdentifier = normalizeText(identifier);
  const normalizedPassword = String(password || "").trim();
  const user = db.users.find(
    (entry) =>
      entry.isActive &&
      roles.includes(entry.role) &&
      (
        normalizeText(entry.email) === normalizedIdentifier ||
        normalizeText(entry.username) === normalizedIdentifier ||
        phoneMatches(entry.phone, identifier)
      ) &&
      String(entry.password || "").trim() === normalizedPassword
  );

  if (!user) return null;

  const names = user.name.split(" ");
  return {
    id: user.id,
    firstName: names[0] || user.name,
    lastName: names.slice(1).join(" "),
    email: user.email,
    phone: user.phone,
    role: user.role,
    name: user.name,
    assignedWard: user.assignedWard || ""
  };
}

export function getDashboardStats() {
  const db = getDb();
  const insights = calculateInsights(db);
  const recentCollections = db.collections
    .map((collection) => enrichCollection(db, collection))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);
  const recentVisits = db.visits
    .map((visit) => enrichVisit(db, visit))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  return {
    ...insights,
    totalCollectionsLabel: toCurrency(insights.totalCollectionsAmount),
    penaltyCollectedLabel: toCurrency(insights.penaltyCollected),
    recentCollections,
    recentVisits
  };
}

export function listWards(search = "") {
  const db = getDb();
  const term = search.toLowerCase();
  return db.wards
    .filter((ward) => matchesSearch(term, ward.wardName, ward.wardNumber, ward.description))
    .map((ward) => ({
      ...ward,
      propertyCount: db.properties.filter((property) => property.ward === ward.id).length,
      userCount: db.users.filter((user) => user.assignedWard === ward.id).length
    }));
}

export function createWard(payload) {
  const db = getDb();
  const ward = {
    id: makeId("ward"),
    wardNumber: payload.wardNumber,
    wardName: payload.wardName,
    description: payload.description || "",
    isActive: payload.isActive ?? true,
    createdAt: new Date().toISOString()
  };
  db.wards.unshift(ward);
  addAuditLog(db, {
    action: "Ward created",
    performedBy: "System Admin",
    entityType: "ward",
    entityId: ward.id,
    details: `Ward ${ward.wardNumber} - ${ward.wardName} created`
  });
  saveDb(db);
  return ward;
}

export function updateWard(id, payload) {
  const db = getDb();
  db.wards = db.wards.map((ward) => (ward.id === id ? { ...ward, ...payload } : ward));
  const updatedWard = wardById(db, id);
  if (updatedWard) {
    addAuditLog(db, {
      action: "Ward updated",
      performedBy: "System Admin",
      entityType: "ward",
      entityId: updatedWard.id,
      details: `Ward ${updatedWard.wardNumber} updated`
    });
  }
  saveDb(db);
}

export function deleteWard(id) {
  const db = getDb();
  const ward = wardById(db, id);
  if (!ward) return;
  db.wards = db.wards.filter((entry) => entry.id !== id);
  db.users = db.users.map((user) => (user.assignedWard === id ? { ...user, assignedWard: "" } : user));
  addAuditLog(db, {
    action: "Ward deleted",
    performedBy: "System Admin",
    entityType: "ward",
    entityId: id,
    details: `Ward ${ward.wardNumber} removed from system`
  });
  saveDb(db);
}

export function listProperties(search = "") {
  const db = getDb();
  const term = search.toLowerCase();
  return db.properties
    .filter((property) =>
      matchesSearch(term, property.propertyId, property.ownerName, property.mobile, property.address)
    )
    .map((property) => enrichProperty(db, property));
}

export function createProperty(payload) {
  const db = getDb();
  const property = {
    id: makeId("property"),
    propertyId: nextPropertyId(db, payload.ward),
    ownerName: payload.ownerName,
    mobile: payload.mobile,
    address: payload.address,
    ward: payload.ward,
    status: payload.status || "active",
    createdAt: new Date().toISOString()
  };
  db.properties.unshift(property);
  addAuditLog(db, {
    action: "Property created",
    performedBy: "System Admin",
    entityType: "property",
    entityId: property.id,
    details: `Property ${property.propertyId} created for ${property.ownerName}`
  });
  saveDb(db);
  return property;
}

export function updateProperty(id, payload) {
  const db = getDb();
  db.properties = db.properties.map((property) =>
    property.id === id
      ? {
          ...property,
          ownerName: payload.ownerName,
          mobile: payload.mobile,
          address: payload.address,
          ward: payload.ward,
          status: payload.status
        }
      : property
  );
  const property = propertyById(db, id);
  if (property) {
    addAuditLog(db, {
      action: "Property updated",
      performedBy: "System Admin",
      entityType: "property",
      entityId: property.id,
      details: `Property ${property.propertyId} updated`
    });
  }
  saveDb(db);
}

export function deleteProperty(id) {
  const db = getDb();
  const property = propertyById(db, id);
  if (!property) return;
  db.properties = db.properties.filter((entry) => entry.id !== id);
  db.visits = db.visits.filter((visit) => visit.propertyId !== id);
  db.collections = db.collections.filter((collection) => collection.propertyId !== id);
  db.notices = db.notices.filter((notice) => notice.propertyId !== id);
  addAuditLog(db, {
    action: "Property deleted",
    performedBy: "System Admin",
    entityType: "property",
    entityId: id,
    details: `Property ${property.propertyId} deleted`
  });
  saveDb(db);
}

export function listUsers(search = "", roles = []) {
  const db = getDb();
  const term = search.toLowerCase();
  return db.users
    .filter((user) => (roles.length ? roles.includes(user.role) : true))
    .filter((user) => matchesSearch(term, user.name, user.email, user.username, user.phone, user.role))
    .map((user) => ({
      ...user,
      wardDetails: wardById(db, user.assignedWard)
    }));
}

export function createUser(payload) {
  const db = getDb();
  const user = {
    id: makeId("user"),
    name: String(payload.name || "").trim(),
    username: String(payload.username || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    phone: normalizePhone(payload.phone),
    password: String(payload.password || "changeme123").trim(),
    role: String(payload.role || "").trim().toLowerCase(),
    assignedWard: String(payload.assignedWard || "").trim(),
    isActive: payload.isActive ?? true,
    createdAt: new Date().toISOString()
  };
  db.users.unshift(user);
  addAuditLog(db, {
    action: "User created",
    performedBy: "System Admin",
    entityType: "user",
    entityId: user.id,
    details: `${user.role} ${user.name} created`
  });
  saveDb(db);
  return user;
}

export function updateUser(id, payload) {
  const db = getDb();
  db.users = db.users.map((user) =>
    user.id === id
      ? {
          ...user,
          name: String(payload.name || "").trim(),
          username: String(payload.username || "").trim(),
          email: String(payload.email || "").trim().toLowerCase(),
          phone: normalizePhone(payload.phone),
          password: String(payload.password || user.password || "").trim(),
          role: String(payload.role || "").trim().toLowerCase(),
          assignedWard: String(payload.assignedWard || "").trim(),
          isActive: payload.isActive
        }
      : user
  );
  const user = userById(db, id);
  if (user) {
    addAuditLog(db, {
      action: "User updated",
      performedBy: "System Admin",
      entityType: "user",
      entityId: user.id,
      details: `${user.role} ${user.name} updated`
    });
  }
  saveDb(db);
}

export function deleteUser(id) {
  const db = getDb();
  const user = userById(db, id);
  if (!user) return;
  db.users = db.users.filter((entry) => entry.id !== id);
  addAuditLog(db, {
    action: "User deleted",
    performedBy: "System Admin",
    entityType: "user",
    entityId: id,
    details: `${user.role} ${user.name} deleted`
  });
  saveDb(db);
}

export function getCollectionApprovalQueue(search = "") {
  const db = getDb();
  const term = search.toLowerCase();
  return db.collections
    .map((collection) => enrichCollection(db, collection))
    .filter((collection) =>
      matchesSearch(
        term,
        collection.property?.propertyId,
        collection.collector?.name,
        collection.paymentMode,
        collection.status
      )
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function approveCollection(collectionId) {
  const db = getDb();
  const collection = db.collections.find((entry) => entry.id === collectionId);
  if (!collection) return;
  collection.status = "completed";
  const visit = db.visits.find((entry) => entry.id === collection.visitId);
  if (visit && !visit.statusFlow.includes("ADMIN_APPROVED")) {
    visit.statusFlow.push("ADMIN_APPROVED");
  }
  addAuditLog(db, {
    action: "Collection approved",
    performedBy: "System Admin",
    entityType: "collection",
    entityId: collection.id,
    details: `Approved collection for ${propertyById(db, collection.propertyId)?.propertyId || "property"}`
  });
  saveDb(db);
}

export function rejectCollection(collectionId) {
  const db = getDb();
  const collection = db.collections.find((entry) => entry.id === collectionId);
  if (!collection) return;
  collection.status = "rejected";
  addAuditLog(db, {
    action: "Collection rejected",
    performedBy: "System Admin",
    entityType: "collection",
    entityId: collection.id,
    details: `Rejected collection for ${propertyById(db, collection.propertyId)?.propertyId || "property"}`
  });
  saveDb(db);
}

export function getVisitMonitoring(search = "") {
  const db = getDb();
  const term = search.toLowerCase();
  return db.visits
    .map((visit) => enrichVisit(db, visit))
    .filter((visit) =>
      matchesSearch(term, visit.property?.propertyId, visit.collector?.name, visit.visitType, visit.geoLocation)
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function createVisit(payload) {
  const db = getDb();
  const statusFlow =
    payload.visitType === "paid"
      ? ["VISITED", "PAID", "COLLECTION_SUBMITTED"]
      : ["VISITED", "NOT_PAID", "NOTICE_CREATED", "PENALTY_ADDED", "REVISIT_PENDING"];
  const visit = {
    id: makeId("visit"),
    propertyId: payload.propertyId,
    collectorId: payload.collectorId,
    visitType: payload.visitType,
    geoLocation: payload.geoLocation,
    timestamp: payload.timestamp || new Date().toISOString(),
    statusFlow
  };
  db.visits.unshift(visit);
  addAuditLog(db, {
    action: "Visit recorded",
    performedBy: userById(db, payload.collectorId)?.name || "System Admin",
    entityType: "visit",
    entityId: visit.id,
    details: `Visit recorded for ${propertyById(db, payload.propertyId)?.propertyId || "property"}`
  });
  if (payload.visitType === "not_paid") {
    const notice = {
      id: makeId("notice"),
      propertyId: payload.propertyId,
      penaltyAmount: Number(payload.penaltyAmount || 50),
      noticeDate: payload.timestamp || new Date().toISOString(),
      status: "pending",
      revisitStatus: "pending",
      visitId: visit.id
    };
    db.notices.unshift(notice);
    addAuditLog(db, {
      action: "Notice created",
      performedBy: userById(db, payload.collectorId)?.name || "System Admin",
      entityType: "notice",
      entityId: notice.id,
      details: `Notice created for ${propertyById(db, payload.propertyId)?.propertyId || "property"}`
    });
  } else {
    const collection = {
      id: makeId("collection"),
      propertyId: payload.propertyId,
      collectorId: payload.collectorId,
      amount: Number(payload.amount || 0),
      paymentMode: payload.paymentMode || "cash",
      status: "pending",
      geoLocation: payload.geoLocation,
      timestamp: payload.timestamp || new Date().toISOString(),
      visitId: visit.id
    };
    db.collections.unshift(collection);
    addAuditLog(db, {
      action: "Collection submitted",
      performedBy: userById(db, payload.collectorId)?.name || "System Admin",
      entityType: "collection",
      entityId: collection.id,
      details: `Pending collection submitted for ${propertyById(db, payload.propertyId)?.propertyId || "property"}`
    });
  }
  saveDb(db);
}

export function listNotices(search = "") {
  const db = getDb();
  const term = search.toLowerCase();
  return db.notices
    .map((notice) => enrichNotice(db, notice))
    .filter((notice) =>
      matchesSearch(term, notice.property?.propertyId, notice.property?.ownerName, notice.status, notice.revisitStatus)
    )
    .sort((a, b) => new Date(b.noticeDate) - new Date(a.noticeDate));
}

export function resolveNotice(noticeId) {
  const db = getDb();
  const notice = db.notices.find((entry) => entry.id === noticeId);
  if (!notice) return;
  notice.status = "resolved";
  notice.revisitStatus = "completed";
  addAuditLog(db, {
    action: "Notice resolved",
    performedBy: "System Admin",
    entityType: "notice",
    entityId: notice.id,
    details: `Resolved notice for ${propertyById(db, notice.propertyId)?.propertyId || "property"}`
  });
  saveDb(db);
}

export function getReportsSummary() {
  const db = getDb();
  const insights = calculateInsights(db);
  const completedCollections = db.collections.filter((collection) => collection.status === "completed");
  const pendingCollections = db.collections.filter((collection) => collection.status === "pending");

  return {
    ...insights,
    totalCollectionsLabel: toCurrency(insights.totalCollectionsAmount),
    penaltyCollectedLabel: toCurrency(insights.penaltyCollected),
    completedCollections: completedCollections.length,
    pendingCollections: pendingCollections.length,
    rejectedCollections: db.collections.filter((collection) => collection.status === "rejected").length
  };
}

export function listAuditLogs(search = "") {
  const db = getDb();
  const term = search.toLowerCase();
  return db.auditLogs
    .filter((log) => matchesSearch(term, log.action, log.performedBy, log.entityType, log.details))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function getGlobalSearchResults(search = "") {
  const term = search.trim().toLowerCase();
  if (!term) {
    return {
      properties: [],
      users: [],
      collections: [],
      visits: []
    };
  }

  return {
    properties: listProperties(term).slice(0, 5),
    users: listUsers(term).slice(0, 5),
    collections: getCollectionApprovalQueue(term).slice(0, 5),
    visits: getVisitMonitoring(term).slice(0, 5)
  };
}

export function getAdminOverview() {
  return {
    stats: getDashboardStats(),
    properties: listProperties(""),
    users: listUsers(""),
    collections: getCollectionApprovalQueue(""),
    visits: getVisitMonitoring(""),
    notices: listNotices(""),
    auditLogs: listAuditLogs("")
  };
}

export function getCollectorDashboard(collectorId, search = "") {
  const db = getDb();
  const collector = userById(db, collectorId);
  if (!collector || collector.role !== "collector") {
    return {
      collector: null,
      properties: [],
      visits: [],
      stats: {
        totalAssignedProperties: 0,
        paidVisits: 0,
        notPaidVisits: 0,
        pendingApprovals: 0
      }
    };
  }

  const term = search.toLowerCase();
  const properties = db.properties
    .filter((property) => property.ward === collector.assignedWard)
    .filter((property) => matchesSearch(term, property.propertyId, property.ownerName, property.address))
    .map((property) => enrichProperty(db, property));
  const visits = db.visits
    .filter((visit) => visit.collectorId === collectorId)
    .map((visit) => enrichVisit(db, visit))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const collections = db.collections.filter((collection) => collection.collectorId === collectorId);

  return {
    collector: {
      ...collector,
      wardDetails: wardById(db, collector.assignedWard)
    },
    properties,
    visits: visits.slice(0, 10),
    stats: {
      totalAssignedProperties: properties.length,
      paidVisits: visits.filter((visit) => visit.visitType === "paid").length,
      notPaidVisits: visits.filter((visit) => visit.visitType === "not_paid").length,
      pendingApprovals: collections.filter((collection) => collection.status === "pending").length
    }
  };
}

export function getCollectorVisitHistory(collectorId, filter = "all") {
  const db = getDb();
  return db.visits
    .filter((visit) => visit.collectorId === collectorId)
    .filter((visit) => (filter === "all" ? true : visit.visitType === filter))
    .map((visit) => enrichVisit(db, visit))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function submitCollectorVisit(payload) {
  const db = getDb();
  const collector = userById(db, payload.collectorId);
  const property = propertyById(db, payload.propertyId);

  if (!collector || collector.role !== "collector") {
    throw new Error("Collector account not found");
  }
  if (!collector.assignedWard) {
    throw new Error("Collector is not assigned to any ward");
  }
  if (!property || property.ward !== collector.assignedWard) {
    throw new Error("You can only access properties in your assigned ward");
  }

  const timestamp = new Date().toISOString();
  const geoLocation = payload.geoLocation || "Location unavailable";
  const visit =
    payload.visitType === "paid"
      ? {
          id: makeId("visit"),
          propertyId: property.id,
          collectorId: collector.id,
          visitType: "paid",
          geoLocation,
          timestamp,
          statusFlow: ["VISIT_STARTED", "PAID", "COLLECTION_SUBMITTED", "PENDING_ADMIN_APPROVAL"]
        }
      : {
          id: makeId("visit"),
          propertyId: property.id,
          collectorId: collector.id,
          visitType: "not_paid",
          geoLocation,
          timestamp,
          statusFlow: ["VISIT_STARTED", "NOT_PAID", "NOTICE_REQUIRED", "PENALTY_ADDED", "REVISIT_REQUIRED"]
        };

  db.visits.unshift(visit);
  addAuditLog(db, {
    action: "Collector visit submitted",
    performedBy: collector.name,
    entityType: "visit",
    entityId: visit.id,
    details: `Visit submitted for ${property.propertyId}`
  });

  let collectionRecord = null;
  let noticeRecord = null;
  let receipt = null;
  let whatsappMessage = "";

  if (payload.visitType === "paid") {
    collectionRecord = {
      id: makeId("collection"),
      propertyId: property.id,
      collectorId: collector.id,
      amount: Number(payload.amount || 0),
      paymentMode: payload.paymentMode || "cash",
      status: "pending",
      geoLocation,
      timestamp,
      visitId: visit.id,
      receiptNumber: `RCP-${Date.now()}`
    };
    db.collections.unshift(collectionRecord);
    receipt = {
      receiptNumber: collectionRecord.receiptNumber,
      propertyId: property.propertyId,
      ownerName: property.ownerName,
      amount: collectionRecord.amount,
      paymentMode: collectionRecord.paymentMode,
      status: "PENDING_ADMIN_APPROVAL",
      timestamp
    };
    whatsappMessage = `Rs ${collectionRecord.amount} collected for Property ${property.propertyId} by Collector ${collector.name}`;
    addAuditLog(db, {
      action: "Collection submitted",
      performedBy: collector.name,
      entityType: "collection",
      entityId: collectionRecord.id,
      details: `Pending collection submitted for ${property.propertyId}`
    });
  } else {
    noticeRecord = {
      id: makeId("notice"),
      propertyId: property.id,
      penaltyAmount: Number(payload.penaltyAmount || 0),
      status: "NOTICE_PENDING",
      createdAt: timestamp,
      visitId: visit.id
    };
    db.notices.unshift(noticeRecord);
    whatsappMessage = `Property ${property.propertyId} not paid. Notice will be generated.`;
    addAuditLog(db, {
      action: "Notice required",
      performedBy: collector.name,
      entityType: "notice",
      entityId: noticeRecord.id,
      details: `Notice pending for ${property.propertyId}`
    });
  }

  saveDb(db);

  return {
    visit: enrichVisit(db, visit),
    collection: collectionRecord ? enrichCollection(db, collectionRecord) : null,
    notice: noticeRecord ? enrichNotice(db, noticeRecord) : null,
    receipt,
    whatsappUrl: `https://wa.me/91${String(property.mobile || "").replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`
  };
}
