"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";
import { FileWarning, Search, Building2, Plus, Edit2, Check, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/toast";

export default function AssessmentsPage() {
  const session = useStoredSession();
  const assessments = useQuery(api.demands.listAssessments, session?.token ? { token: session.token } : "skip");
  const properties = useQuery(api.properties.listProperties, session?.token ? { token: session.token } : "skip");
  const saveAssessment = useMutation(api.demands.createOrUpdateAssessment);
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: "",
    monthlyCharge: 100,
    startDate: new Date().toISOString().split("T")[0],
    autoBilling: true,
    status: "active"
  });

  const filteredAssessments = assessments?.filter(a => 
    a.property?.propertyId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.property?.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (a) => {
    setFormData({
      id: a._id,
      propertyId: a.propertyId,
      monthlyCharge: a.monthlyCharge,
      startDate: new Date(a.startDate).toISOString().split("T")[0],
      autoBilling: a.autoBilling ?? true,
      status: a.status
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!session?.token || !formData.propertyId) return;
    setLoading(true);
    try {
      await saveAssessment({
        token: session.token,
        propertyId: formData.propertyId,
        monthlyCharge: Number(formData.monthlyCharge),
        startDate: new Date(formData.startDate).getTime(),
        autoBilling: formData.autoBilling,
        status: formData.status
      });
      toast.success(formData.id ? "Assessment updated successfully" : "New assessment created");
      setShowModal(false);
      setFormData({ propertyId: "", monthlyCharge: 100, startDate: new Date().toISOString().split("T")[0], autoBilling: true, status: "active" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="ds-page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="ds-page-title inline-flex items-center">
              <FileWarning className="mr-2 h-6 w-6 text-orange-600" />
              Property Assessments
            </h1>
            <p className="ds-page-subtitle text-gray-500">Track monthly charges and billing cycles for every property.</p>
          </div>
          <button 
            onClick={() => {
              setFormData({ propertyId: "", monthlyCharge: 100, startDate: new Date().toISOString().split("T")[0], autoBilling: true, status: "active" });
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create Assessment
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
            Showing <span className="text-primary-600 font-medium">{filteredAssessments?.length ?? 0}</span> assessments
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="w-48">Property ID</th>
                <th>Owner Name</th>
                <th className="w-40">Monthly Charge</th>
                <th className="w-40">Start Date</th>
                <th className="w-32">Auto Billing</th>
                <th className="w-32">Status</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!filteredAssessments ? (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500 italic">Connecting to database...</td></tr>
              ) : filteredAssessments.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500 italic">No assessment records matching your criteria.</td></tr>
              ) : (
                filteredAssessments.map((a) => (
                  <tr key={a._id} className="group hover:bg-gray-50 transition-colors">
                    <td className="text-gray-900 font-medium">{a.property?.propertyId}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-gray-900 group-hover:text-primary-600 transition-colors">{a.property?.ownerName}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {a.property?.mobile}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
                        ₹{a.monthlyCharge}
                      </span>
                    </td>
                    <td className="text-gray-600 tabular-nums">{new Date(a.startDate).toLocaleDateString("en-IN")}</td>
                    <td>
                      {a.autoBilling ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded">
                          <Check className="h-3 w-3" /> ON
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 text-xs font-medium bg-rose-50 px-2 py-1 rounded">
                          <X className="h-3 w-3" /> OFF
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        a.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => handleEdit(a)} 
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900 border-b pb-4">
              {formData.id ? "Edit Assessment" : "New Assessment"}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="label">Target Property</label>
                <select 
                  className="input font-medium"
                  value={formData.propertyId}
                  onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                  disabled={!!formData.id}
                  required
                >
                  <option value="">Choose property...</option>
                  {properties?.map(p => (
                    <option key={p._id} value={p._id}>{p.propertyId} - {p.ownerName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Monthly Charge</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-medium">₹</span>
                    <input 
                      type="number"
                      className="input pl-8 font-mono"
                      value={formData.monthlyCharge}
                      onChange={(e) => setFormData({...formData, monthlyCharge: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Effective Date</label>
                  <input 
                    type="date"
                    className="input font-mono"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Automatic Billing</span>
                  <span className="text-[10px] text-gray-500 uppercase font-medium">Monthly generation</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.autoBilling}
                    onChange={(e) => setFormData({...formData, autoBilling: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div>
                <label className="label">Lifecycle Status</label>
                <select 
                  className="input font-medium uppercase text-xs tracking-widest"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="mt-8 flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Discard</button>
                <button type="submit" disabled={loading} className="btn btn-primary flex-1 shadow-lg shadow-primary-200">
                  {loading ? "Processing..." : formData.id ? "Update Changes" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
