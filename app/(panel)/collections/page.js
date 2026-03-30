"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  MapPin, 
  User, 
  History, 
  MoreHorizontal,
  ChevronRight,
  Eye
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";
import { useToast } from "@/components/toast";

export default function CollectionsPage() {
  const session = useStoredSession();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const collections = useQuery(api.d2dc.collectionApprovalQueue, session?.token ? { token: session.token, search } : "skip") || [];
  const approveCollection = useMutation(api.d2dc.approveCollection);
  const rejectCollection = useMutation(api.d2dc.rejectCollection);

  const stats = {
    total: collections.length,
    pending: collections.filter(c => c.status === "pending").length,
    today: collections.filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString()).length,
    totalAmount: collections.filter(c => c.status === "completed").reduce((sum, c) => sum + c.amount, 0)
  };

  const handleApprove = async (id) => {
    try {
      await approveCollection({ token: session.token, collectionId: id });
      toast.success("Collection authenticated and completed.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Are you sure you want to reject this record?")) return;
    try {
      await rejectCollection({ token: session.token, collectionId: id });
      toast.error("Collection record rejected.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const filteredCollections = collections.filter(c => {
    if (activeTab === "pending") return c.status === "pending";
    if (activeTab === "completed") return c.status === "completed";
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="ds-page-title inline-flex items-center text-3xl font-medium tracking-tight text-slate-900 border-l-4 border-emerald-600 pl-4">
             Financial Oversight
           </h1>
           <p className="ds-page-subtitle text-slate-500 mt-2">Validate field collections, verify digital reference IDs, and reconcile D2DC accounts.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
           {["all", "pending", "completed"].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest transition-all ${
                 activeTab === tab ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
               }`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Total Volume", val: stats.total, color: "text-slate-900", icon: History },
           { label: "Awaiting Validation", val: stats.pending, color: "text-blue-600", icon: Clock },
           { label: "Received Today", val: stats.today, color: "text-primary-600", icon: CheckCircle2 },
           { label: "Asset Recovery", val: `₹${stats.totalAmount.toLocaleString("en-IN")}`, color: "text-emerald-600", icon: ShieldCheck }
         ].map((s, i) => (
           <div key={i} className="stat-card p-6 bg-white border border-slate-100 hover:shadow-lg transition-all group">
             <div className="flex justify-between items-start">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary-500 transition-colors">{s.label}</p>
                <s.icon className="h-4 w-4 text-slate-300" />
             </div>
             <p className={`mt-3 text-3xl font-medium tracking-tight ${s.color}`}>{s.val}</p>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
           <div className="relative group max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                className="input pl-12 h-14 bg-slate-50/50 border-slate-100 focus:bg-white rounded-2xl transition-all font-medium"
                placeholder="Search collection records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Property & Collector</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Transaction</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Mode</th>
                <th className="px-6 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-medium text-slate-400 uppercase tracking-widest">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredCollections.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500">
                          <User className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{c.property?.propertyId}</span>
                          <span className="text-[10px] text-slate-400">{c.collector?.name}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                       <span className="font-medium text-slate-900 group-hover:text-primary-600 transition-colors">₹{c.amount.toLocaleString("en-IN")}</span>
                       <span className="text-[10px] text-slate-400 mt-0.5">{new Date(c.timestamp).toLocaleString("en-IN")}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                     <span className="text-[10px] font-medium uppercase px-3 py-1 bg-slate-100 text-slate-600 rounded-full">{c.paymentMode}</span>
                     {c.transactionId && <p className="text-[9px] font-mono text-slate-400 mt-1 truncate max-w-xs">{c.transactionId}</p>}
                  </td>
                  <td className="px-6 py-6 font-medium">
                     <div className="relative group/status flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-wider uppercase ${
                          c.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                          c.status === "pending" ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"
                        }`}>
                           {c.status}
                        </span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-3 invisible group-hover:visible transition-all">
                       {c.status === "pending" && (
                         <>
                           <button 
                             onClick={() => handleReject(c.id)}
                             className="p-2.5 text-rose-400 hover:text-rose-600 border border-transparent hover:border-rose-100 hover:bg-rose-50 rounded-xl transition-all"
                           >
                              <XCircle className="h-5 w-5" />
                           </button>
                           <button 
                             onClick={() => handleApprove(c.id)}
                             className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-medium shadow-md transition-all active:scale-95 flex items-center gap-2"
                           >
                              Authenticate
                              <ChevronRight className="h-3 w-3" />
                           </button>
                         </>
                       )}
                       <button 
                        onClick={() => setSelectedItem(c)}
                        className="p-2.5 text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 hover:bg-slate-50 rounded-xl transition-all"
                       >
                          <Eye className="h-5 w-5" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-slate-100">
            {/* Header: Minimal & Clean */}
            <div className="p-6 pb-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-medium text-slate-900 tracking-tight">Audit Verification</h2>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="px-8 pb-8 space-y-6">
              {/* Receipt Style Financial Summary */}
              <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <CreditCard className="h-24 w-24 -rotate-12" />
                </div>
                
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">Net Amount Collected</p>
                      <h3 className="text-4xl font-medium text-slate-900 tracking-tight">₹{selectedItem.amount.toLocaleString("en-IN")}</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest ${
                      selectedItem.paymentMode === 'cash' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'
                    }`}>
                      {selectedItem.paymentMode}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Base Dues</p>
                      <p className="text-sm font-medium text-slate-700">₹{(selectedItem.baseAmount || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Arrears/Penalties</p>
                      <p className="text-sm font-medium text-rose-500">₹{(selectedItem.penaltyAmount || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interaction & Asset Details */}
              <div className="grid grid-cols-2 gap-8 px-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Asset Details</p>
                    <p className="text-sm font-medium text-slate-900">{selectedItem.property?.propertyId}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{selectedItem.property?.ownerName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Time Authenticated</p>
                    <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-300" />
                      {new Date(selectedItem.timestamp).toLocaleString("en-IN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 border-l border-slate-100 pl-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Captured By</p>
                    <p className="text-sm font-medium text-slate-900">{selectedItem.collector?.name}</p>
                    <p className="text-[10px] text-emerald-600 font-medium tracking-tight">Geo-Verified Agent</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Submission ID</p>
                    <p className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block">{selectedItem.id.slice(-10).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Integrity & References Bar */}
              <div className="pt-2">
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 group/bar hover:bg-white hover:shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg text-slate-400 group-hover/bar:text-primary-500 transition-colors shadow-sm">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1">GPS Coordinates</p>
                      <p className="text-[11px] font-mono font-medium text-slate-700">{selectedItem.geoLocation || "0.000, 0.000"}</p>
                    </div>
                  </div>
                  <a 
                    href={`https://www.google.com/maps?q=${selectedItem.geoLocation}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-100"
                  >
                    <Eye className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Digital Footprint if UPI/Cheque */}
              {(selectedItem.transactionId || selectedItem.chequeNumber) && (
                <div className="bg-primary-50/50 rounded-2xl p-4 border border-primary-100/50 flex flex-wrap gap-x-8 gap-y-3">
                  {selectedItem.transactionId && (
                    <div className="min-w-0">
                      <p className="text-[9px] font-medium text-primary-500 uppercase tracking-widest">UPI ID / Ref</p>
                      <p className="text-[11px] font-mono font-medium text-slate-800 truncate max-w-[200px]">{selectedItem.transactionId}</p>
                    </div>
                  )}
                  {selectedItem.chequeNumber && (
                    <div>
                      <p className="text-[9px] font-medium text-primary-500 uppercase tracking-widest">Cheque Details</p>
                      <p className="text-[11px] font-medium text-slate-800"># {selectedItem.chequeNumber} {selectedItem.bankName ? `(${selectedItem.bankName})` : ''}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions: High Polish */}
            <div className="bg-slate-50/80 backdrop-blur-md p-6 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setSelectedItem(null)} 
                className="flex-1 px-6 h-12 rounded-2xl text-[11px] font-medium text-slate-400 uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
              >
                Close View
              </button>
              {selectedItem.status === "pending" && (
                <>
                  <button 
                    onClick={() => { handleReject(selectedItem.id); setSelectedItem(null); }}
                    className="flex-1 px-6 h-12 rounded-2xl text-[11px] font-medium text-rose-500 uppercase tracking-widest border border-rose-100 bg-white hover:bg-rose-50 transition-all shadow-sm"
                  >
                    Reject Record
                  </button>
                  <button 
                    onClick={() => { handleApprove(selectedItem.id); setSelectedItem(null); }}
                    className="flex-[1.5] px-6 h-12 rounded-2xl text-[11px] font-medium text-white uppercase tracking-widest bg-slate-900 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                  >
                    Authenticate Entry
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
