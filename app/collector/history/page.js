"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function CollectorHistoryPage() {
  const session = useStoredSession();
  const [filter, setFilter] = useState("all");
  const visits = useQuery(api.d2dc.collectorVisitHistory, session?.token ? { token: session.token, filter } : "skip") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">Visit History</h1>
        <p className="ds-page-subtitle">Review all collector visits with quick filters for paid and not paid records.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setFilter("all")} className={`btn ${filter === "all" ? "btn-primary" : "btn-secondary"}`}>
          All Visits
        </button>
        <button type="button" onClick={() => setFilter("paid")} className={`btn ${filter === "paid" ? "btn-primary" : "btn-secondary"}`}>
          Paid
        </button>
        <button type="button" onClick={() => setFilter("not_paid")} className={`btn ${filter === "not_paid" ? "btn-primary" : "btn-secondary"}`}>
          Not Paid
        </button>
      </div>

      {visits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
          No visit records found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visits.map((visit) => (
            <div key={visit.id} className="card">
              <p className="text-sm font-semibold text-gray-900">{visit.property?.propertyId}</p>
              <p className="mt-1 text-sm text-gray-700">{visit.property?.ownerName}</p>
              <p className="mt-2 text-xs text-gray-500">{new Date(visit.timestamp).toLocaleString()}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={visit.visitType === "paid" ? "badge badge-success" : "badge badge-warning"}>
                  {visit.visitType === "paid" ? "PAID" : "NOT_PAID"}
                </span>
                {visit.statusFlow.map((status) => (
                  <span key={status} className="badge badge-info">{status}</span>
                ))}
              </div>
              <p className="mt-3 text-sm text-gray-600">Location: {visit.geoLocation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
