"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  MapPin,
  MapPinned,
  ScrollText,
  ShieldCheck,
  Users
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function DashboardPage() {
  const session = useStoredSession();
  const stats = useQuery(api.dashboard.stats, session?.token ? { token: session.token } : "skip");

  const allActions = [
    { name: "Dashboard", icon: ShieldCheck, link: "/dashboard", color: "bg-slate-600" },
    { name: "Wards", icon: MapPin, link: "/wards", color: "bg-cyan-600" },
    { name: "Assessments", icon: FileWarning, link: "/assessments", color: "bg-orange-600" },
    { name: "Demands", icon: ScrollText, link: "/demands", color: "bg-emerald-600" },
    { name: "Properties", icon: Building2, link: "/properties", color: "bg-indigo-600" },
    { name: "Field Worker Management", icon: Users, link: "/users", color: "bg-blue-600" },
    { name: "D2DC Collection", icon: ClipboardList, link: "/collections", color: "bg-emerald-600" },
    { name: "Visit Monitoring", icon: MapPinned, link: "/visits", color: "bg-sky-600" },
    { name: "Notice Management", icon: FileWarning, link: "/notices", color: "bg-amber-600" },
    { name: "Reports", icon: ScrollText, link: "/reports", color: "bg-violet-600" },
    { name: "Audit Logs", icon: ClipboardList, link: "/audit-logs", color: "bg-rose-600" }
  ];

  const quickActions = allActions.filter(action =>
    ["Assessments", "Demands", "Properties", "D2DC Collection", "Notice Management", "Reports"].includes(action.name)
  );

  const adminActions = allActions.filter(action => action.name !== "Dashboard");

  const insightCards = [
    { title: "Total Demand Generated", value: stats?.totalDemandGeneratedLabel ?? "Rs 0", icon: ScrollText },
    { title: "Total Collected (D2DC)", value: stats?.totalCollectedLabel ?? "Rs 0", icon: CheckCircle2 },
    { title: "Total Pending Demand", value: stats?.totalPendingLabel ?? "Rs 0", icon: AlertTriangle },
    { title: "Penalty Collected", value: stats?.totalPenaltyCollectedLabel ?? "Rs 0", icon: FileWarning },
    { title: "Delayed Cases", value: stats?.totalDelayedCases ?? 0, icon: AlertTriangle }
  ];

  return (
    <div className="space-y-6">
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">Admin Dashboard</h1>
          <p className="ds-page-subtitle">Full-access control for properties, workers, visits, collections, notices, and reporting.</p>
        </div>
      </div>

      <section>
        <h2 className="ds-section-title flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5 text-primary-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.link} className="card-hover flex flex-col items-center justify-center p-5 text-center group">
              <div className={`${action.color} mb-3 rounded-full p-3 text-white shadow-sm transition-transform group-hover:scale-110`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="ds-section-title-muted">Data Insights</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {insightCards.map((item) => (
            <div key={item.title} className="stat-card">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase text-gray-500">{item.title}</p>
                <item.icon className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="ds-section-title-muted">Administration & Reports</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {adminActions.map((action) => (
            <Link key={`mini-${action.name}`} href={action.link} className="stat-card flex flex-col items-center p-3 text-center">
              <div className="mb-2 text-gray-500">
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">{action.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-gray-200 bg-blue-50/50 px-6 py-4">
            <h3 className="flex items-center text-sm font-semibold uppercase text-gray-900">
              <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" />
              Visit Monitoring
            </h3>
            <Link href="/visits" className="text-xs font-medium text-blue-600">View all</Link>
          </div>
          <div className="space-y-3 p-6">
            {!stats || stats.recentVisits.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No visits yet. Create wards, users, properties, and field activity to see monitoring here.
              </div>
            ) : (
              stats.recentVisits.map((visit) => (
                <div key={visit.id} className="flex items-start justify-between border-b border-dashed border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{visit.property?.propertyId}</p>
                    <p className="text-xs text-gray-500">{visit.collector?.name} - {visit.visitType === "paid" ? "PAID" : "NOT_PAID"}</p>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(visit.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-gray-200 bg-emerald-50/50 px-6 py-4">
            <h3 className="flex items-center text-sm font-semibold uppercase text-gray-900">
              <ScrollText className="mr-2 h-4 w-4 text-emerald-600" />
              Billing & Demands Snapshot
            </h3>
            <Link href="/demands" className="text-xs font-medium text-emerald-600 hover:underline">View all</Link>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-dashed border-gray-100 pb-2">
              <span className="text-xs font-medium uppercase text-gray-500">Total Demand Generated</span>
              <span className="text-base font-bold text-gray-900">{stats?.totalDemandGeneratedLabel ?? "Rs 0"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-gray-100 pb-2">
              <span className="text-xs font-medium uppercase text-gray-500">Collected Amount</span>
              <span className="text-base font-bold text-emerald-600">{stats?.totalCollectedLabel ?? "Rs 0"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-gray-100 pb-2">
              <span className="text-xs font-medium uppercase text-gray-500">Penalty Collected</span>
              <span className="text-base font-bold text-amber-600">{stats?.totalPenaltyCollectedLabel ?? "Rs 0"}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium uppercase text-gray-500">Outstanding Balance</span>
              <span className="text-base font-bold text-rose-600">{stats?.totalPendingLabel ?? "Rs 0"}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
