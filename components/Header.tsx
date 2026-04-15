"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Steel beam icon */}
          <div className="w-9 h-9 bg-steel-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="3" rx="0.5" fill="#f59e0b" />
              <rect x="2" y="13" width="16" height="3" rx="0.5" fill="#f59e0b" />
              <rect x="8.5" y="7" width="3" height="6" fill="white" opacity="0.4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-700 text-slate-900 leading-tight font-semibold">
              Steel Indent Automation
            </h1>
            <p className="text-xs text-slate-500 leading-tight">
              Fabrication Planning System
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            System Ready
          </div>

          {session ? (
            <div className="flex items-center gap-3">
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="text-xs font-medium text-steel-700 hover:text-steel-900 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <span className="text-xs text-slate-500">{session.user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-medium text-steel-700 hover:text-steel-900 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
