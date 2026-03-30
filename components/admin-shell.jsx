"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Home, LogOut, Search, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { clearSession, getSession } from "@/lib/session-store";
import GlobalSearchModal from "@/components/global-search-modal";
import Modal from "@/components/modal";

const segmentLabelMap = {
  dashboard: "Dashboard",
  wards: "Wards",
  properties: "Properties",
  users: "Field Worker Management",
  collections: "D2DC Collection",
  visits: "Visit Monitoring",
  notices: "Notice Management",
  reports: "Reports",
  "audit-logs": "Audit Logs",
  "tax-management": "Tax Management",
  d2dc: "D2DC"
};

function getBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: segmentLabelMap[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    current: index === segments.length - 1
  }));
}

export default function AdminShell({ children }) {
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
      name: [session.firstName, session.lastName].filter(Boolean).join(" ") || session.name || "System Admin",
      role: session.role || "admin",
      phone: session.phone || "N/A",
      email: session.email || "N/A",
      id: session.userId || "N/A",
      initial: session.firstName?.charAt(0) || session.name?.charAt(0) || "A"
    };
  }, [session]);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/admin/login");
      return;
    }
    if (current.role !== "admin") {
      router.replace(
        current.role === "supervisor"
          ? "/supervisor/dashboard"
          : current.role === "citizen"
            ? "/citizen/dashboard"
            : "/collector/dashboard"
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

    if (serverUser.role !== "admin") {
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
  if (!serverUser || serverUser.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="min-w-0 shrink-0 flex items-center py-2">
                <div className="flex flex-col">
                  <p className="text-2xl font-medium text-primary-600 tracking-tight">D2DC</p>
                  <p className="text-sm font-medium text-gray-400 mt-0.5">Door-to-Door Collection</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={() => router.push("/dashboard")} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Dashboard">
                  <Home className="w-5 h-5" />
                </button>
                
                <button onClick={() => setSearchOpen(true)} className="md:hidden p-2 text-gray-400 hover:text-primary-600" title="Search">
                  <Search className="w-5 h-5" />
                </button>
                
                <button onClick={() => setSearchOpen(true)} className="hidden md:inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-all">
                  <Search className="h-4 w-4" />
                  Search
                  <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-400">Ctrl + K</span>
                </button>

                <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 ml-2">
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-sm font-bold">
                    {userData?.initial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-900 leading-none mb-0.5">
                      {userData?.name}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-medium">Admin</span>
                  </div>
                </div>

                <div className="flex items-center border-l border-gray-200 ml-2 pl-2">
                  <button onClick={() => setProfileOpen(true)} className="p-2 text-gray-400 hover:text-primary-600" title="Profile Details">
                    <User className="w-5 h-5" />
                  </button>
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600" title="Sign Out">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
              <Link href="/dashboard" className="hover:text-primary-600 transition-colors">
                Home
              </Link>
              {breadcrumbs.map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1">
                  <span>/</span>
                  {crumb.current ? (
                    <span className="text-gray-700">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-primary-600 transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
          {children}
        </main>
      </div>
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
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
              {userData?.initial || "A"}
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">{userData?.name}</h4>
              <p className="text-sm capitalize text-gray-500">{userData?.role || "admin"}</p>
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
