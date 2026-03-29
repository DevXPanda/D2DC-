"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function CollectionsPage() {
  const [search, setSearch] = useState("");
  const session = useStoredSession();
  const collections = useQuery(api.d2dc.collectionApprovalQueue, session?.token ? { token: session.token, search } : "skip") || [];
  const approveCollection = useMutation(api.d2dc.approveCollection);
  const rejectCollection = useMutation(api.d2dc.rejectCollection);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">D2DC Collection Approval</h1>
        <p className="ds-page-subtitle">Review all collector submissions and approve them as completed or reject them.</p>
      </div>

      <div className="card-flat">
        <input className="input" placeholder="Search by property ID, collector, mode or status..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Property ID</th>
              <th>Collector Name</th>
              <th>Amount Collected</th>
              <th>Payment Mode</th>
              <th>Geo Location</th>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection) => (
              <tr key={collection.id}>
                <td className="font-medium">{collection.property?.propertyId}</td>
                <td>{collection.collector?.name}</td>
                <td>Rs {collection.amount.toLocaleString("en-IN")}</td>
                <td className="capitalize">{collection.paymentMode}</td>
                <td>{collection.geoLocation}</td>
                <td>{new Date(collection.timestamp).toLocaleString()}</td>
                <td>
                  <span
                    className={
                      collection.status === "completed"
                        ? "badge badge-success"
                        : collection.status === "rejected"
                          ? "badge badge-danger"
                          : "badge badge-warning"
                    }
                  >
                    {collection.status}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-primary"
                      disabled={collection.status === "completed"}
                      onClick={async () => {
                        await approveCollection({ token: session.token, collectionId: collection.id });
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      disabled={collection.status === "rejected"}
                      onClick={async () => {
                        await rejectCollection({ token: session.token, collectionId: collection.id });
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
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
