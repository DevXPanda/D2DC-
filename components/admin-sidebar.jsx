"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  FileWarning,
  LayoutDashboard,
  MapPin,
  ScrollText,
  ShieldCheck,
  Users
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/wards", label: "Wards", icon: MapPin },
  { path: "/properties", label: "Properties", icon: Building2 },
  { path: "/users", label: "Field Worker Management", icon: Users },
  { path: "/collections", label: "D2DC Collection", icon: ClipboardList },
  { path: "/visits", label: "Visit Monitoring", icon: ShieldCheck },
  { path: "/notices", label: "Notice Management", icon: FileWarning },
  { path: "/reports", label: "Reports", icon: ScrollText },
  { path: "/audit-logs", label: "Audit Logs", icon: ClipboardList }
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full w-full">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary-600">D2DC</h1>
          <p className="text-sm text-gray-500">Door-to-Door Collection</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
