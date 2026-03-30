"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function CitizenVisitsPage() {
  const session = useStoredSession();
  const visits = useQuery(api.d2dc.citizenVisitHistory, session?.token ? { token: session.token } : "skip") || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="ds-page-header">
        <div className="flex flex-col gap-2">
          <h1 className="ds-page-title inline-flex items-center text-3xl font-medium tracking-tight text-slate-900 border-l-4 border-primary-600 pl-4">
            Field Activity Logs
          </h1>
          <p className="ds-page-subtitle text-slate-500 max-w-2xl leading-relaxed">
            Historical record of municipal visits to your property, documenting site verification, collection attempts, and real-time status updates.
          </p>
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
           <div className="bg-slate-50 p-6 rounded-full text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10H3"/><path d="M21 6H3"/><path d="M21 14H3"/><path d="M21 18H3"/></svg>
           </div>
           <p className="text-slate-400 font-medium">No site visit activity has been logged for your property yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="table-wrap border-0 rounded-none overflow-x-auto">
            <table className="table min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="pl-8 py-5 uppercase tracking-widest text-[10px] font-medium text-slate-400">Property</th>
                  <th className="py-5 uppercase tracking-widest text-[10px] font-medium text-slate-400">Date & Time</th>
                  <th className="py-5 uppercase tracking-widest text-[10px] font-medium text-slate-400">Visit Purpose</th>
                  <th className="py-5 uppercase tracking-widest text-[10px] font-medium text-slate-400">Assigned Agent</th>
                  <th className="py-5 uppercase tracking-widest text-[10px] font-medium text-slate-400">Workflow Status</th>
                  <th className="pr-8 py-5 text-right uppercase tracking-widest text-[10px] font-medium text-slate-400">Field Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="pl-8 py-6">
                      <span className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors">{visit.property?.propertyId}</span>
                    </td>
                    <td className="py-6">
                       <p className="text-xs font-medium text-slate-600 tabular-nums">
                        {new Date(visit.timestamp).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium tabular-nums">
                        {new Date(visit.timestamp).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-medium uppercase tracking-widest border ${
                        visit.visitType === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        {visit.visitType === "paid" ? "Payment Logged" : "Premise Visited"}
                      </span>
                    </td>
                    <td className="py-6">
                      <p className="text-sm font-medium text-slate-700 leading-tight">{visit.collector?.name || "Field Agent"}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Collector ID: {visit.collector?._id?.slice(-6).toUpperCase()}</p>
                    </td>
                    <td className="py-6">
                      <div className="flex flex-wrap gap-1.5">
                        {visit.statusFlow.map((status) => (
                          <span key={status} className="px-2 py-0.5 rounded text-[8px] font-medium uppercase tracking-tighter bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {status.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="pr-8 py-6 text-right">
                       <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest inline-flex items-center">
                         <svg className="w-3 h-3 mr-1 text-slate-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                         {visit.geoLocation?.split(',')[0] || "N/A"}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
