"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ClipboardList,
  CreditCard,
  MapPin,
  MapPinned,
  ReceiptText,
  Search,
  ShieldAlert,
  Users
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

const defaultForm = {
  amount: "",
  paymentMode: "cash",
  penaltyAmount: "50"
};

export default function SupervisorDashboardPage() {
  const session = useStoredSession();
  const [search, setSearch] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [visitType, setVisitType] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [geoLocation, setGeoLocation] = useState("");
  const [geoStatus, setGeoStatus] = useState("Capture location when you start a visit.");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const summary = useQuery(api.d2dc.supervisorDashboard, session?.token ? { token: session.token } : "skip");
  const fieldAccess = useQuery(api.d2dc.collectorDashboard, session?.token ? { token: session.token, search } : "skip");
  const submitVisit = useMutation(api.d2dc.submitCollectorVisit);
  const selectedProperty = fieldAccess?.properties.find((property) => property.id === selectedPropertyId) || null;

  useEffect(() => {
    if (!selectedPropertyId) {
      setVisitType("");
      setForm(defaultForm);
      setGeoLocation("");
      setGeoStatus("Capture location when you start a visit.");
      setResult(null);
    }
  }, [selectedPropertyId]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation is not supported on this device.");
      return;
    }

    setGeoStatus("Capturing location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        setGeoLocation(coords);
        setGeoStatus("Location captured successfully.");
      },
      () => {
        setGeoStatus("Unable to capture location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!selectedProperty || !visitType) {
      setError("Select a property and choose PAID or NOT PAID.");
      return;
    }
    if (!geoLocation) {
      setError("Please capture geo location before submitting.");
      return;
    }
    if (visitType === "paid" && !form.amount) {
      setError("Enter the amount collected.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await submitVisit({
        token: session.token,
        propertyId: selectedProperty.id,
        visitType,
        geoLocation,
        amount: form.amount ? Number(form.amount) : undefined,
        paymentMode: form.paymentMode,
        penaltyAmount: form.penaltyAmount ? Number(form.penaltyAmount) : undefined
      });
      setResult(response);
      if (typeof window !== "undefined") {
        window.open(response.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      setSelectedPropertyId("");
      setVisitType("");
      setForm(defaultForm);
      setGeoLocation("");
      setGeoStatus("Capture location when you start a visit.");
    } catch (submissionError) {
      setError(submissionError.message || "Unable to submit the visit.");
    } finally {
      setSubmitting(false);
    }
  };

  const quickActions = [
    { label: "Assign Collector", href: "/supervisor/assignments", icon: Users, color: "bg-blue-600" },
    { label: "View Field Activity", href: "/supervisor/activity", icon: MapPinned, color: "bg-sky-600" },
    { label: "Monitor Visits", href: "/supervisor/activity", icon: ClipboardList, color: "bg-emerald-600" },
    { label: "Track Notices", href: "/supervisor/notices", icon: ShieldAlert, color: "bg-amber-600" }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="ds-page-title">Supervisor Dashboard</h1>
        <p className="ds-page-subtitle">
          Monitor collectors, field visits, geo-tagged activity, notices, and pending revisits while keeping the same field rights as a collector.
        </p>
        {summary?.ward ? <p className="mt-2 text-sm text-gray-500">Monitoring scope: {summary.ward.wardNumber} - {summary.ward.wardName}</p> : null}
      </div>

      <section>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="stat-card">
            <p className="text-xs font-medium uppercase text-gray-500">Total Collectors</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{summary?.stats.totalCollectors ?? 0}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-medium uppercase text-gray-500">Total Visits Today</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{summary?.stats.totalVisitsToday ?? 0}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-medium uppercase text-gray-500">Paid Visits</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{summary?.stats.paidVisits ?? 0}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-medium uppercase text-gray-500">Not Paid Visits</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{summary?.stats.notPaidVisits ?? 0}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-medium uppercase text-gray-500">Pending Revisits</p>
            <p className="mt-2 text-2xl font-bold text-rose-600">{summary?.stats.pendingRevisits ?? 0}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="ds-section-title">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className="card-hover flex flex-col items-center justify-center p-5 text-center group">
              <div className={`${action.color} mb-3 rounded-full p-3 text-white shadow-sm transition-transform group-hover:scale-110`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="card">
            <div className="mb-4 flex items-center gap-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                className="input"
                placeholder="Search ward properties by ID, owner, or address..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {!fieldAccess || fieldAccess.properties.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No active properties are available inside your supervisor scope.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fieldAccess.properties.map((property) => (
                  <button
                    key={property.id}
                    type="button"
                    onClick={() => {
                      setSelectedPropertyId(property.id);
                      setError("");
                      setResult(null);
                      captureLocation();
                    }}
                    className={`rounded-xl border p-5 text-left transition ${
                      selectedPropertyId === property.id
                        ? "border-primary-500 bg-primary-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{property.propertyId}</p>
                    <p className="mt-1 text-sm text-gray-700">{property.ownerName}</p>
                    <p className="mt-2 text-sm text-gray-500">{property.address}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="mb-4">
              <h2 className="ds-section-title">Start Visit</h2>
              <p className="text-sm text-gray-500">Supervisors can also perform the same paid or not paid visit workflow when needed in the field.</p>
            </div>

            {selectedProperty ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500">Property ID</p>
                  <p className="text-lg font-bold text-gray-900">{selectedProperty.propertyId}</p>
                  <p className="mt-3 text-xs uppercase text-gray-500">Owner Name</p>
                  <p className="text-sm font-medium text-gray-900">{selectedProperty.ownerName}</p>
                  <p className="mt-3 text-xs uppercase text-gray-500">Address</p>
                  <p className="text-sm text-gray-700">{selectedProperty.address}</p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <MapPin className="h-4 w-4 text-primary-600" />
                      Geo Location
                    </div>
                    <button type="button" onClick={captureLocation} className="btn btn-secondary">
                      Refresh Location
                    </button>
                  </div>
                  <p className="text-sm text-gray-700">{geoLocation || "Location not captured yet."}</p>
                  <p className="mt-2 text-xs text-gray-500">{geoStatus}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setVisitType("paid")}
                    className={`rounded-2xl border px-6 py-8 text-center text-lg font-bold transition ${
                      visitType === "paid"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                    }`}
                  >
                    PAID
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitType("not_paid")}
                    className={`rounded-2xl border px-6 py-8 text-center text-lg font-bold transition ${
                      visitType === "not_paid"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-amber-300"
                    }`}
                  >
                    NOT PAID
                  </button>
                </div>

                {visitType === "paid" ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">Amount Collected</label>
                      <input
                        className="input h-12 text-base"
                        type="number"
                        value={form.amount}
                        onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <label className="label">Payment Mode</label>
                      <select
                        className="input h-12 text-base"
                        value={form.paymentMode}
                        onChange={(event) => setForm((prev) => ({ ...prev, paymentMode: event.target.value }))}
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {visitType === "not_paid" ? (
                  <div>
                    <label className="label">Penalty Amount</label>
                    <input
                      className="input h-12 text-base"
                      type="number"
                      value={form.penaltyAmount}
                      onChange={(event) => setForm((prev) => ({ ...prev, penaltyAmount: event.target.value }))}
                    />
                  </div>
                ) : null}

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button type="button" onClick={handleSubmit} disabled={submitting} className="btn btn-primary h-12 w-full text-base">
                  {submitting ? "Submitting Visit..." : "Submit Visit"}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                Select a property above to start a supervisor field visit.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="mb-4 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary-600" />
              <h2 className="ds-section-title">Visit Result</h2>
            </div>
            {result?.receipt ? (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">Receipt Generated</p>
                <p className="text-sm text-gray-700">Receipt No: {result.receipt.receiptNumber}</p>
                <p className="text-sm text-gray-700">Property: {result.receipt.propertyId}</p>
                <p className="text-sm text-gray-700">Amount: Rs {result.receipt.amount}</p>
                <p className="text-sm text-gray-700">Status: {result.receipt.status}</p>
              </div>
            ) : result?.notice ? (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-700">Notice Pending</p>
                <p className="text-sm text-gray-700">Property: {result.visit?.property?.propertyId}</p>
                <p className="text-sm text-gray-700">Penalty: Rs {result.notice.penaltyAmount}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                Submitted visit results will appear here.
              </div>
            )}
          </div>

          <div className="card">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-600" />
              <h2 className="ds-section-title">Collector Performance</h2>
            </div>
            {!summary || summary.collectorPerformance.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No collectors assigned in this supervisor scope yet.
              </div>
            ) : (
              <div className="space-y-3">
                {summary.collectorPerformance.map((collector) => (
                  <div key={collector.id} className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900">{collector.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {collector.totalVisits} visits ({collector.paidVisits} Paid, {collector.notPaidVisits} Not Paid)
                    </p>
                    {collector.assignedArea ? <p className="mt-2 text-xs text-gray-500">Area: {collector.assignedArea}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="mb-4 flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-primary-600" />
              <h2 className="ds-section-title">Recent Field Activity</h2>
            </div>
            {!summary || summary.recentActivity.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No geo-tagged visits found yet.
              </div>
            ) : (
              <div className="space-y-3">
                {summary.recentActivity.map((visit) => (
                  <div key={visit.id} className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900">{visit.property?.propertyId}</p>
                    <p className="mt-1 text-xs text-gray-500">{visit.collector?.name} | {new Date(visit.timestamp).toLocaleString()}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {visit.statusFlow.map((status) => (
                        <span key={status} className="badge badge-info">{status}</span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-gray-500">Geo: {visit.geoLocation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
