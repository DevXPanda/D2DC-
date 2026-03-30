"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";
import { ScrollText, Search, RefreshCw, CheckCircle2, AlertTriangle, Building2, Calculator, RotateCcw, Edit3 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/toast";

export default function DemandsPage() {
  const session = useStoredSession();
  const demands = useQuery(api.demands.listDemands, session?.token ? { token: session.token } : "skip");
  const syncDemands = useMutation(api.demands.syncAllDemands);
  const generateManual = useMutation(api.demands.generateManualDemand);
  const resetDemandMut = useMutation(api.demands.resetDemand);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [syncing, setSyncing] = useState(false);

  const [showGenModal, setShowGenModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [genFormData, setGenFormData] = useState({
    pendingMonths: 0,
    baseAmountOverride: "",
    resetPenalty: false
  });

  const filteredDemands = demands?.filter(d =>
    d.property?.propertyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.property?.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSync = async () => {
    if (!session?.token) return;
    setSyncing(true);
    const toastId = toast.info("Synchronizing all demands...");
    try {
      const result = await syncDemands({ token: session.token });
      toast.success(`Successfully updated ${result.updatedCount} properties.`);
    } catch (err) {
      toast.error(`Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSyncing(false);
    }
  };

  const openGenModal = (d) => {
    setSelectedDemand(d);
    setGenFormData({
      pendingMonths: d.pendingMonths,
      baseAmountOverride: d.baseAmount,
      resetPenalty: false
    });
    setShowGenModal(true);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!session?.token || !selectedDemand) return;
    try {
      await generateManual({
        token: session.token,
        propertyId: selectedDemand.propertyId,
        pendingMonths: Number(genFormData.pendingMonths),
        baseAmountOverride: genFormData.baseAmountOverride ? Number(genFormData.baseAmountOverride) : undefined,
        resetPenalty: genFormData.resetPenalty
      });
      toast.success("Demand generated/updated successfully");
      setShowGenModal(false);
    } catch (err) {
      toast.error("Generation failed: " + err.message);
    }
  };

  const handleReset = async () => {
    if (!session?.token || !selectedDemand) return;
    try {
      await resetDemandMut({
        token: session.token,
        propertyId: selectedDemand.propertyId
      });
      toast.success("Demand record reset to zero");
      setShowResetModal(false);
    } catch (err) {
      toast.error("Reset failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="ds-page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="ds-page-title inline-flex items-center">
              <ScrollText className="mr-2 h-6 w-6 text-emerald-600" />
              Property Demands
            </h1>
            <p className="ds-page-subtitle text-gray-500">View and manage outstanding dues, penalties, and payment balances.</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-primary flex items-center justify-center gap-2 px-5 py-2.5"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync All Demands"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or Owner..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Showing <span className="text-primary-600 font-medium">{filteredDemands?.length ?? 0}</span> records
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="w-48">Property ID</th>
                <th>Owner Name</th>
                <th className="w-32 text-center">Months</th>
                <th className="w-36">Base Amount</th>
                <th className="w-36">Penalty</th>
                <th className="w-40 font-medium text-gray-900">Total Due</th>
                <th className="w-44">Last Updated</th>
                <th className="w-24">Source</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!filteredDemands ? (
                <tr><td colSpan="9" className="py-8 text-center text-gray-500 italic">Syncing with ledger...</td></tr>
              ) : filteredDemands.length === 0 ? (
                <tr><td colSpan="9" className="py-8 text-center text-gray-500 italic">No outstanding demands found.</td></tr>
              ) : (
                filteredDemands.map((d) => (
                  <tr key={d._id} className="group hover:bg-gray-50 transition-colors">
                    <td className="text-gray-900 font-medium">{d.property?.propertyId}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-gray-900 group-hover:text-primary-600 transition-colors">{d.property?.ownerName}</span>
                        <span className="text-xs text-gray-500">{d.property?.mobile}</span>
                      </div>
                    </td>
                    <td className="text-center tabular-nums text-gray-600">{d.pendingMonths}</td>
                    <td className="tabular-nums">₹{d.baseAmount.toLocaleString()}</td>
                    <td className="tabular-nums">
                      <span className={`${d.penaltyAmount > 0 ? "text-rose-600 font-medium" : "text-gray-400"}`}>
                        ₹{d.penaltyAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="tabular-nums">
                      <span className={`text-base font-medium ${d.totalAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        ₹{d.totalAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-gray-500 text-[11px] tabular-nums">
                      {new Date(d.lastUpdated).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>
                      <span className={`text-[9px] px-2 py-0.5 rounded-sm font-semibold tracking-wider ${d.generatedBy === "system" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"
                        }`}>
                        {d.generatedBy === "system" ? "SYSTEM" : "ADMIN"}
                      </span>
                    </td>
                    <td className="text-right flex items-center justify-end gap-1">
                      <button
                        onClick={() => openGenModal(d)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-all"
                        title="Generate/Edit Demand"
                      >
                        <Calculator className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedDemand(d); setShowResetModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded-lg transition-all"
                        title="Reset Demand"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold font-sans">Generate/Edit Demand</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <p className="text-sm text-gray-500">Property: <span className="font-medium text-gray-900">{selectedDemand?.property?.propertyId}</span></p>
              <div>
                <label className="label">Pending Months</label>
                <input
                  type="number"
                  className="input"
                  value={genFormData.pendingMonths}
                  onChange={(e) => setGenFormData({ ...genFormData, pendingMonths: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Base Amount (Auto-calculated: ₹{genFormData.pendingMonths * 100})</label>
                <div className="relative">
                  <input
                    type="number"
                    className="input"
                    placeholder="Enter manual amount to override"
                    value={genFormData.baseAmountOverride}
                    onChange={(e) => setGenFormData({ ...genFormData, baseAmountOverride: e.target.value })}
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-gray-400 uppercase font-medium">Override</span>
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="resetPenalty"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  checked={genFormData.resetPenalty}
                  onChange={(e) => setGenFormData({ ...genFormData, resetPenalty: e.target.checked })}
                />
                <label htmlFor="resetPenalty" className="text-sm font-medium text-gray-700 font-sans">Clear/Reset Penalty Amount</label>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowGenModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary font-medium">Update Demand</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-xl font-semibold text-gray-900 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-rose-600" />
              Reset Demand?
            </h2>
            <p className="text-sm text-gray-500">This will clear all pending months, base amount, and penalty for <span className="font-medium text-gray-900">{selectedDemand?.property?.propertyId}</span>. This action is recorded.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowResetModal(false)} className="btn btn-secondary">Discard</button>
              <button
                onClick={handleReset}
                className="btn btn-danger font-medium"
              >
                Clear All Dues
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
