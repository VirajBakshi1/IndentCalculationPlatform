import Link from "next/link";
import { getLogStats } from "@/services/log.service";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, adminCount, configCount] = await Promise.all([
    getLogStats(),
    db.adminEmail.count(),
    db.config.count(),
  ]);

  const cards = [
    {
      label: "Total Processed",
      value: stats.total,
      sub: `${stats.success} succeeded · ${stats.failed} failed`,
      href: "/admin/logs",
      color: "bg-steel-800",
    },
    {
      label: "Success Rate",
      value:
        stats.total > 0
          ? `${Math.round((stats.success / stats.total) * 100)}%`
          : "—",
      sub: "of all MTO runs",
      href: "/admin/logs",
      color: "bg-emerald-600",
    },
    {
      label: "Config Keys",
      value: configCount,
      sub: "DB-driven constants",
      href: "/admin/config",
      color: "bg-violet-600",
    },
    {
      label: "Admin Emails",
      value: adminCount,
      sub: "whitelisted addresses",
      href: "/admin/admins",
      color: "bg-amber-500",
    },
  ];

  const quickLinks = [
    {
      href: "/admin/config",
      title: "Edit Configuration",
      desc: "Update plate widths, scrap factor, steel density, and more.",
    },
    {
      href: "/admin/admins",
      title: "Manage Admin Emails",
      desc: "Add or remove emails from the admin whitelist.",
    },
    {
      href: "/admin/logs",
      title: "View Processing Logs",
      desc: "Audit every MTO upload — success, failure, and timing.",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          System overview and quick access to all admin tools.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className={`w-8 h-8 ${card.color} rounded-lg mb-3`} />
              <p className="text-2xl font-bold text-slate-800 font-mono">
                {card.value}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                {card.label}
              </p>
              <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-steel-400 hover:shadow-sm transition-all group">
                <h3 className="text-sm font-semibold text-slate-800 group-hover:text-steel-700 mb-1">
                  {link.title}
                </h3>
                <p className="text-xs text-slate-500">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
