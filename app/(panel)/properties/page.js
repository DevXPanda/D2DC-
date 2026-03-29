"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Edit, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/modal";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

const blankForm = {
  ownerName: "",
  mobile: "",
  address: "",
  ward: "",
  status: "active"
};

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState("");
  const session = useStoredSession();
  const wards = useQuery(api.wards.list, session?.token ? { token: session.token, search: "" } : "skip") || [];
  const properties = useQuery(api.properties.list, session?.token ? { token: session.token, search } : "skip") || [];
  const citizenLookup = useQuery(
    api.properties.lookupCitizenByPhone,
    session?.token && form.mobile.trim() ? { token: session.token, phone: form.mobile } : "skip"
  );
  const createProperty = useMutation(api.properties.create);
  const updateProperty = useMutation(api.properties.update);
  const deleteProperty = useMutation(api.properties.remove);

  useEffect(() => {
    if (!open || editing || !citizenLookup) return;

    if (citizenLookup.citizenExists && citizenLookup.name && form.ownerName !== citizenLookup.name) {
      setForm((prev) => ({ ...prev, ownerName: citizenLookup.name }));
    }
  }, [citizenLookup, editing, form.ownerName, open]);

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.ward) {
      setFormError("Please select a ward before saving the property.");
      return;
    }

    if (editing) {
      await updateProperty({ token: session.token, propertyDocId: editing.id, ...form });
    } else {
      await createProperty({ token: session.token, ...form });
    }
    setOpen(false);
    setEditing(null);
    setForm(blankForm);
  };

  return (
    <div className="space-y-6">
      <div className="ds-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="ds-page-title">Property Management</h1>
          <p className="ds-page-subtitle">Create, edit, and remove D2DC properties with ward assignment and active status.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setForm(blankForm);
            setFormError("");
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Create Property
        </button>
      </div>

      <div className="card-flat">
        <input
          className="input"
          placeholder="Search by property ID, owner, mobile or address..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase text-gray-900">Property Records</h2>
        </div>
        <div className="table-wrap rounded-none border-0">
        <table className="table">
          <thead>
            <tr>
              <th>Property ID</th>
              <th>Owner Name</th>
              <th>Mobile</th>
              <th>Address</th>
              <th>Ward</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr key={property.id}>
                <td className="font-medium">{property.propertyId}</td>
                <td>{property.ownerName}</td>
                <td>{property.mobile}</td>
                <td>{property.address}</td>
                <td>{property.wardDetails?.wardName || "N/A"}</td>
                <td>
                  <span className={property.status === "active" ? "badge badge-success" : "badge badge-danger"}>
                    {property.status}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditing(property);
                        setForm({
                          ownerName: property.ownerName,
                          mobile: property.mobile,
                          address: property.address,
                          ward: property.ward,
                          status: property.status
                        });
                        setFormError("");
                        setOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={async () => {
                        await deleteProperty({ token: session.token, propertyDocId: property.id });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <Modal
        title={editing ? "Edit Property" : "Create Property"}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>{editing ? "Update Property" : "Create Property"}</button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={submit}>
          {!editing ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Property ID will be generated automatically after selecting the ward.
            </div>
          ) : null}
          <div>
            <label className="label">Owner Name</label>
            <input
              className="input"
              value={form.ownerName}
              onChange={(event) => setForm((prev) => ({ ...prev, ownerName: event.target.value }))}
              required
              disabled={!editing && citizenLookup?.citizenExists}
            />
            {!editing && citizenLookup?.citizenExists ? (
              <p className="mt-2 text-xs text-emerald-600">Existing citizen found for this mobile number. Owner name was auto-filled and property will be linked automatically.</p>
            ) : null}
          </div>
          <div>
            <label className="label">Mobile</label>
            <input className="input" value={form.mobile} onChange={(event) => setForm((prev) => ({ ...prev, mobile: event.target.value }))} required />
            {!editing && form.mobile.trim() && citizenLookup && !citizenLookup.citizenExists ? (
              <p className="mt-2 text-xs text-gray-500">No citizen exists for this mobile. A new citizen account will be created, linked automatically, and the initial citizen password will be the mobile number.</p>
            ) : null}
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input h-24 py-3" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Ward</label>
              <select className="input" value={form.ward} onChange={(event) => setForm((prev) => ({ ...prev, ward: event.target.value }))} required>
                <option value="">Select ward</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>{ward.wardNumber} - {ward.wardName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        </form>
      </Modal>
    </div>
  );
}
