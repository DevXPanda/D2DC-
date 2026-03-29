"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function ReportsPage() {
  const session = useStoredSession();
  const report = useQuery(api.d2dc.reportsSummary, session?.token ? { token: session.token } : "skip");

  const cards = [
    { title: "Total Visits", value: report?.totalVisits ?? 0 },
    { title: "Total Collections", value: report?.totalCollectionsLabel ?? "Rs 0" },
    { title: "Total Pending Visits", value: report?.totalPendingVisits ?? 0 },
    { title: "% Paid", value: `${report?.paidPercent ?? 0}%` },
    { title: "% Not Paid", value: `${report?.notPaidPercent ?? 0}%` },
    { title: "Notice Served Count", value: report?.noticeServedCount ?? 0 },
    { title: "Penalty Collected", value: report?.penaltyCollectedLabel ?? "Rs 0" },
    { title: "Pending Collections", value: report?.pendingCollections ?? 0 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">Reports</h1>
        <p className="ds-page-subtitle">Operational and payment reporting for visits, collections, penalties, and pending recovery.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="stat-card">
            <p className="text-xs font-medium uppercase text-gray-500">{card.title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="ds-section-title">Status Split</h2>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span>Paid</span>
                <span>{report?.paidPercent ?? 0}%</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100">
                <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${report?.paidPercent ?? 0}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span>Not Paid</span>
                <span>{report?.notPaidPercent ?? 0}%</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100">
                <div className="h-3 rounded-full bg-amber-500" style={{ width: `${report?.notPaidPercent ?? 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="ds-section-title">Collection Review</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between rounded-lg border border-gray-200 px-4 py-3">
              <span>Completed Collections</span>
              <span className="font-semibold">{report?.completedCollections ?? 0}</span>
            </div>
            <div className="flex justify-between rounded-lg border border-gray-200 px-4 py-3">
              <span>Pending Collections</span>
              <span className="font-semibold">{report?.pendingCollections ?? 0}</span>
            </div>
            <div className="flex justify-between rounded-lg border border-gray-200 px-4 py-3">
              <span>Rejected Collections</span>
              <span className="font-semibold">{report?.rejectedCollections ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
