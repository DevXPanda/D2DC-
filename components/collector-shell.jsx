"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { History, Home, LogOut, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { clearSession, getSession } from "@/lib/session-store";

const segmentLabelMap = {
  collector: "Collector",
  dashboard: "Dashboard",
  history: "Visit History",
  collections: "Collections"
};

function getBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: segmentLabelMap[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    current: index === segments.length - 1
  }));
}

export default function CollectorShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const breadcrumbs = getBreadcrumbs(pathname);
  const serverUser = useQuery(api.auth.me, session?.token ? { token: session.token } : "skip");

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/admin/login");
      return;
    }
    if (current.role !== "collector") {
      router.replace(
        current.role === "supervisor"
          ? "/supervisor/dashboard"
          : current.role === "citizen"
            ? "/citizen/dashboard"
            : "/dashboard"
      );
      return;
    }
    setSession(current);
  }, [router]);

  useEffect(() => {
    if (!session || serverUser === undefined) return;

    if (!serverUser) {
      clearSession();
      router.replace("/admin/login");
      return;
    }

    if (serverUser.role !== "collector") {
      clearSession();
      router.replace("/admin/login");
    }
  }, [router, serverUser, session]);

  const handleLogout = () => {
    clearSession();
    router.replace("/admin/login");
  };

  if (!session || serverUser === undefined) return null;
  if (!serverUser || serverUser.role !== "collector") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 w-full bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-2xl font-bold leading-none text-primary-600">D2DC</p>
              <p className="text-sm text-gray-500">Collector Panel</p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/collector/dashboard")} className="header-icon-btn" title="Dashboard">
                <Home className="h-5 w-5" />
              </button>
              <button onClick={() => router.push("/collector/history")} className="header-icon-btn" title="Visit History">
                <History className="h-5 w-5" />
              </button>
              <div className="hidden items-center space-x-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                  {session.firstName?.charAt(0) || "C"}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-900">{session.firstName} {session.lastName}</span>
                  <span className="text-xs text-gray-500">Role: collector</span>
                </div>
              </div>
              <button className="header-icon-btn" title="My Profile">
                <User className="h-5 w-5" />
              </button>
              <button onClick={handleLogout} className="header-icon-btn text-red-600 hover:bg-red-50 hover:text-red-700" title="Logout">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
              <Link href="/collector/dashboard" className="transition-colors hover:text-primary-600">
                Home
              </Link>
              {breadcrumbs.map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1">
                  <span>/</span>
                  {crumb.current ? (
                    <span className="text-gray-700">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="transition-colors hover:text-primary-600">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <Link href="/collector/dashboard" className={`btn ${pathname === "/collector/dashboard" ? "btn-primary" : "btn-secondary"}`}>
              Dashboard
            </Link>
            <Link href="/collector/history" className={`btn ${pathname === "/collector/history" ? "btn-primary" : "btn-secondary"}`}>
              Visit History
            </Link>
            <Link href="/collector/collections" className={`btn ${pathname === "/collector/collections" ? "btn-primary" : "btn-secondary"}`}>
              Collections
            </Link>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
