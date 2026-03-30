"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";
import { useToast } from "@/components/toast";
import { FileText, Search, Plus, Calendar, AlertTriangle, CheckCircle2, History, Trash2, Printer } from "lucide-react";

export default function NoticesPage() {
  const [search, setSearch] = useState("");
  const [showGenModal, setShowGenModal] = useState(false);
  const [genForm, setGenForm] = useState({
    propertyId: "",
    noticeType: "reminder",
    dueDate: "",
    remarks: ""
  });
  
  const session = useStoredSession();
  const { toast } = useToast();
  
  const notices = useQuery(api.notices.listNotices, session?.token ? { token: session.token, search } : "skip") || [];
  const properties = useQuery(api.properties.listProperties, session?.token ? { token: session.token } : "skip") || [];
  const generateNotice = useMutation(api.notices.generateManualNotice);
  const resolveNotice = useMutation(api.notices.resolveNotice);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!session?.token || !genForm.propertyId) return;
    
    try {
      await generateNotice({
        token: session.token,
        propertyId: genForm.propertyId,
        noticeType: genForm.noticeType,
        remarks: genForm.remarks,
        dueDate: genForm.dueDate ? new Date(genForm.dueDate).getTime() : undefined
      });
      toast.success(`${genForm.noticeType.toUpperCase()} notice generated successfully`);
      setShowGenModal(false);
      setGenForm({ propertyId: "", noticeType: "reminder", dueDate: "", remarks: "" });
    } catch (err) {
      toast.error("Generation failed: " + err.message);
    }
  };

  const handleResolve = async (id) => {
    if (!session?.token) return;
    try {
      await resolveNotice({ token: session.token, noticeId: id });
      toast.success("Notice marked as resolved");
    } catch (err) {
      toast.error("Resolution failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="ds-page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="ds-page-title inline-flex items-center">
              <FileText className="mr-2 h-6 w-6 text-primary-600" />
              Notice & Penalty Management
            </h1>
            <p className="ds-page-subtitle">Track, generate, and escalate official communication for property dues.</p>
          </div>
          <button 
            onClick={() => setShowGenModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Generate Notice
          </button>
        </div>
      </div>

      <div className="card">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, Number or Status..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Showing <span className="text-primary-600 font-medium">{notices.length}</span> notices
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Notice #</th>
                <th>Type</th>
                <th>Property</th>
                <th>Owner</th>
                <th>Amount Due</th>
                <th>Notice Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 ? (
                <tr><td colSpan="9" className="py-8 text-center text-gray-500 italic">No notices found.</td></tr>
              ) : (
                notices.map((n) => (
                  <tr key={n.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="font-medium text-gray-900">{n.noticeNumber}</td>
                    <td>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        n.noticeType === 'penalty' ? 'bg-orange-50 text-orange-700' :
                        n.noticeType === 'final_warrant' ? 'bg-rose-50 text-rose-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {n.noticeType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-gray-900 font-medium">{n.property?.propertyId}</td>
                    <td className="text-gray-600">{n.property?.ownerName}</td>
                    <td className="tabular-nums font-medium text-rose-600">₹{n.amountDue.toLocaleString()}</td>
                    <td className="text-[11px] text-gray-500 tabular-nums">{new Date(n.noticeDate).toLocaleDateString()}</td>
                    <td className="text-[11px] text-gray-500 tabular-nums">{n.dueDate ? new Date(n.dueDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        n.status === "resolved" ? "bg-emerald-50 text-emerald-700" : 
                        n.status === "escalated" ? "bg-orange-50 text-orange-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {n.status === "resolved" && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {n.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleResolve(n.id)}
                          disabled={n.status === "resolved"}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-30"
                          title="Mark Resolved"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all" title="Print Notice">
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
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
            <h2 className="mb-4 text-xl font-semibold">Generate Official Notice</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="label">Target Property</label>
                <select 
                  className="input font-medium"
                  value={genForm.propertyId}
                  onChange={(e) => setGenForm({...genForm, propertyId: e.target.value})}
                  required
                >
                  <option value="">Select a property...</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.propertyId} - {p.ownerName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notice Type</label>
                <select 
                  className="input font-medium"
                  value={genForm.noticeType}
                  onChange={(e) => setGenForm({...genForm, noticeType: e.target.value})}
                  required
                >
                  <option value="reminder">Reminder Notice</option>
                  <option value="demand">Demand Notice</option>
                  <option value="penalty">Penalty Notice</option>
                  <option value="final_warrant">Final Warrant</option>
                </select>
              </div>
              <div>
                <label className="label">Resolution Deadline (Due Date)</label>
                <input 
                  type="date"
                  className="input"
                  value={genForm.dueDate}
                  onChange={(e) => setGenForm({...genForm, dueDate: e.target.value})}
                />
              </div>
              <div>
                <label className="label">Additional Remarks</label>
                <textarea 
                  className="input min-h-[80px]"
                  placeholder="Official instructions or policy references..."
                  value={genForm.remarks}
                  onChange={(e) => setGenForm({...genForm, remarks: e.target.value})}
                />
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setShowGenModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Issue Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
