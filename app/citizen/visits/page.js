"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function CitizenVisitsPage() {
  const session = useStoredSession();
  const visits = useQuery(api.d2dc.citizenVisitHistory, session?.token ? { token: session.token } : "skip") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">Visit History</h1>
        <p className="ds-page-subtitle">Review every D2DC visit for your property, including collector name and current status.</p>
      </div>

      {visits.length === 0 ? (
        <div className="card py-12 text-center text-sm text-gray-500">
          No visit history found for your property yet.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Date</th>
                <th>Visit Type</th>
                <th>Collector</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="font-medium">{visit.property?.propertyId}</td>
                  <td>{new Date(visit.timestamp).toLocaleString()}</td>
                  <td>
                    <span className={visit.visitType === "paid" ? "badge badge-success" : "badge badge-warning"}>
                      {visit.visitType === "paid" ? "PAID" : "NOT_PAID"}
                    </span>
                  </td>
                  <td>{visit.collector?.name || "N/A"}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {visit.statusFlow.map((status) => (
                        <span key={status} className="badge badge-info">{status}</span>
                      ))}
                    </div>
                  </td>
                  <td>{visit.geoLocation || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
