"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import RoleGate from "@/components/RoleGate";
import Header from "@/components/Header";

const TABS = [
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/calendar",   label: "Calendar" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate roles={["administrador"]}>
      {(user) => (
        <div className="min-h-screen bg-slate-50">
          {/* Header sin extraNav — los tabs van abajo */}
          <Header user={user} />
          <AdminTabs />
          <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
        </div>
      )}
    </RoleGate>
  );
}

function AdminTabs() {
  const path = usePathname();
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex justify-center gap-0 px-4">
        {TABS.map((t) => {
          const active = path.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition ${
                active
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
