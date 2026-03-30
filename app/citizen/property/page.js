"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";
import { Building2, TrendingUp, User, MapPin, Receipt, ShieldCheck, MessageCircle } from "lucide-react";

const DetailRow = ({ label, value, valueClass = "" }) => (
  <div className="flex flex-col sm:flex-row py-3 border-b border-slate-50 last:border-b-0">
    <dt className="text-xs font-medium text-slate-400 uppercase tracking-widest sm:w-1/3 shrink-0">{label}</dt>
    <dd className={`text-sm font-medium text-slate-700 mt-1 sm:mt-0 ${valueClass}`}>{value || "—"}</dd>
  </div>
);

export default function CitizenPropertyPage() {
  const session = useStoredSession();
  const [paymentForm, setPaymentForm] = useState({});
  const dashboard = useQuery(api.d2dc.citizenDashboard, session?.token ? { token: session.token } : "skip");
  const collections = useQuery(api.d2dc.citizenCollections, session?.token ? { token: session.token } : "skip") || [];
  const payCollection = useMutation(api.d2dc.citizenPayCollection);

  const handlePay = async (propertyId) => {
    const current = paymentForm[propertyId] || {};
    await payCollection({
      token: session.token,
      propertyId,
      amount: Number(current.amount || 0),
      paymentMode: current.paymentMode || "upi"
    });
    setPaymentForm((prev) => ({
      ...prev,
      [propertyId]: { amount: "", paymentMode: "upi" }
    }));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="ds-page-header">
        <div className="flex flex-col gap-2">
          <h1 className="ds-page-title inline-flex items-center text-3xl font-medium tracking-tight text-slate-900 border-l-4 border-primary-600 pl-4">
            Property Portfolio
          </h1>
          <p className="ds-page-subtitle text-slate-500 max-w-2xl leading-relaxed">
            Detailed profile of your registered properties, authenticated collection logs, and secure electronic payment submissions.
          </p>
        </div>
      </div>

      {!dashboard || dashboard.properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
           <div className="bg-slate-50 p-6 rounded-full">
              <Building2 className="h-12 w-12 text-slate-300" />
           </div>
           <p className="text-slate-400 font-medium font-medium">No verified property accounts linked to your profile.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {dashboard.properties.map((property) => {
            const propertyCollections = collections.filter((item) => item.propertyId === property.id);
            const form = paymentForm[property.id] || { amount: "", paymentMode: "upi" };

            return (
              <div key={property.id} className="space-y-10 animate-in zoom-in-95 duration-700">
                {/* ULB Style Header & Summary Section */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary-600 p-4 rounded-2xl text-white shadow-xl shadow-primary-100 transition-transform hover:scale-105">
                         <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-medium text-slate-900 tracking-tight">{property.propertyId}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-[0.2em] border ${property.dues?.totalAmount > 0 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                            {property.dues?.totalAmount > 0 ? "Action Required" : "Compliant Status"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-success px-5 py-2.5 rounded-full font-medium uppercase tracking-widest text-[10px] ring-4 ring-emerald-50">
                      {property.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="stat-card p-6 border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500">
                      <div className="stat-card-title flex items-center justify-between">
                         <span className="text-[10px] font-medium text-slate-400">Current Ward</span>
                         <MapPin className="h-3 w-3 text-slate-300" />
                      </div>
                      <p className="stat-card-value text-lg font-medium text-slate-900 truncate uppercase mt-1">{property.wardDetails?.wardName || "—"}</p>
                    </div>
                    <div className="stat-card p-6 border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500">
                      <div className="stat-card-title flex items-center justify-between">
                         <span className="text-[10px] font-medium text-slate-400">Base Dues</span>
                         <Receipt className="h-3 w-3 text-slate-300" />
                      </div>
                      <p className="stat-card-value text-lg font-medium text-slate-900 mt-1">₹{property.dues?.baseAmount.toLocaleString("en-IN") || 0}</p>
                    </div>
                    <div className="stat-card p-6 border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500">
                      <div className="stat-card-title flex items-center justify-between">
                         <span className="text-[10px] font-medium text-rose-400">Total Penalty</span>
                         <TrendingUp className="h-3 w-3 text-rose-300" />
                      </div>
                      <p className="stat-card-value text-lg font-medium text-rose-600 mt-1">₹{property.dues?.penaltyAmount.toLocaleString("en-IN") || 0}</p>
                    </div>
                    <div className="stat-card p-6 border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-500 bg-slate-900">
                      <div className="stat-card-title flex items-center justify-between">
                         <span className="text-[10px] font-medium text-slate-400">Net Payable</span>
                         <ShieldCheck className="h-3 w-3 text-primary-400" />
                      </div>
                      <p className="stat-card-value text-lg font-medium text-white mt-1">₹{property.dues?.totalAmount.toLocaleString("en-IN") || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Information Card */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col hover:shadow-md transition-shadow">
                    <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center">
                      <Building2 className="w-4 h-4 mr-3 text-primary-600" />
                      Asset Details
                    </h3>
                    <div className="flex-1">
                      <dl>
                        <DetailRow label="Property Number" value={property.propertyId} valueClass="text-primary-600" />
                        <DetailRow label="Primary Owner" value={property.ownerName} />
                        <DetailRow label="Mobile Number" value={property.mobile} valueClass="tabular-nums" />
                        <DetailRow label="Administrative Ward" value={property.wardDetails?.wardName} valueClass="uppercase" />
                        <DetailRow label="Full Address" value={property.address} />
                      </dl>
                    </div>
                  </div>

                  {/* Owner & Support Card */}
                  <div className="space-y-6">
                     <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                           <TrendingUp className="h-32 w-32" />
                        </div>
                        <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center">
                          <User className="w-4 h-4 mr-3 text-primary-600" />
                          Owner Profile
                        </h3>
                        <div className="flex-1 flex flex-col justify-between">
                           <div>
                              <p className="text-xl font-medium text-slate-900">{property.ownerName}</p>
                              <p className="text-sm text-slate-500 mt-1">Legally registered owner of asset {property.propertyId}.</p>
                           </div>
                           
                           <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                              <div>
                                 <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Support Access</p>
                                 <p className="text-sm font-medium text-slate-700 mt-1">Direct Concierge</p>
                              </div>
                              <a 
                                href={dashboard.supportWhatsAppUrl} 
                                target="_blank" 
                                className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-100 hover:scale-110 active:scale-95 transition-all"
                              >
                                 <MessageCircle className="h-5 w-5" />
                              </a>
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                        <div className="absolute bottom-0 right-0 p-6 opacity-20">
                           <Receipt className="h-16 w-16" />
                        </div>
                        <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-2">Self Declaration</h4>
                        <p className="text-lg font-medium tracking-tight mb-6">Payment Verification</p>
                        
                        <div className="space-y-4">
                           <div className="flex gap-4">
                              <input 
                                className="flex-1 bg-white/10 border-white/5 rounded-2xl h-12 px-4 text-sm font-medium focus:bg-white/20 transition-all outline-none" 
                                placeholder="Amount Paid"
                                type="number"
                                value={form.amount}
                                onChange={(e) => setPaymentForm((prev) => ({ ...prev, [property.id]: { ...form, amount: e.target.value } }))}
                              />
                              <select 
                                className="w-32 bg-white/10 border-white/5 rounded-2xl h-12 px-4 text-xs font-medium focus:bg-white/20 transition-all outline-none appearance-none"
                                value={form.paymentMode}
                                onChange={(e) => setPaymentForm((prev) => ({ ...prev, [property.id]: { ...form, paymentMode: e.target.value } }))}
                              >
                                 <option value="upi" className="bg-slate-900">UPI</option>
                                 <option value="cash" className="bg-slate-900">Cash</option>
                              </select>
                           </div>
                           <button 
                             onClick={() => handlePay(property.id)}
                             className="w-full h-12 bg-primary-600 hover:bg-primary-500 rounded-2xl text-sm font-medium tracking-tight transition-all active:scale-[0.98]"
                           >
                             Submit Verification Request
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Wide Ledger Verification Card */}
                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="border-b border-slate-50 bg-slate-50/50 px-8 py-5 flex items-center justify-between">
                      <h3 className="flex items-center text-xs font-medium uppercase tracking-[0.2em] text-slate-700">
                        <TrendingUp className="mr-3 h-4 w-4 text-primary-600" />
                        Authenticated Collection Ledger
                      </h3>
                    </div>
                    <div className="flex-1">
                      {propertyCollections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                           <Receipt className="h-12 w-12 text-slate-100" />
                           <p className="text-sm font-medium text-slate-400 font-medium">No verified transaction logs found for this asset.</p>
                        </div>
                      ) : (
                        <div className="table-wrap border-0 rounded-none overflow-x-auto">
                          <table className="table">
                            <thead>
                              <tr className="bg-slate-50/50">
                                <th className="pl-8 uppercase tracking-[0.2em] text-[10px] font-medium text-slate-400">Value</th>
                                <th className="uppercase tracking-[0.2em] text-[10px] font-medium text-slate-400">Channel</th>
                                <th className="uppercase tracking-[0.2em] text-[10px] font-medium text-slate-400">Verification Date</th>
                                <th className="pr-8 text-right uppercase tracking-[0.2em] text-[10px] font-medium text-slate-400">Workflow Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {propertyCollections.map((collection) => (
                                <tr key={collection.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="pl-8 py-5">
                                    <span className="text-sm font-medium text-slate-900 tracking-tight">₹{collection.amount.toLocaleString("en-IN")}</span>
                                  </td>
                                  <td>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">{collection.paymentMode}</span>
                                  </td>
                                  <td>
                                    <span className="text-xs font-medium text-slate-500 tabular-nums">
                                      {new Date(collection.timestamp).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                  </td>
                                  <td className="pr-8 py-5 text-right">
                                    <span className={`px-4 py-1.5 text-[9px] font-medium uppercase tracking-widest rounded-full border ${
                                      collection.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                      collection.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-100" : 
                                      "bg-rose-50 text-rose-700 border-rose-100"
                                    }`}>
                                      {collection.status === "completed" ? "Verified" : collection.status === "pending" ? "In Review" : "Disputed"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Visual Separator for multi-property lists */}
                <div className="h-px bg-slate-100 mx-auto w-1/3"></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
