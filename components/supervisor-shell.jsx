"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { ClipboardList, Home, LogOut, MapPinned, Search, User, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { clearSession, getSession } from "@/lib/session-store";
import GlobalSearchModal from "@/components/global-search-modal";

const segmentLabelMap = {
  supervisor: "Supervisor",
  dashboard: "Dashboard",
  assignments: "Collector Assignment",
  activity: "Field Activity",
  notices: "Notice Tracking"
};

function getBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: segmentLabelMap[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    current: index === segments.length - 1
  }));
}

export default function SupervisorShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const breadcrumbs = getBreadcrumbs(pathname);
  const serverUser = useQuery(api.auth.me, session?.token ? { token: session.token } : "skip");

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/admin/login");
      return;
    }
    if (current.role !== "supervisor") {
      router.replace(
        current.role === "collector"
          ? "/collector/dashboard"
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

    if (serverUser.role !== "supervisor") {
      clearSession();
      router.replace("/admin/login");
    }
  }, [router, serverUser, session]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLogout = () => {
    clearSession();
    router.replace("/admin/login");
  };

  if (!session || serverUser === undefined) return null;
  if (!serverUser || serverUser.role !== "supervisor") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 w-full bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-2xl font-bold leading-none text-primary-600">D2DC</p>
              <p className="text-sm text-gray-500">Supervisor Panel</p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/supervisor/dashboard")} className="header-icon-btn" title="Dashboard">
                <Home className="h-5 w-5" />
              </button>
              <button onClick={() => router.push("/supervisor/assignments")} className="header-icon-btn" title="Collector Assignment">
                <Users className="h-5 w-5" />
              </button>
              <button onClick={() => router.push("/supervisor/activity")} className="header-icon-btn" title="Field Activity">
                <MapPinned className="h-5 w-5" />
              </button>
              <button onClick={() => router.push("/supervisor/notices")} className="header-icon-btn" title="Notices">
                <ClipboardList className="h-5 w-5" />
              </button>
              <button onClick={() => setSearchOpen(true)} className="header-icon-btn md:hidden" title="Search">
                <Search className="h-5 w-5" />
              </button>
              <button onClick={() => setSearchOpen(true)} className="hidden md:inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">
                <Search className="h-4 w-4" />
                Search
                <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400">Ctrl + K</span>
              </button>
              <div className="hidden items-center space-x-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                  {session.firstName?.charAt(0) || "S"}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-900">{session.firstName} {session.lastName}</span>
                  <span className="text-xs text-gray-500">Role: supervisor</span>
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
              <Link href="/supervisor/dashboard" className="transition-colors hover:text-primary-600">
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
            <Link href="/supervisor/dashboard" className={`btn ${pathname === "/supervisor/dashboard" ? "btn-primary" : "btn-secondary"}`}>
              Dashboard
            </Link>
            <Link href="/supervisor/assignments" className={`btn ${pathname === "/supervisor/assignments" ? "btn-primary" : "btn-secondary"}`}>
              Assign Collector
            </Link>
            <Link href="/supervisor/activity" className={`btn ${pathname === "/supervisor/activity" ? "btn-primary" : "btn-secondary"}`}>
              Field Activity
            </Link>
            <Link href="/supervisor/notices" className={`btn ${pathname === "/supervisor/notices" ? "btn-primary" : "btn-secondary"}`}>
              Notices
            </Link>
          </div>

          {children}
        </main>
      </div>
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
