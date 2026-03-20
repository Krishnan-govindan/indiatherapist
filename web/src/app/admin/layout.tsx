import Link from "next/link";
import { WhatsAppBadge } from "./WhatsAppBadge";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1A1030] text-gray-100">
      {/* Sidebar nav */}
      <div className="flex">
        <aside className="w-52 shrink-0 min-h-screen bg-[#2A1A4A] border-r border-[#3E2868] flex flex-col">
          <div className="px-5 py-5 border-b border-[#3E2868]">
            <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="text-lg">🌿</span>
              <span>IT Admin</span>
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            <NavLink href="/admin">Overview</NavLink>
            <NavLink href="/admin/leads">Leads</NavLink>
            <NavLink href="/admin/therapists">Therapists</NavLink>
            <Link
              href="/admin/whatsapp"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#B0A8C0] hover:bg-[#3E2868] hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-green-400">💬</span>
                WhatsApp
              </span>
              <WhatsAppBadge />
            </Link>
          </nav>
          <div className="px-3 py-4 border-t border-[#3E2868]">
            <a
              href="/"
              target="_blank"
              className="flex items-center gap-2 text-xs text-[#8B7AA0] hover:text-[#C4B5F0] transition-colors px-2 py-1.5"
            >
              ↗ View site
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 rounded-lg text-sm text-[#B0A8C0] hover:bg-[#3E2868] hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}
