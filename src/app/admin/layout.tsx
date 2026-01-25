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
  FileText,
  AlertTriangle,
  Image as ImageIcon,
  Map,
  Layers,
  Grid3X3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/charters", label: "Schools", icon: School },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/judges", label: "Judges", icon: ClipboardList },
  { href: "/admin/volunteers", label: "Volunteers", icon: HandHeart },
  { href: "/admin/sponsors", label: "Sponsors", icon: Award },
];

const dataItems = [
  { href: "/admin/turn-ins", label: "Turn-Ins", icon: Trophy },
  { href: "/admin/report-cards", label: "Report Cards", icon: FileText },
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
  const [dataOpen, setDataOpen] = useState(true);
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

  const NavLink = ({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setSidebarOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-white text-americana-blue shadow-sm"
            : "text-white/70 hover:text-white hover:bg-white/10"
        }`}
      >
        <Icon
          className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 ${
            isActive ? "text-americana-blue" : ""
          }`}
        />
        <span>{label}</span>
        {isActive && (
          <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
        )}
      </Link>
    );
  };

  const SectionHeader = ({
    label,
    isOpen,
    onClick,
  }: {
    label: string;
    isOpen: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider hover:text-white/60 transition-colors"
    >
      <span>{label}</span>
      <ChevronDown
        className={`w-3.5 h-3.5 transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-americana-blue to-[#1e2a5e] transform transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-5 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-4">
              <div className="relative w-12 h-12 bg-white rounded-xl p-1.5 shadow-lg">
                <Image
                  src="/images/nhsbbqa-logo.png"
                  alt="NHSBBQA"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex-1">
                <h1 className="font-heading text-xl text-white tracking-tight">
                  PITMSTR
                </h1>
                <p className="text-white/50 text-xs font-medium">
                  Admin Portal
                </p>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-2 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* Main Nav */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>

            {/* Data Section */}
            <div className="mt-6">
              <SectionHeader
                label="Competition Data"
                isOpen={dataOpen}
                onClick={() => setDataOpen(!dataOpen)}
              />
              {dataOpen && (
                <div className="mt-1 space-y-1">
                  {dataItems.map((item) => (
                    <NavLink key={item.href} {...item} />
                  ))}
                </div>
              )}
            </div>

            {/* Lookups Section */}
            <div className="mt-6">
              <SectionHeader
                label="Lookup Tables"
                isOpen={lookupsOpen}
                onClick={() => setLookupsOpen(!lookupsOpen)}
              />
              {lookupsOpen && (
                <div className="mt-1 space-y-1">
                  {lookupItems.map((item) => (
                    <NavLink key={item.href} {...item} />
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <ExternalLink className="w-[18px] h-[18px]" />
              <span>View Live Site</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumb placeholder */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-slate-400">Admin</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <span className="font-medium text-slate-700 capitalize">
                  {pathname === "/admin"
                    ? "Dashboard"
                    : pathname.split("/").pop()?.replace("-", " ")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/knowledge-base"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Help
              </Link>
              <div className="w-px h-6 bg-slate-200 hidden sm:block" />
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
