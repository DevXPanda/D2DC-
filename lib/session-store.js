"use client";

"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "d2dc-admin-session";

export function getSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function useStoredSession() {
  const [session, setStoredSession] = useState(null);

  useEffect(() => {
    setStoredSession(getSession());
  }, []);

  return session;
}
