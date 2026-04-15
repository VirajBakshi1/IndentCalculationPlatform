"use client";

import { useEffect, useState, useCallback } from "react";

interface AdminEmailRow {
  id: string;
  email: string;
  addedAt: string;
}

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<AdminEmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/emails");
      const data = await res.json();
      setEmails(data.emails ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setAdding(true);

    const res = await fetch("/api/admin/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    });
    const data = await res.json();
    setAdding(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to add email.");
      return;
    }

    setSuccess(`${newEmail} added to admin whitelist.`);
    setNewEmail("");
    await load();
  }

  async function handleRemove(email: string) {
    if (!confirm(`Remove ${email} from admin whitelist?`)) return;
    setError(null);

    const res = await fetch("/api/admin/emails", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to remove.");
      return;
    }

    await load();
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Emails</h1>
        <p className="text-sm text-slate-500 mt-1">
          Emails on this list are automatically assigned the ADMIN role on registration.
          Adding an existing user's email will also promote them immediately.
        </p>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Add Admin Email</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="admin@company.com"
            required
            className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-500"
          />
          <button
            type="submit"
            disabled={adding || !newEmail}
            className="px-4 py-2 bg-steel-800 hover:bg-steel-900 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            {adding ? "Adding…" : "Add Email"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-600 mt-2">{success}</p>
        )}
      </div>

      {/* List */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Whitelisted Emails ({emails.length})
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            No admin emails yet. Add one above.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {emails.map((row) => (
              <div key={row.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{row.email}</p>
                  <p className="text-xs text-slate-400">
                    Added {new Date(row.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(row.email)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
