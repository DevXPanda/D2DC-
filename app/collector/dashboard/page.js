"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CreditCard, MapPin, ReceiptText, Search, ShieldAlert, Camera, User, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";
import { useToast } from "@/components/toast";

const defaultForm = {
  amount: "",
  paymentMode: "cash",
  penaltyAmount: "0",
  citizenResponse: "will_pay_today",
  visitType: "payment_collection",
  transactionId: "",
  chequeNumber: "",
  chequeDate: "",
  bankName: "",
  remarks: "",
  expectedPaymentDate: ""
};

export default function CollectorDashboardPage() {
  const session = useStoredSession();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [geoLocation, setGeoLocation] = useState("");
  const [geoStatus, setGeoStatus] = useState("Capture location when you start a visit.");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  
  const dashboard = useQuery(api.d2dc.collectorDashboard, session?.token ? { token: session.token, search } : "skip");
  const submitCollectorVisit = useMutation(api.d2dc.submitCollectorVisit);
  const selectedProperty = dashboard?.properties.find((p) => p.id === selectedPropertyId) || null;

  useEffect(() => {
    if (!selectedPropertyId) {
      setForm(defaultForm);
      setGeoLocation("");
      setGeoStatus("Capture location when you start a visit.");
      setResult(null);
    } else if (selectedProperty) {
      setForm(prev => ({ ...prev, amount: selectedProperty.totalDue.toString() }));
    }
  }, [selectedPropertyId, selectedProperty]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation is not supported on this device.");
      return;
    }
    setGeoStatus("Capturing location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setGeoLocation(coords);
        setGeoStatus("Location captured successfully.");
      },
      () => {
        setGeoStatus("Unable to capture location. Please allow access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!selectedProperty) {
      setError("Please select a property first.");
      return;
    }
    if (!geoLocation) {
      setError("Geo-location is required for field visits.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await submitCollectorVisit({
        token: session.token,
        propertyId: selectedProperty.id,
        visitType: form.visitType,
        citizenResponse: form.citizenResponse,
        geoLocation,
        amount: form.citizenResponse === "will_pay_today" ? Number(form.amount || 0) : undefined,
        paymentMode: form.citizenResponse === "will_pay_today" ? form.paymentMode : undefined,
        transactionId: form.transactionId || undefined,
        chequeNumber: form.chequeNumber || undefined,
        chequeDate: form.chequeDate ? new Date(form.chequeDate).getTime() : undefined,
        bankName: form.bankName || undefined,
        remarks: form.remarks || undefined,
        expectedPaymentDate: form.expectedPaymentDate ? new Date(form.expectedPaymentDate).getTime() : undefined,
        penaltyAmount: Number(form.penaltyAmount || 0)
      });

      setResult(response);
      toast.success("Field visit recorded successfully.");
      
      if (typeof window !== "undefined" && response.whatsappUrl) {
         // Throttled open to avoid popup blocks
         setTimeout(() => window.open(response.whatsappUrl, "_blank"), 500);
      }
      
      setSelectedPropertyId("");
    } catch (err) {
      setError(err.message || "Unable to submit visit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="ds-page-header">
        <div className="flex flex-col gap-2">
          <h1 className="ds-page-title inline-flex items-center text-3xl font-medium tracking-tight text-slate-900 border-l-4 border-primary-600 pl-4">
            Collector Hub
          </h1>
          <p className="ds-page-subtitle text-slate-500 max-w-2xl leading-relaxed">
            Standardised D2DC field operations: capture visits, collect multi-mode payments, and trigger escalation notices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {[
          { label: "Assigned Assets", val: dashboard?.stats.totalAssignedProperties, color: "text-slate-900" },
          { label: "Successful Collections", val: dashboard?.stats.paidVisits, color: "text-emerald-600" },
          { label: "Unpaid Engagements", val: dashboard?.stats.notPaidVisits, color: "text-amber-600" },
          { label: "Pending Approvals", val: dashboard?.stats.pendingApprovals, color: "text-blue-600" }
        ].map((stat, idx) => (
          <div key={idx} className="stat-card p-6 bg-white border border-slate-100 hover:shadow-lg transition-all">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
            <p className={`mt-3 text-3xl font-medium tracking-tight ${stat.color}`}>{stat.val ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          {/* Property Selection Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    className="input pl-12 h-14 bg-slate-50/50 border-slate-100 focus:bg-white text-base rounded-2xl transition-all"
                    placeholder="Search assigned property ID, owner, or address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
            </div>

            <div className="p-4 bg-slate-50/30">
               {!dashboard || dashboard.properties.length === 0 ? (
                 <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400 font-medium">
                   No properties found in your assigned ward.
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-h-[400px] overflow-y-auto p-2 scrollbar-thin">
                   {dashboard.properties.map((p) => (
                     <button
                       key={p.id}
                       onClick={() => {
                         setSelectedPropertyId(p.id);
                         setError("");
                         setResult(null);
                         captureLocation();
                       }}
                       className={`p-5 rounded-2xl text-left border transition-all duration-300 ${
                         selectedPropertyId === p.id
                           ? "border-primary-500 bg-primary-50 shadow-md ring-4 ring-primary-50"
                           : "border-slate-100 bg-white hover:border-primary-300 hover:bg-slate-50"
                       }`}
                     >
                       <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-medium text-slate-900 tracking-tight">{p.propertyId}</p>
                          <span className="text-[9px] font-medium uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Active</span>
                       </div>
                       <p className="text-xs font-medium text-slate-600 truncate">{p.ownerName}</p>
                       <p className="mt-2 text-[10px] text-slate-400 line-clamp-1">{p.address}</p>
                     </button>
                   ))}
                 </div>
               )}
            </div>
          </div>

          {/* Workflow Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
             <div className="flex items-center gap-4 mb-8">
                <div className="bg-slate-100 p-3 rounded-2xl text-slate-600">
                   <Clock className="h-5 w-5" />
                </div>
                <div>
                   <h2 className="text-xl font-medium text-slate-900 tracking-tight">Record Field Engagement</h2>
                   <p className="text-xs text-slate-500 mt-0.5">Capturing geolocation and citizen response for audit trails.</p>
                </div>
             </div>

             {selectedProperty ? (
               <div className="space-y-8">
                  {/* Property Quick Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                     <div className="space-y-4">
                        <div>
                           <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Selected Asset</p>
                           <p className="text-base font-medium text-slate-900 mt-1">{selectedProperty.propertyId}</p>
                           <p className="text-xs text-slate-500">{selectedProperty.ownerName}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Geo Context</p>
                           <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-3 w-3 text-primary-600" />
                              <span className="text-xs font-medium text-slate-700">{geoLocation || "Awaiting GPS..."}</span>
                           </div>
                           <p className="text-[9px] text-slate-400 mt-1">{geoStatus}</p>
                        </div>
                     </div>
                     <div className="text-right flex flex-col justify-between">
                        <div>
                           <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Financial Summary</p>
                           <p className="text-2xl font-medium text-slate-900 mt-1 tracking-tight">₹{selectedProperty.totalDue.toLocaleString("en-IN")}</p>
                           <p className="text-[10px] font-medium text-rose-500 mt-1">{selectedProperty.pendingMonths} months in arrears</p>
                        </div>
                        <button onClick={captureLocation} className="text-[10px] font-medium text-primary-600 uppercase tracking-widest hover:underline">
                           Refresh Coordinates
                        </button>
                     </div>
                  </div>

                  {/* Visit Logic Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">Visit Category</label>
                        <select 
                          className="input h-14 bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-800"
                          value={form.visitType}
                          onChange={(e) => setForm(f => ({ ...f, visitType: e.target.value }))}
                        >
                           <option value="payment_collection">Payment Collection</option>
                           <option value="reminder">Standard Reminder</option>
                           <option value="warning">Official Warning</option>
                           <option value="final_warning">Final Notice / Warrant</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">Citizen Response</label>
                        <select 
                          className="input h-14 bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-800"
                          value={form.citizenResponse}
                          onChange={(e) => setForm(f => ({ ...f, citizenResponse: e.target.value }))}
                        >
                           <option value="will_pay_today">Will pay immediately</option>
                           <option value="will_pay_later">Promised to pay later</option>
                           <option value="refused_to_pay">Refused payment</option>
                           <option value="not_available">Premise locked / NA</option>
                        </select>
                     </div>
                  </div>

                  {/* Dynamic Sections Based on Response */}
                  {form.citizenResponse === "will_pay_today" && (
                    <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-6 animate-in slide-in-from-top-4 duration-500">
                       <div className="flex items-center gap-3 mb-2">
                          <CreditCard className="h-5 w-5 text-emerald-600" />
                          <h3 className="text-sm font-medium text-emerald-900 uppercase tracking-widest">Collection Details</h3>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-1 space-y-1">
                             <label className="text-[10px] font-medium text-emerald-700 uppercase tracking-widest pl-1">Collect Amount (₹)</label>
                             <input 
                               className="input h-12 bg-white border-emerald-100 text-lg font-medium tabular-nums"
                               type="number"
                               value={form.amount}
                               onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                             />
                          </div>
                          <div className="md:col-span-1 space-y-1">
                             <label className="text-[10px] font-medium text-emerald-700 uppercase tracking-widest pl-1">Payment Mode</label>
                             <select 
                               className="input h-12 bg-white border-emerald-100 font-medium"
                               value={form.paymentMode}
                               onChange={(e) => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                             >
                                <option value="cash">Cash Payment</option>
                                <option value="upi">Digital UPI</option>
                                <option value="cheque">Bank Cheque</option>
                                <option value="dd">Demand Draft</option>
                             </select>
                          </div>
                          <div className="md:col-span-1 space-y-1">
                             <label className="text-[10px] font-medium text-emerald-700 uppercase tracking-widest pl-1">Ref / ID / Chq No.</label>
                             <input 
                               className="input h-12 bg-white border-emerald-100 font-medium"
                               placeholder="Optional"
                               value={form.paymentMode === "cheque" ? form.chequeNumber : form.transactionId}
                               onChange={(e) => setForm(f => ({ ...f, [form.paymentMode === "cheque" ? "chequeNumber" : "transactionId"]: e.target.value }))}
                             />
                          </div>
                       </div>
                    </div>
                  )}

                  {(form.citizenResponse === "will_pay_later") && (
                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 animate-in slide-in-from-top-4 duration-500">
                       <label className="text-[10px] font-medium text-amber-700 uppercase tracking-widest mb-1 block">Expected Payment Date</label>
                       <input 
                         type="date"
                         className="input h-12 bg-white border-amber-100 font-medium"
                         value={form.expectedPaymentDate}
                         onChange={(e) => setForm(f => ({ ...f, expectedPaymentDate: e.target.value }))}
                       />
                    </div>
                  )}

                  {/* Remarks & Photos */}
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">Field Observation / Remarks</label>
                        <textarea 
                          className="input min-h-[100px] py-4 bg-slate-50 border-slate-100 focus:bg-white resize-none"
                          placeholder="Describe citizen interaction, property condition, or reason for non-payment..."
                          value={form.remarks}
                          onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))}
                        />
                     </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700">
                       <AlertCircle className="h-5 w-5" />
                       <p className="text-xs font-medium">{error}</p>
                    </div>
                  )}

                  <button 
                    onClick={handleSubmit} 
                    disabled={submitting} 
                    className="btn btn-primary h-14 w-full text-base font-medium rounded-2xl shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {submitting ? "Processing Engagement..." : "Submit Field Report"}
                  </button>
               </div>
             ) : (
               <div className="rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/30 px-4 py-20 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                     <Building2 className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">Select an asset from the list to begin field entry.</p>
               </div>
             )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Real-time Feedback Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <ReceiptText className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-medium text-slate-900 tracking-tight">Active Operation Log</h2>
            </div>
            
            <div className="flex-1">
               {result?.receipt ? (
                 <div className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 animate-in zoom-in-95 duration-500">
                   <div className="flex items-center gap-2 text-emerald-700 mb-2">
                     <CheckCircle2 className="h-5 w-5" />
                     <p className="text-xs font-medium uppercase tracking-widest">Receipt Authenticated</p>
                   </div>
                   <div className="space-y-1.5 border-t border-emerald-100/50 pt-4">
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Receipt No:</span> <span className="font-medium text-slate-900">{result.receipt.receiptNumber}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Amount:</span> <span className="font-medium text-slate-900">₹{result.receipt.amount}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Mode:</span> <span className="font-medium text-slate-900 uppercase">{result.receipt.paymentMode}</span></div>
                   </div>
                   <a href={result.whatsappUrl} target="_blank" className="btn btn-primary w-full h-12 rounded-xl text-xs mt-2">
                     Push WhatsApp Receipt
                   </a>
                 </div>
               ) : result?.notice ? (
                 <div className="space-y-4 rounded-3xl border border-amber-100 bg-amber-50/40 p-6 animate-in zoom-in-95 duration-500">
                   <div className="flex items-center gap-2 text-amber-700 mb-2">
                     <ShieldAlert className="h-5 w-5" />
                     <p className="text-xs font-medium uppercase tracking-widest">Notice Provisioned</p>
                   </div>
                   <div className="space-y-1.5 border-t border-amber-100/50 pt-4">
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-900 uppercase">{result.notice.noticeType}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Status:</span> <span className="font-medium text-slate-900">PENDING GENERATION</span></div>
                   </div>
                   <a href={result.whatsappUrl} target="_blank" className="btn btn-primary w-full h-12 rounded-xl text-xs mt-2">
                     Notify Citizen
                   </a>
                 </div>
               ) : (
                 <div className="rounded-2xl border border-dashed border-slate-100 bg-slate-50/20 px-4 py-16 text-center text-xs text-slate-400 font-medium">
                   Submission results and dynamic receipts will appear here after field entry.
                 </div>
               )}
            </div>
          </div>

          {/* History Snippet */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-medium text-slate-900 tracking-tight">Recent Engagement History</h2>
            </div>
            
            {!dashboard || dashboard.visits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-100 bg-slate-50 px-4 py-12 text-center text-xs text-slate-400 font-medium">
                No recent field reports found.
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.visits.map((v) => (
                  <div key={v.id} className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                     <div className="flex justify-between items-start">
                        <p className="text-xs font-medium text-slate-900">{v.property?.propertyId}</p>
                        <span className={`text-[8px] font-medium uppercase px-2 py-0.5 rounded-full ${v.visitType === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                           {v.visitType}
                        </span>
                     </div>
                     <p className="text-[9px] text-slate-400 mt-1">{new Date(v.timestamp).toLocaleString()}</p>
                     <p className="text-[10px] text-slate-500 mt-3 italic line-clamp-1">"{v.remarks || "No remarks provided"}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Building2(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>;
}
