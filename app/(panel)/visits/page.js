"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function VisitsPage() {
  const [search, setSearch] = useState("");
  const session = useStoredSession();
  const visits = useQuery(api.d2dc.visitMonitoring, session?.token ? { token: session.token, search } : "skip") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">Visit Monitoring</h1>
        <p className="ds-page-subtitle">Track every property visit, payment status, geo location, and collector activity.</p>
      </div>

      <div className="card-flat">
        <input className="input" placeholder="Search visits by property, collector, status or geo location..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Collector</th>
              <th>Visit Type</th>
              <th>Geo Location</th>
              <th>Time</th>
              <th>Status Flow</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td className="font-medium">{visit.property?.propertyId}</td>
                <td>{visit.collector?.name}</td>
                <td>
                  <span className={visit.visitType === "paid" ? "badge badge-success" : "badge badge-warning"}>
                    {visit.visitType === "paid" ? "PAID" : "NOT_PAID"}
                  </span>
                </td>
                <td>{visit.geoLocation}</td>
                <td>{new Date(visit.timestamp).toLocaleString()}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {visit.statusFlow.map((status) => (
                      <span key={status} className="badge badge-info">{status}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
