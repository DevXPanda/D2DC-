function normalizeText(value) {
  return String(value || "").trim();
}

export function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

export function normalizeUsername(value) {
  return normalizeText(value).toLowerCase();
}

export function normalizePhone(value) {
  return normalizeText(value).replace(/\D/g, "");
}

export function normalizePassword(value) {
  return normalizeText(value);
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const pairs = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(pairs.map((pair) => Number.parseInt(pair, 16)));
}

async function sha256(input) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return bytesToHex(new Uint8Array(digest));
}

export async function hashPassword(password) {
  const normalized = normalizePassword(password);
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bytesToHex(saltBytes);
  const digest = await sha256(`${salt}:${normalized}`);
  return `sha256:${salt}:${digest}`;
}

export async function verifyPassword(password, storedPasswordHash) {
  const normalized = normalizePassword(password);

  if (!storedPasswordHash?.startsWith("sha256:")) {
    return {
      matches: storedPasswordHash === normalized,
      needsUpgrade: true
    };
  }

  const [, salt, expectedDigest] = storedPasswordHash.split(":");
  if (!salt || !expectedDigest) {
    return { matches: false, needsUpgrade: false };
  }

  const saltHex = bytesToHex(hexToBytes(salt));
  const actualDigest = await sha256(`${saltHex}:${normalized}`);
  return {
    matches: actualDigest === expectedDigest,
    needsUpgrade: false
  };
}

export function buildSessionUser(user, token) {
  const name = normalizeText(user.name);
  const [firstName = "", ...rest] = name.split(/\s+/).filter(Boolean);

  return {
    id: user._id,
    token,
    name,
    firstName: firstName || name,
    lastName: rest.join(" "),
    email: user.email,
    phone: user.phone,
    role: user.role,
    assignedWard: user.assignedWard || "",
    assignedArea: user.assignedArea || ""
  };
}

export async function getUserByIdentifier(ctx, identifier) {
  const raw = normalizeText(identifier);
  const email = normalizeEmail(raw);
  const username = normalizeUsername(raw);
  const phone = normalizePhone(raw);

  const [userByEmail, userByUsername, users] = await Promise.all([
    ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique(),
    ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", username)).unique(),
    phone ? ctx.db.query("users").withIndex("by_phone", (q) => q.eq("phone", phone)).unique() : Promise.resolve(null)
  ]);

  if (userByEmail) return userByEmail;
  if (userByUsername) return userByUsername;
  return users || null;
}

export async function requireSession(ctx, token) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session) {
    throw new Error("Session expired. Please login again.");
  }

  const user = await ctx.db.get(session.userId);
  if (!user || !user.isActive) {
    throw new Error("Account is not available.");
  }

  return { session, user };
}

export async function requireRole(ctx, token, roles) {
  const { session, user } = await requireSession(ctx, token);
  if (!roles.includes(user.role)) {
    throw new Error("You are not authorized for this action.");
  }
  return { session, user };
}

export async function ensureUniqueUser(ctx, values, excludeUserId) {
  const users = await ctx.db.query("users").collect();
  const email = normalizeEmail(values.email);
  const username = normalizeUsername(values.username);
  const phone = normalizePhone(values.phone);

  const duplicate = users.find((user) => {
    if (excludeUserId && user._id === excludeUserId) return false;

    return user.email === email || user.username === username || normalizePhone(user.phone) === phone;
  });

  if (duplicate) {
    throw new Error("Email, username, or phone already exists.");
  }
}

export async function createAuditLog(ctx, payload) {
  await ctx.db.insert("auditLogs", {
    action: payload.action,
    performedBy: payload.performedBy,
    entityType: payload.entityType || "system",
    details: payload.details || "",
    timestamp: payload.timestamp || Date.now()
  });
}

export function buildVisitStatusFlow(visitType, collectionStatus, noticeStatus) {
  if (visitType === "paid") {
    if (collectionStatus === "completed") {
      return ["VISIT_STARTED", "PAID", "COLLECTION_SUBMITTED", "ADMIN_APPROVED"];
    }

    if (collectionStatus === "rejected") {
      return ["VISIT_STARTED", "PAID", "COLLECTION_SUBMITTED", "REJECTED"];
    }

    return ["VISIT_STARTED", "PAID", "COLLECTION_SUBMITTED", "PENDING_ADMIN_APPROVAL"];
  }

  if (noticeStatus === "resolved") {
    return ["VISIT_STARTED", "NOT_PAID", "NOTICE_REQUIRED", "PENALTY_ADDED", "REVISIT_COMPLETED"];
  }

  return ["VISIT_STARTED", "NOT_PAID", "NOTICE_REQUIRED", "PENALTY_ADDED", "REVISIT_REQUIRED"];
}

export function formatCurrency(amount) {
  return `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;
}
