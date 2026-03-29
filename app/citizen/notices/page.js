"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function CitizenNoticesPage() {
  const session = useStoredSession();
  const notices = useQuery(api.d2dc.citizenNotices, session?.token ? { token: session.token } : "skip") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">Notices & Penalties</h1>
        <p className="ds-page-subtitle">See all notices, penalty amounts, and current resolution status for your property.</p>
      </div>

      {notices.length === 0 ? (
        <div className="card py-12 text-center text-sm text-gray-500">
          No notices or penalties found for your property.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Penalty Amount</th>
                <th>Notice Date</th>
                <th>Status</th>
                <th>Revisit</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice) => (
                <tr key={notice.id}>
                  <td className="font-medium">{notice.property?.propertyId}</td>
                  <td>Rs {notice.penaltyAmount.toLocaleString("en-IN")}</td>
                  <td>{new Date(notice.noticeDate).toLocaleString()}</td>
                  <td>
                    <span className={notice.status === "resolved" ? "badge badge-success" : "badge badge-warning"}>
                      {String(notice.status || "").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={notice.revisitStatus === "completed" ? "badge badge-success" : "badge badge-danger"}>
                      {String(notice.revisitStatus || "").toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
