"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function SupervisorNoticesPage() {
  const session = useStoredSession();
  const [search, setSearch] = useState("");
  const notices = useQuery(api.d2dc.supervisorNotices, session?.token ? { token: session.token, search } : "skip") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">Notice & Revisit Tracking</h1>
        <p className="ds-page-subtitle">Review notice creation, penalty additions, and revisit pending status for not paid properties.</p>
      </div>

      <div className="card-flat">
        <input className="input" placeholder="Search notices by property, owner, status or revisit..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Owner</th>
              <th>Penalty</th>
              <th>Status</th>
              <th>Revisit</th>
              <th>Notice Date</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((notice) => (
              <tr key={notice.id}>
                <td className="font-medium">{notice.property?.propertyId}</td>
                <td>{notice.property?.ownerName}</td>
                <td>Rs {notice.penaltyAmount.toLocaleString("en-IN")}</td>
                <td><span className={notice.status === "resolved" ? "badge badge-success" : "badge badge-warning"}>{notice.status}</span></td>
                <td><span className={notice.revisitStatus === "completed" ? "badge badge-success" : "badge badge-danger"}>{notice.revisitStatus}</span></td>
                <td>{new Date(notice.noticeDate).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
