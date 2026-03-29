"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import Modal from "@/components/modal";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

const initialForm = {
  collectorId: "",
  assignedWard: "",
  assignedArea: ""
};

export default function SupervisorAssignmentsPage() {
  const session = useStoredSession();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const collectors = useQuery(api.d2dc.supervisorCollectors, session?.token ? { token: session.token } : "skip") || [];
  const wards = useQuery(api.d2dc.supervisorAssignableWards, session?.token ? { token: session.token } : "skip") || [];
  const assignCollector = useMutation(api.d2dc.assignCollector);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await assignCollector({
      token: session.token,
      collectorId: form.collectorId,
      assignedWard: form.assignedWard,
      assignedArea: form.assignedArea || undefined
    });
    setOpen(false);
    setForm(initialForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="ds-page-title">Collector Assignment</h1>
          <p className="ds-page-subtitle">Assign collectors to your ward scope and optionally define an area for field coverage.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Assign Collector
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Collector</th>
              <th>Ward</th>
              <th>Area</th>
              <th>Total Visits</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {collectors.map((collector) => (
              <tr key={collector.id}>
                <td>
                  <p className="font-medium text-gray-900">{collector.name}</p>
                  <p className="text-xs text-gray-500">{collector.phone}</p>
                </td>
                <td>{collector.wardDetails?.wardName || "Unassigned"}</td>
                <td>{collector.assignedArea || "Not set"}</td>
                <td>{collector.totalVisits}</td>
                <td><span className={collector.isActive ? "badge badge-success" : "badge badge-danger"}>{collector.isActive ? "Active" : "Inactive"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title="Assign Collector"
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Save Assignment</button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">Collector Name</label>
            <select className="input" value={form.collectorId} onChange={(event) => setForm((prev) => ({ ...prev, collectorId: event.target.value }))} required>
              <option value="">Select collector</option>
              {collectors.map((collector) => (
                <option key={collector.id} value={collector.id}>{collector.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Assigned Ward</label>
            <select className="input" value={form.assignedWard} onChange={(event) => setForm((prev) => ({ ...prev, assignedWard: event.target.value }))} required>
              <option value="">Select ward</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>{ward.wardNumber} - {ward.wardName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Area (optional)</label>
            <input className="input" value={form.assignedArea} onChange={(event) => setForm((prev) => ({ ...prev, assignedArea: event.target.value }))} placeholder="Market road, sector, colony..." />
          </div>
        </form>
      </Modal>
    </div>
  );
}
