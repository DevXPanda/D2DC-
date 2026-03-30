"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Search, Receipt, Calendar, User, MapPin, Eye, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function CollectorCollectionsPage() {
  const session = useStoredSession();
  const [search, setSearch] = useState("");
  const [selectedCollection, setSelectedCollection] = useState(null);
  const collections = useQuery(api.d2dc.collectorCollections, session?.token ? { token: session.token, search } : "skip");

  const formatDate = (ts) => new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="ds-page-header">
        <h1 className="ds-page-title inline-flex items-center text-3xl font-medium tracking-tight text-slate-900 border-l-4 border-primary-600 pl-4">
          Collection History
        </h1>
        <p className="ds-page-subtitle text-slate-500 max-w-2xl leading-relaxed mt-2">
          Review and track all payments collected from the field. Monitor approval statuses and access transaction details.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              className="input pl-12 h-12 bg-slate-50/50 border-slate-100 focus:bg-white rounded-2xl transition-all"
              placeholder="Search by ID, owner, mode, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
             <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed</span>
             <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Pending</span>
             <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Rejected</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Asset & Owner</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Payment Mode</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-5 text-right text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!collections ? (
                <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-medium">Fetching history...</td></tr>
              ) : collections.length === 0 ? (
                <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-medium">No collection records found.</td></tr>
              ) : (
                collections.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{c.property?.propertyId}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">{c.property?.ownerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors">₹{c.amount.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium uppercase text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full tracking-wider">
                             {c.paymentMode}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase ${
                         c.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                         c.status === "pending" ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"
                       }`}>
                          {c.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : 
                           c.status === "pending" ? <Clock className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {c.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-500 font-medium whitespace-nowrap">
                       {formatDate(c.timestamp)}
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                         onClick={() => setSelectedCollection(c)}
                         className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                       >
                          <Eye className="h-4 w-4" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedCollection(null)} />
           <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm text-primary-600">
                       <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                       <h2 className="text-xl font-medium text-slate-900 tracking-tight">Collection Summary</h2>
                       <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Reference ID: {selectedCollection.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedCollection(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all">
                    <XCircle className="h-6 w-6" />
                 </button>
              </div>
              
              <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto scrollbar-thin">
                 <section className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                      { label: "Total Amount", val: `₹${selectedCollection.amount.toLocaleString("en-IN")}`, col: "text-primary-600" },
                      { label: "Base Amount", val: `₹${(selectedCollection.baseAmount || 0).toLocaleString("en-IN")}` },
                      { label: "Penalty Paid", val: `₹${(selectedCollection.penaltyAmount || 0).toLocaleString("en-IN")}`, col: "text-rose-500" },
                      { label: "Status", val: selectedCollection.status.toUpperCase(), col: selectedCollection.status === "completed" ? "text-emerald-600" : "text-blue-600" }
                    ].map((s, i) => (
                      <div key={i} className="space-y-1.5">
                         <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{s.label}</p>
                         <p className={`text-base font-medium tracking-tight ${s.col || "text-slate-900"}`}>{s.val}</p>
                      </div>
                    ))}
                 </section>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h3 className="text-xs font-medium text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-400" /> Asset & Interaction
                       </h3>
                       <div className="space-y-4">
                          <div className="detail-row">
                             <span className="detail-label">Asset ID</span>
                             <span className="detail-value">{selectedCollection.property?.propertyId}</span>
                          </div>
                          <div className="detail-row">
                             <span className="detail-label">Owner Name</span>
                             <span className="detail-value">{selectedCollection.property?.ownerName}</span>
                          </div>
                          <div className="detail-row">
                             <span className="detail-label">Ward</span>
                             <span className="detail-value text-primary-600 underline">Ward {selectedCollection.property?.wardDetails?.wardNumber || "-"}</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-xs font-medium text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400" /> Transaction Audit
                       </h3>
                       <div className="space-y-4">
                          <div className="detail-row">
                             <span className="detail-label">Mode</span>
                             <span className="detail-value uppercase">{selectedCollection.paymentMode}</span>
                          </div>
                          {selectedCollection.transactionId && (
                            <div className="detail-row">
                               <span className="detail-label">Trans ID</span>
                               <span className="detail-value font-mono text-xs">{selectedCollection.transactionId}</span>
                            </div>
                          )}
                          <div className="detail-row">
                             <span className="detail-label">Geo Stamp</span>
                             <span className="detail-value text-[10px] flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400" /> {selectedCollection.geoLocation}
                             </span>
                          </div>
                          <div className="detail-row">
                             <span className="detail-label">Timestamp</span>
                             <span className="detail-value text-xs">{formatDate(selectedCollection.timestamp)}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => setSelectedCollection(null)} className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                    Close Details
                 </button>
                 {selectedCollection.status === "completed" && (
                    <button className="btn btn-primary h-12 px-8 rounded-xl flex items-center gap-2">
                       <FileText className="h-4 w-4" />
                       Download Official Receipt
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
