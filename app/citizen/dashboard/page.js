"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Building2, ClipboardList, FileWarning, MapPinned, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function CitizenDashboardPage() {
  const session = useStoredSession();
  const dashboard = useQuery(api.d2dc.citizenDashboard, session?.token ? { token: session.token } : "skip");

  const quickActions = [
    { name: "View Property", icon: Building2, link: "/citizen/property", color: "bg-indigo-600" },
    { name: "View Visit History", icon: MapPinned, link: "/citizen/visits", color: "bg-sky-600" },
    { name: "View Notices", icon: FileWarning, link: "/citizen/notices", color: "bg-amber-600" }
  ];

  return (
    <div className="space-y-6">
      <div className="ds-page-header">
        <div>
        <h1 className="ds-page-title">Citizen Dashboard</h1>
        <p className="ds-page-subtitle">View your property, D2DC visit history, notices, penalties, and payment status.</p>
        </div>
      </div>

      <section>
        <h2 className="ds-section-title mb-4 flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary-600" />
          Summary
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card card-hover">
            <div className="stat-card-title flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
              <span>Total Visits</span>
              <MapPinned className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{dashboard?.stats.totalVisits ?? 0}</p>
          </div>
          <div className="stat-card card-hover">
            <div className="stat-card-title flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
              <span>Paid Visits</span>
              <ClipboardList className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{dashboard?.stats.paidVisits ?? 0}</p>
          </div>
          <div className="stat-card card-hover">
            <div className="stat-card-title flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
              <span>Not Paid Visits</span>
              <FileWarning className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">{dashboard?.stats.notPaidVisits ?? 0}</p>
          </div>
          <div className="stat-card card-hover">
            <div className="stat-card-title flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
              <span>Pending Notices</span>
              <FileWarning className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-600">{dashboard?.stats.pendingNotices ?? 0}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="ds-section-title mb-4 flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-gray-200 bg-blue-50/50 px-6 py-4">
            <h3 className="flex items-center text-sm font-semibold uppercase text-gray-900">
              <MapPinned className="mr-2 h-4 w-4 text-blue-600" />
              Recent Visits
            </h3>
            <Link href="/citizen/visits" className="text-xs font-medium text-blue-600">View all</Link>
          </div>
          <div className="space-y-3 p-6">
            {!dashboard || dashboard.recentVisits.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No visit history found for your property yet.
              </div>
            ) : (
              dashboard.recentVisits.map((visit) => (
                <div key={visit.id} className="flex items-start justify-between border-b border-dashed border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{visit.property?.propertyId}</p>
                    <p className="text-xs text-gray-500">{visit.collector?.name} | {visit.visitType === "paid" ? "PAID" : "NOT_PAID"}</p>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(visit.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-gray-200 bg-amber-50/50 px-6 py-4">
            <h3 className="flex items-center text-sm font-semibold uppercase text-gray-900">
              <ClipboardList className="mr-2 h-4 w-4 text-amber-600" />
              Pending Notices
            </h3>
            <Link href="/citizen/notices" className="text-xs font-medium text-amber-600">Open notices</Link>
          </div>
          <div className="space-y-3 p-6">
            {!dashboard || dashboard.pendingNotices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No pending notices for your property.
              </div>
            ) : (
              dashboard.pendingNotices.map((notice) => (
                <div key={notice.id} className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">{notice.property?.propertyId}</p>
                  <p className="mt-1 text-xs text-gray-500">Penalty: Rs {notice.penaltyAmount.toLocaleString("en-IN")}</p>
                  <p className="mt-2 text-xs text-amber-600">Status: {String(notice.status || "").toUpperCase()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
