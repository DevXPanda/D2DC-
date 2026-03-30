"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Home, LogOut, Search, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { clearSession, getSession } from "@/lib/session-store";
import CitizenSearchModal from "@/components/citizen-search-modal";
import Modal from "@/components/modal";

const segmentLabelMap = {
  citizen: "Citizen",
  dashboard: "Dashboard",
  property: "Property Details",
  visits: "Visit History",
  notices: "Notices"
};

function getBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: segmentLabelMap[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    current: index === segments.length - 1
  }));
}

export default function CitizenShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const breadcrumbs = getBreadcrumbs(pathname);
  const serverUser = useQuery(api.auth.me, session?.token ? { token: session.token } : "skip");

  const userData = useMemo(() => {
    if (!session) return null;
    return {
      name: [session.firstName, session.lastName].filter(Boolean).join(" ") || session.name || "Citizen User",
      role: session.role || "citizen",
      phone: session.phone || "N/A",
      email: session.email || "N/A",
      id: session.userId || "N/A",
      initial: session.firstName?.charAt(0) || session.name?.charAt(0) || "C"
    };
  }, [session]);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/admin/login");
      return;
    }
    if (current.role !== "citizen") {
      router.replace(
        current.role === "collector"
          ? "/collector/dashboard"
          : current.role === "supervisor"
            ? "/supervisor/dashboard"
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

    if (serverUser.role !== "citizen") {
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
  if (!serverUser || serverUser.role !== "citizen") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 w-full bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-2xl font-medium leading-none text-primary-600">D2DC</p>
              <p className="text-sm text-gray-500">Citizen Portal</p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/citizen/dashboard")} className="header-icon-btn" title="Dashboard">
                <Home className="h-5 w-5" />
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
                  {userData?.initial || "C"}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-900">{userData?.name}</span>
                  <span className="text-xs text-gray-500">Role: citizen</span>
                </div>
              </div>
              <button onClick={() => setProfileOpen(true)} className="header-icon-btn" title="My Profile">
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
              <Link href="/citizen/dashboard" className="transition-colors hover:text-primary-600">
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

          <div className="mb-6 border-b border-slate-200">
            <div className="flex space-x-8 overflow-x-auto scroller-hidden">
              {[
                { name: "Dashboard", href: "/citizen/dashboard" },
                { name: "Property Portfolio", href: "/citizen/property" },
                { name: "Visit Logs", href: "/citizen/visits" },
                { name: "Official Notices", href: "/citizen/notices" }
              ].map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`whitespace-nowrap pb-4 px-1 text-sm font-medium tracking-tight uppercase transition-all relative ${
                      isActive 
                        ? "text-primary-600 border-b-2 border-primary-600" 
                        : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"
                    }`}
                  >
                    {tab.name}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {children}
        </main>
      </div>
      <CitizenSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Modal
        title="My Profile"
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        footer={
          <button type="button" className="btn btn-primary" onClick={() => setProfileOpen(false)}>
            Close
          </button>
        }
      >
        <div className="space-y-4">
          <div className="mb-6 flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-600">
              {userData?.initial || "C"}
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">{userData?.name}</h4>
              <p className="text-sm capitalize text-gray-500">{userData?.role || "citizen"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-xs uppercase text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{userData?.email}</p>
            </div>
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-xs uppercase text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{userData?.phone}</p>
            </div>
            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-xs uppercase text-gray-500">User ID</p>
              <p className="text-sm font-medium text-gray-900">{userData?.id}</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
