"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function NoticesPage() {
  const [search, setSearch] = useState("");
  const session = useStoredSession();
  const notices = useQuery(api.d2dc.noticesList, session?.token ? { token: session.token, search } : "skip") || [];
  const resolveNotice = useMutation(api.d2dc.resolveNotice);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">Notice & Penalty Management</h1>
        <p className="ds-page-subtitle">Review not-paid visits, penalty amounts, and revisit status for every served notice.</p>
      </div>

      <div className="card-flat">
        <input className="input" placeholder="Search notices by property, owner, status or revisit status..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Owner</th>
              <th>Penalty Added</th>
              <th>Notice Date</th>
              <th>Status</th>
              <th>Revisit Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((notice) => (
              <tr key={notice.id}>
                <td className="font-medium">{notice.property?.propertyId}</td>
                <td>{notice.property?.ownerName}</td>
                <td>Rs {notice.penaltyAmount.toLocaleString("en-IN")}</td>
                <td>{new Date(notice.noticeDate).toLocaleString()}</td>
                <td><span className={notice.status === "resolved" ? "badge badge-success" : "badge badge-warning"}>{notice.status}</span></td>
                <td><span className={notice.revisitStatus === "completed" ? "badge badge-success" : "badge badge-danger"}>{notice.revisitStatus}</span></td>
                <td>
                  <button
                    className="btn btn-primary"
                    disabled={notice.status === "resolved"}
                    onClick={async () => {
                      await resolveNotice({ token: session.token, noticeId: notice.id });
                    }}
                  >
                    Mark Resolved
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
