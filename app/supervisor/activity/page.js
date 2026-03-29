"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function SupervisorActivityPage() {
  const session = useStoredSession();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const visits = useQuery(
    api.d2dc.supervisorActivity,
    session?.token ? { token: session.token, filter, search } : "skip"
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">Field Activity Monitoring</h1>
        <p className="ds-page-subtitle">Track all paid, not paid, and pending revisit field activity with geo-tagged visit data.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setFilter("all")} className={`btn ${filter === "all" ? "btn-primary" : "btn-secondary"}`}>All Visits</button>
        <button type="button" onClick={() => setFilter("paid")} className={`btn ${filter === "paid" ? "btn-primary" : "btn-secondary"}`}>Paid</button>
        <button type="button" onClick={() => setFilter("not_paid")} className={`btn ${filter === "not_paid" ? "btn-primary" : "btn-secondary"}`}>Not Paid</button>
        <button type="button" onClick={() => setFilter("revisit")} className={`btn ${filter === "revisit" ? "btn-primary" : "btn-secondary"}`}>Pending Revisits</button>
      </div>

      <div className="card-flat">
        <input className="input" placeholder="Search properties, collectors, geo location or status..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Property ID</th>
              <th>Collector</th>
              <th>Visit Type</th>
              <th>Geo Location</th>
              <th>Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td className="font-medium">{visit.property?.propertyId}</td>
                <td>{visit.collector?.name}</td>
                <td><span className={visit.visitType === "paid" ? "badge badge-success" : "badge badge-warning"}>{visit.visitType === "paid" ? "PAID" : "NOT_PAID"}</span></td>
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
