"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Edit, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/modal";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

const initialForm = { wardNumber: "", wardName: "", description: "" };

export default function WardsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const session = useStoredSession();
  const wards = useQuery(api.wards.list, session?.token ? { token: session.token, search } : "skip") || [];
  const createWard = useMutation(api.wards.create);
  const updateWard = useMutation(api.wards.update);
  const deleteWard = useMutation(api.wards.remove);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (editing) {
      await updateWard({ token: session.token, wardId: editing.id, ...form });
    } else {
      await createWard({ token: session.token, ...form });
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
              </div>
              <span className="badge badge-success">Active</span>
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
                    description: ward.description || ""
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
        title={editing ? "Edit Ward" : "Add New Ward"}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>{editing ? "Update Ward" : "Create Ward"}</button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">Ward Number</label>
            <input className="input" value={form.wardNumber} onChange={(event) => setForm((prev) => ({ ...prev, wardNumber: event.target.value }))} required />
          </div>
          <div>
            <label className="label">Ward Name</label>
            <input className="input" value={form.wardName} onChange={(event) => setForm((prev) => ({ ...prev, wardName: event.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input h-24 py-3" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
