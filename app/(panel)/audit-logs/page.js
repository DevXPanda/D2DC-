"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const session = useStoredSession();
  const logs = useQuery(api.d2dc.auditLogsList, session?.token ? { token: session.token, search } : "skip") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">Audit Logs</h1>
        <p className="ds-page-subtitle">Track collection approvals, visit records, notices, and user actions across the admin panel.</p>
      </div>

      <div className="card-flat">
        <input className="input" placeholder="Search logs by action, performer, entity or details..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Performed By</th>
              <th>Entity</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="font-medium">{log.action}</td>
                <td>{log.performedBy}</td>
                <td className="capitalize">{log.entityType}</td>
                <td>{log.details}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
