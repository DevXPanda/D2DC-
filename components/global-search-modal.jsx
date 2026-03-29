"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import Modal from "@/components/modal";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

function ResultSection({ title, items, renderItem }) {
  if (!items.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="space-y-2">{items.map(renderItem)}</div>
    </div>
  );
}

export default function GlobalSearchModal({ open, onClose }) {
  const session = useStoredSession();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useQuery(api.d2dc.globalSearch, open && query.trim() && session?.token ? { token: session.token, query } : "skip") ||
    { properties: [], users: [], collections: [], visits: [] };

  return (
    <Modal title="Global Search" open={open} onClose={onClose}>
      <div className="space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            className="input pl-10"
            placeholder="Search properties, users, collections, visits..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {!query.trim() ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            Start typing to search across properties, users, collections, and visits.
          </div>
        ) : (
          <div className="space-y-5">
            <ResultSection
              title="Properties"
              items={results.properties}
              renderItem={(item) => (
                <Link key={item.id} href="/properties" onClick={onClose} className="block rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">{item.propertyId}</p>
                  <p className="text-sm text-gray-600">{item.ownerName}</p>
                </Link>
              )}
            />

            <ResultSection
              title="Users"
              items={results.users}
              renderItem={(item) => (
                <Link key={item.id} href="/users" onClick={onClose} className="block rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{item.role}</p>
                </Link>
              )}
            />

            <ResultSection
              title="Collections"
              items={results.collections}
              renderItem={(item) => (
                <Link key={item.id} href="/collections" onClick={onClose} className="block rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">{item.property?.propertyId}</p>
                  <p className="text-sm text-gray-600">{item.collector?.name} · {item.status}</p>
                </Link>
              )}
            />

            <ResultSection
              title="Visits"
              items={results.visits}
              renderItem={(item) => (
                <Link key={item.id} href="/visits" onClick={onClose} className="block rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">{item.property?.propertyId}</p>
                  <p className="text-sm text-gray-600">{item.collector?.name} · {item.visitType.replace("_", " ")}</p>
                </Link>
              )}
            />

            {!results.properties.length && !results.users.length && !results.collections.length && !results.visits.length ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                No matches found for this search.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
