"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Edit, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/modal";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

const defaultForm = {
  name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  role: "collector",
  assignedWard: "",
  isActive: true
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const session = useStoredSession();
  const users = useQuery(api.users.list, session?.token ? { token: session.token, search } : "skip") || [];
  const wards = useQuery(api.wards.list, session?.token ? { token: session.token, search: "" } : "skip") || [];
  const createUser = useMutation(api.users.create);
  const updateUser = useMutation(api.users.update);
  const deleteUser = useMutation(api.users.remove);

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      token: session.token,
      name: form.name,
      username: form.username,
      email: form.email,
      phone: form.phone,
      password: form.password || undefined,
      role: form.role,
      assignedWard: form.assignedWard || undefined,
      isActive: form.isActive
    };
    if (editing) await updateUser({ ...payload, userId: editing.id });
    else await createUser(payload);
    setOpen(false);
    setEditing(null);
    setForm(defaultForm);
  };

  return (
    <div className="space-y-6">
      <div className="ds-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="ds-page-title">Field Worker & User Management</h1>
          <p className="ds-page-subtitle">Manage supervisors, collectors, and citizens with role and ward assignment.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setForm(defaultForm);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      <div className="card-flat">
        <input className="input" placeholder="Search users by name, phone, email, role or ward..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase text-gray-900">User Records</h2>
        </div>
        <div className="table-wrap rounded-none border-0">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Assigned Ward</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </td>
                <td><span className="badge badge-info capitalize">{user.role}</span></td>
                <td>{user.phone}</td>
                <td>{user.email}</td>
                <td>{user.wardDetails?.wardName || "Unassigned"}</td>
                <td><span className={user.isActive ? "badge badge-success" : "badge badge-danger"}>{user.isActive ? "Active" : "Inactive"}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditing(user);
                        setForm({
                          name: user.name,
                          username: user.username,
                          email: user.email,
                          phone: user.phone,
                          password: user.password || "",
                          role: user.role,
                          assignedWard: user.assignedWard || "",
                          isActive: user.isActive
                        });
                        setOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={async () => {
                        await deleteUser({ token: session.token, userId: user.id });
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
        title={editing ? "Edit User" : "Create User"}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>{editing ? "Update User" : "Create User"}</button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Username</label>
              <input className="input" value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} required={!editing} />
            <p className="mt-2 text-xs text-gray-500">If left blank during edit, the existing password is kept. New users default to `changeme123` only if no password is entered in the data layer.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
                <option value="supervisor">Supervisor</option>
                <option value="collector">Collector</option>
                <option value="citizen">Citizen</option>
              </select>
            </div>
            <div>
              <label className="label">Assign Ward</label>
              <select className="input" value={form.assignedWard} onChange={(event) => setForm((prev) => ({ ...prev, assignedWard: event.target.value }))}>
                <option value="">Unassigned</option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>{ward.wardNumber} - {ward.wardName}</option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
