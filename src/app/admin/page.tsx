"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  School,
  GraduationCap,
  Trophy,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Sparkles,
} from "lucide-react";

interface DashboardStats {
  events: number;
  teams: number;
  schools: number;
  students: number;
  loading: boolean;
  error: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    events: 0,
    teams: 0,
    schools: 0,
    students: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const eventsRes = await fetch("/api/events");
        const eventsJson = await eventsRes.json();
        const eventsData = eventsJson.success ? eventsJson.data : [];

        setStats({
          events: eventsData.length || 0,
          teams: 0,
          schools: 0,
          students: 0,
          loading: false,
          error: null,
        });
      } catch {
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load stats",
        }));
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Events",
      value: stats.events,
      icon: Calendar,
      href: "/admin/events",
      trend: "+2 this month",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Teams",
      value: stats.teams,
      icon: Users,
      href: "/admin/teams",
      trend: "12 active",
      gradient: "from-violet-500 to-violet-600",
    },
    {
      label: "Schools",
      value: stats.schools,
      icon: School,
      href: "/admin/charters",
      trend: "8 states",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      label: "Students",
      value: stats.students,
      icon: GraduationCap,
      href: "/admin/students",
      trend: "Growing",
      gradient: "from-emerald-500 to-emerald-600",
    },
  ];

  const quickActions = [
    {
      label: "Create Event",
      description: "Add a new competition",
      href: "/admin/events/new",
      icon: Calendar,
    },
    {
      label: "Add Team",
      description: "Register a new team",
      href: "/admin/teams/new",
      icon: Users,
    },
    {
      label: "New School",
      description: "Add a school charter",
      href: "/admin/charters/new",
      icon: School,
    },
    {
      label: "View Turn-Ins",
      description: "Check submissions",
      href: "/admin/turn-ins",
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome back
          </h1>
          <p className="text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with your competitions today.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-americana-blue text-white rounded-xl font-medium text-sm hover:bg-americana-blue/90 transition-colors shadow-lg shadow-americana-blue/25"
        >
          <Plus className="w-4 h-4" />
          New Event
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group relative bg-white rounded-2xl p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border border-slate-100 overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div
                  className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg`}
                >
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">
                    {stats.loading ? (
                      <span className="inline-block w-12 h-7 bg-slate-100 animate-pulse rounded-lg" />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-400 mt-3">{card.trend}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Quick Actions</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="p-3 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-americana-blue group-hover:text-white transition-colors">
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-900 group-hover:text-americana-blue transition-colors">
                  {action.label}
                </p>
                <p className="text-sm text-slate-500">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Activity</h2>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No recent activity</p>
              <p className="text-sm text-slate-400 mt-1">
                Activity will appear here as events happen
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Upcoming Events</h2>
            <Link
              href="/admin/events"
              className="text-sm text-americana-blue hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No upcoming events</p>
              <p className="text-sm text-slate-400 mt-1">
                Create an event to get started
              </p>
              <Link
                href="/admin/events/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-americana-blue hover:bg-americana-blue/5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Help Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-americana-blue to-[#1e2a5e] rounded-2xl p-6 sm:p-8">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-white">
            Need help getting started?
          </h3>
          <p className="text-white/70 mt-1 max-w-xl">
            This admin dashboard syncs directly with your Airtable base. Changes
            made here update automatically. Check out the Knowledge Base for
            guides and FAQs.
          </p>
          <Link
            href="/knowledge-base"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white text-americana-blue rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
          >
            View Knowledge Base
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
      </div>
    </div>
  );
}
