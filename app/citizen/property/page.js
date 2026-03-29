"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function CitizenPropertyPage() {
  const session = useStoredSession();
  const [paymentForm, setPaymentForm] = useState({});
  const dashboard = useQuery(api.d2dc.citizenDashboard, session?.token ? { token: session.token } : "skip");
  const collections = useQuery(api.d2dc.citizenCollections, session?.token ? { token: session.token } : "skip") || [];
  const payCollection = useMutation(api.d2dc.citizenPayCollection);

  const handlePay = async (propertyId) => {
    const current = paymentForm[propertyId] || {};
    await payCollection({
      token: session.token,
      propertyId,
      amount: Number(current.amount || 0),
      paymentMode: current.paymentMode || "upi"
    });
    setPaymentForm((prev) => ({
      ...prev,
      [propertyId]: { amount: "", paymentMode: "upi" }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ds-page-title">Property Details</h1>
        <p className="ds-page-subtitle">View your property information, collection history, and optionally submit a payment for approval.</p>
      </div>

      {!dashboard || dashboard.properties.length === 0 ? (
        <div className="card text-center py-12 text-sm text-gray-500">
          No property is linked to this citizen account yet.
        </div>
      ) : (
        <div className="space-y-6">
          {dashboard.properties.map((property) => {
            const propertyCollections = collections.filter((item) => item.propertyId === property.id);
            const form = paymentForm[property.id] || { amount: "", paymentMode: "upi" };

            return (
              <div key={property.id} className="space-y-6">
                <div className="card overflow-hidden p-0">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">Property Information</h2>
                  </div>
                  <div className="table-wrap rounded-none border-0">
                    <table className="table min-w-0">
                      <tbody>
                        <tr>
                          <td className="w-48 font-medium text-gray-500">Property ID</td>
                          <td>{property.propertyId}</td>
                        </tr>
                        <tr>
                          <td className="font-medium text-gray-500">Owner Name</td>
                          <td>{property.ownerName}</td>
                        </tr>
                        <tr>
                          <td className="font-medium text-gray-500">Mobile</td>
                          <td>{property.mobile}</td>
                        </tr>
                        <tr>
                          <td className="font-medium text-gray-500">Address</td>
                          <td>{property.address}</td>
                        </tr>
                        <tr>
                          <td className="font-medium text-gray-500">Ward</td>
                          <td>{property.wardDetails?.wardName || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="font-medium text-gray-500">Status</td>
                          <td className="capitalize">{property.status}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="card">
                    <h2 className="ds-section-title">Collection History</h2>
                    {propertyCollections.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                        No collection history found for this property.
                      </div>
                    ) : (
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Amount</th>
                              <th>Payment Mode</th>
                              <th>Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {propertyCollections.map((collection) => (
                              <tr key={collection.id}>
                                <td className="font-medium">Rs {collection.amount.toLocaleString("en-IN")}</td>
                                <td>{collection.paymentMode.toUpperCase()}</td>
                                <td>{new Date(collection.timestamp).toLocaleString()}</td>
                                <td>
                                  <span className={collection.status === "completed" ? "badge badge-success" : collection.status === "pending" ? "badge badge-warning" : "badge badge-danger"}>
                                    {collection.status === "completed" ? "Approved" : collection.status === "pending" ? "Pending Approval" : "Rejected"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="card space-y-4">
                    <div>
                      <h2 className="ds-section-title">Pay Pending Amount</h2>
                      <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                        <div>
                          <label className="label">Amount</label>
                          <input
                            className="input"
                            type="number"
                            value={form.amount}
                            onChange={(event) => setPaymentForm((prev) => ({ ...prev, [property.id]: { ...form, amount: event.target.value } }))}
                            placeholder="Enter amount"
                          />
                        </div>
                        <div>
                          <label className="label">Payment Mode</label>
                          <select
                            className="input"
                            value={form.paymentMode}
                            onChange={(event) => setPaymentForm((prev) => ({ ...prev, [property.id]: { ...form, paymentMode: event.target.value } }))}
                          >
                            <option value="upi">UPI</option>
                            <option value="cash">Cash</option>
                          </select>
                        </div>
                        <button className="btn btn-primary w-full" onClick={() => handlePay(property.id)}>
                          Submit Payment
                        </button>
                      </div>
                    </div>

                    <a
                      href="https://wa.me/919999999999?text=I%20need%20help%20regarding%20my%20property"
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary w-full"
                    >
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
