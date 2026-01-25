"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Calendar,
  Users,
  School,
  GraduationCap,
  ClipboardList,
  Award,
  HandHeart,
  Trophy,
  FileWarning,
  AlertTriangle,
  Image as ImageIcon,
  Map,
  Layers,
  Grid3X3,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/charters", label: "Charters (Schools)", icon: School },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/judges", label: "Judges", icon: ClipboardList },
  { href: "/admin/volunteers", label: "Volunteers", icon: HandHeart },
  { href: "/admin/sponsors", label: "Sponsors", icon: Award },
  { href: "/admin/turn-ins", label: "Turn-Ins", icon: Trophy },
  { href: "/admin/report-cards", label: "Report Cards", icon: FileWarning },
  { href: "/admin/penalties", label: "Penalties", icon: AlertTriangle },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
];

const lookupItems = [
  { href: "/admin/states", label: "States", icon: Map },
  { href: "/admin/divisions", label: "Divisions", icon: Layers },
  { href: "/admin/categories", label: "Categories", icon: Grid3X3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lookupsOpen, setLookupsOpen] = useState(false);

  // Don't apply layout to login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-bbq-red text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon className="w-5 h-5" />
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-light-grey flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-americana-blue transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-4 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-3">
              <Image
                src="/images/nhsbbqa-logo.png"
                alt="NHSBBQA"
                width={50}
                height={50}
                className="h-10 w-auto"
              />
              <div>
                <span className="font-heading text-white text-lg block leading-tight">
                  ADMIN
                </span>
                <span className="text-white/60 text-xs">NHSBBQA Portal</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}

            {/* Lookups Dropdown */}
            <div className="pt-4">
              <button
                onClick={() => setLookupsOpen(!lookupsOpen)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span>Lookup Tables</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    lookupsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {lookupsOpen && (
                <div className="ml-2 mt-1 space-y-1">
                  {lookupItems.map((item) => (
                    <NavLink key={item.href} {...item} />
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/80 hover:bg-bbq-red hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-card-border sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-smoke-black hover:bg-light-grey rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-americana-blue hover:underline"
              >
                View Site
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
