"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";
import { Plus, Search, ShieldAlert, FileText, CheckCircle2, Clock, X, AlertTriangle, Building2, Send } from "lucide-react";

const defaultNoticeForm = {
  propertyId: "",
  noticeType: "reminder",
  penaltyAmount: "0",
  remarks: ""
};

export default function SupervisorNoticesPage() {
  const session = useStoredSession();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultNoticeForm);
  const [propSearch, setPropSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const notices = useQuery(api.d2dc.supervisorNotices, session?.token ? { token: session.token, search } : "skip") || [];
  const properties = useQuery(api.d2dc.collectorDashboard, session?.token ? { token: session.token, search: propSearch } : "skip")?.properties || [];
  const generateManualNotice = useMutation(api.d2dc.generateManualNotice);

  const stats = {
    total: notices.length,
    pending: notices.filter(n => n.status === "generated").length,
    resolved: notices.filter(n => n.status === "resolved").length,
    highPriority: notices.filter(n => n.noticeType === "final_warrant").length
  };

  const handleGenerate = async () => {
    if (!form.propertyId) return alert("Select a property first.");
    setSubmitting(true);
    try {
      const res = await generateManualNotice({
        token: session.token,
        propertyId: form.propertyId,
        noticeType: form.noticeType,
        penaltyAmount: Number(form.penaltyAmount || 0),
        remarks: form.remarks
      });
      if (res.whatsappUrl) window.open(res.whatsappUrl, "_blank");
      setIsModalOpen(false);
      setForm(defaultNoticeForm);
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="ds-page-title inline-flex items-center text-3xl font-medium tracking-tight text-slate-900 border-l-4 border-primary-600 pl-4">
             Enforcement Hub
           </h1>
           <p className="ds-page-subtitle text-slate-500 mt-2">Manage official notices, legal warrants, and penalty escalations.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary h-12 px-6 rounded-2xl shadow-lg shadow-primary-500/20 flex items-center gap-2 active:scale-95 transition-all"
        >
           <Plus className="h-5 w-5" />
           Issue New Notice
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Total Notices", val: stats.total, color: "text-slate-900" },
           { label: "Pending Revisit", val: stats.pending, color: "text-amber-600" },
           { label: "Warrants Issued", val: stats.highPriority, color: "text-rose-600" },
           { label: "Successfully Resolved", val: stats.resolved, color: "text-emerald-600" }
         ].map((s, i) => (
           <div key={i} className="stat-card p-6 bg-white border border-slate-100 hover:shadow-lg transition-all">
             <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
             <p className={`mt-3 text-3xl font-medium tracking-tight ${s.color}`}>{s.val}</p>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
           <div className="relative group max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                className="input pl-12 h-12 bg-slate-50/50 border-slate-100 focus:bg-white rounded-2xl transition-all"
                placeholder="Filter by asset ID, owner, or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Asset</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Notice Type</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Amount Due</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Penalty</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Status / Revisit</th>
                <th className="px-8 py-5 text-right text-[10px] font-medium text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {notices.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors">{n.property?.propertyId}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{n.property?.ownerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <span className={`text-[10px] font-medium uppercase px-2.5 py-1 rounded-full ${
                       n.noticeType === "final_warrant" ? "bg-rose-50 text-rose-700" :
                       n.noticeType === "penalty" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                     }`}>
                        {n.noticeType.replace('_', ' ')}
                     </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-900">₹{n.amountDue.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-5 text-sm font-medium text-rose-500">₹{n.penaltyAmount.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                       <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${n.status === "resolved" ? "text-emerald-600" : "text-amber-500"}`}>
                          {n.status === "resolved" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {n.status.toUpperCase()}
                       </span>
                       <span className={`text-[9px] font-medium uppercase tracking-tighter ${n.revisitStatus === "completed" ? "text-slate-400" : "text-rose-400 animate-pulse"}`}>
                          Revisit: {n.revisitStatus}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100 hover:bg-primary-50 rounded-lg">
                       <FileText className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
           <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-primary-600">
                       <ShieldAlert className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-medium text-slate-900 tracking-tight">Issue Official Notice</h2>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                    <X className="h-6 w-6" />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 {/* Property Search */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">Select Arrear Property</label>
                    <div className="relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <input
                          className="input pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:bg-white transition-all font-medium"
                          placeholder="Type asset ID..."
                          value={propSearch}
                          onChange={(e) => setPropSearch(e.target.value)}
                       />
                       {propSearch && properties.length > 0 && !form.propertyId && (
                         <div className="absolute top-16 left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-10 max-h-48 overflow-y-auto">
                            {properties.map(p => (
                               <button 
                                 key={p.id}
                                 onClick={() => { setForm(f => ({...f, propertyId: p.id})); setPropSearch(p.propertyId); }}
                                 className="w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                               >
                                  <p className="text-sm font-medium text-slate-900">{p.propertyId}</p>
                                  <p className="text-[10px] text-slate-500">{p.ownerName}</p>
                               </button>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">Notice Tier</label>
                       <select 
                         className="input h-14 bg-slate-50 border-slate-100 rounded-2xl font-medium"
                         value={form.noticeType}
                         onChange={(e) => setForm(f => ({...f, noticeType: e.target.value}))}
                       >
                          <option value="reminder">Arrear Reminder</option>
                          <option value="demand">Demand Notice</option>
                          <option value="penalty">Penalty Notice</option>
                          <option value="final_warrant">Final Warrant</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">Initial Penalty (₹)</label>
                       <input 
                         type="number"
                         className="input h-14 bg-slate-50 border-slate-100 rounded-2xl font-medium"
                         value={form.penaltyAmount}
                         onChange={(e) => setForm(f => ({...f, penaltyAmount: e.target.value}))}
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">Compliance Remarks</label>
                    <textarea 
                       className="input min-h-[100px] py-4 bg-slate-50 border-slate-100 rounded-2xl resize-none"
                       placeholder="Specify reason for notice or legal context..."
                       value={form.remarks}
                       onChange={(e) => setForm(f => ({...f, remarks: e.target.value}))}
                    />
                 </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                    Cancel
                 </button>
                 <button 
                    onClick={handleGenerate}
                    disabled={submitting}
                    className="btn btn-primary h-14 px-10 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary-500/20"
                 >
                    <Send className="h-4 w-4" />
                    {submitting ? "Provisioning..." : "Generate and Send"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
