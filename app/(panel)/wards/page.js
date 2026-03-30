"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Edit, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/modal";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

const initialForm = { wardNumber: "", wardName: "", description: "", collectorId: "", isActive: true };

export default function WardsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const session = useStoredSession();
  const wards = useQuery(api.wards.list, session?.token ? { token: session.token, search } : "skip") || [];
  const users = useQuery(api.users.list, session?.token ? { token: session.token } : "skip") || [];
  const collectors = users.filter(u => u.role === "collector");

  const createWard = useMutation(api.wards.create);
  const updateWard = useMutation(api.wards.update);
  const deleteWard = useMutation(api.wards.remove);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      token: session.token,
      wardNumber: form.wardNumber.trim(),
      wardName: form.wardName.trim(),
      description: form.description?.trim(),
      collectorId: form.collectorId || undefined,
      isActive: !!form.isActive
    };

    if (editing) {
      await updateWard({ wardId: editing.id, ...payload });
    } else {
      await createWard(payload);
    }
    setForm(initialForm);
    setEditing(null);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="ds-page-title">Ward Management</h1>
          <p className="ds-page-subtitle">Maintain operational wards for property assignment and field staff mapping.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm(initialForm);
            setOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Ward
        </button>
      </div>

      <div className="card-flat">
        <input className="input" placeholder="Search by ward number or ward name..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {wards.map((ward) => (
          <div key={ward.id} className="card">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{ward.wardName}</h3>
                <p className="text-sm text-gray-500">Ward {ward.wardNumber}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                  <div className={`h-1.5 w-1.5 rounded-full ${ward.isActive ? "bg-primary-400" : "bg-gray-300"}`} />
                  <span>{ward.collectorName ? `Assign Collector: ${ward.collectorName}` : "No Collector Assigned"}</span>
                </div>
              </div>
              <span className={`badge ${ward.isActive ? "badge-success" : "badge-danger"}`}>
                {ward.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mb-4 text-sm text-gray-600">{ward.description || "No description added yet."}</p>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs uppercase text-gray-500">Properties</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{ward.propertyCount}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs uppercase text-gray-500">Users</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{ward.userCount}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => {
                  setEditing(ward);
                  setForm({
                    wardNumber: ward.wardNumber,
                    wardName: ward.wardName,
                    description: ward.description || "",
                    collectorId: ward.collectorId || "",
                    isActive: ward.isActive ?? true
                  });
                  setOpen(true);
                }}
                className="btn btn-secondary"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={async () => {
                  await deleteWard({ token: session.token, wardId: ward.id });
                }}
                className="btn btn-danger"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        title={editing ? "Edit Ward Profile" : "Onboard New Ward"}
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="max-w-4xl"
        footer={
          <div className="flex w-full justify-between items-center px-2">
            <p className="text-xs text-gray-400">All fields marked with * are mandatory</p>
            <div className="flex gap-3">
              <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editing ? "Update Ward" : "Create Ward"}
              </button>
            </div>
          </div>
        }
      >
        <form className="space-y-8 py-2" onSubmit={handleSubmit}>
          {/* Primary Identity */}
          <section className="space-y-4">
            <h3 className="flex items-center text-sm font-bold text-gray-900 border-l-4 border-primary-500 pl-3">
              <Plus className="mr-2 h-4 w-4 text-primary-500" />
              Primary Identity
            </h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="label">Ward Number *</label>
                <input className="input" placeholder="e.g. 001, 45, W-12" value={form.wardNumber} onChange={(event) => setForm((prev) => ({ ...prev, wardNumber: event.target.value }))} required />
              </div>
              <div>
                <label className="label">Ward Name *</label>
                <input className="input" placeholder="e.g. Central Ward, City North" value={form.wardName} onChange={(event) => setForm((prev) => ({ ...prev, wardName: event.target.value }))} required />
              </div>
            </div>
          </section>

          {/* Operational Details */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="flex items-center text-sm font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">
              <Edit className="mr-2 h-4 w-4 text-indigo-500" />
              Operational Context
            </h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="label">Assign Collector (Optional)</label>
                <select className="input" value={form.collectorId} onChange={(e) => setForm(p => ({ ...p, collectorId: e.target.value }))}>
                  <option value="">Select a collector</option>
                  {collectors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input font-bold text-emerald-600" value={String(form.isActive)} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.value === "true" }))}>
                  <option value="true">ACTIVE</option>
                  <option value="false">INACTIVE</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Description</label>
                <textarea className="input h-32 py-3" placeholder="Define the geographical boundaries or specific landmarks included in this ward..." value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
              </div>
            </div>
          </section>

          {/* <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100 flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-xs">!</div>
              <div>
                 <p className="text-xs text-blue-800 font-bold uppercase tracking-tight">System Notice</p>
                 <p className="text-[11px] text-blue-600 leading-relaxed mt-0.5">Creating this ward will make it immediately available for property registration and staff allocation across the administrative dashboard.</p>
              </div>
           </div> */}
        </form>
      </Modal>
    </div>
  );
}
